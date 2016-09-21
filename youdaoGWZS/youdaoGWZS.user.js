// ==UserScript==
// @name        惠惠购物助手
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 在您网购浏览商品的同时，自动对比其他优质电商同款商品价格，并提供商品价格历史，帮您轻松抄底，聪明网购不吃亏！
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @match       *://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

// 一天一更新
if (Date.now() - GM_getValue('last', 0) > 86400000) {
    // 更新匹配规则
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://zhushou.huihui.cn/extensions/config.xml',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
        onload: function (response) {
            if (response.status === 200 && response.responseXML) {
                GM_setValue('last', Date.now())
                GM_setValue('matched', response.responseXML.getElementsByTagName('matched')[0].firstChild.nodeValue)
            }
        }
    })
    // 更新脚本地址
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://shared-https.ydstatic.com/gouwuex/ext/script/load_url_s.txt',
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
        responseType: 'json',
        onload: function (response) {
            if (response.status === 200 && response.response.src) GM_setValue('src', response.response.src)
        }
    })
}
// 虽然淘宝不允许用iframe，但万一呢
if (self === top && GM_getValue('matched') && GM_getValue('src')) {
    var regUrl = new RegExp(GM_getValue('matched'))
    if (regUrl.test(location.href)) {
        // 插入设置，阻止弹出升级提示
        var opnode = document.createElement('span')
        opnode.id = 'youdaoGWZS_options'
        opnode.innerHTML = 'closeddpTips=true;closeddpTips618=true'
        opnode.style.display = 'none'
        document.getElementsByTagName('body')[0].appendChild(opnode)
        // 插入远程脚本，事实上这是greasyfork所禁止的行为
        var daogw_s = document.createElement('script')
        daogw_s.charset = 'UTF-8'
        daogw_s.type = 'text/javascript'
        daogw_s.id = 'youdao_gouwu_assistant'
        daogw_s.src = GM_getValue('src')
        document.getElementsByTagName('head')[0].appendChild(daogw_s)
    }
}