// ==UserScript==
// @name        libReplaceText
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.6
// @author      lzghzr
// @description 替换网页内文本, 达到本地化的目的
// @license     MIT
// @grant       none
// @run-at      document-start
// ==/UserScript==
class ReplaceText {
    constructor(i18n, mode = 'equal') {
        this.W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
        this.done = new Set();
        this.alert = this.W.alert.bind(this.W);
        this.confirm = this.W.confirm.bind(this.W);
        this.prompt = this.W.prompt.bind(this.W);
        const i18nMap = new Map(i18n);
        const i18nArr = i18n.map(value => value[0]);
        if (mode === 'regexp') {
            this.textReplace = (text) => {
                if (i18nMap.has(text))
                    text = i18nMap.get(text);
                else {
                    const key = i18nArr.find(key => (key instanceof RegExp && text.match(key) !== null));
                    if (key !== undefined)
                        text = text.replace(key, i18nMap.get(key));
                }
                return text;
            };
        }
        else if (mode === 'match') {
            this.textReplace = (text) => {
                const key = i18nArr.find(key => (text.match(key) !== null));
                if (key !== undefined)
                    text = text.replace(key, i18nMap.get(key));
                return text;
            };
        }
        else {
            this.textReplace = (text) => {
                if (i18nMap.has(text))
                    text = i18nMap.get(text);
                return text;
            };
        }
        this.replaceAlert();
        this.replaceObserver();
    }
    replaceAlert() {
        this.W.alert = (message) => this.alert(this.textReplace(message));
        this.W.confirm = (message) => this.confirm(this.textReplace(message));
        this.W.prompt = (message, _default) => this.prompt(this.textReplace(message), _default);
    }
    replaceNode(node) {
        this.nodeForEach(node).forEach(textNode => {
            if (textNode.parentElement instanceof HTMLScriptElement || textNode.parentElement instanceof HTMLStyleElement)
                return;
            if (textNode instanceof Text) {
                const newText = this.textReplace(textNode.data);
                if (textNode.data !== newText) {
                    this.done.add(newText);
                    textNode.data = newText;
                }
            }
            else if (textNode instanceof HTMLInputElement && ['button', 'reset', 'submit'].includes(textNode.type)) {
                const newText = this.textReplace(textNode.value);
                if (textNode.value !== newText) {
                    this.done.add(newText);
                    textNode.value = newText;
                }
            }
            else if (typeof textNode.placeholder === 'string') {
                const newText = this.textReplace(textNode.placeholder);
                if (textNode.placeholder !== newText) {
                    this.done.add(newText);
                    textNode.placeholder = newText;
                }
            }
        });
    }
    replaceObserver() {
        const bodyObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    const t = mutation.target;
                    if (t instanceof HTMLInputElement && ['button', 'reset', 'submit'].includes(t.type) && !this.done.has(t.value))
                        this.replaceNode(t);
                    else if (typeof t.placeholder === 'string' && !this.done.has(t.placeholder))
                        this.replaceNode(t);
                }
                else if (mutation.type === 'characterData') {
                    const t = mutation.target;
                    if (t instanceof Text && !this.done.has(t.data))
                        this.replaceNode(t);
                }
                else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(addedNode => {
                        this.replaceNode(addedNode);
                    });
                }
            });
        });
        let load = false;
        document.addEventListener('readystatechange', () => {
            if (!load) {
                load = true;
                bodyObserver.observe(document.body, { attributes: true, characterData: true, childList: true, subtree: true });
                this.replaceNode(document.body);
            }
        }, { capture: true });
    }
    nodeForEach(node) {
        const list = [];
        if (node.childNodes.length === 0)
            list.push(node);
        else {
            node.childNodes.forEach(child => {
                if (child.childNodes.length === 0)
                    list.push(child);
                else
                    list.push(...this.nodeForEach(child));
            });
        }
        return list;
    }
}