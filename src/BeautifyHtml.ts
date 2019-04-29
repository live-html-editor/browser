import {TextWrap, WrapStyle} from "./TextWrap";
import {getOpenTag, initiateObject} from "./utilities";

/**
 * @author [S. Mahdi Mir-Ismaili](https://mirismaili.github.io).
 * Created on 1398/2/5 (2019/4/25).
 */

export class BeautifyHtml implements CodeStyle {
	private static readonly BLOCKS = /^(?:P|H[123456]|BLOCKQUOTE|[UO]L|LI|DIV)$/;
	//private static readonly TEXT_OR_INLINE = /^(?:#text|[BIA]|CODE|FONT|SPAN)$/;
	
	private readonly wrapper: TextWrap;
	
	// noinspection JSUnusedGlobalSymbols
	readonly tabLength: number;
	readonly indent: string;
	readonly continuationIndent: string;
	readonly keepIntentsOnEmptyLines: boolean;
	readonly emptyLinesBetweenBlocks: number;
	readonly wrapOn: number;
	
	constructor(codeStyle: CodeStyle = DEF_CODE_STYLE) {
		initiateObject(this, codeStyle, DEF_CODE_STYLE);
		this.wrapper = new TextWrap(codeStyle);
	}
	
	beautify(element: HTMLElement): string {
		return this.beautifyR(element, null);
	}
	
