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
/// <reference path="libReplaceText.d.ts" />

class ReplaceText {
  /**
   * Creates an instance of ReplaceText.
   * 
   * @param {[string | RegExp, string][]} i18n - 形如 [['Hello', '你好'], [/World/, '世界'], [RegExp('!'), '！']]
   * @param {('equal' | 'match' | 'regexp')} [mode='equal'] - 匹配模式. 'equal' 完全相等, 使用 Map.has 匹配, 速度较快. 'match' 部分匹配, 使用 Array.find 匹配, 速度较慢, 支持正则. 'regexp' 正则匹配, 优先采用全字匹配, 否则使用 Array.find 匹配, 速度较慢, 支持正则.
   * @memberof ReplaceText
   */
  constructor(i18n: [string, string][])
  constructor(i18n: [string, string][], mode: 'equal')
  constructor(i18n: [string | RegExp, string][], mode: 'match' | 'regexp')
  constructor(i18n: [string | RegExp, string][], mode: 'equal' | 'match' | 'regexp' = 'equal') {
    const i18nMap = new Map(i18n)
    const i18nArr = i18n.map(value => value[0])
    if (mode === 'regexp') {
      this.textReplace = (text: string) => {
        // @ts-ignore Map.has is true
        if (i18nMap.has(text)) text = i18nMap.get(text)
        else {
          const key = i18nArr.find(key => (key instanceof RegExp && text.match(key) !== null))
          // @ts-ignore i18nMap.keys == i18nArr.keys
          if (key !== undefined) text = text.replace(key, i18nMap.get(key))
        }
        return text
      }
    }
    else if (mode === 'match') {
      this.textReplace = (text: string) => {
        const key = i18nArr.find(key => (text.match(key) !== null))
        // @ts-ignore i18nMap.keys == i18nArr.keys
        if (key !== undefined) text = text.replace(key, i18nMap.get(key))
        return text
      }
    }
    else {
      this.textReplace = (text: string) => {
        // @ts-ignore Map.has is true
        if (i18nMap.has(text)) text = i18nMap.get(text)
        return text
      }
    }
    this.replaceAlert()
    this.replaceObserver()
  }
  public W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  public done: Set<string> = new Set()
  /**
   * window.alert
   *
   * @memberof ReplaceText
   */
  public alert = this.W.alert.bind(this.W)
  /**
   * window.confirm
   *
   * @memberof ReplaceText
   */
  public confirm = this.W.confirm.bind(this.W)
  /**
   * window.prompt
   *
   * @memberof ReplaceText
   */
  public prompt = this.W.prompt.bind(this.W)
  public textReplace: (text: string) => string
  /**
   * 替换弹出框
   *
   * @memberof ReplaceText
   */
  public replaceAlert() {
    this.W.alert = (message: string) => this.alert(this.textReplace(message))
    this.W.confirm = (message: string) => this.confirm(this.textReplace(message))
    this.W.prompt = (message: string, _default: string) => this.prompt(this.textReplace(message), _default)
  }
  /**
   * 替换节点上的所有文本
   *
   * @param {Node} node
   * @param {boolean} [self=false]
   * @memberof ReplaceText
   */
  public replaceNode(node: Node, self = false) {
    const list = this.getReplaceList(node, self)
    for (let index in list) {
      // @ts-ignore it's too difficult
      list[index].forEach(node => {
        if (this.done.has(node[index])) return
        const newText = this.textReplace(node[index])
        if (node[index] !== newText) {
          this.done.add(newText)
          node[index] = newText
        }
      })
    }
  }
  /**
   * 替换动态内容
   *
   * @memberof ReplaceText
   */
  public replaceObserver() {
    // 出于功能不需要太高实时性, 使用 MutationObserver 而不是 MutationEvents
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' || mutation.type === 'characterData')
          this.replaceNode(mutation.target, true)
        else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(addedNode => this.replaceNode(addedNode))
        }
      })
    })
    // 使用 document.onreadystatechange 可以更早的替换 body
    document.addEventListener('readystatechange', () => {
      bodyObserver.observe(document.body, { attributes: true, characterData: true, childList: true, subtree: true })
      this.replaceNode(document.body)
    }, { capture: true, once: true })
  }
  /**
   * 深度遍历节点
   *
   * @param {Node} node
   * @param {boolean} [self=false]
   * @returns {replaceList}
   * @memberof ReplaceText
   */
  public getReplaceList(node: Node, self = false): replaceList {
    const list: replaceList = {
      data: new Set<Text>(),
      placeholder: new Set<HTMLInputElement | HTMLTextAreaElement>(),
      title: new Set<HTMLElement>(),
      value: new Set<HTMLInputElement>(),
    }
    const nodeList = self ? [node] : this.nodeForEach(node)
    nodeList.forEach(node => {
      // 排除特殊标签
      if (node instanceof HTMLScriptElement || node instanceof HTMLStyleElement) return
      if (node instanceof HTMLElement && node.title !== '') list.title.add(node)
      else if (node instanceof HTMLInputElement && ['button', 'reset', 'submit'].includes(node.type) && node.value !== '')
        list.value.add(node)
      else if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement && node.placeholder !== '')
        list.placeholder.add(node)
      else if (node instanceof Text) list.data.add(node)
    })
    return list
  }
  /**
   * 深度遍历节点, 返回所有节点
   *
   * @param {Node} node
   * @returns {Node[]}
   * @memberof ReplaceText
   */
  public nodeForEach(node: Node): Node[] {
    const list: Node[] = []
    list.push(node)
    if (node.hasChildNodes())
      node.childNodes.forEach(child => list.push(...this.nodeForEach(child)))
    return list
  }
}

export default ReplaceText 