/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1398/1/29 (2019/4/18).
 */
/* global require, __dirname */
"use strict";

const path = require('path');
const libraryName = 'liveHtmlEditor';

module.exports = {
	target: 'web',
	entry: './src/live-editor.ts',
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
		library: libraryName,
		libraryTarget: 'var',
	}
};
