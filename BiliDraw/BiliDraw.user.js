// ==UserScript==
// @name        bilibili夏日绘板
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 组队一起画呀
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @match       *://api.live.bilibili.com/feed*
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
var BiliDraw = (function () {
    function BiliDraw(apiKey) {
        this.apiKey = apiKey;
    }
    BiliDraw.prototype.Start = function () {
        this.wsc = new WebSocket('wss://bilive.halaal.win/drawapi', this.apiKey);
        this.wsc.onmessage = this._Draw.bind(this);
        this.wsc.onclose = this._Close.bind(this);
    };
    BiliDraw.prototype._Draw = function (data) {
        var dataInfo = JSON.parse(data.data), x = dataInfo.x, y = dataInfo.y, c = dataInfo.c;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/activity/v1/SummerDraw/draw');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.onload = function (ev) {
            var res = JSON.parse(ev.target.responseText);
            if (res.code === 0)
                console.log("\u5750\u6807x: " + x + ", y: " + y + " \u586B\u5145\u5B8C\u6BD5");
            else
                console.log("\u5750\u6807x: " + x + ", y: " + y + " \u586B\u5145\u5931\u8D25");
        };
        xhr.send("x_min=" + x + "&y_min=" + y + "&x_max=" + x + "&y_max=" + y + "&color=" + c);
    };
    BiliDraw.prototype._Close = function () {
        var _this = this;
        setTimeout(function () {
            _this.Start();
        }, 3000);
    };
    return BiliDraw;
}());
window['Draw'] = function (apiKey) {
    var biliDraw = new BiliDraw(apiKey);
    biliDraw.Start();
};
