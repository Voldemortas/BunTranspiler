import Transpiler from './Transpiler.ts'
import {describe, test, expect} from 'bun:test'

describe('Transpiler', () => {
  describe('constructor', () => {
    test('constructor doesnt allow same options', () => {
      expect(
        () =>
          new Transpiler({
            ignores: [/react/],
            transformations: [{key: /react/, value: ''}],
          }),
      ).toThrow()
    })
    test('constructor doesnt throw on different options', () => {
      expect(
        () =>
          new Transpiler({
            ignores: [/.+\.css/],
            transformations: [{key: /.+\.less/, value: '$1.css'}],
          }),
      ).not.toThrow()
    })
  })
  describe('transpile', () => {
    const transpiler = new Transpiler(
      {
        transformations: [
          {key: /^(\.{1,2}[^\.]+)$/, value: '$1.js'},
          {key: /^(.+)\.tsx?$/, value: '$1.js'},
          {key: /^(.+)\.less$/, value: '$1.css'},
        ],
        ignores: [/react/i],
      },
      {
        loader: 'ts',
        target: 'browser',
        minifyWhitespace: true,
        inline: true,
      },
    )
    test('correctly transpiles imports', () => {
      const code = `
import React, {useEffect} from 'react';
import type {ReactNode} from 'react';
import bla, {nice as great} from './bla.ts'
const val = require('./cjs.js')
import styleSheet from 'common/header.css'
import styleSheet2 from 'common/header.less'

import
{
A
,
B
,
C
,
D
}
from
'../path/to/my/module/in/very/far/directory'`

      const transpiled =
        'import bla,{nice as great} from"./bla.js";import styleSheet from"common/header.css";import styleSheet2 from"common/header.css";import{A,B,C,D} from"../path/to/my/module/in/very/far/directory.js";const val=require("./cjs.js");'

      expect(transpiled).toStrictEqual(transpiler.transpile(code))
    })
    test('correctly transpiles casual ts', () => {
      const code = `
const test: string = 'five'
const numba = 5 as unknown as string
`

      const transpiled = 'const test="five";const numba=5;'

      expect(transpiled).toStrictEqual(transpiler.transpile(code))
    })
  })
})
