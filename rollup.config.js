import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from 'rollup-plugin-typescript2'
import {terser} from "rollup-plugin-terser"
import tempDir from "temp-dir"

const pkg = require('./package.json')

const libraryName = 'live-editor'
const libVarName = camelCase(libraryName)
//const libClassName = `${libVarName[0].toUpperCase() + libVarName.slice(1)}` // PascalCase

// noinspection JSUnusedGlobalSymbols
export default {
	input: `src/${libraryName}.ts`,
	output: [
		{file: pkg.main, name: libVarName, format: 'iife', sourcemap: true, exports: 'named'},
		{file: pkg.module, format: 'esm', sourcemap: true},
	],
	watch: {
		include: 'src/**',
	},
	plugins: [
		typescript({
			useTsconfigDeclarationDir: true,
			cacheRoot: `${tempDir}/.rpt2_cache`, // See: https://github.com/ezolenko/rollup-plugin-typescript2/issues/34#issuecomment-332591290
		}),
		commonjs(),
		resolve(),
		(process.env.BUILD === 'production' && terser()),
		sourceMaps(),
	],
}
