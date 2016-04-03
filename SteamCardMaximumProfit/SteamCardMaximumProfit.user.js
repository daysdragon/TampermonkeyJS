// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.1.4
// @author      lzghzr
// @description 按照美元区出价，最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     Apache-2.0
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @run-at      document-end
// ==/UserScript==
'use strict';

// 不要显得太乱
var D = document;
var W = unsafeWindow;
// 添加汇率输入框
var divInventoryPagecontrols = D.getElementById('inventory_pagecontrols');
var inputUSDCNY = D.createElement('input');
inputUSDCNY.className = 'filter_search_box';
inputUSDCNY.style.cssText = 'width: 5em; float: right';
inputUSDCNY.value = 6.50;
divInventoryPagecontrols.parentNode.insertBefore(inputUSDCNY, divInventoryPagecontrols);
// 获取实时汇率
GM_xmlhttpRequest({
    method: 'GET',
    url: 'http://data.forex.hexun.com/data/breedExch_bing.ashx?currency1=%c3%c0%d4%aa&currency2=%c8%cb%c3%f1%b1%d2%d4%aa&format=json&callback=currencyExchange',
    onload: function(response) {
        if (200 == response.status) {
            var refePrice = /refePrice:'([^']{5})/;
            inputUSDCNY.value = refePrice.exec(response.responseText)[1];
        }
    }
});
// hook函数
var NewPopulateMarketActions = W.PopulateMarketActions;
// 为了兼容火狐
if ('function' == typeof (exportFunction)) {
    exportFunction(hookPopulateMarketActions, unsafeWindow, { defineAs: 'hookPopulateMarketActions' });
    W.PopulateMarketActions = W.hookPopulateMarketActions;
}
else {
    W.PopulateMarketActions = hookPopulateMarketActions;
}
/**
 * hookPopulateMarketActions
 * 
 * @param {HTMLElement} elActions
 * @param {Object} item
 */
function hookPopulateMarketActions(elActions, item) {
    if (item.marketable) {
        // 直接获取美区的价格，省去一步换算
        var xhrPriceoverview = new XMLHttpRequest();
        xhrPriceoverview.open(
            'get',
            // 坑爹的&
            '/market/priceoverview/?country=US&currency=1&appid=' + item.appid + '&market_hash_name=' + encodeURIComponent(W.GetMarketHashName(item)),
            true
        );
        xhrPriceoverview.responseType = 'json';
        xhrPriceoverview.send();
        xhrPriceoverview.onload = function() {
            if (200 == xhrPriceoverview.status && xhrPriceoverview.response.success && xhrPriceoverview.response.lowest_price) {
                // 对返回字符串进行处理
                var lowestPrice = xhrPriceoverview.response.lowest_price;
                // 日了狗了，他不认识$
                lowestPrice = lowestPrice.replace('$', '');
                GetPrice(lowestPrice);
            }
            // steam逼我啊
            else {
                // 抓取商店界面
                var xhrListings = new XMLHttpRequest();
                xhrListings.open(
                    'get',
                    '/market/listings/' + item.appid + '/' + encodeURIComponent(W.GetMarketHashName(item)),
                    true
                );
                xhrListings.send();
                xhrListings.onload = function() {
                    if (200 == xhrListings.status) {
                        // 解析出item_nameid
                        var regNameid = /Market_LoadOrderSpread\( (\d+)/;
                        var nameid = regNameid.exec(xhrListings.responseText)[1];
                        // 获取商店价格排序
                        var xhrItemordershistogram = new XMLHttpRequest();
                        xhrItemordershistogram.open(
                            'get',
                            '/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=' + nameid + '&two_factor=0',
                            true
                        );
                        xhrItemordershistogram.responseType = 'json';
                        xhrItemordershistogram.send();
                        xhrItemordershistogram.onload = function() {
                            if (200 == xhrItemordershistogram.status && xhrItemordershistogram.response.success) {
                                // 这次返回的不是字符串了
                                var lowestPrice = ' ' + xhrItemordershistogram.response.sell_order_graph[0][0];
                                GetPrice(lowestPrice);
                            }
                        }
                    }
                }
            }
        }
    }
    NewPopulateMarketActions(elActions, item);
    /**
     * 计算输出
     * @param {String} lowestPrice
     */
    function GetPrice(lowestPrice) {
        // 格式化取整
        lowestPrice = W.GetPriceValueAsInt(lowestPrice);
        // 手续费
        var publisherFee = (undefined == item.market_fee) ? W.g_rgWalletInfo['wallet_publisher_fee_percent_default'] : item.market_fee;
        var feeInfo = W.CalculateFeeAmount(lowestPrice, publisherFee);
        lowestPrice = lowestPrice - feeInfo.fees;
        // 美元区+1美分
        var plusPrice = Math.floor((1 + lowestPrice) * inputUSDCNY.value);
        //格式化
        plusPrice = W.v_currencyformat(plusPrice, W.GetCurrencyCode(W.g_rgWalletInfo['wallet_currency']));
        // 换算成人民币
        lowestPrice = Math.floor(lowestPrice * inputUSDCNY.value);
        lowestPrice = W.v_currencyformat(lowestPrice, W.GetCurrencyCode(W.g_rgWalletInfo['wallet_currency']));
        // 显示输出
        var div = D.createElement('div');
        div.style.margin = '0 1em 1em';
        div.innerHTML = '建议最低售价: ' + lowestPrice + ' (' + plusPrice + ')';
        elActions.insertBefore(div, elActions.lastChild);
    }
}
