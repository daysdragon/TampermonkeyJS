// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.2
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
'use strict';
var SteamCardMaximumProfit = (function () {
    /**
     * 最大化steam卡牌卖出的利润
     */
    function SteamCardMaximumProfit() {
        this.checkBoxs = [];
        this.quickSelled = false;
        this.D = document;
        this.W = unsafeWindow;
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
            observer.disconnect();
        });
        // 传入目标节点和观察选项
        observer.observe(elmActiveInventoryPage, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
    };
    /**
     * 添加样式, 复选框和汇率输入框
     */
    SteamCardMaximumProfit.prototype.AddUI = function () {
        var _this = this;
        // 样式
        var elmStyle = this.D.createElement('style');
        elmStyle.type = 'text/css';
        elmStyle.innerHTML = '\
.scmpCheckBox {\
  position: absolute;\
  z-index: 100;\
  left: 0;\
  top: 0;\
}\
.scmpMask {\
  position: absolute;\
  z-index: 200;\
  right: 0;\
  top: -6%;\
  font-size: 25px;\
  }\
.scmpExch {\
  width: 5em;\
.scmpHide {\
  display: none;\
}';
        this.D.querySelector('body').appendChild(elmStyle);
        // 复选框和丑爆了的遮罩
        var elmItems = this.D.querySelectorAll('.itemHolder');
        for (var i = 0; i < elmItems.length; i++) {
            var iteminfo = elmItems[i].wrappedJSObject.rgItem;
            if (typeof iteminfo !== 'undefined' && iteminfo.appid.toString() === '753' && iteminfo.marketable === 1) {
                // 复选框
                var elmCheckBox = this.D.createElement('input');
                elmCheckBox.type = 'checkbox';
                elmCheckBox.classList.add('scmpCheckBox');
                this.checkBoxs.push(elmCheckBox);
                elmItems[i].firstChild.appendChild(elmCheckBox);
                // 遮罩
                var elmMask = this.D.createElement('div');
                elmMask.classList.add('scmpMask', 'scmpHide');
                elmItems[i].firstChild.appendChild(elmMask);
            }
        }
        // 汇率输入框
        var elmInventoryPageRight = this.D.querySelector('.inventory_page_right');
        var elmDiv = this.D.createElement('div');
        elmDiv.innerHTML = '\
<div>\
  <span>汇率: </span>\
  <input class="filter_search_box scmpExch" type="text">\
  <span class="btn_green_white_innerfade" id="scmpQuickAllItem">快速出售所选物品</span>&nbsp;\
</div>';
        elmInventoryPageRight.appendChild(elmDiv);
        // 改变汇率
        this.inputUSDCNY = this.D.querySelector('.scmpExch');
        this.inputUSDCNY.value = '6.50';
        // 在线获取实时汇率
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://data.forex.hexun.com/data/breedExch_bing.ashx?currency1=%c3%c0%d4%aa&currency2=%c8%cb%c3%f1%b1%d2%d4%aa&format=json&callback=currencyExchange',
            onload: function (res) {
                if (res.status == 200) {
                    _this.inputUSDCNY.value = res.responseText.match(/refePrice:'([^']{5})/)[1];
                }
            }
        });
    };
    /**
     * 添加监听
     */
    SteamCardMaximumProfit.prototype.Listener = function () {
        var _this = this;
        this.D.addEventListener('click', function (e) {
            var evt = e.target;
            // 点击物品
            if (evt.className === 'inventory_item_link') {
                var itemInfo = evt.parentNode.wrappedJSObject.rgItem;
                _this.GetPriceOverview(itemInfo);
            }
            else if (evt.className === 'scmpCheckBox') {
                // shift多选
                if (typeof _this.lastChecked !== 'undefined' && e.shiftKey) {
                    var check = evt.checked;
                    var start = _this.checkBoxs.indexOf(_this.lastChecked);
                    var end = _this.checkBoxs.indexOf(evt);
                    var someCheckBoxs = _this.checkBoxs.slice(Math.min(start, end), Math.max(start, end));
                    for (var _i = 0, someCheckBoxs_1 = someCheckBoxs; _i < someCheckBoxs_1.length; _i++) {
                        var x = someCheckBoxs_1[_i];
                        x.checked = check;
                    }
                }
                _this.lastChecked = evt;
            }
            else if (evt.id === 'scmpQuickSellItem') {
                var price = _this.W.GetPriceValueAsInt(evt.innerHTML);
                var itemInfo = _this.D.querySelector('.activeInfo').wrappedJSObject.rgItem;
                _this.QuickSellItem(itemInfo, price);
            }
            else if (evt.id === 'scmpQuickAllItem') {
                for (var _a = 0, _b = _this.checkBoxs; _a < _b.length; _a++) {
                    var x = _b[_a];
                    if (x.checked) {
                        var itemInfo = x.parentNode.wrappedJSObject.rgItem;
                        _this.GetPriceOverview(itemInfo, true);
                    }
                }
            }
        });
    };
    /**
     * 获取美元区价格, 为了兼容还是采用回调的方式
     */
    SteamCardMaximumProfit.prototype.GetPriceOverview = function (itemInfo, quick) {
        var _this = this;
        if (quick === void 0) { quick = false; }
        if (itemInfo.marketable != 1)
            return;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "/market/priceoverview/?country=US&currency=1&appid=" + itemInfo.appid + "&market_hash_name=" + encodeURIComponent(this.W.GetMarketHashName(itemInfo)), true);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function (res) {
            var evt = res.target;
            if (evt.status == 200 && evt.response.success && evt.response.lowest_price) {
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
                    if (evt.status == 200) {
                        // 解析出item_nameid
                        var nameid = evt.responseText.match(/Market_LoadOrderSpread\( (\d+)/)[1];
                        var xhr_2 = new XMLHttpRequest();
                        xhr_2.open('GET', "/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=" + nameid + "&two_factor=0", true);
                        xhr_2.responseType = 'json';
                        xhr_2.send();
                        xhr_2.onload = function (res) {
                            var evt = res.target;
                            if (evt.status == 200 && evt.response.success) {
                                // 转换为带有一个空格的字符串
                                var lowestPrice = ' ' + evt.response.sell_order_graph[0][0];
                                _this.GetPrice(itemInfo, lowestPrice, quick);
                            }
                            else {
                                _this.QuickSellStatus(itemInfo, false);
                            }
                        };
                    }
                    else {
                        _this.QuickSellStatus(itemInfo, false);
                    }
                };
            }
        };
    };
    /**
     * 计算价格并显示
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
            this.QuickSellItem(itemInfo, firstPrice);
        }
        else {
            // 显示输出
            var elmDiv = this.D.createElement('div');
            elmDiv.style.cssText = 'margin: 0px 1em 1em;';
            elmDiv.innerHTML = "\u5EFA\u8BAE\u6700\u4F4E\u552E\u4EF7: <span class=\"btn_green_white_innerfade\" id=\"scmpQuickSellItem\" >" + formatFirstPrice + "</span>&nbsp<span class=\"btn_green_white_innerfade\" id=\"scmpQuickSellItem\" >" + formatSecondPrice + "</span>";
            var elmDivActions = this.D.querySelector("#iteminfo" + this.W.iActiveSelectView + "_item_market_actions");
            elmDivActions.firstChild.appendChild(elmDiv);
        }
    };
    /**
     * 快速出售
     */
    SteamCardMaximumProfit.prototype.QuickSellItem = function (itemInfo, price) {
        var _this = this;
        // 用了回调, 顺序触发就不好处理了, 所以轮询吧
        if (!this.quickSelled) {
            this.quickSelled = true;
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://steamcommunity.com/market/sellitem/', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            // 交易采用HTTPS, 有时会产生跨域问题
            xhr.withCredentials = true;
            xhr.responseType = 'json';
            xhr.send("sessionid=" + this.W.g_sessionID + "&appid=" + itemInfo.appid + "&contextid=" + itemInfo.contextid + "&assetid=" + itemInfo.id + "&amount=1&price=" + price);
            xhr.onload = function (res) {
                _this.quickSelled = false;
                var evt = res.target;
                if (evt.status == 200 && evt.response.success) {
                    _this.QuickSellStatus(itemInfo, true);
                }
                else {
                    _this.QuickSellStatus(itemInfo, false);
                }
            };
        }
        else {
            setTimeout(function () {
                _this.QuickSellItem(itemInfo, price);
            }, 1000);
        }
    };
    SteamCardMaximumProfit.prototype.QuickSellStatus = function (itemInfo, status) {
        var elmDiv = itemInfo.element.querySelector('.scmpMask');
        var elmCheckBox = itemInfo.element.querySelector('.scmpCheckBox');
        elmDiv.classList.remove('scmpHide');
        if (status) {
            elmCheckBox.checked = false;
            elmDiv.style.cssText = 'color: greenyellow;';
            elmDiv.innerHTML = '☑';
        }
        else {
            elmDiv.style.cssText = 'color: red;';
            elmDiv.innerHTML = '☒';
        }
    };
    return SteamCardMaximumProfit;
}());
var app = new SteamCardMaximumProfit();
app.Run();
