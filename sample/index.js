/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1397/11/9 (2019/1/29).
 */
"use strict";

function initPage() {
	// noinspection JSUnresolvedFunction, JSUnresolvedVariable, ES6ModulesDependencies
	liveHtmlEditor.editorManager.config({
		serverUrl: 'http://127.0.0.1:3000',
		sourceFiles: [
			{
				// This is on server's local machine and can be relative. If so
				// base-path would be server's working directory.
				path: '../sample/index.html',

				// This determines how the result must be written down to the file.
				writeMethod: 'html', // Default for `.html` and `.htm` files

				// `domPath` is a selector for (all) target elements (that will be
				// editable). It will be passed into `document.querySelectorAll()`.
				// So can be `#id`, `.class`, `[attr]` etc.
				// `index` is useful when you have multiple live-editors. Then
				// `index` comes from:
				// 	<div live-editor="INDEX" ...>...</div>
				// and must be UNIQUE (can be a string).
				domPath: index => '[live-editor]',
			},
			{
				// See the above note.
				path: '../README.md',

				// To write html-output without any transformation into whole
				// `.md` file (from begin to the end) you need to set `writeMethod`
				// to 'raw'. For unrecognized file extensions (other than 'html',
				// 'md', etc) 'raw' is default.
				writeMethod: 'markdown', // Default for `.md` files
			},
		],
		codeStyle: {
			wrapOn: 0,
		}
	});
	
	// noinspection JSUnresolvedFunction, JSUnresolvedVariable, ES6ModulesDependencies
	liveHtmlEditor.editorManager.start();
	
	// When you don't need this any more, run below command. You can start it again.
	//liveHtmlEditor.editorManager.shutdown();
}
