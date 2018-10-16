// ==UserScript==
// @name        libReplaceText
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.7
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
    replaceNode(node, self = false) {
        const list = this.getReplaceList(node, self);
        for (let index in list) {
            list[index].forEach(node => {
                if (this.done.has(node[index]))
                    return;
                const newText = this.textReplace(node[index]);
                if (node[index] !== newText) {
                    this.done.add(newText);
                    node[index] = newText;
                }
            });
        }
    }
    replaceObserver() {
        const bodyObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' || mutation.type === 'characterData')
                    this.replaceNode(mutation.target, true);
                else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(addedNode => this.replaceNode(addedNode));
                }
            });
        });
        document.addEventListener('readystatechange', () => {
            bodyObserver.observe(document.body, { attributes: true, characterData: true, childList: true, subtree: true });
            this.replaceNode(document.body);
        }, { capture: true, once: true });
    }
    getReplaceList(node, self = false) {
        const list = {
            data: new Set(),
            placeholder: new Set(),
            title: new Set(),
            value: new Set(),
        };
        const nodeList = self ? [node] : this.nodeForEach(node);
        nodeList.forEach(node => {
            if (node instanceof HTMLScriptElement || node instanceof HTMLStyleElement)
                return;
            if (node instanceof HTMLElement && node.title !== '')
                list.title.add(node);
            else if (node instanceof HTMLInputElement && ['button', 'reset', 'submit'].includes(node.type) && node.value !== '')
                list.value.add(node);
            else if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement && node.placeholder !== '')
                list.placeholder.add(node);
            else if (node instanceof Text)
                list.data.add(node);
        });
        return list;
    }
    nodeForEach(node) {
        const list = [];
        list.push(node);
        if (node.hasChildNodes())
            node.childNodes.forEach(child => list.push(...this.nodeForEach(child)));
        return list;
    }
}