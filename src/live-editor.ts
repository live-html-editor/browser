import {Draggable, getCookie, initiateObject, setCookie, TOOLS_POSITION} from './utilities'
import {styleSheet} from './css'
import {htmlSourceOfTools, FORMAT_DOC1, FORMAT_DOC2, FORMAT_DOC_LINK, SUBMIT, SWITCH_MODE} from './html'
import {BeautifyHtml, CodeStyle, DEF_CODE_STYLE} from "./BeautifyHtml"
import {log} from 'util'

const NO_EDITABLE_SELECTED = 'No editable selected!'

/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io)
 * Created on 1397/11/9 (2019/1/29).
 */
class EditorManager implements Options {
	serverUrl!: string
	codeStyle!: CodeStyle
	sourceFiles!: SourceFile[]
	
	private beautifier!: BeautifyHtml
	private activeEditor: Editor | null = null
	private lastActiveElement: EventTarget | null = null
	private lastActiveEditor: Editor | null = null
	private tools!: HTMLElement
	private switchMode!: HTMLInputElement
	private toolsContainer: any
	private styles!: HTMLStyleElement
	private readonly editors: Editor[] = []
	private idAttr = '[data-live-editor]'
	
	private readonly recordLastFocusedElement: EventListener = (event: Event) => {
		this.lastActiveElement = event.target
	}
	
	// noinspection JSUnusedGlobalSymbols
	config(options: Options = DEF_OPTIONS) {
		initiateObject(this, options, DEF_OPTIONS)
		
		this.beautifier = new BeautifyHtml(this.codeStyle)
		
		//**********************************************************************************/
		
		let editables: NodeListOf<HTMLElement> = document.querySelectorAll(this.idAttr)
		if (editables.length === 0) {
			this.idAttr = '[live-editor]'
			editables = document.querySelectorAll(this.idAttr)
		}
		
		for (const editable of editables) {
			const editor = {
				editable: editable,
				index: editable.getAttribute(this.idAttr)!,
				initDoc: editable.innerHTML,
			}
			
			editable.addEventListener('focusout', () => {
				this.lastActiveEditor = editor
				this.activeEditor = null
			})
			editable.addEventListener('focus', () => {
				this.activeEditor = editor
			})
			
			this.editors.push(editor)
		}
		//**********************************************************************************/
		
		this.styles = document.createElement('style')
		//this.styles.type = 'text/css'
		this.styles.innerHTML = styleSheet
		
		const template = document.createElement('template')
		template.innerHTML = htmlSourceOfTools.trim()
		this.toolsContainer = template.content.firstChild
		
		this.tools = this.toolsContainer.firstElementChild
		//**********************************************************************************/
		
		this.setListenersToToolsArea()
	}
	
	private setListenersToToolsArea() {
		{
			const attr = FORMAT_DOC1
			const tools1 = this.tools.querySelector('#toolbar1')!.querySelectorAll(`[${attr}]`) as NodeListOf<HTMLSelectElement>
			
			for (const tool of tools1) { //console.log(tool)console.log(tool.selectedIndex)console.log(tool[0])
				const command = tool.getAttribute(attr)!
				
				tool.addEventListener('change', () => {
					this.formatDoc(command, (tool[tool.selectedIndex] as HTMLOptionElement).value)
					tool.selectedIndex = 0
				})
			}
		}
		{
			const attr = FORMAT_DOC2
			const toolbar2 = this.tools.querySelector('#toolbar2')!
			const tools2 = toolbar2.querySelectorAll(`[${attr}]`)
			
			for (const tool of tools2) {
				const args = tool.getAttribute(attr)!.split(',')
				
				tool.addEventListener('click', () =>
						// @ts-ignore: Expected 1-2 arguments, but got 0 or more.
						this.formatDoc(...args))  // Alternative way:
				// 	this.formatDoc.apply(this, args)   // See: https://stackoverflow.com/a/20443127/5318303
			}
			
			toolbar2.querySelector('#' + FORMAT_DOC_LINK)!
					.addEventListener('click', () => {
						const url = prompt('URL?', 'http://') || ''
						this.formatDoc('createlink', url)
					})
		}
		{
			this.switchMode = this.tools.querySelector('#' + SWITCH_MODE) as HTMLInputElement
			
			this.switchMode.addEventListener('change', () =>
					this.switchMode.checked ? editorManager.setSourceMode() : editorManager.setDocMode()
			)
			
			this.tools.querySelector('#' + SUBMIT)!.addEventListener('click', this.submit.bind(this))
		}
	}
	
