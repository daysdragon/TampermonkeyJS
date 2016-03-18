// ==UserScript==
// @name        惠惠购物助手
// @description 【网易出品】在您网购浏览商品的同时，自动对比其他优质电商同款商品价格，并提供商品价格历史，帮您轻松抄底，聪明网购不吃亏！
// @version     0.0.0.2
// @author      lzzr
// @namespace   https://lzzr.me/
// @include     /https?\:\/\/.*/
// @downloadURL https://github.com/lzghzr/GreasemonkeyJS/raw/master/youdaoGWZS/youdaoGWZS.user.js
// @updateURL   https://github.com/lzghzr/GreasemonkeyJS/raw/master/youdaoGWZS/youdaoGWZS.meta.js
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @compatible  chrome
// @compatible  firefox
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

(undefined == GM_getValue('last')) && GM_setValue('last', 0);
/* 一天一更新 */
if ((new Date()).getTime() - GM_getValue('last') > 86400000)
{
    /* 更新规则 */
    GM_xmlhttpRequest(
    {
        method: 'GET',
        url: 'https://zhushou.huihui.cn/extensions/config.xml',
        headers:
        {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response)
        {
            if (200 == response.status && response.responseXML)
            {
                GM_setValue('last', (new Date()).getTime());
                GM_setValue('matched', response.responseXML.getElementsByTagName('matched')[0].firstChild.nodeValue);
            }
        }
    });
    /* 更新脚本地址 */
    GM_xmlhttpRequest(
    {
        method: 'GET',
        url: 'https://shared-https.ydstatic.com/gouwuex/ext/script/load_url_s.txt',
        headers:
        {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        responseType: 'json',
        onload: function(response)
        {
            if (200 == response.status && response.response.src)
            {
                GM_setValue('src', response.response.src);
            }
        }
    });
}
/* 只是第一次有用 */
if (GM_getValue('matched') && GM_getValue('src'))
{
    var regUrl = new RegExp(GM_getValue('matched'));
    if (location.href.match(regUrl))
    {
        var daogw_s = document.createElement('script');
        daogw_s.charset = 'UTF-8';
        daogw_s.type = 'text/javascript';
        daogw_s.id = 'youdao_gouwu_assistant';
        daogw_s.src = GM_getValue('src');
        document.getElementsByTagName('head')[0].appendChild(daogw_s);
    }
}