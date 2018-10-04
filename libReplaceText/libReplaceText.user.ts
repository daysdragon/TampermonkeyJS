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
export { }

const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
// @ts-ignore
class ReplaceText {
  /**
   * Creates an instance of ReplaceText.
   * @param {[string, string][]} i18n
   * @memberof ReplaceText
   */
  constructor(i18n: [string, string][]) {
    this.i18n = new Map(i18n)
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => this.replaceText(addedNode))
      })
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })
    this.replaceAlert()
    this.replaceText(document.body)
  }
  public i18n: Map<string, string>
  public alert = W.alert.bind(W)
  public confirm = W.confirm.bind(W)
  public prompt = W.prompt.bind(W)
  /**
   * 替换弹出框
   *
   * @memberof ReplaceText
   */
  public replaceAlert() {
    W.alert = (message: string) => {
      // @ts-ignore Map.has is true
      if (this.i18n.has(message)) message = this.i18n.get(message)
      return this.alert(message)
    }
    W.confirm = (message: string) => {
      // @ts-ignore Map.has is true
      if (this.i18n.has(message)) message = this.i18n.get(message)
      return this.confirm(message)
    }
    W.prompt = (message: string, _default: string) => {
      // @ts-ignore Map.has is true
      if (this.i18n.has(message)) message = this.i18n.get(message)
      return this.prompt(message, _default)
    }
  }
  /**
   * 替换节点上的所有文本节点
   *
   * @param {Node} node
   * @memberof ReplaceText
   */
  public replaceText(node: Node) {
    this.nodeForEach(node).forEach(textNode => {
      if (textNode instanceof Text && this.i18n.has(textNode.data))
        // @ts-ignore Map.has is true
        textNode.data = this.i18n.get(textNode.data)
      else if (textNode instanceof HTMLInputElement) {
        if (textNode.type === 'button' && this.i18n.has(textNode.value))
          // @ts-ignore Map.has is true
          textNode.value = this.i18n.get(textNode.value)
        else if (textNode.type === 'text' && this.i18n.has(textNode.placeholder))
          // @ts-ignore Map.has is true
          textNode.placeholder = this.i18n.get(textNode.placeholder)
      }
    })
  }
  /**
   * 深度遍历节点, 返回文本节点
   *
   * @param {Node} node
   * @returns {Node[]}
   * @memberof ReplaceText
   */
  public nodeForEach(node: Node): Node[] {
    const list: Node[] = []
    if (node.childNodes.length === 0) list.push(node)
    else {
      node.childNodes.forEach(child => {
        if (child.childNodes.length === 0) list.push(child)
        else list.push(...this.nodeForEach(child))
      })
    }
    return list
  }
}