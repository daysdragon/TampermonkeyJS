// ==UserScript==
// @name        steam物品价值
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 在市场物品详情中显示价值
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/market\/listings\/753\//
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
/// <reference path="SteamItemGoo.user.d.ts" />
{
  const gooValue = JSON.stringify(window.g_rgAssets).match(/GetGooValue\(.*?, (\d+), (\d+), (\d+)/)
  if (gooValue !== null)
    getGooValue(gooValue[1], gooValue[2], gooValue[3])
      .then(data => addGoo(data.goo_value))
  function getGooValue(appid: string, item_type: string, border_color: string) {
    return fetch(`//steamcommunity.com/auction/ajaxgetgoovalueforitemtype/\
?appid=${appid}&item_type=${item_type}&border_color=${border_color}`)
      .then(res => res.json())
  }
  function addGoo(gooValue: string) {
    const itemCont = <HTMLDivElement>document.querySelector('#largeiteminfo_content')
    const divGoo = document.createElement('div')
    divGoo.innerHTML = `该物品价值：<span style="color: #5b9ace">${gooValue} 宝珠</span>`
    itemCont.appendChild(divGoo)
  }
}