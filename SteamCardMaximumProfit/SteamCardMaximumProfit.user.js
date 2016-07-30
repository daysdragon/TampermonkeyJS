// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.10
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
/**
 * 最大化steam卡牌卖出的利润
 *
 * @class SteamCardMaximumProfit
 */
var SteamCardMaximumProfit = (function () {
    function SteamCardMaximumProfit() {
        this.D = document;
        this.W = (typeof unsafeWindow === 'undefined') ? window : unsafeWindow;
        this.divItems = [];
        this.quickSells = [];
    }
    /**
     * 加载程序
     */
    SteamCardMaximumProfit.prototype.Start = function () {
        var _this = this;
        var elmDivActiveInventoryPage = this.D.querySelector('#active_inventory_page');
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
        observer.observe(elmDivActiveInventoryPage, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
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
        elmStyle.innerHTML = "\n.scmpItemSelect {\n  background: yellow;\n}\n.scmpItemRun {\n  background: blue;\n}\n.scmpItemSuccess {\n  background: green;\n}\n.scmpItemError {\n  background: red;\n}\n.scmpQuickSell {\n  margin: 0 0 1em;\n}\n.scmpItemCheckbox {\n  position: absolute;\n  z-index: 100;\n  top: 0;\n  left: 0;\n  width: 20px;\n  height: 20px;\n  border: 2px solid yellow;\n  opacity: 0.7;\n  cursor: default;\n}\n.scmpItemCheckbox:hover {\n  opacity: 1;\n}\n#scmpExch {\n  width: 5em;\n}";
        this.D.querySelector('body').appendChild(elmStyle);
        // 有点丑
        var elmDivItems = this.D.querySelectorAll('.itemHolder');
        for (var _i = 0, elmDivItems_1 = elmDivItems; _i < elmDivItems_1.length; _i++) {
            var y = elmDivItems_1[_i];
            var iteminfo = this.GetRgItem(y);
            if (typeof iteminfo !== 'undefined' && iteminfo.appid.toString() === '753' && iteminfo.marketable === 1) {
                this.divItems.push(iteminfo.element);
                // 选择框
                var elmDiv_1 = this.D.createElement('div');
                elmDiv_1.classList.add('scmpItemCheckbox');
                iteminfo.element.appendChild(elmDiv_1);
            }
        }
        // 插入快速出售按钮
        var elmDivInventoryPageRight = this.D.querySelector('.inventory_page_right');
        var elmDiv = this.D.createElement('div');
        elmDiv.innerHTML = "\n<div class=\"scmpQuickSell\">\u5EFA\u8BAE\u6700\u4F4E\u552E\u4EF7: <span class=\"btn_green_white_innerfade scmpQuickSellItem\">null</span> <span class=\"btn_green_white_innerfade scmpQuickSellItem\">null</span></div>\n<div>\u6C47\u7387: <input class=\"filter_search_box\" id=\"scmpExch\" type=\"text\"><span class=\"btn_green_white_innerfade\" id=\"scmpQuickAllItem\">\u5FEB\u901F\u51FA\u552E</span> \u5269\u4F59: <span id=\"scmpQuickSurplus\">0</span> \u5931\u8D25: <span id=\"scmpQuickError\">0</span></div>";
        elmDivInventoryPageRight.appendChild(elmDiv);
        // 获取快速出售按钮
        var elmSpanQuickSellItems = elmDiv.querySelectorAll('.scmpQuickSellItem');
        this.spanFirstPrice = elmSpanQuickSellItems[0];
        this.spanSecondPrice = elmSpanQuickSellItems[1];
        this.spanQuickSurplus = elmDiv.querySelector('#scmpQuickSurplus');
        this.spanQuickError = elmDiv.querySelector('#scmpQuickError');
        // 改变汇率
        this.inputUSDCNY = elmDiv.querySelector('#scmpExch');
        this.inputUSDCNY.value = '6.50';
        // 在线获取实时汇率
        if (typeof GM_xmlhttpRequest === 'function') {
            GM_xmlhttpRequest({
                method: 'GET',
                url: "https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=1%E7%BE%8E%E5%85%83%E7%AD%89%E4%BA%8E%E5%A4%9A%E5%B0%91%E4%BA%BA%E6%B0%91%E5%B8%81&resource_id=6017&t=" + Date.now() + "&ie=utf8&oe=utf8&format=json&tn=baidu",
                responseType: 'json',
                onload: function (res) {
                    if (res.status === 200 && res.response.status === '0') {
                        _this.inputUSDCNY.value = res.response.data[0].number2;
                    }
                }
            });
        }
    };
    /**
     * 添加监听
     *
     * @private
     */
    SteamCardMaximumProfit.prototype.Listener = function () {
        var _this = this;
        this.D.addEventListener('click', function (ev) {
            var evt = ev.target;
            // 点击物品
            if (evt.className === 'inventory_item_link') {
                _this.spanFirstPrice.innerText = 'null';
                _this.spanSecondPrice.innerText = 'null';
                var itemInfo = _this.GetRgItem(evt.parentNode);
                _this.GetPriceOverview(itemInfo);
            }
            else if (evt.classList.contains('scmpItemCheckbox')) {
                var itemInfo = _this.GetRgItem(evt.parentNode);
                var select_1 = evt.classList.contains('scmpItemSelect');
                // shift多选
                if (typeof _this.divLastChecked !== 'undefined' && ev.shiftKey) {
                    var start = _this.divItems.indexOf(_this.divLastChecked);
                    var end = _this.divItems.indexOf(itemInfo.element);
                    var someDivItems = _this.divItems.slice(Math.min(start, end), Math.max(start, end) + 1);
                    for (var _i = 0, someDivItems_1 = someDivItems; _i < someDivItems_1.length; _i++) {
                        var y = someDivItems_1[_i];
                        ChangeClass(y);
                    }
                }
                else {
                    ChangeClass(itemInfo.element);
                }
                _this.divLastChecked = itemInfo.element;
                /**
                 * 改变背景
                 *
                 * @param {HTMLDivElement} elmDiv
                 */
                function ChangeClass(elmDiv) {
                    var elmCheckbox = elmDiv.querySelector('.scmpItemCheckbox');
                    if (elmCheckbox.classList.contains('scmpItemSuccess') === false) {
                        elmCheckbox.classList.remove('scmpItemError');
                        elmCheckbox.classList.toggle('scmpItemSelect', !select_1);
                    }
                }
            }
        });
        // 点击快速出售
        var elmDivQuickSellItem = this.D.querySelectorAll('.scmpQuickSellItem');
        for (var _i = 0, elmDivQuickSellItem_1 = elmDivQuickSellItem; _i < elmDivQuickSellItem_1.length; _i++) {
            var y = elmDivQuickSellItem_1[_i];
            y.addEventListener('click', function (ev) {
                var evt = ev.target;
                var itemInfo = _this.GetRgItem(_this.D.querySelector('.activeInfo'));
                if (itemInfo.element.querySelector('.scmpItemCheckbox').classList.contains('scmpItemSuccess') === false && evt.innerText !== 'null') {
                    var price = _this.W.GetPriceValueAsInt(evt.innerText);
                    _this.quickSells.push({ itemInfo: itemInfo, price: price });
                }
            });
        }
        // 点击全部出售
        this.D.querySelector('#scmpQuickAllItem').addEventListener('click', function (ev) {
            var itemInfos = _this.D.querySelectorAll('.scmpItemSelect');
            for (var _i = 0, itemInfos_1 = itemInfos; _i < itemInfos_1.length; _i++) {
                var y = itemInfos_1[_i];
                var itemInfo = _this.GetRgItem(y.parentNode);
                _this.GetPriceOverview(itemInfo, true);
            }
        });
    };
    /**
     * 获取美元区价格
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
        var priceoverview = "/market/priceoverview/?country=US&currency=1&appid=" + itemInfo.appid + "&market_hash_name=" + encodeURIComponent(this.W.GetMarketHashName(itemInfo));
        this.XHR(priceoverview, 'json')
            .then(function (resolve) {
            if (resolve.success && resolve.lowest_price) {
                // 对$进行处理, 否则会报错
                var lowestPrice = resolve.lowest_price.replace('$', '');
                _this.GetPrice(itemInfo, lowestPrice, quick);
            }
            else {
                var marketListings = "/market/listings/" + itemInfo.appid + "/" + encodeURIComponent(_this.W.GetMarketHashName(itemInfo));
                _this.XHR(marketListings)
                    .then(function (resolve) {
                    var nameid = resolve.match(/Market_LoadOrderSpread\( (\d+)/)[1];
                    var marketItemordershistogram = "/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=" + nameid + "&two_factor=0";
                    return _this.XHR(marketItemordershistogram, 'json');
                })
                    .then(function (resolve) {
                    if (resolve.success) {
                        // 转换为带有一个空格的字符串
                        var lowestPrice = ' ' + resolve.sell_order_graph[0][0];
                        _this.GetPrice(itemInfo, lowestPrice, quick);
                    }
                    else {
                        _this.QuickSellStatus(itemInfo, 'error');
                    }
                })
                    .catch(function (reject) {
                    _this.QuickSellStatus(itemInfo, 'error');
                });
            }
        })
            .catch(function (reject) {
            _this.QuickSellStatus(itemInfo, 'error');
        });
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
        var publisherFee = (typeof itemInfo.market_fee === 'undefined') ? this.W.g_rgWalletInfo.wallet_publisher_fee_percent_default : itemInfo.market_fee;
        var feeInfo = this.W.CalculateFeeAmount(firstPrice, publisherFee);
        firstPrice = firstPrice - feeInfo.fees;
        // 美元区+1美分
        var secondPrice = Math.floor((firstPrice + 1) * parseFloat(this.inputUSDCNY.value));
        // 格式化
        var formatSecondPrice = this.W.v_currencyformat(secondPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo.wallet_currency));
        // 换算成人民币
        firstPrice = Math.floor(firstPrice * parseFloat(this.inputUSDCNY.value));
        var formatFirstPrice = this.W.v_currencyformat(firstPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo.wallet_currency));
        if (quick) {
            var price = firstPrice;
            this.quickSells.push({ itemInfo: itemInfo, price: price });
        }
        else {
            // 显示输出
            this.spanFirstPrice.innerText = formatFirstPrice;
            this.spanSecondPrice.innerText = formatSecondPrice;
        }
    };
    /**
     * 快速出售，目前采用轮询
     *
     * @private
     */
    SteamCardMaximumProfit.prototype.QuickSellItem = function () {
        var _this = this;
        // 顺序触发不好处理, 所以轮询吧
        var quickSell = this.quickSells.shift();
        if (typeof quickSell !== 'undefined') {
            var itemInfo_1 = quickSell.itemInfo;
            var price = quickSell.price;
            this.QuickSellStatus(itemInfo_1, 'run');
            var marketSellitem = "https://steamcommunity.com/market/sellitem/?sessionid=" + this.W.g_sessionID + "&appid=" + itemInfo_1.appid + "&contextid=" + itemInfo_1.contextid + "&assetid=" + itemInfo_1.id + "&amount=1&price=" + price;
            this.XHR(marketSellitem, 'json', 'POST', true)
                .then(function (resolve) {
                _this.QuickSellItem();
                if (resolve.success) {
                    _this.QuickSellStatus(itemInfo_1, 'success');
                }
                else {
                    _this.QuickSellStatus(itemInfo_1, 'error');
                }
            })
                .catch(function (reject) {
                _this.QuickSellStatus(itemInfo_1, 'error');
            });
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
        var elmCheckbox = itemInfo.element.querySelector('.scmpItemCheckbox');
        if (status === 'run') {
            this.spanQuickSurplus.innerText = this.quickSells.length.toString();
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
            this.spanQuickError.innerText = (parseInt(this.spanQuickError.innerText) + 1).toString();
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
     */
    SteamCardMaximumProfit.prototype.XHR = function (url, type, method, cookie) {
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
                var elmScript_1 = _this.D.createElement('script');
                _this.D.body.appendChild(elmScript_1);
                _this.W['cb'] = function (json) {
                    clearTimeout(timeout);
                    _this.D.body.removeChild(elmScript_1);
                    _this.W['cb'] = undefined;
                    resolve(json);
                };
                elmScript_1.src = path + "&callback=cb & _=" + Date.now() + " ";
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
