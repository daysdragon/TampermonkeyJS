// ==UserScript==
// @name        bilibili夏日绘板
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.2
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
        this.color = {
            '0': 'rgb(0, 0, 0)',
            '1': 'rgb(255, 255, 255)',
            '2': 'rgb(252, 222, 107)',
            '3': 'rgb(255, 246, 209)',
            '4': 'rgb(125, 149, 145)',
            '5': 'rgb(113, 190, 214)',
            '6': 'rgb(59, 229, 219)',
            '7': 'rgb(254, 211, 199)',
            '8': 'rgb(184, 63, 39)',
            '9': 'rgb(250, 172, 142)',
            'A': 'rgb(0, 70, 112)',
            'B': 'rgb(5, 113, 151)',
            'C': 'rgb(68, 201, 95)',
            'D': 'rgb(119, 84, 255)',
            'E': 'rgb(255, 0, 0)',
            'F': 'rgb(255, 152, 0)',
            'G': 'rgb(151, 253, 220)',
            'H': 'rgb(248, 203, 140)',
            'I': 'rgb(46, 143, 175)'
        };
        this.apiKey = apiKey;
    }
    BiliDraw.prototype.Start = function () {
        this.wsc = new WebSocket('wss://bilive.halaal.win/drawapi', this.apiKey);
        this.wsc.onmessage = this._Draw.bind(this);
        this.wsc.onclose = this._Close.bind(this);
    };
    BiliDraw.prototype._Draw = function (data) {
        var _this = this;
        var dataInfo = JSON.parse(data.data), x = dataInfo.x, y = dataInfo.y, c = dataInfo.c;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/activity/v1/SummerDraw/draw');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.onload = function (ev) {
            var res = JSON.parse(ev.target.responseText);
            if (res.code === 0)
                console.log("\u5750\u6807 x: " + x + ", y: " + y + ", \u989C\u8272 c: %c\u25A0 %c\u586B\u5145\u5B8C\u6BD5", "color:" + _this.color[c] + ";", '');
            else
                console.log("\u5750\u6807 x: " + x + ", y: " + y + ", \u989C\u8272 c: %c\u25A0 %c\u586B\u5145\u5931\u8D25", "color:" + _this.color[c] + ";", '');
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
