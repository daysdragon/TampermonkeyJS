// ==UserScript==
// @name        bilibili夏日绘板
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 组队一起画呀
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @match       *://api.live.bilibili.com/feed*
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==

class BiliDraw {
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  public apiKey: string
  public wsc: WebSocket
  public Start() {
    this.wsc = new WebSocket('wss://bilive.halaal.win/drawapi', this.apiKey)
    this.wsc.onmessage = this._Draw.bind(this)
    this.wsc.onclose = this._Close.bind(this)
  }
  private _Draw(data) {
    let dataInfo = <dataInfo>JSON.parse(data.data)
      , x = dataInfo.x
      , y = dataInfo.y
      , c = dataInfo.c
    let xhr = new XMLHttpRequest()
    xhr.open('POST', '/activity/v1/SummerDraw/draw')
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    xhr.onload = ev => {
      let res = JSON.parse((<XMLHttpRequest>ev.target).responseText)
      if (res.code === 0) console.log(`坐标x: ${x}, y: ${y} 填充完毕`)
      else console.log(`坐标x: ${x}, y: ${y} 填充失败`)
    }
    xhr.send(`x_min=${x}&y_min=${y}&x_max=${x}&y_max=${y}&color=${c}`)
  }
  private _Close() {
    setTimeout(() => {
      this.Start()
    }, 3000)
  }
}
window['Draw'] = (apiKey: string) => {
  const biliDraw = new BiliDraw(apiKey)
  biliDraw.Start()
}
interface dataInfo {
  x: number
  y: number
  c: string
}