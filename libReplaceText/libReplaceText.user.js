// ==UserScript==
// @name        libReplaceText
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 替换网页内文本, 达到本地化的目的
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
class ReplaceText {
    constructor(i18n) {
        this.alert = W.alert.bind(W);
        this.confirm = W.confirm.bind(W);
        this.prompt = W.prompt.bind(W);
        this.i18n = new Map(i18n);
        const bodyObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => this.replaceText(addedNode));
            });
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        this.replaceAlert();
        this.replaceText(document.body);
    }
    replaceAlert() {
        W.alert = (message) => {
            if (this.i18n.has(message))
                message = this.i18n.get(message);
            return this.alert(message);
        };
        W.confirm = (message) => {
            if (this.i18n.has(message))
                message = this.i18n.get(message);
            return this.confirm(message);
        };
        W.prompt = (message, _default) => {
            if (this.i18n.has(message))
                message = this.i18n.get(message);
            return this.prompt(message, _default);
        };
    }
    replaceText(node) {
        this.nodeForEach(node).forEach(textNode => {
            if (textNode instanceof Text && this.i18n.has(textNode.data))
                textNode.data = this.i18n.get(textNode.data);
            else if (textNode instanceof HTMLInputElement) {
                if (textNode.type === 'button' && this.i18n.has(textNode.value))
                    textNode.value = this.i18n.get(textNode.value);
                else if (textNode.type === 'text' && this.i18n.has(textNode.placeholder))
                    textNode.placeholder = this.i18n.get(textNode.placeholder);
            }
        });
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