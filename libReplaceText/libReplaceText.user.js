// ==UserScript==
// @name        libReplaceText
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.2
// @author      lzghzr
// @description 替换网页内文本, 达到本地化的目的
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
class ReplaceText {
    constructor(i18n, mode = 'equal') {
        this.alert = W.alert.bind(W);
        this.confirm = W.confirm.bind(W);
        this.prompt = W.prompt.bind(W);
        this.i18n = new Map(i18n);
        if (mode === 'regexp') {
            this.textReplace = (text) => {
                if (this.i18n.has(text))
                    text = this.i18n.get(text);
                else {
                    let done = false;
                    this.i18n.forEach((value, key) => {
                        if (!done && key instanceof RegExp && text.match(key) !== null) {
                            done = true;
                            text = text.replace(key, value);
                        }
                    });
                }
                return text;
            };
        }
        else if (mode === 'match') {
            this.textReplace = (text) => {
                let done = false;
                this.i18n.forEach((value, key) => {
                    if (!done && text.match(key) !== null) {
                        done = true;
                        text = text.replace(key, value);
                    }
                });
                return text;
            };
        }
        else {
            this.textReplace = (message) => {
                if (this.i18n.has(message))
                    message = this.i18n.get(message);
                return message;
            };
        }
        const bodyObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    this.replaceNode(addedNode);
                });
            });
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        this.replaceAlert();
        this.replaceNode(document.body);
    }
    replaceAlert() {
        W.alert = (message) => this.alert(this.textReplace(message));
        W.confirm = (message) => this.confirm(this.textReplace(message));
        W.prompt = (message, _default) => this.prompt(this.textReplace(message), _default);
    }
    replaceNode(node) {
        this.nodeForEach(node).forEach(textNode => {
            if (textNode instanceof Text)
                textNode.data = this.textReplace(textNode.data);
            else if (textNode instanceof HTMLInputElement) {
                if (textNode.type === 'button')
                    textNode.value = this.textReplace(textNode.value);
                else if (textNode.type === 'text')
                    textNode.placeholder = this.textReplace(textNode.placeholder);
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