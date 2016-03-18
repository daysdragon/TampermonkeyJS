// ==UserScript==
// @name        steam卡牌利润最大化
// @description 按照美元区出价，最大化steam卡牌卖出的利润
// @version     0.0.0.4
// @author      lzzr
// @namespace   https://lzzr.me/
// @include     /^https?\:\/\/steamcommunity\.com\/.*\/inventory\/.*$/
// @downloadURL https://github.com/lzghzr/GreasemonkeyJS/raw/master/SteamCardMaximumProfit/SteamCardMaximumProfit.user.js
// @updateURL   https://github.com/lzghzr/GreasemonkeyJS/raw/master/SteamCardMaximumProfit/SteamCardMaximumProfit.meta.js
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @license     Apache Licence 2.0
// @compatible  chrome
// @compatible  firefox
// @grant       none
// @run-at      document-end
// ==/UserScript==

(undefined == localStorage.getItem('exchange_rate')) && localStorage.setItem('exchange_rate', 6.49); //初始化汇率
/* 添加汇率输入框 */
var divIP = document.getElementById('inventory_pagecontrols');
var inputER = document.createElement('input');
inputER.className = 'filter_search_box';
inputER.style.width = '5em';
inputER.style.float = 'right';
inputER.value = localStorage.getItem('exchange_rate');
divIP.parentNode.insertBefore(inputER, divIP);
/* hook函数 */
var NewPopulateMarketActions = window.PopulateMarketActions;
window.PopulateMarketActions = function(elActions, item)
{
    if (item.marketable) 
    {
        /* 直接获取美区的价格，省去一步换算 */
        var xhrPriceoverview = new XMLHttpRequest();
        xhrPriceoverview.onload = function()
        {
            if (xhrPriceoverview.status == 200 && xhrPriceoverview.response.success && xhrPriceoverview.response.lowest_price) 
            {
                /* 对返回字符串进行处理 */
                var lowestPrice = xhrPriceoverview.response.lowest_price;
                lowestPrice = lowestPrice.replace('$', ''); //日了狗了，他不认识$
                lowestPrice = GetPriceValueAsInt(lowestPrice); //格式化取整
                GetPrice(lowestPrice);
            }
            else // steam逼我啊
            {
                /* 抓取商店界面 */
                var xhrListings = new XMLHttpRequest();
                xhrListings.onload = function()
                {
                    if (xhrListings.status == 200) 
                    {
                        /* 解析出item_nameid */
                        var reg = /Market_LoadOrderSpread\( (\d+)/;
                        reg.exec(xhrListings.response);
                        /* 获取商店价格排序 */
                        var xhrItemordershistogram = new XMLHttpRequest();
                        xhrItemordershistogram.onload = function()
                        {
                            if (xhrItemordershistogram.status == 200 && xhrItemordershistogram.response.success) 
                            {
                                /* 这次返回的不是字符串了 */
                                var lowestPrice = xhrItemordershistogram.response.sell_order_graph[0][0];
                                lowestPrice = GetPriceValueAsInt(lowestPrice.toString()); //格式化取整
                                GetPrice(lowestPrice);
                            }
                        }
                        xhrItemordershistogram.open('get', '/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=' + RegExp.$1 + '&two_factor=0', true);
                        xhrItemordershistogram.responseType = 'json';
                        xhrItemordershistogram.send();
                    }
                }
                xhrListings.open('get', '/market/listings/' + item.appid + '/' + GetMarketHashName(item), true);
                xhrListings.send();
            }
        }
        xhrPriceoverview.open('get', '/market/priceoverview/?country=US&currency=1&appid=' + item.appid + '&market_hash_name=' + GetMarketHashName(item), true);
        xhrPriceoverview.responseType = 'json';
        xhrPriceoverview.send();
    }
    NewPopulateMarketActions(elActions, item);
    
    function GetPrice(lowestPrice)
    {
        /* 手续费 */
        var publisherFee = (undefined == item.market_fee) ? g_rgWalletInfo['wallet_publisher_fee_percent_default'] : item.market_fee;
        var feeInfo = CalculateFeeAmount(lowestPrice, publisherFee);
        lowestPrice = lowestPrice - feeInfo.fees;
        /* 美元区+1美分 */
        localStorage.setItem('exchange_rate', inputER.value); //保存汇率
        var plusPrice = Math.floor((1 + lowestPrice) * inputER.value);
        plusPrice = v_currencyformat(plusPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])); //格式化
        /* 换算成人民币 */
        lowestPrice = Math.floor(lowestPrice * inputER.value);
        lowestPrice = v_currencyformat(lowestPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
        /* 显示输出 */
        var div = document.createElement('div');
        div.style.margin = '0 1em 1em';
        div.innerHTML = '建议最低售价: '+ lowestPrice + ' (' + plusPrice + ')';
        elActions.insertBefore(div, elActions.lastChild);
    }
}