import type {
  Transpiler as BunTranspiler,
  TranspilerOptions as BunTranspilerOptions,
} from 'bun'

export default class Transpiler {
  public readonly options: TranspilerOptions
  private readonly bunTranspiler: BunTranspiler

  public constructor(
    options: TranspilerOptions = {},
    bunTranspilerOptions: BunTranspilerOptions = {},
  ) {
    const optionKeys = [
      ...(options.transformations ?? []).map(({key}) => key.toString()),
      ...(options.ignores ?? []).map((ignore) => ignore.toString()),
    ]

    if (
      optionKeys.reduce(
        (acc, cur, index, keys) => acc || keys.lastIndexOf(cur) !== index,
        false,
      )
    ) {
      throw 'Transformations, Ignores and Includes cannot have same keys'
    }

    this.options = {
      ignores: options.ignores ?? [],
      transformations: options.transformations ?? [],
    }
    this.bunTranspiler = new Bun.Transpiler(bunTranspilerOptions)
  }

  public transpile(code: string): any {
    const importTypeRegex =
      /(import\s*type\s*([^]+?{?[^]+?}?)from[^]+?(['"])([^]+?)\3)/gm
    const importRegex = /(import([^]+?{?[^]+?}?)from[^]+?(['"])([^]+?)\3)/gm
    const typeMatches = [...code.matchAll(importTypeRegex)].map((x) => [
      x[2],
      x[4],
    ]) as [string, string][]
    const matches = (
      [...code.matchAll(importRegex)].map((x) => [x[2], x[4]]) as [
        string,
        string,
      ][]
    ).filter(
      ([things, pck]) =>
        !typeMatches.find(
          ([thingsType, pckType]) => thingsType === things && pck === pckType,
        ),
    )

    return (
      matches.reduce((acc, cur) => acc + this.transformImport(...cur), '') +
      this.bunTranspiler.transformSync(code.replaceAll(importRegex, ''))
    )
  }

  private transformImport(things: string, from: string): string {
    if (this.options.ignores!.some((ignore) => ignore.test(from))) {
      return ''
    }
    return `import ${things} from "${this.options.transformations!.reduce(
      (acc, {key, value}) => acc.replace(key, value),
      from,
    )}"\n`
  }
}

interface TranspilerOptions {
  transformations?: {key: RegExp; value: string}[]
  ignores?: RegExp[]
}
