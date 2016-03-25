// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.1.0
// @author      lzghzr
// @description 按照美元区出价，最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?\:\/\/steamcommunity\.com\/.*\/inventory\/.*/
// @license     Apache Licence 2.0
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @run-at      document-end
// ==/UserScript==

// 一小时一更新
if ((new Date()).getTime() - GM_getValue('last', 0) > 3600000)
{
    // 更新汇率
    GM_xmlhttpRequest(
    {
        method: 'GET',
        url: 'https://finance.yahoo.com/webservice/v1/symbols/USDCNY=X/quote?format=json',
        headers:
        {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        responseType: 'json',
        onload: function(response)
        {
            if (200 == response.status && response.response.list.meta.count)
            {
                GM_setValue('last', (new Date()).getTime()); // 更新时间
                GM_setValue('price', response.response.list.resources[0].resource.fields.price);
            }
        }
    });
}
// 不要显得太乱
var D = document;
var W = unsafeWindow;
// 添加汇率输入框
var divInventoryPagecontrols = D.getElementById('inventory_pagecontrols');
var inputUSDCNY = D.createElement('input');
inputUSDCNY.className = 'filter_search_box';
inputUSDCNY.style.width = '5em';
inputUSDCNY.style.float = 'right';
inputUSDCNY.value = GM_getValue('price', 6.50);
divInventoryPagecontrols.parentNode.insertBefore(inputUSDCNY, divInventoryPagecontrols);
// hook函数
var NewPopulateMarketActions = W.PopulateMarketActions;
function hookPopulateMarketActions(elActions, item)
{
    if (item.marketable) 
    {
        // 直接获取美区的价格，省去一步换算
        var xhrPriceoverview = new XMLHttpRequest();
        xhrPriceoverview.onload = function()
        {
            if (200 == this.status && this.response.success && this.response.lowest_price) 
            {
                // 对返回字符串进行处理
                var lowestPrice = this.response.lowest_price;
                lowestPrice = lowestPrice.replace('$', ''); // 日了狗了，他不认识$
                lowestPrice = W.GetPriceValueAsInt(lowestPrice); // 格式化取整
                GetPrice(lowestPrice);
            }
            else // steam逼我啊
            {
                // 抓取商店界面
                var xhrListings = new XMLHttpRequest();
                xhrListings.onload = function()
                {
                    if (200 == this.status) 
                    {
                        // 解析出item_nameid
                        var regNameid = /Market_LoadOrderSpread\( (\d+)/;
                        var nameid = regNameid.exec(this.responseText)[1];
                        // 获取商店价格排序
                        var xhrItemordershistogram = new XMLHttpRequest();
                        xhrItemordershistogram.onload = function()
                        {
                            if (200 == this.status && this.response.success) 
                            {
                                // 这次返回的不是字符串了
                                var lowestPrice = this.response.sell_order_graph[0][0];
                                lowestPrice = W.GetPriceValueAsInt(lowestPrice.toString()); // 格式化取整
                                GetPrice(lowestPrice);
                            }
                        }
                        xhrItemordershistogram.open('get', '/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=' + nameid + '&two_factor=0', true);
                        xhrItemordershistogram.responseType = 'json';
                        xhrItemordershistogram.send();
                    }
                }
                xhrListings.open('get', '/market/listings/' + item.appid + '/' + W.GetMarketHashName(item), true);
                xhrListings.send();
            }
        }
        xhrPriceoverview.open('get', '/market/priceoverview/?country=US&currency=1&appid=' + item.appid + '&market_hash_name=' + W.GetMarketHashName(item), true);
        xhrPriceoverview.responseType = 'json';
        xhrPriceoverview.send();
    }
    NewPopulateMarketActions(elActions, item);
    // 计算输出
    function GetPrice(lowestPrice)
    {
        // 手续费
        var publisherFee = (undefined == item.market_fee) ? W.g_rgWalletInfo['wallet_publisher_fee_percent_default'] : item.market_fee;
        var feeInfo = W.CalculateFeeAmount(lowestPrice, publisherFee);
        lowestPrice = lowestPrice - feeInfo.fees;
        // 美元区+1美分
        var plusPrice = Math.floor((1 + lowestPrice) * inputUSDCNY.value);
        plusPrice = W.v_currencyformat(plusPrice, W.GetCurrencyCode(W.g_rgWalletInfo['wallet_currency'])); //格式化
        // 换算成人民币
        lowestPrice = Math.floor(lowestPrice * inputUSDCNY.value);
        lowestPrice = W.v_currencyformat(lowestPrice, W.GetCurrencyCode(W.g_rgWalletInfo['wallet_currency']));
        // 显示输出
        var div = D.createElement('div');
        div.style.margin = '0 1em 1em';
        div.innerHTML = '建议最低售价: '+ lowestPrice + ' (' + plusPrice + ')';
        elActions.insertBefore(div, elActions.lastChild);
    }
}
// 为了兼容火狐
if ('function' == typeof (exportFunction))
{
    exportFunction(hookPopulateMarketActions, unsafeWindow, { defineAs: 'hookPopulateMarketActions' });
    W.PopulateMarketActions = W.hookPopulateMarketActions;
}
else
{
    W.PopulateMarketActions = hookPopulateMarketActions;
}