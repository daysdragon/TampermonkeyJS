// ==UserScript==
// @name        惠惠购物助手
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.1.0
// @author      lzghzr
// @description 在您网购浏览商品的同时，自动对比其他优质电商同款商品价格，并提供商品价格历史，帮您轻松抄底，聪明网购不吃亏！
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @match       http://*/*
// @match       https://*/*
// @connect     zhushou.huihui.cn
// @connect     shared-https.ydstatic.com
// @license     MIT
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @noframes
// ==/UserScript==
import { GM_getValue, GM_setValue, GM_xmlhttpRequest } from '../@types/tm_f'

// 一天一更新
if (Date.now() - GM_getValue('last', 0) > 24 * 60 * 60 * 1000) {
  // 更新匹配规则
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://zhushou.huihui.cn/extensions/config.xml',
    onload: res => {
      if (res.status === 200) {
        GM_setValue('last', Date.now())
        const matched = res.responseXML.querySelector('matched')
        if (matched !== null) GM_setValue('matched', (<Node>matched.firstChild).nodeValue)
      }
    }
  })
  // 更新脚本地址
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://shared-https.ydstatic.com/gouwuex/ext/script/load_url_s.txt',
    responseType: 'json',
    onload: res => {
      if (res.status === 200 && typeof res.response.src === 'string')
        GM_setValue('src', res.response.src)
    }
  })
}
if (GM_getValue('matched') !== undefined && GM_getValue('src') !== undefined) {
  const regUrl = new RegExp(GM_getValue('matched'))
  if (regUrl.test(location.href)) {
    // 插入设置，阻止弹出升级提示
    const opnode = document.createElement('span')
    opnode.id = 'youdaoGWZS_options'
    opnode.innerText = 'closeddpTips=true;closeddpTips618=true'
    opnode.style.display = 'none'
    document.body.appendChild(opnode)
    // 插入远程脚本
    const daogw_s = document.createElement('script')
    daogw_s.charset = 'UTF-8'
    daogw_s.type = 'application/javascript'
    daogw_s.id = 'youdao_gouwu_assistant'
    daogw_s.src = GM_getValue('src')
    if (document.head !== null) document.head.appendChild(daogw_s)
  }
}