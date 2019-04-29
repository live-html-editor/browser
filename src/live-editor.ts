import {Draggable, getCookie, initiateObject, setCookie, TOOLS_POSITION} from './utilities';
import {styleSheet} from './css';
import {htmlSourceOfTools} from './html';
import {BeautifyHtml, CodeStyle, DEF_CODE_STYLE} from "./BeautifyHtml";

/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1397/11/9 (2019/1/29).
 */

class EditorManager implements Options {
	serverUrl: string;
	codeStyle: CodeStyle;
	sourceFiles: SourceFile[];
	
	private beautifier: BeautifyHtml;
	private tools: any;
	private toolsContainer: any;
	private styles: HTMLStyleElement;
	private readonly editors: Editor[] = [];
	private idAttr = '[data-live-editor]';
	
	// noinspection JSUnusedGlobalSymbols
	config(options: Options = DEF_OPTIONS) {
		initiateObject(this, options, DEF_OPTIONS);
		
		this.beautifier = new BeautifyHtml(this.codeStyle);
		
		//**********************************************************************************/
		
		let editables = document.querySelectorAll(this.idAttr);
		if (editables.length === 0) {
			this.idAttr = '[live-editor]';
			editables = document.querySelectorAll(this.idAttr);
		}
		
		for (const editable of editables)
			this.editors.push({
				editable: <HTMLElement>editable,
				index: editable.getAttribute(this.idAttr),
				initDoc: editable.innerHTML,
			});
		//**********************************************************************************/
		
		this.styles = document.createElement('style');
		//this.styles.type = 'text/css';
		this.styles.innerHTML = styleSheet;
		
		const template = document.createElement('template');
		template.innerHTML = htmlSourceOfTools.trim();
		this.toolsContainer = template.content.firstChild;
	}
	
	// noinspection JSUnusedGlobalSymbols
	start() {
		document.getElementsByTagName('head')[0].appendChild(this.styles);
		
		document.body.appendChild(this.toolsContainer);
		
		this.tools = this.toolsContainer.firstElementChild;
		
		Draggable.makeElementDraggable(this.toolsContainer, this.tools,
				(left, top) => setCookie(TOOLS_POSITION, `(${left},${top})`,
						now => now.setDate(now.getDate() + 30)
				)
		);
		
		const toolsPosition = getCookie(TOOLS_POSITION);
		
		if (toolsPosition) {
			const match = /\((\d+)\s*,\s*(\d+)\)/.exec(toolsPosition);
			
			this.toolsContainer.style.left = match[1] + 'px';
			this.toolsContainer.style.top = match[2] + 'px';
		}
		
		for (const editor of this.editors)
			(<any>editor.editable).contentEditable = true;
	}
	
	// noinspection JSUnusedGlobalSymbols
	shutdown() {
		for (const editor of this.editors)
			(<any>editor.editable).contentEditable = false;
		
		document.body.removeChild(this.toolsContainer);
		
		document.getElementsByTagName('head')[0].removeChild(this.styles);
	}
	
	submit(editor: Editor): void {
		const editable = editor.editable;
		const beatifiedHtml = this.beautifier.beautify(editable);
		
		if (!this.validateMode(editable)) return;
		
		const req: Req = {
			htmlDocument: beatifiedHtml,
			
			sourceFiles: this.sourceFiles.map(sourceFile => ({
				path: sourceFile.path,
				domPath: sourceFile.domPath ? sourceFile.domPath(editor.index) : null,
				regexp: sourceFile.regexp ? sourceFile.regexp(editor.index).toString() : null,
			})),
			// extendedFunctionality: this.extendedFunctionality,
		};
		
		fetch(this.serverUrl,
				{
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=utf-8'
					},
					method: "POST",
					body: JSON.stringify(req)
				})
				.then(res => {
					console.log(res);
					return res.json();
				}, res => console.error(res))
				.then(body => console.log(body.logs))
				.catch(err => console.error(err));
	}
	
	formatDoc(sCmd: string, sValue: string, editable: HTMLElement) {
		if (this.validateMode(editable)) {
			document.execCommand(sCmd, false, sValue);
			editable.focus();
		}
	}
	
	validateMode(editable: HTMLElement) {
		if (!this.tools.switchMode.checked) return true;
		
		alert('Uncheck "Show HTML".');
		editable.focus();
		return false;
	}
	
	setSourceMode() {
		for (const editor of this.editors) {
			const editable = editor.editable;
			
			(<any>editable).contentEditable = false;
			const source = this.beautifier.beautify(editable);
			editable.innerHTML = '';
			
			// const oContent = document.createRange();
			// oContent.selectNodeContents(editable.firstChild);
			//const oContent = document.createTextNode(source);
			
			const oSourcePreview = document.createElement('pre');
			oSourcePreview.setAttribute('dir', 'auto');
			oSourcePreview.className = 'editable-source';
			oSourcePreview.innerText = source;
			(<any>oSourcePreview).contentEditable = true;
			
			editable.appendChild(oSourcePreview);
			//document.execCommand('defaultParagraphSeparator', false, 'div');
			
			//editable.focus();
			oSourcePreview.focus();
		}
	}
	
	setDocMode() {
		for (const editor of this.editors) {
			const editable = editor.editable;
			
			// const oContent = document.createRange();
			// oContent.selectNodeContents(editable.firstChild);
			editable.innerHTML = (<HTMLElement>editable.firstElementChild).innerText; //oContent.toString();
			
			(<any>editable).contentEditable = true;
			
			editable.focus();
		}
	}
}

export const editorManager = new EditorManager();

interface Options {
	serverUrl: string;
	codeStyle: CodeStyle;
	sourceFiles: SourceFile[];
}

export const DEF_OPTIONS: Options = {
	serverUrl: 'http://127.0.0.1:3000',
	codeStyle: DEF_CODE_STYLE,
	sourceFiles: [],
};

interface SourceFile {
	path: string;
	domPath: (index: string) => string;
	regexp: (index: string) => RegExp;
}

interface ResolvedSourceFile {
	path: string;
	domPath: string;
	regexp: string;
}

interface Editor {
	editable: HTMLElement;
	index: string;
	initDoc: string;
}

interface Req {
	htmlDocument: string;
	sourceFiles: ResolvedSourceFile[];
}
