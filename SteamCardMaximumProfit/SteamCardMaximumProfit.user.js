// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.6
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
'use strict';
/**
 * 最大化steam卡牌卖出的利润
 *
 * @class SteamCardMaximumProfit
 */
var SteamCardMaximumProfit = (function () {
    /**
     * Creates an instance of SteamCardMaximumProfit.
     *
     */
    function SteamCardMaximumProfit() {
        this.divItems = [];
        this.quickSells = [];
        this.D = document;
        this.W = (typeof unsafeWindow === 'undefined') ? window : unsafeWindow;
    }
    /**
     * 加载程序
     */
    SteamCardMaximumProfit.prototype.Run = function () {
        var _this = this;
        var elmActiveInventoryPage = this.D.querySelector('#active_inventory_page');
        // 创建观察者对象
        var observer = new MutationObserver(function (rec) {
            if (location.hash.match(/^#753|^$/) === null || rec[0].oldValue !== 'display: none;')
                return;
            _this.AddUI();
            _this.Listener();
            _this.QuickSellItem();
            observer.disconnect();
        });
        // 传入目标节点和观察选项
        observer.observe(elmActiveInventoryPage, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
    };
    /**
     * 添加样式, 复选框和汇率输入框
     *
     * @private
     */
    SteamCardMaximumProfit.prototype.AddUI = function () {
        var _this = this;
        // 样式
        var elmStyle = this.D.createElement('style');
        elmStyle.type = 'text/css';
        elmStyle.innerHTML = '\
.scmpItemSelect {\
  background: yellow;\
}\
.scmpItemRun {\
  background: blue;\
}\
.scmpItemSuccess {\
  background: green;\
}\
.scmpItemError {\
  background: red;\
}\
#scmpItemCheckbox {\
  position: absolute;\
  z-index: 100;\
  top: 0;\
  left: 0;\
  width: 20px;\
  height: 20px;\
  border: 2px solid yellow;\
  opacity: 0.7;\
  cursor: default;\
}\
#scmpItemCheckbox:hover {\
  opacity: 1;\
}\
#scmpQuickSell {\
  margin: 0px 1em 1em;\
}\
#scmpExch {\
  width: 5em;\
}';
        this.D.querySelector('body').appendChild(elmStyle);
        // 有点丑
        var elmItems = this.D.querySelectorAll('.itemHolder');
        for (var i = 0; i < elmItems.length; i++) {
            var iteminfo = this.GetRgItem(elmItems[i]);
            if (typeof iteminfo !== 'undefined' && iteminfo.appid.toString() === '753' && iteminfo.marketable === 1) {
                this.divItems.push(iteminfo.element);
                // 选择框
                var elmDiv_1 = this.D.createElement('div');
                elmDiv_1.id = 'scmpItemCheckbox';
                iteminfo.element.appendChild(elmDiv_1);
            }
        }
        // 汇率输入框
        var elmInventoryPageRight = this.D.querySelector('.inventory_page_right');
        var elmDiv = this.D.createElement('div');
        elmDiv.innerHTML = '\
<div>\
  <span>汇率: </span>\
  <input class="filter_search_box" id="scmpExch" type="text">\
  <span class="btn_green_white_innerfade" id="scmpQuickAllItem">快速出售</span><span> 剩余: <span id="scmpQuickSurplus">0</span> 失败: <span id="scmpQuickError">0</span></span>\
</div>';
        elmInventoryPageRight.appendChild(elmDiv);
        this.quickSurplus = this.D.querySelector('#scmpQuickSurplus');
        this.quickError = this.D.querySelector('#scmpQuickError');
        // 改变汇率
        this.inputUSDCNY = this.D.querySelector('#scmpExch');
        this.inputUSDCNY.value = '6.50';
        // 在线获取实时汇率
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://data.forex.hexun.com/data/breedExch_bing.ashx?currency1=%c3%c0%d4%aa&currency2=%c8%cb%c3%f1%b1%d2%d4%aa&format=json&callback=currencyExchange',
            onload: function (res) {
                if (res.status === 200) {
                    _this.inputUSDCNY.value = res.responseText.match(/refePrice:'([^']{5})/)[1];
                }
            }
        });
    };
    /**
     * 添加监听
     *
     * @private
     */
    SteamCardMaximumProfit.prototype.Listener = function () {
        var _this = this;
        this.D.addEventListener('click', function (e) {
            var evt = e.target;
            // 点击物品
            if (evt.className === 'inventory_item_link') {
                var itemInfo = _this.GetRgItem(evt.parentNode);
                _this.GetPriceOverview(itemInfo);
            }
            else if (evt.id === 'scmpItemCheckbox') {
                var itemInfo = _this.GetRgItem(evt.parentNode);
                var select_1 = evt.classList.contains('scmpItemSelect');
                if (typeof _this.lastChecked !== 'undefined' && e.shiftKey) {
                    var start = _this.divItems.indexOf(_this.lastChecked);
                    var end = _this.divItems.indexOf(itemInfo.element);
                    var someDivItems = _this.divItems.slice(Math.min(start, end), Math.max(start, end) + 1);
                    for (var _i = 0, someDivItems_1 = someDivItems; _i < someDivItems_1.length; _i++) {
                        var x = someDivItems_1[_i];
                        ChangeClass(x);
                    }
                }
                else {
                    ChangeClass(itemInfo.element);
                }
                _this.lastChecked = itemInfo.element;
                /**
                 * 改变背景
                 *
                 * @param {HTMLDivElement} elmDiv
                 */
                function ChangeClass(elmDiv) {
                    var elmCheckbox = elmDiv.querySelector('#scmpItemCheckbox');
                    if (elmCheckbox.classList.contains('scmpItemSuccess'))
                        return;
                    elmCheckbox.classList.remove('scmpItemError');
                    elmCheckbox.classList.toggle('scmpItemSelect', !select_1);
                }
            }
            else if (evt.id === 'scmpQuickSellItem') {
                var itemInfo = _this.GetRgItem(_this.D.querySelector('.activeInfo'));
                if (itemInfo.element.querySelector('#scmpItemCheckbox').classList.contains('scmpItemSuccess'))
                    return;
                var price = _this.W.GetPriceValueAsInt(evt.innerHTML);
                _this.quickSells.push({ itemInfo: itemInfo, price: price });
            }
            else if (evt.id === 'scmpQuickAllItem') {
                var iteminfos = _this.D.querySelectorAll('.scmpItemSelect');
                for (var i = 0; i < iteminfos.length; i++) {
                    var itemInfo = _this.GetRgItem(iteminfos[i].parentNode);
                    _this.GetPriceOverview(itemInfo, true);
                }
            }
        });
    };
    /**
     * 获取美元区价格, 为了兼容还是采用回调的方式
     *
     * @private
     * @param {rgItem} itemInfo
     * @param {boolean} [quick=false]
     */
    SteamCardMaximumProfit.prototype.GetPriceOverview = function (itemInfo, quick) {
        var _this = this;
        if (quick === void 0) { quick = false; }
        if (itemInfo.marketable !== 1)
            return;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "/market/priceoverview/?country=US&currency=1&appid=" + itemInfo.appid + "&market_hash_name=" + encodeURIComponent(this.W.GetMarketHashName(itemInfo)), true);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function (res) {
            var evt = res.target;
            if (evt.status === 200 && evt.response.success && evt.response.lowest_price) {
                // 对$进行处理, 否则会报错
                var lowestPrice = evt.response.lowest_price.replace('$', '');
                _this.GetPrice(itemInfo, lowestPrice, quick);
            }
            else {
                // steam对于价格获取频率有限制, 不得不通过抓取商店页面来获取价格
                var xhr_1 = new XMLHttpRequest();
                xhr_1.open('GET', "/market/listings/" + itemInfo.appid + "/" + encodeURIComponent(_this.W.GetMarketHashName(itemInfo)), true);
                xhr_1.send();
                xhr_1.onload = function (res) {
                    var evt = res.target;
                    if (evt.status === 200) {
                        // 解析出item_nameid
                        var nameid = evt.responseText.match(/Market_LoadOrderSpread\( (\d+)/)[1];
                        var xhr_2 = new XMLHttpRequest();
                        xhr_2.open('GET', "/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=" + nameid + "&two_factor=0", true);
                        xhr_2.responseType = 'json';
                        xhr_2.send();
                        xhr_2.onload = function (res) {
                            var evt = res.target;
                            if (evt.status === 200 && evt.response.success) {
                                // 转换为带有一个空格的字符串
                                var lowestPrice = ' ' + evt.response.sell_order_graph[0][0];
                                _this.GetPrice(itemInfo, lowestPrice, quick);
                            }
                            else {
                                _this.QuickSellStatus(itemInfo, 'error');
                            }
                        };
                    }
                    else {
                        _this.QuickSellStatus(itemInfo, 'error');
                    }
                };
            }
        };
    };
    /**
     * 计算价格
     *
     * @private
     * @param {rgItem} itemInfo
     * @param {string} lowestPrice
     * @param {boolean} quick
     */
    SteamCardMaximumProfit.prototype.GetPrice = function (itemInfo, lowestPrice, quick) {
        // 格式化取整
        var firstPrice = this.W.GetPriceValueAsInt(lowestPrice);
        // 手续费
        var publisherFee = (typeof itemInfo.market_fee === 'undefined') ? this.W.g_rgWalletInfo['wallet_publisher_fee_percent_default'] : itemInfo.market_fee;
        var feeInfo = this.W.CalculateFeeAmount(firstPrice, publisherFee);
        firstPrice = firstPrice - feeInfo.fees;
        // 美元区+1美分
        var secondPrice = Math.floor((firstPrice + 1) * parseFloat(this.inputUSDCNY.value));
        // 格式化
        var formatSecondPrice = this.W.v_currencyformat(secondPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo['wallet_currency']));
        // 换算成人民币
        firstPrice = Math.floor(firstPrice * parseFloat(this.inputUSDCNY.value));
        var formatFirstPrice = this.W.v_currencyformat(firstPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo['wallet_currency']));
        if (quick) {
            var price = firstPrice;
            this.quickSells.push({ itemInfo: itemInfo, price: price });
        }
        else {
            // 显示输出
            var elmDiv = this.D.createElement('div');
            elmDiv.id = 'scmpQuickSell';
            elmDiv.innerHTML = "\u5EFA\u8BAE\u6700\u4F4E\u552E\u4EF7: <span class=\"btn_green_white_innerfade\" id=\"scmpQuickSellItem\" >" + formatFirstPrice + "</span>&nbsp<span class=\"btn_green_white_innerfade\" id=\"scmpQuickSellItem\" >" + formatSecondPrice + "</span>";
            var elmDivActions = this.D.querySelector("#iteminfo" + this.W.iActiveSelectView + "_item_market_actions");
            elmDivActions.firstChild.appendChild(elmDiv);
        }
    };
    /**
     * 快速出售，目前采用轮询
     *
     * @private
     */
    SteamCardMaximumProfit.prototype.QuickSellItem = function () {
        var _this = this;
        // 用了回调, 顺序触发就不好处理了, 所以轮询吧
        var quickSell = this.quickSells.shift();
        if (typeof quickSell !== 'undefined') {
            var itemInfo_1 = quickSell.itemInfo;
            var price = quickSell.price;
            this.QuickSellStatus(itemInfo_1, 'run');
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://steamcommunity.com/market/sellitem/', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            // 交易采用HTTPS, 有时会产生跨域问题
            xhr.withCredentials = true;
            xhr.responseType = 'json';
            xhr.send("sessionid=" + this.W.g_sessionID + "&appid=" + itemInfo_1.appid + "&contextid=" + itemInfo_1.contextid + "&assetid=" + itemInfo_1.id + "&amount=1&price=" + price);
            xhr.onload = function (res) {
                _this.QuickSellItem();
                var evt = res.target;
                if (evt.status === 200 && evt.response.success) {
                    _this.QuickSellStatus(itemInfo_1, 'success');
                }
                else {
                    _this.QuickSellStatus(itemInfo_1, 'error');
                }
            };
        }
        else {
            setTimeout(function () {
                _this.QuickSellItem();
            }, 1000);
        }
    };
    /**
     * 就是改一下框框
     *
     * @private
     * @param {rgItem} itemInfo
     * @param {string} status
     */
    SteamCardMaximumProfit.prototype.QuickSellStatus = function (itemInfo, status) {
        var elmCheckbox = itemInfo.element.querySelector('#scmpItemCheckbox');
        if (status === 'run') {
            this.quickSurplus.innerHTML = this.quickSells.length.toString();
            elmCheckbox.classList.remove('scmpItemError');
            elmCheckbox.classList.remove('scmpItemSelect');
            elmCheckbox.classList.add('scmpItemRun');
        }
        else if (status === 'success') {
            elmCheckbox.classList.remove('scmpItemError');
            elmCheckbox.classList.remove('scmpItemRun');
            elmCheckbox.classList.add('scmpItemSuccess');
        }
        else if (status === 'error') {
            this.quickError.innerHTML = (parseInt(this.quickError.innerHTML) + 1).toString();
            elmCheckbox.classList.remove('scmpItemRun');
            elmCheckbox.classList.add('scmpItemError');
            elmCheckbox.classList.add('scmpItemSelect');
        }
    };
    /**
     * 为了兼容火狐sandbox的wrappedJSObject
     *
     * @private
     * @param {HTMLDivElement} elmDiv
     * @returns {rgItem}
     */
    SteamCardMaximumProfit.prototype.GetRgItem = function (elmDiv) {
        return ('wrappedJSObject' in elmDiv) ? elmDiv.wrappedJSObject.rgItem : elmDiv.rgItem;
    };
    return SteamCardMaximumProfit;
}());
var app = new SteamCardMaximumProfit();
app.Run();
