/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1398/1/29 (2019/4/18).
 */
"use strict";

// noinspection CssUnusedSymbol
export const styleSheet = `
	/* Default styles of source-preview. Can be overridden by consumer: */
	.editable-source {
		white-space: pre-wrap;
		word-wrap: break-word;
		tab-size: 4;
	}

	#htmlEditorToolsContainer {
		padding: 32px;
		position: fixed;
		left: 0;		/* default */
		top: 0;		/* default */
		opacity: 0.3;
		transition: opacity 0.5s;
	}
	
	#htmlEditorToolsContainer:hover {
		opacity: 1;
	}
	
	#htmlEditorToolsContainer > form {
		background-color: #9FFC;
		cursor: move;
		padding: 16px;
	}
	#htmlEditorToolsContainer > form > * {
		cursor: auto;
	}

	.intLink {
		 cursor: pointer;
	}
	
	img.intLink {
		 border: 0;
	}
`;
