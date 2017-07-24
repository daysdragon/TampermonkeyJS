// ==UserScript==
// @name        SteamRedeemKey
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.4
// @author      lzghzr
// @description 划Key激活
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @match       *://*/*
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
/// <reference path="SteamRedeemKey.d.ts" />
class SteamRedeemKey {
  constructor() {
  }
  private _elmDivSRK: HTMLDivElement
  private _elmDivSRKButton: HTMLDivElement
  private _D = document
  private _W = unsafeWindow || window
  private _redeemKey: string
  private _left: number
  private _top: number
  public Start() {
    this._AddUI()
    this._D.addEventListener('mouseup', this._ShowUI.bind(this))
  }
  private _ShowUI(event) {
    setTimeout(() => {
      let selection = this._W.getSelection()
        , str = selection.toString()
      if (str.length < 17) this._elmDivSRKButton.style.cssText = 'display: none;'
      else {
        let inputKeys: string[] = []
          , elmInputKeys = selection.getRangeAt(0).cloneContents().querySelectorAll('input')
        for (let i = 0; i < elmInputKeys.length; i++) inputKeys.push(elmInputKeys[i].value)
        str = str + inputKeys.join(',')
        let keys = str.match(/[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}/g)
        if (keys !== null) {
          let redeemKey: string[] = []
          keys.forEach(key => {
            if (redeemKey.indexOf(key) === -1) redeemKey.push(key)
          })
          this._redeemKey = redeemKey.join(',')
          this._top = this._D.body.scrollTop + event.clientY - 30
          this._left = this._D.body.scrollLeft + event.clientX
          this._elmDivSRKButton.style.cssText = `
display: block;
left: ${this._left}px;
top: ${this._top}px;`
        }
        else this._elmDivSRKButton.style.cssText = 'display: none;'
      }
    }, 0)
  }
  private _AddUI() {
    this._AddCSS()
    this._elmDivSRK = this._D.createElement('div')
    this._elmDivSRKButton = this._D.createElement('div')
    this._elmDivSRKButton.classList.add('SRK_button')
    this._elmDivSRK.appendChild(this._elmDivSRKButton)
    this._D.body.appendChild(this._elmDivSRK)
    this._elmDivSRKButton.addEventListener('click', this._ClickButton.bind(this))
  }
  private _ClickButton() {
    let elmDivRedeem = this._D.createElement('div')
    elmDivRedeem.classList.add('SRK_redeem')
    elmDivRedeem.style.cssText = `
left: ${this._left}px;
top: ${this._top}px;`
    this._elmDivSRK.appendChild(elmDivRedeem)
    GM_xmlhttpRequest({
      method: 'GET',
      url: `http://127.0.0.1:1242/IPC?command=redeem%20${this._redeemKey}`,
      onload: (res) => {
        if (res.status === 200) {
          let elmSpanRedeem = this._D.createElement('span')
          elmSpanRedeem.innerHTML = res.responseText
          let resText = elmSpanRedeem.innerText
          elmSpanRedeem.innerHTML = resText.slice(1).replace(/\n/g, '<br />')
          elmDivRedeem.appendChild(elmSpanRedeem)
          elmDivRedeem.classList.add('SRK_redeem_green')
        }
      }
    })
  }
  private _AddCSS() {
    let cssText = `
.SRK_button {
  background: no-repeat url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFRklEQVR4XoXVCWwUVRzH8e+bmZ3dtvTulp4IiLZqBSQoIArKoSIKclQKyNUECInBeCXUCh5F41HFBA8EQSEcFZTbizMoqNAIJQE1CmI4WqhaaKHHzs6bvxuzoUlj6Sf5JflPkvd/8/Lyf8rO6E8rwVQ6Eg9DCZaS7igZC9yh4BYgGwCoFjgOHELUJi3qRCRoMSIxAYMoLP5fjggLw6KmglK0BYnATcB44A1gNVAKnCbqWg2KtKgVoGLogOcJAIahHgMKQWYBq9ptoOAJLcY7XIMyLUKXG6HhPCAAgAFJGX5/XMxKpb3OAm8SpezMOwFAKARZz7VYPpyzZ8AfYOKUMdvHPzJ8t4iois++vu+z1ZsfQGvsnGxw3ceANdEGdwMEgVoQ2qMsi9DZs6RkZTQe2L1ySn5e97015y4MVqYpGRlp+6qO/jJy4NBpK5rq6/3+jExEe1lAjQUmwBI6EG5oQdl+78C3FU/nd88+ff+YuXv8SmtBKcMOuFsqymfu31dR0qdgxNvhxjBWwF4GPKQCWUO7AqfoQEv1KQpnzqhav/T5uaMnz1sRTEms/2hxyauAKpox/0VlWWrdshfmPDjpuaVfrfs8P5CVC9DNMg1rmgjtU2BYJtDEvf1vrQ6H3eGNTY69ZU3JquhVpeLjsmVDH3nymZATHjatcNjxr9Z9mm8oC2C25boy0O+3EREQ2sIwFfW1dRgJN8rYhwedbgk5Wa7GBHIBBQiQrDWmoVSS47jJYEcKC2CQFbri3BY6/zdGMEhiQhzieUjr5nEjNU0XWf7pu5Wdg8ktgJWdma5HTZw/cfniZ3Z7nsfk2a/d37Pghgafz3JWbtjTGzMRw/IBXMfOfUf2FRW/8ldczmgXbhcShkvSDY9Kal6RJPQoFOglo6aV/SUiayPZHskWxwlvnTrnjfMjx5VceHh8ae3cee+dFZGPd31XVYl5l8R1HScpkTUiuaxEZCuQ9cefNbJ6/d70im0Hgr9U/hqD64LPole/W5ord71zxGcZDhALAIQAB0gAPKBu+87K3LFTygpQiuT0FLTnAVxRIrID6A+cBMLak5i1G79N+anq90DfXj2ak1MTnJFD+jQAvtYphge4Pxz+PX7jtgNxVSfOxe/65lCMERsgmJmKdlyiqpWILAeKgXNEjz0aDzDL39+cvG3/8dglZTMu3nR9lgMAqGdfXZNYvmhDPFdaIC2BpIxUbNvC0x6tOKhmLfhkweghvV96cHCvy4BHKxWtdfmKrxN2/PizuWPpU/UnT9eak57+oNOhXYeN2B7ZxHeKRWtNO95S5Ey8mbjA8X5985gwoq+ePmqAJMfH0oae+cpae8LwPl5R6SfmP7+dIZjfBUQQoX0ieSr9oRdwtP7yUk3dCBqaSM/L4cSGUi5caiSpU4C0xDgWbfiOuvom7undjWGTXic1PxflCR3YCzLE8vw2FswK9sg944lQ++sZXly1hyfGDGDxxu9xIgtfUVBWfB8z3tyI0TkNw/YjdECkGEClTS4HAGUUK6WWh13NpfMXeXLyYIb27Co15/6Rgpu7GIs2/cj6LypJ65YB2qNdSgEyB5EloFBp0xdzlWXONyzz5XDY5WJ1HalZKeSkJ8qxUxeUvtxCek4q4gnSdv/REsMAz1uI48xHBNR/Dd6N3hcPbB8EArMw1IeI0BwK47iaGNvC77MQkWtMRAUij9Pc8h7NzVf/xoLWIYcIwFKx7f2YZlkglrGB6HevneOI2orWpSoUOoZIB4++CHjyM7Y5DssqwDQmgeoPdAVSAAXUAadADqK9Clz3KOEwiNDWv8cbRuR4oLfxAAAAAElFTkSuQmCC");
  border-radius: 50%;
  box-shadow: 0px 0px 10px 0px #171a21;
  cursor: pointer;
  display: none;
  height: 24px;
  position: absolute;
  width: 24px;
  z-index: 999;
}
.SRK_redeem {
  background: #57CBDE;
  border-radius: 50%;
  height: 24px;
  position: absolute;
  width: 24px;
  z-index: 999;
}
.SRK_redeem_green {
  background: #90BA3C;
}
.SRK_redeem > span {
  background: #FFF;
  color: #000;
  display:none;
  font-size: 15px;
  margin: 12px 12px;
  position: absolute;
  white-space: nowrap;
  z-index: 999;
}
.SRK_redeem:hover > span {
  display: block;
}`
    let elmStyle = this._D.createElement('style')
    elmStyle.innerHTML = cssText
    this._D.body.appendChild(elmStyle)
  }
}
const redeem = new SteamRedeemKey()
redeem.Start()