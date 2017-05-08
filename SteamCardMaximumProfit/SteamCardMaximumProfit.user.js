// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.19
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
/// <reference path="SteamCardMaximumProfit.d.ts" />
/**
 * 最大化steam卡牌卖出的利润
 *
 * @class SteamCardMaximumProfit
 */
var SteamCardMaximumProfit = (function () {
    function SteamCardMaximumProfit() {
        this._D = document;
        this._W = unsafeWindow || window;
        this._divItems = [];
        this._quickSells = [];
    }
    /**
     * 加载程序
     *
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype.Start = function () {
        var _this = this;
        this._AddUI();
        this._DoLoop();
        var elmDivActiveInventoryPage = this._D.querySelector('#inventories');
        // 创建观察者对象
        var observer = new MutationObserver(function (rec) {
            if (location.hash.match(/^#753|^$/)) {
                // 有点丑的复选框
                for (var _i = 0, rec_1 = rec; _i < rec_1.length; _i++) {
                    var r = rec_1[_i];
                    var rt = r.target;
                    if (rt.classList.contains('inventory_page')) {
                        var itemHolders = rt.querySelectorAll('.itemHolder');
                        for (var i = 0; i < itemHolders.length; i++) {
                            var rgItem = _this._GetRgItem(itemHolders[i]);
                            if (rgItem != null && _this._divItems.indexOf(rgItem.element) === -1 && rgItem.description.appid === 753 && rgItem.description.marketable === 1) {
                                _this._divItems.push(rgItem.element);
                                // 选择框
                                var elmDiv = _this._D.createElement('div');
                                elmDiv.classList.add('scmpItemCheckbox');
                                rgItem.element.appendChild(elmDiv);
                            }
                        }
                    }
                }
            }
        });
        // 传入目标节点和观察选项
        observer.observe(elmDivActiveInventoryPage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    };
    /**
     * 添加样式, 复选框和汇率输入框
     *
     * @private
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._AddUI = function () {
        var _this = this;
        // 样式
        var elmStyle = this._D.createElement('style');
        elmStyle.innerHTML = "\n    .scmpItemSelect {\n      background: yellow;\n    }\n    .scmpItemRun {\n      background: blue;\n    }\n    .scmpItemSuccess {\n      background: green;\n    }\n    .scmpItemError {\n      background: red;\n    }\n    .scmpQuickSell {\n      margin: 0 0 1em;\n    }\n    .scmpItemCheckbox {\n      position: absolute;\n      z-index: 100;\n      top: 0;\n      left: 0;\n      width: 20px;\n      height: 20px;\n      border: 2px solid yellow;\n      opacity: 0.7;\n      cursor: default;\n    }\n    .scmpItemCheckbox:hover {\n      opacity: 1;\n    }\n    #scmpExch {\n      width: 5em;\n    }";
        this._D.body.appendChild(elmStyle);
        // 插入快速出售按钮
        var elmDivInventoryPageRight = this._D.querySelector('.inventory_page_right');
        var elmDiv = this._D.createElement('div');
        elmDiv.innerHTML = "\n    <div class=\"scmpQuickSell\">\u5EFA\u8BAE\u6700\u4F4E\u552E\u4EF7: <span class=\"btn_green_white_innerfade scmpQuickSellItem\">null</span> <span class=\"btn_green_white_innerfade scmpQuickSellItem\">null</span></div>\n    <div>\u6C47\u7387: <input class=\"filter_search_box\" id=\"scmpExch\" type=\"text\"><span class=\"btn_green_white_innerfade\" id=\"scmpQuickAllItem\">\u5FEB\u901F\u51FA\u552E</span> \u5269\u4F59: <span id=\"scmpQuickSurplus\">0</span> \u5931\u8D25: <span id=\"scmpQuickError\">0</span></div>";
        elmDivInventoryPageRight.appendChild(elmDiv);
        // 获取快速出售按钮
        var elmSpanQuickSellItems = elmDiv.querySelectorAll('.scmpQuickSellItem');
        this._spanQuickSurplus = elmDiv.querySelector('#scmpQuickSurplus');
        this._spanQuickError = elmDiv.querySelector('#scmpQuickError');
        // 监听事件
        this._D.addEventListener('click', function (ev) {
            var evt = ev.target;
            // 点击物品
            if (evt.className === 'inventory_item_link') {
                elmSpanQuickSellItems[0].innerText = 'null';
                elmSpanQuickSellItems[1].innerText = 'null';
                var rgItem = _this._GetRgItem(evt.parentNode);
                _this._GetPriceOverview({ rgItem: rgItem })
                    .then(function (resolve) {
                    elmSpanQuickSellItems[0].innerText = resolve.firstFormatPrice;
                    elmSpanQuickSellItems[1].innerText = resolve.secondFormatPrice;
                })
                    .catch(function (reject) {
                    reject.status = 'error';
                    _this._QuickSellStatus(reject);
                });
            }
            else if (evt.classList.contains('scmpItemCheckbox')) {
                var rgItem = _this._GetRgItem(evt.parentNode);
                var select_1 = evt.classList.contains('scmpItemSelect');
                // 改变背景
                var ChangeClass = function (elmDiv) {
                    var elmCheckbox = elmDiv.querySelector('.scmpItemCheckbox');
                    if (elmDiv.parentNode.style.display !== 'none' && elmCheckbox.classList.contains('scmpItemSuccess') === false) {
                        elmCheckbox.classList.remove('scmpItemError');
                        elmCheckbox.classList.toggle('scmpItemSelect', !select_1);
                    }
                };
                // shift多选
                if (_this._divLastChecked != null && ev.shiftKey) {
                    var start = _this._divItems.indexOf(_this._divLastChecked);
                    var end = _this._divItems.indexOf(rgItem.element);
                    var someDivItems = _this._divItems.slice(Math.min(start, end), Math.max(start, end) + 1);
                    for (var _i = 0, someDivItems_1 = someDivItems; _i < someDivItems_1.length; _i++) {
                        var y = someDivItems_1[_i];
                        ChangeClass(y);
                    }
                }
                else {
                    ChangeClass(rgItem.element);
                }
                _this._divLastChecked = rgItem.element;
            }
        });
        // 点击快速出售
        var elmDivQuickSellItem = this._D.querySelectorAll('.scmpQuickSellItem');
        for (var i = 0; i < elmDivQuickSellItem.length; i++) {
            elmDivQuickSellItem[i].addEventListener('click', function (ev) {
                var evt = ev.target;
                var rgItem = _this._GetRgItem(_this._D.querySelector('.activeInfo'));
                if (rgItem.element.querySelector('.scmpItemCheckbox').classList.contains('scmpItemSuccess') === false && evt.innerText != 'null') {
                    var price = _this._W.GetPriceValueAsInt(evt.innerText);
                    _this._QuickSellItem({ rgItem: rgItem, price: price });
                }
            });
        }
        // 点击全部出售
        this._D.querySelector('#scmpQuickAllItem').addEventListener('click', function () {
            var itemInfos = _this._D.querySelectorAll('.scmpItemSelect');
            for (var i = 0; i < itemInfos.length; i++) {
                var rgItem = _this._GetRgItem(itemInfos[i].parentNode);
                if (rgItem.description.marketable === 1)
                    _this._quickSells.push({ rgItem: rgItem });
            }
        });
        // 改变汇率
        this._inputUSDCNY = elmDiv.querySelector('#scmpExch');
        this._inputUSDCNY.value = '6.50';
        // 在线获取实时汇率
        GM_xmlhttpRequest({
            method: 'GET',
            url: "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=1%E7%BE%8E%E5%85%83%E7%AD%89%E4%BA%8E%E5%A4%9A%E5%B0%91%E4%BA%BA%E6%B0%91%E5%B8%81&resource_id=6017&t=" + Date.now() + "&ie=utf8&oe=utf8&format=json&tn=baidu",
            responseType: 'json',
            onload: function (res) {
                if (res.status === 200 && res.response.status === '0')
                    _this._inputUSDCNY.value = res.response.data[0].number2;
            }
        });
    };
    /**
     * 获取美元区价格
     *
     * @private
     * @param {itemInfo} itemInfo
     * @returns {Promise<itemInfo>}
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._GetPriceOverview = function (itemInfo) {
        var _this = this;
        return new Promise(function (resolved, rejected) {
            var priceoverview = "/market/priceoverview/?country=US&currency=1&appid=" + itemInfo.rgItem.description.appid + "&market_hash_name=" + encodeURIComponent(_this._W.GetMarketHashName(itemInfo.rgItem.description));
            _this._XHR(priceoverview, 'json')
                .then(function (resolve) {
                if (resolve != null && resolve.success && resolve.lowest_price !== '') {
                    // 对$进行处理, 否则会报错
                    itemInfo.lowestPrice = resolve.lowest_price.replace('$', '');
                    resolved(_this._CalculatePrice(itemInfo));
                }
                else {
                    var marketListings = "/market/listings/" + itemInfo.rgItem.description.appid + "/" + encodeURIComponent(_this._W.GetMarketHashName(itemInfo.rgItem.description));
                    _this._XHR(marketListings)
                        .then(function (resolve) {
                        var marketLoadOrderSpread = resolve.toString().match(/Market_LoadOrderSpread\( (\d+)/);
                        if (marketLoadOrderSpread != null) {
                            var nameid = marketLoadOrderSpread[1];
                            var marketItemordershistogram = "/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=" + nameid + "&two_factor=0";
                            return _this._XHR(marketItemordershistogram, 'json');
                        }
                        else {
                            return Promise.reject(itemInfo);
                        }
                    })
                        .then(function (resolve) {
                        if (resolve != null && resolve.success) {
                            // 转换为带有一个空格的字符串
                            itemInfo.lowestPrice = ' ' + resolve.sell_order_graph[0][0];
                            resolved(_this._CalculatePrice(itemInfo));
                        }
                    })
                        .catch(function () {
                        rejected(itemInfo);
                    });
                }
            })
                .catch(function () {
                rejected(itemInfo);
            });
        });
    };
    /**
     * 计算价格
     *
     * @private
     * @param {itemInfo} itemInfo
     * @returns {itemInfo}
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._CalculatePrice = function (itemInfo) {
        // 格式化取整
        var firstPrice = this._W.GetPriceValueAsInt(itemInfo.lowestPrice);
        // 手续费
        var publisherFee = itemInfo.rgItem.description.market_fee || this._W.g_rgWalletInfo.wallet_publisher_fee_percent_default;
        var feeInfo = this._W.CalculateFeeAmount(firstPrice, publisherFee);
        firstPrice = firstPrice - feeInfo.fees;
        // 换算成人民币
        itemInfo.firstPrice = Math.floor(firstPrice * parseFloat(this._inputUSDCNY.value));
        // 美元区+1美分
        itemInfo.secondPrice = Math.floor((firstPrice + 1) * parseFloat(this._inputUSDCNY.value));
        // 格式化
        itemInfo.firstFormatPrice = this._W.v_currencyformat(itemInfo.firstPrice, this._W.GetCurrencyCode(this._W.g_rgWalletInfo.wallet_currency));
        itemInfo.secondFormatPrice = this._W.v_currencyformat(itemInfo.secondPrice, this._W.GetCurrencyCode(this._W.g_rgWalletInfo.wallet_currency));
        return itemInfo;
    };
    /**
     * 快速出售
     *
     * @private
     * @param {itemInfo} itemInfo
     * @returns {Promise<void>}
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._QuickSellItem = function (itemInfo) {
        var _this = this;
        var price = itemInfo.price || itemInfo.firstPrice;
        itemInfo.status = 'run';
        this._QuickSellStatus(itemInfo);
        var marketSellitem = "https://steamcommunity.com/market/sellitem/?sessionid=" + this._W.g_sessionID + "&appid=" + itemInfo.rgItem.description.appid + "&contextid=" + itemInfo.rgItem.contextid + "&assetid=" + itemInfo.rgItem.assetid + "&amount=1&price=" + price;
        return this._XHR(marketSellitem, 'json', 'POST', true)
            .then(function (resolve) {
            if (resolve != null && resolve.success) {
                itemInfo.status = 'success';
                _this._QuickSellStatus(itemInfo);
            }
            else {
                itemInfo.status = 'error';
                _this._QuickSellStatus(itemInfo);
            }
        })
            .catch(function () {
            itemInfo.status = 'error';
            _this._QuickSellStatus(itemInfo);
        });
    };
    /**
     * 就是改一下框框
     *
     * @private
     * @param {itemInfo} itemInfo
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._QuickSellStatus = function (itemInfo) {
        var elmCheckbox = itemInfo.rgItem.element.querySelector('.scmpItemCheckbox');
        if (itemInfo.status === 'run') {
            this._spanQuickSurplus.innerText = this._quickSells.length.toString();
            elmCheckbox.classList.remove('scmpItemError');
            elmCheckbox.classList.remove('scmpItemSelect');
            elmCheckbox.classList.add('scmpItemRun');
        }
        else if (itemInfo.status === 'success') {
            elmCheckbox.classList.remove('scmpItemError');
            elmCheckbox.classList.remove('scmpItemRun');
            elmCheckbox.classList.add('scmpItemSuccess');
        }
        else if (itemInfo.status === 'error') {
            this._spanQuickError.innerText = (parseInt(this._spanQuickError.innerText) + 1).toString();
            elmCheckbox.classList.remove('scmpItemRun');
            elmCheckbox.classList.add('scmpItemError');
            elmCheckbox.classList.add('scmpItemSelect');
        }
    };
    /**
     * 批量出售采用轮询
     *
     * @private
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._DoLoop = function () {
        var _this = this;
        var itemInfo = this._quickSells.shift();
        if (itemInfo !== undefined) {
            this._GetPriceOverview(itemInfo)
                .then(function (resolve) {
                return _this._QuickSellItem(resolve);
            })
                .then(function () {
                _this._DoLoop();
            });
        }
        else {
            setTimeout(function () {
                _this._DoLoop();
            }, 500);
        }
    };
    /**
     * 为了兼容火狐sandbox的wrappedJSObject
     *
     * @private
     * @param {HTMLDivElement} elmDiv
     * @returns {rgItem}
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._GetRgItem = function (elmDiv) {
        return ('wrappedJSObject' in elmDiv) ? elmDiv.wrappedJSObject.rgItem : elmDiv.rgItem;
    };
    /**
     * 使用Promise封装xhr
     *
     * @private
     * @template T
     * @param {string} url
     * @param {string} [type='']
     * @param {string} [method='GET']
     * @param {boolean} [cookie=false]
     * @returns {Promise<T>}
     * @memberOf SteamCardMaximumProfit
     */
    SteamCardMaximumProfit.prototype._XHR = function (url, type, method, cookie) {
        var _this = this;
        if (type === void 0) { type = ''; }
        if (method === void 0) { method = 'GET'; }
        if (cookie === void 0) { cookie = false; }
        return new Promise(function (resolve, reject) {
            // 并不需要处理错误
            var timeout = setTimeout(reject, 3e4); //30秒
            var path = url;
            if (type === 'jsonp') {
                // 感觉引入jquery还是太大材小用
                var cbRandom_1 = Math.floor(Math.random() * 1e15);
                var elmScript_1 = _this._D.createElement('script');
                _this._D.body.appendChild(elmScript_1);
                _this._W["cb" + cbRandom_1] = function (json) {
                    clearTimeout(timeout);
                    _this._D.body.removeChild(elmScript_1);
                    _this._W["cb" + cbRandom_1] = undefined;
                    resolve(json);
                };
                elmScript_1.src = path + "&callback=cb" + cbRandom_1 + "&_=" + Date.now() + " ";
            }
            else {
                var postData = '';
                var xhr = new XMLHttpRequest();
                if (method === 'POST') {
                    path = url.split('?')[0];
                    postData = url.split('?')[1];
                }
                xhr.open(method, path, true);
                if (method === 'POST')
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                if (cookie)
                    xhr.withCredentials = true;
                xhr.responseType = type;
                xhr.onload = function (ev) {
                    clearTimeout(timeout);
                    resolve(ev.target.response);
                };
                xhr.send(postData);
            }
        });
    };
    return SteamCardMaximumProfit;
}());
var scmp = new SteamCardMaximumProfit();
scmp.Start();
