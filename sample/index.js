/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io)
 * Created on 1397/11/9 (2019/1/29).
 */
"use strict";

const editorManager = liveEditor.editorManager
// For ES6-module-system use below import instead of above assignment (Also see index.html. Another change is needed in that file).
//import {editorManager} from "./node_modules/@live-html-editor/browser/dist/bundle.esm.js";

window.onload = () => {
	editorManager.config({
		serverUrl: 'http://127.0.0.1:3000',
		sourceFiles: [
			{ // Source 1:
				
				// This is ON SERVER'S LOCAL MACHINE and can be relative. If so
				// the base-path would be SERVER'S WORKING DIRECTORY.
				path: './index.html',
				
				// Can be automatically detected from the file's extension. So is
				// unnecessary in this case. This determines how the result must
				// be written down to the file.
				writeMethod: 'html',
				
				// `index` is useful when you have multiple live-editors.
				// Then `index` comes from: [live-editor=INDEX] and must be UNIQUE.
				domPath: index => '[live-editor]',
			},
			//
			// { // Another source:
			//
			// 	// See the above note.
			// 	path: './README.md',
			//
			// 	// This is also unnecessary (in this case). See the above note.
			// 	writeMethod: 'markdown',
			// }
		],
		codeStyle: {
			wrapOn: 0,
		}
	});
	
	editorManager.start();
	
	// When you don't need this any more run below command. You can start it again.
	//liveEditor.editorManager.shutdown();
}
