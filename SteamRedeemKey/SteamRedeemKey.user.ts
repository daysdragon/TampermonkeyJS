// ==UserScript==
// @name        SteamRedeemKey
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.6
// @author      lzghzr
// @description 划Key激活
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @match       *://*/*
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @noframes
// ==/UserScript==
import { GM_addStyle, GM_getValue, GM_setValue, GM_xmlhttpRequest } from '../@types/tm_f'

const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
// 主要显示区域
let elmDivSRK: HTMLDivElement
// Steam按钮图标
let elmDivSRKButton: HTMLDivElement
// key列表
let redeemKey: string
// 图标坐标
let left: number
let top: number
// 初始化设置
if (GM_getValue('server') === undefined) GM_setValue('server', 'http://127.0.0.1:1242')
if (GM_getValue('password') === undefined) GM_setValue('password', '')
if (location.href.match(/^https:\/\/steamcn\.com\/.*289320/)) {
  const elmDivShowhid = <HTMLLinkElement>document.querySelector('.showhide > p > a')
  // 因为论坛谜一样的设定, onclick并不总是生效
  W['SRKOptions'] = Options
  elmDivShowhid.setAttribute('onclick', 'SRKOptions()')
}
addCSS()
addUI()
document.addEventListener('mouseup', event => showUI(event))
/**
 * 显示图标, 由于冒泡机制, 使用setTimeout 0
 * 
 * @param {MouseEvent} event 
 */
function showUI(event: MouseEvent) {
  setTimeout(() => {
    const selection = W.getSelection()
    let str = selection.toString()
    if (str.length < 17) elmDivSRKButton.style.cssText = 'display: none;'
    else {
      const inputKeys: string[] = []
      const elmInputKeys = selection.getRangeAt(0).cloneContents().querySelectorAll('input')
      for (const elmInputKey of elmInputKeys) inputKeys.push(elmInputKey.value)
      str += inputKeys.join(',')
      const keys = str.match(/[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}/g)
      if (keys !== null) {
        const setKeys: Set<string> = new Set()
        keys.forEach(key => setKeys.add(key))
        redeemKey = Array.from(setKeys).join(',')
        top = event.pageY - 30
        left = event.pageX
        elmDivSRKButton.style.cssText = `
display: block;
left: ${left}px;
top: ${top}px;`
      }
      else elmDivSRKButton.style.cssText = 'display: none;'
    }
  }, 0)
}
/**
 * 把图标添加到body
 * 
 */
function addUI() {
  elmDivSRK = document.createElement('div')
  elmDivSRKButton = document.createElement('div')
  elmDivSRKButton.classList.add('SRK_button')
  elmDivSRK.appendChild(elmDivSRKButton)
  document.body.appendChild(elmDivSRK)
  elmDivSRKButton.addEventListener('click', () => clickButton())
}
/**
 * 图标点击事件处理
 * 
 */
function clickButton() {
  const elmDivRedeem = document.createElement('div')
  elmDivRedeem.classList.add('SRK_redeem')
  elmDivRedeem.style.cssText = `
left: ${left}px;
top: ${top}px;`
  elmDivSRK.appendChild(elmDivRedeem)
  GM_xmlhttpRequest({
    method: 'POST',
    url: `${GM_getValue('server')}/Api/Command/redeem%20${redeemKey}`,
    headers: { 'Authentication': GM_getValue('password') },
    responseType: 'json',
    onload: res => {
      if (res.status === 200) {
        console.log(res.response)
        const elmSpanRedeem = document.createElement('span')
        elmSpanRedeem.innerText = res.responseText
        elmDivRedeem.appendChild(elmSpanRedeem)
        elmDivRedeem.classList.add('SRK_redeem_green')
      }
    }
  })
}
/**
 * 加载设置界面
 * 
 */
function Options() {
  const elmDivOptions = <HTMLDivElement>document.querySelector('.showhide')
  const df = document.createDocumentFragment()
  const elmSpanServer = document.createElement('span')
  const elmInputServer = document.createElement('input')
  const elmSpanPassword = document.createElement('span')
  const elmInputPassword = document.createElement('input')
  elmSpanServer.innerText = '服务器'
  elmInputServer.value = GM_getValue('server')
  elmInputServer.addEventListener('input', () => {
    if (elmInputServer.value === '') elmInputServer.value = 'http://127.0.0.1:1242'
    GM_setValue('server', elmInputServer.value)
  })
  elmSpanPassword.innerText = '密码'
  elmInputPassword.value = GM_getValue('password')
  elmInputPassword.addEventListener('input', () => {
    GM_setValue('password', elmInputPassword.value)
  })
  df.appendChild(elmSpanServer)
  df.appendChild(elmInputServer)
  df.appendChild(elmSpanPassword)
  df.appendChild(elmInputPassword)
  elmDivOptions.innerText = ''
  elmDivOptions.appendChild(df)
}
/**
 * 插入CSS规则
 * 
 */
function addCSS() {
  GM_addStyle(`
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
}`)
}