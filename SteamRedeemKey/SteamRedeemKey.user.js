// ==UserScript==
// @name        SteamRedeemKey
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.3
// @author      lzghzr
// @description 划Key激活
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @match       *://*/*
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
/// <reference path="SteamRedeemKey.d.ts" />
var SteamRedeemKey = (function () {
    function SteamRedeemKey() {
        this._D = document;
        this._W = unsafeWindow || window;
    }
    SteamRedeemKey.prototype.Start = function () {
        this._AddUI();
        this._D.addEventListener('mouseup', this._ShowUI.bind(this));
    };
    SteamRedeemKey.prototype._ShowUI = function (event) {
        var _this = this;
        setTimeout(function () {
            var selection = _this._W.getSelection(), str = selection.toString();
            if (str.length < 17) {
                _this._elmDivSRK.style.cssText = 'display: none;';
            }
            else {
                var inputKeys = [], elmInputKeys = selection.getRangeAt(0).cloneContents().querySelectorAll('input');
                for (var i = 0; i < elmInputKeys.length; i++) {
                    var key = elmInputKeys[i].value;
                    if (inputKeys.indexOf(key) === -1)
                        inputKeys.push(key);
                }
                str = str + inputKeys.join(',');
                var keys = str.match(/[A-Za-z0-9]{5}-[A-Za-z0-9]{5}-[A-Za-z0-9]{5}/g);
                if (keys !== null) {
                    _this._redeemKey = keys.join(',');
                    _this._top = document.body.scrollTop + event.clientY - 30;
                    _this._left = document.body.scrollLeft + event.clientX;
                    _this._elmDivSRK.style.cssText = "\ndisplay: block;\nleft: " + _this._left + "px;\ntop: " + _this._top + "px;";
                }
                else {
                    _this._elmDivSRK.style.cssText = 'display: none;';
                }
            }
        }, 0);
    };
    SteamRedeemKey.prototype._AddUI = function () {
        this._AddCSS();
        this._elmDivSRK = this._D.createElement('div');
        this._elmDivSRK.id = 'SRK_button';
        var html = '<div class="SRK_steam"></div>';
        this._elmDivSRK.innerHTML = html;
        this._D.body.appendChild(this._elmDivSRK);
        this._elmDivSRK.addEventListener('click', this._ClickButton.bind(this));
    };
    SteamRedeemKey.prototype._ClickButton = function () {
        var _this = this;
        GM_xmlhttpRequest({
            method: 'GET',
            url: "http://127.0.0.1:1242/IPC?command=redeem%20" + this._redeemKey,
            onload: function (res) {
                if (res.status === 200) {
                    var elmDivRedeem = _this._D.createElement('div');
                    elmDivRedeem.classList.add('SRK_redeem');
                    elmDivRedeem.style.cssText = "\nleft: " + _this._left + "px;\ntop: " + _this._top + "px;";
                    elmDivRedeem.innerHTML = res.responseText;
                    var resText = elmDivRedeem.innerText;
                    resText = resText.slice(1).replace(/\n/g, '<br />');
                    elmDivRedeem.innerHTML = "<span>" + resText + "</span>";
                    _this._D.body.appendChild(elmDivRedeem);
                }
            }
        });
    };
    SteamRedeemKey.prototype._AddCSS = function () {
        var cssText = "\n#SRK_button {\n  background: rgba(23, 26, 33, 0);\n  border-radius: 50%;\n  box-shadow: 0px 0px 10px 0px #171a21;\n  cursor: pointer;\n  display: none;\n  height: 24px;\n  position: absolute;\n  width: 24px;\n  z-index: 999;\n}\n.SRK_steam {\n  background: no-repeat url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFRklEQVR4XoXVCWwUVRzH8e+bmZ3dtvTulp4IiLZqBSQoIArKoSIKclQKyNUECInBeCXUCh5F41HFBA8EQSEcFZTbizMoqNAIJQE1CmI4WqhaaKHHzs6bvxuzoUlj6Sf5JflPkvd/8/Lyf8rO6E8rwVQ6Eg9DCZaS7igZC9yh4BYgGwCoFjgOHELUJi3qRCRoMSIxAYMoLP5fjggLw6KmglK0BYnATcB44A1gNVAKnCbqWg2KtKgVoGLogOcJAIahHgMKQWYBq9ptoOAJLcY7XIMyLUKXG6HhPCAAgAFJGX5/XMxKpb3OAm8SpezMOwFAKARZz7VYPpyzZ8AfYOKUMdvHPzJ8t4iois++vu+z1ZsfQGvsnGxw3ceANdEGdwMEgVoQ2qMsi9DZs6RkZTQe2L1ySn5e97015y4MVqYpGRlp+6qO/jJy4NBpK5rq6/3+jExEe1lAjQUmwBI6EG5oQdl+78C3FU/nd88+ff+YuXv8SmtBKcMOuFsqymfu31dR0qdgxNvhxjBWwF4GPKQCWUO7AqfoQEv1KQpnzqhav/T5uaMnz1sRTEms/2hxyauAKpox/0VlWWrdshfmPDjpuaVfrfs8P5CVC9DNMg1rmgjtU2BYJtDEvf1vrQ6H3eGNTY69ZU3JquhVpeLjsmVDH3nymZATHjatcNjxr9Z9mm8oC2C25boy0O+3EREQ2sIwFfW1dRgJN8rYhwedbgk5Wa7GBHIBBQiQrDWmoVSS47jJYEcKC2CQFbri3BY6/zdGMEhiQhzieUjr5nEjNU0XWf7pu5Wdg8ktgJWdma5HTZw/cfniZ3Z7nsfk2a/d37Pghgafz3JWbtjTGzMRw/IBXMfOfUf2FRW/8ldczmgXbhcShkvSDY9Kal6RJPQoFOglo6aV/SUiayPZHskWxwlvnTrnjfMjx5VceHh8ae3cee+dFZGPd31XVYl5l8R1HScpkTUiuaxEZCuQ9cefNbJ6/d70im0Hgr9U/hqD64LPole/W5ord71zxGcZDhALAIQAB0gAPKBu+87K3LFTygpQiuT0FLTnAVxRIrID6A+cBMLak5i1G79N+anq90DfXj2ak1MTnJFD+jQAvtYphge4Pxz+PX7jtgNxVSfOxe/65lCMERsgmJmKdlyiqpWILAeKgXNEjz0aDzDL39+cvG3/8dglZTMu3nR9lgMAqGdfXZNYvmhDPFdaIC2BpIxUbNvC0x6tOKhmLfhkweghvV96cHCvy4BHKxWtdfmKrxN2/PizuWPpU/UnT9eak57+oNOhXYeN2B7ZxHeKRWtNO95S5Ey8mbjA8X5985gwoq+ePmqAJMfH0oae+cpae8LwPl5R6SfmP7+dIZjfBUQQoX0ieSr9oRdwtP7yUk3dCBqaSM/L4cSGUi5caiSpU4C0xDgWbfiOuvom7undjWGTXic1PxflCR3YCzLE8vw2FswK9sg944lQ++sZXly1hyfGDGDxxu9xIgtfUVBWfB8z3tyI0TkNw/YjdECkGEClTS4HAGUUK6WWh13NpfMXeXLyYIb27Co15/6Rgpu7GIs2/cj6LypJ65YB2qNdSgEyB5EloFBp0xdzlWXONyzz5XDY5WJ1HalZKeSkJ8qxUxeUvtxCek4q4gnSdv/REsMAz1uI48xHBNR/Dd6N3hcPbB8EArMw1IeI0BwK47iaGNvC77MQkWtMRAUij9Pc8h7NzVf/xoLWIYcIwFKx7f2YZlkglrGB6HevneOI2orWpSoUOoZIB4++CHjyM7Y5DssqwDQmgeoPdAVSAAXUAadADqK9Clz3KOEwiNDWv8cbRuR4oLfxAAAAAElFTkSuQmCC\");\n  height: 24px;\n  width: 24px;\n}\n.SRK_redeem {\n  background: #57CBDE;\n  border-radius: 50%;\n  height: 24px;\n  position: absolute;\n  width: 24px;\n  z-index: 999;\n}\n.SRK_redeem > span {\n  display:none;\n}\n.SRK_redeem:hover > span {\n  background: #FFF;\n  color: #000;\n  display: block;\n  font-size: 15px;\n  margin: 12px 12px;\n  position: absolute;\n  white-space: nowrap;\n  z-index: 999;\n}";
        var elmStyle = this._D.createElement('style');
        elmStyle.innerHTML = cssText;
        this._D.body.appendChild(elmStyle);
    };
    return SteamRedeemKey;
}());
var redeem = new SteamRedeemKey();
redeem.Start();