	// noinspection JSUnusedGlobalSymbols
	start() {
		document.getElementsByTagName('head')[0].appendChild(this.styles)
		
		document.body.appendChild(this.toolsContainer)
		
		Draggable.makeElementDraggable(this.toolsContainer, this.tools,
				(left, top) => setCookie(TOOLS_POSITION, `(${left},${top})`,
						now => now.setDate(now.getDate() + 30)
				)
		)
		
		const toolsPosition = getCookie(TOOLS_POSITION)
		
		if (toolsPosition) {
			const match = /\((\d+)\s*,\s*(\d+)\)/.exec(toolsPosition)!
			
			this.toolsContainer.style.left = match[1] + 'px'
			this.toolsContainer.style.top = match[2] + 'px'
		}
		
		for (const editor of this.editors)
			editor.editable.contentEditable = 'true'
		
		document.addEventListener('focusout', this.recordLastFocusedElement, true)
	}
	
	// noinspection JSUnusedGlobalSymbols
	shutdown() {
		document.removeEventListener('focusout', this.recordLastFocusedElement, true)
		
		for (const editor of this.editors)
			editor.editable.contentEditable = 'false'
		
		document.body.removeChild(this.toolsContainer)
		
		document.getElementsByTagName('head')[0].removeChild(this.styles)
	}
	
	private checkLastActiveEditor(): boolean {
		if (this.lastActiveEditor === null || this.lastActiveEditor.editable !== this.lastActiveElement) {
			alert(NO_EDITABLE_SELECTED)
			return false
		}
		return true
	}
	
	submit(): void {
		if (!this.checkLastActiveEditor()) return
		
		const editor = this.lastActiveEditor!
		const editable = editor.editable
		const beatifiedHtml = this.beautifier.beautify(editable)
		
		if (!this.validateMode(editable)) return
		
		const req: Req = {
			htmlDocument: beatifiedHtml,
			
			sourceFiles: this.sourceFiles.map(sourceFile => ({
				path: sourceFile.path,
				domPath: sourceFile.domPath ? sourceFile.domPath(editor.index) : null,
				regexp: sourceFile.regexp ? sourceFile.regexp(editor.index).toString() : null,
			})),
			// extendedFunctionality: this.extendedFunctionality,
		}
		
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
					console.log(res)
					return res.json()
				}, res => console.error(res))
				.then(body => console.log(body.logs))
				.catch(err => console.error(err))
	}
	
	formatDoc(command: string, argument: string | undefined = undefined) {//console.debug(command);console.debug(argument)
		if (!this.checkLastActiveEditor()) return
		
		const editable = this.lastActiveEditor!.editable
		if (!this.validateMode(editable)) return
		
		document.execCommand(command, false, argument)
		editable.focus()
	}
	
	validateMode(editable: HTMLElement) {
		if (!this.switchMode.checked) return true
		
		alert('Uncheck "Show HTML".')
		editable.focus()
		return false
	}
	
	setSourceMode() {
		for (const editor of this.editors) {
			const editable = editor.editable;
			
			editable.contentEditable = 'false'
			const source = this.beautifier.beautify(editable)
			editable.innerHTML = ''
			
			// const oContent = document.createRange()
			// oContent.selectNodeContents(editable.firstChild)
			//const oContent = document.createTextNode(source)
			
			const oSourcePreview = document.createElement('pre')
			oSourcePreview.setAttribute('dir', 'auto')
			oSourcePreview.className = 'editable-source'
			oSourcePreview.innerText = source;
			oSourcePreview.contentEditable = 'true'
			
			editable.appendChild(oSourcePreview)
			//document.execCommand('defaultParagraphSeparator', false, 'div')
			
			//editable.focus()
			oSourcePreview.focus()
		}
	}
	
	setDocMode() {
		for (const editor of this.editors) {
			const editable = editor.editable
			
			// const oContent = document.createRange()
			// oContent.selectNodeContents(editable.firstChild)
			editable.innerHTML = (editable.firstElementChild as HTMLElement).innerText; //oContent.toString()
			
			editable.contentEditable = 'true'
			
			editable.focus()
		}
	}
}

// noinspection JSUnusedGlobalSymbols
export const editorManager = new EditorManager()

interface Options {
	serverUrl: string
	codeStyle: CodeStyle
	sourceFiles: SourceFile[]
}

export const DEF_OPTIONS: Options = {
	serverUrl: 'http://127.0.0.1:3000',
	codeStyle: DEF_CODE_STYLE,
	sourceFiles: [],
}

interface SourceFile {
	path: string
	domPath: (index: string) => string
	regexp: (index: string) => RegExp
}

interface ResolvedSourceFile {
	path: string
	domPath: string | null
	regexp: string | null
}

interface Editor {
	editable: HTMLElement
	index: string
	initDoc: string
}

interface Req {
	htmlDocument: string
	sourceFiles: ResolvedSourceFile[]
}