	/**
	 * @param element - Must a block element like `<div>`, `<p>`, `<h1>` (not inline like `<b>`, `<i>`, `<a>`).
	 * See {@link #BLOCKS} variable.
	 * @param parentIndents - Set to `null` if you want to beautify `innerHTML` only.
	 */
	beautifyR(element: HTMLElement, parentIndents: string): string { if (!BeautifyHtml.BLOCKS.test(element.nodeName)) console.error('false');
		//if (!BeautifyHtml.BLOCKS.test(element.nodeName)) return element.outerHTML;
		
		let indents: string;
		let preFirst: string;
		let sufLast: string;
		let openTag: string;
		let closeTag: string;
		
		if (parentIndents === null)
			indents = preFirst = sufLast = openTag = closeTag = '';
		else {
			indents = parentIndents + this.indent;
			preFirst = '\n' + indents;
			sufLast = '\n' + parentIndents;
			openTag = getOpenTag(element);
			closeTag = `</${element.tagName.toLowerCase()}>`;
		}
		
		const blockSeparator =
				('\n' + (this.keepIntentsOnEmptyLines ? indents : '')).repeat(this.emptyLinesBetweenBlocks)
				+ ('\n' + indents);
		//--------------------------------------------------------/
		
		const nodes = element.childNodes;
		const l = nodes.length;
		const l_1 = l - 1;
		let isBlock: boolean;
		let previousIsBlock = false;
		let output = '';
		
		for (let i = 0; i < l; ++i) {
			let node: ChildNode;
			const i0 = i;
			while (true) {
				node = nodes[i]; //console.debug(node);
				
				if (BeautifyHtml.BLOCKS.test(node.nodeName)) break;
				
				if (++i === l) break;
			}
			
			if (i > i0) {
				--i;
				isBlock = false;
			} else
				isBlock = true;
			//console.debug(isBlock);
			
			let pre: string;			// WhiteSpaces; Before Non-blocks (Between-Blocks-and-Non-blocks or Before-First-Non-block)
			let suf: string;			// WhiteSpaces; After Non-Blocks (Between-Non-blocks-and-Blocks or After-Last-Non-block)
			let separator: string;  // WhiteSpaces; Between-2-Blocks or Before-First-Block or After-Last-Block
			
			if (!(i0 === 0 || i === l_1)) {	// Not First, Not Last => Middle
				//console.debug('MIDDLE');
				pre = suf = blockSeparator;
				separator = blockSeparator;
			} else if (!(i === l_1)) { 		// Not Last => First
				//console.debug('FIRST');
				pre = preFirst;
				suf = blockSeparator;
				separator = preFirst;
			} else if (!(i0 === 0)) { 			// Not First => Last
				//console.debug('LAST');
				pre = blockSeparator;
				suf = sufLast;
				separator = sufLast;
			} else { 								// First and Last
				//console.debug('BOTH');
				pre = preFirst;
				suf = sufLast;
				separator = '';
			}
			
			if (!isBlock) {
				previousIsBlock = false;
				
				let text = '';
				
				if (this.wrapOn === 0) {
					for (let j = i0; j <= i; ++j) {
						node = nodes[j];
						
						if (node.nodeType !== Node.ELEMENT_NODE) {
							text += node.nodeValue;
							continue;
						}
						
						text += (<HTMLElement>node).outerHTML;
					}
					
					if (text === separator) {
						output += text; //console.debug(JSON.stringify(output));
						continue;
					}
				}
				else {
					let originalText = '';
					let manipulatedText = '';
					
					for (let j = i0; j <= i; ++j) {
						node = nodes[j];
						
						if (node.nodeType !== Node.ELEMENT_NODE) {
							let nodeValue = node.nodeValue;
							originalText += nodeValue;
							
							// Don't wrap spaces in [![...]
							nodeValue = nodeValue.replace(/(\[!\[\S*?)(\s+)(\S*?])/g, '$1●$3');
							manipulatedText += nodeValue;
							continue;
						}
						
						const outerHtml = (<HTMLElement>node).outerHTML;
						originalText += outerHtml;
						
						const innerHtml = (<HTMLElement>node).innerHTML;
						const length = outerHtml.length;
						
						const openTagLength = outerHtml[length - 2] === '/' ?
								length : 
								length - innerHtml.length - (node.nodeName.length + 3);
						let openTag = outerHtml.slice(0, openTagLength);
						
						// Don't wrap spaces in <html open tags> (or <self-closing tags />)
						openTag = openTag.replace(/\s/g, '●');
						
						manipulatedText += openTag + outerHtml.slice(openTagLength);
					}
					
					if (originalText === separator) {
						output += originalText; //console.debug(JSON.stringify(output));
						continue;
					}
					
					const wrapResult = this.wrapper.wrap(manipulatedText, indents);
					const markers = wrapResult.markers;
					
					let m = 0;
					const absContinuationIndents = indents + this.continuationIndent;  // abs: absolute (not relative to `indents`)
					for (const marker of markers) {
						if (m > 0) text += absContinuationIndents;
						text += originalText.slice(m, marker) + '\n';
						if (marker===307) {
							console.log(originalText.slice(m, marker))
						}
						m = marker;
					}
					if (m > 0) text += absContinuationIndents;
					text += originalText.slice(m);
				}
				//console.log(text);
				
				const start = /^\s*/.exec(text)[0];
				if (start.length === text.length) { // If text only contains white spaces
					output += separator; //console.debug(JSON.stringify(output));
					continue;
				}
				const end = /\s*$/.exec(text)[0];
				
				//console.debug(text !== text);console.debug(JSON.stringify(start));console.debug(JSON.stringify(end));
				output +=
						start === pre && end === suf ?
								text :
								pre + text.slice(start.length, text.length - end.length) + suf;
				
				//console.log(output);
				continue;
			}
			
			if (previousIsBlock) output += separator;
			
			previousIsBlock = true;
			
			output += this.beautifyR(<HTMLElement>node, indents);
			
			if (i === l_1) output += separator;
		}
		
		//console.debug(output); //console.debug(JSON.stringify(output));
		
		return openTag + output + closeTag; //console.debug(openTag + output + closeTag);
	}
}

export interface CodeStyle extends WrapStyle {
	indent                 : string;
	keepIntentsOnEmptyLines: boolean;
	emptyLinesBetweenBlocks: number;
}

export const DEF_CODE_STYLE: CodeStyle = {
	indent: '\t',
	continuationIndent: '',
	keepIntentsOnEmptyLines: true,
	emptyLinesBetweenBlocks: 1,
	tabLength: 4,
	wrapOn: 120,
};
