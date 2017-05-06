// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     2.0.26
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.bilibili\.com\/\d.*$/
// @license     MIT
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-end
// ==/UserScript==
/// <reference path="BiLiveNoVIP.d.ts" />
/**
 * 屏蔽B站直播间聊天室内容
 *
 * @class BiLiveNoVIP
 */
var BiLiveNoVIP = (function () {
    function BiLiveNoVIP() {
        this._D = document;
        this._defaultConfig = {
            version: 1494084016822,
            menu: {
                noKanBanMusume: {
                    name: '看&nbsp;&nbsp;板&nbsp;&nbsp;娘',
                    enable: false
                },
                noGuardIcon: {
                    name: '舰队相关',
                    enable: false
                },
                noHDIcon: {
                    name: '活动标识',
                    enable: false
                },
                noVIPIcon: {
                    name: '老爷标识',
                    enable: false
                },
                noMedalIcon: {
                    name: '粉丝勋章',
                    enable: false
                },
                noUserLevelIcon: {
                    name: '用户等级',
                    enable: false
                },
                noLiveTitleIcon: {
                    name: '成就头衔',
                    enable: false
                },
                noSystemMsg: {
                    name: '系统公告',
                    enable: false
                },
                noGiftMsg: {
                    name: '礼物信息',
                    enable: false
                },
                fixTreasure: {
                    name: '下移宝箱',
                    enable: false
                }
            }
        };
        // 加载设置
        var config = JSON.parse(GM_getValue('blnvConfig') || '{}');
        var defaultConfig = this._defaultConfig;
        if (config.version === undefined || config.version < defaultConfig.version) {
            for (var x in defaultConfig.menu) {
                try {
                    defaultConfig.menu[x].enable = config.menu[x].enable;
                }
                catch (error) {
                    console.error(error);
                }
            }
            this._config = defaultConfig;
        }
        else {
            this._config = config;
        }
    }
    /**
     * 开始
     *
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.Start = function () {
        this._AddUI();
        this._ChangeCSS();
        this._ChangeRankList();
    };
    /**
     * 模拟实时屏蔽
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._ChangeCSS = function () {
        // 获取或者插入style
        var elmStyle = this._D.querySelector('#gunCSS');
        if (elmStyle === null) {
            elmStyle = this._D.createElement('style');
            elmStyle.id = 'gunCSS';
            this._D.body.appendChild(elmStyle);
        }
        //css内容
        var cssText = '';
        if (this._config.menu.noKanBanMusume.enable)
            cssText += "\n    .live-haruna-ctnr {\n      display: none !important;\n    }";
        if (this._config.menu.noGuardIcon.enable)
            cssText += "\n    .tab-switcher[data-type=\"guard\"], .guard-rank, #chat-msg-list .guard-icon-small, #chat-msg-list .guard-sys, .guard-buy-sys, #chat-msg-list .guard-msg:after, .guard-lv1:before, .guard-lv2:before {\n      display: none !important;\n    }\n    #chat-msg-list .guard-msg {\n      margin: auto !important;\n      padding: 4px 5px !important;\n    }\n    #chat-msg-list .user-name.color {\n      color: #4fc1e9 !important;\n    }\n    #chat-msg-list .msg-content {\n      color: #646c7a !important;\n    }";
        if (this._config.menu.noHDIcon.enable)
            cssText += "\n    #chat-msg-list a[href^=\"/hd/\"], #santa-hint-ctnr {\n      display: none !important;\n    }";
        if (this._config.menu.noVIPIcon.enable)
            cssText += "\n    #chat-msg-list .vip-icon, #chat-msg-list .system-msg:not(.guard-sys) .v-middle {\n      display: none !important;\n    }\n    #chat-msg-list .system-msg {\n      padding:0 5px;\n    }";
        if (this._config.menu.noMedalIcon.enable)
            cssText += "\n    #chat-msg-list .fans-medal-item {\n      display: none !important;\n    }";
        if (this._config.menu.noUserLevelIcon.enable)
            cssText += "\n    #chat-msg-list .user-level-icon {\n      display: none !important;\n    }";
        if (this._config.menu.noLiveTitleIcon.enable)
            cssText += "\n    #chat-msg-list .check-my-title {\n      display: none !important;\n    }";
        if (this._config.menu.noSystemMsg.enable)
            cssText += "\n    #chat-msg-list .announcement-container, .bilibili-live-player-video-gift {\n      display: none !important;\n    }";
        if (this._config.menu.noGiftMsg.enable)
            cssText += "\n    #chat-msg-list .gift-msg, #chat-list-ctnr > .super-gift-ctnr, #chat-list-ctnr > #gift-msg-1000, #super-gift-ctnr-haruna, .bilibili-live-player-danmaku-gift {\n      display: none !important;\n    }\n    #chat-list-ctnr > #chat-msg-list {\n      height: 100% !important;\n    }";
        if (this._config.menu.fixTreasure.enable)
            cssText += "\n    #player-container > .treasure-box-ctnr {\n      margin: -160px 0 !important;\n    }";
        elmStyle.innerHTML = cssText;
    };
    /**
     * 改良排行榜
     *
     * @private
     * @memberof BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._ChangeRankList = function () {
        var _this = this;
        if (this._config.menu.noGuardIcon.enable) {
            var elmRankList = this._D.querySelector('.rank-list-ctnr');
            if (elmRankList != null) {
                var rankObserver_1 = new MutationObserver(function () {
                    var elmDivSevenRank = _this._D.querySelector('.tab-switcher[data-type="seven-rank"]');
                    elmDivSevenRank.click();
                    rankObserver_1.disconnect();
                });
                rankObserver_1.observe(elmRankList, { attributes: true });
            }
        }
        var bodyObserver = new MutationObserver(function () {
            var elmDivRand = _this._D.querySelector('#rank-list-ctnr');
            var elmDivChat = _this._D.querySelector('#chat-list-ctnr');
            if (_this._D.body.classList.contains('player-full-win')) {
                elmDivRand.style.cssText = 'display: none';
                elmDivChat.style.cssText = 'height: calc(100% - 150px)';
            }
            else {
                elmDivRand.style.cssText = '';
                elmDivChat.style.cssText = '';
            }
        });
        bodyObserver.observe(this._D.body, { attributes: true, attributeFilter: ['class'] });
    };
    /**
     * 添加按钮
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._AddUI = function () {
        var _this = this;
        // 添加按钮相关的css
        this._AddCSS();
        // 获取按钮插入的位置
        var elmDivBtns = this._D.querySelector('.btns');
        // 传说中的UI, 真的很丑
        var elmDivGun = this._D.createElement('div');
        elmDivGun.id = 'gunBut';
        var html = '滚<div id="gunMenu" class="gunHide">';
        // 循环插入内容
        for (var x in this._config.menu) {
            html += "\n      <div>\n        <input type=\"checkbox\" id=\"" + x + "\" class=\"gunHide\" />\n      \t<label for=\"" + x + "\"></label>\n        <span>" + this._config.menu[x].name + "</span>\n      </div>";
        }
        html += '</div>';
        elmDivGun.innerHTML = html;
        // 插入菜单按钮
        if (elmDivBtns != null)
            elmDivBtns.appendChild(elmDivGun);
        // 获取刚刚插入的DOM
        var elmDivMenu = this._D.querySelector('#gunMenu');
        // 为了和b站更搭, 所以监听body的click
        this._D.body.addEventListener('click', function (ev) {
            var evt = ev.target;
            if (elmDivGun.contains(evt)) {
                if (elmDivMenu != null && elmDivGun === evt)
                    elmDivMenu.classList.toggle('gunHide');
            }
            else {
                if (elmDivMenu != null)
                    elmDivMenu.classList.add('gunHide');
            }
        });
        // 循环设置监听插入的DOM
        for (var x in this._config.menu) {
            var checkbox = this._D.getElementById(x);
            checkbox.checked = this._config.menu[x].enable;
            checkbox.addEventListener('change', function (ev) {
                var evt = ev.target;
                _this._config.menu[evt.id].enable = evt.checked;
                GM_setValue('blnvConfig', JSON.stringify(_this._config));
                _this._ChangeCSS();
            });
        }
    };
    /**
     * 添加样式
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._AddCSS = function () {
        var cssText = "\n    #chat-ctrl-panel .chat-ctrl-btns .btn {\n      margin: 0 3px;\n    }\n    .gunHide {\n      display: none;\n    }\n    #gunBut {\n      border: 1px solid #999;\n      border-radius: 50%;\n      cursor: pointer;\n      display: inline-block;\n      font-size: 13px;\n      height: 18px;\n      margin: -3px 3px;\n      text-align: center;\n      width: 18px;\n      vertical-align: text-top;\n    }\n    #gunBut > #gunMenu {\n      animation:move-in-right cubic-bezier(.22,.58,.12,.98) .4s;\n      background-color: #fff;\n      border-radius: 5px;\n      box-shadow: 0 0 2em .1em rgba(0,0,0,0.15);\n      cursor: default;\n      font-size: 12px;\n      height: 210px;\n      margin: -250px -125px;\n      padding: 10px;\n      position: absolute;\n      width: 100px;\n      z-index: 101;\n    }\n    #gunBut > #gunMenu > div {\n    \tbackground: darkgray;\n    \tborder-radius: 5px;\n    \theight: 10px;\n    \tmargin: 0 0 12px 0;\n    \tposition: relative;\n    \twidth: 20px;\n    }\n    #gunBut > #gunMenu > div > label {\n    \tbackground: dimgray;\n    \tborder-radius: 50%;\n    \tcursor: pointer;\n    \tdisplay: block;\n    \theight: 16px;\n    \tleft: -3px;\n    \tposition: absolute;\n    \ttop: -3px;\n    \ttransition: all .5s ease;\n    \twidth: 16px;\n    }\n    #gunBut > #gunMenu > div > input[type=checkbox]:checked + label {\n      background: #4fc1e9;\n    \tleft: 7px;\n    }\n    #gunBut > #gunMenu > div > span {\n      left: 0;\n      margin: -3px 0 0 20px;\n      position: absolute;\n      width: 80px;\n    }";
        // 插入css
        var elmStyle = this._D.createElement('style');
        elmStyle.innerHTML = cssText;
        this._D.body.appendChild(elmStyle);
    };
    return BiLiveNoVIP;
}());
var gun = new BiLiveNoVIP();
gun.Start();
