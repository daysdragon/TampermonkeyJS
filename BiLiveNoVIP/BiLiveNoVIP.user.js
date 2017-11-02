// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     3.0.0
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.bilibili\.com\/neptune\/\d.*$/
// @license     MIT
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-end
// ==/UserScript==
"use strict";
var BiLiveNoVIP = (function () {
    function BiLiveNoVIP() {
        this._counter = 0;
        this._defaultConfig = {
            version: 1509593795879,
            menu: {
                noKanBanMusume: {
                    name: '看&nbsp;&nbsp;板&nbsp;&nbsp;娘',
                    enable: false
                },
                noGuardIcon: {
                    name: '舰队标识',
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
                }
            }
        };
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
    BiLiveNoVIP.prototype.Start = function () {
        var _this = this;
        this._AddCSS();
        this._ChangeCSS();
        var elmDivAside = document.querySelector('.right-part.chat-ctnr, .aside-area');
        if (elmDivAside != null) {
            var asideObserver_1 = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'childList' && mutation.addedNodes != null) {
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            var elm = mutation.addedNodes[i];
                            if (elm.nodeName === 'LI' && elm.innerText === '七日榜') {
                                _this._counter += 1;
                                elm.click();
                            }
                            if (elm.nodeName === 'DIV' && elm.id === 'chat-control-panel-vm') {
                                _this._counter += 1;
                                _this._AddUI();
                            }
                        }
                    }
                });
                if (_this._counter >= 2)
                    asideObserver_1.disconnect();
            });
            asideObserver_1.observe(elmDivAside, { childList: true, subtree: true });
        }
        var bodyObserver = new MutationObserver(function () {
            var elmDivRand = document.querySelector('#rank-list-vm'), elmDivChat = document.querySelector('.chat-history-panel');
            if (document.body.classList.contains('player-full-win')) {
                elmDivRand.style.cssText = 'display: none';
                elmDivChat.style.cssText = 'height: calc(100% - 135px)';
            }
            else {
                elmDivRand.style.cssText = '';
                elmDivChat.style.cssText = '';
            }
        });
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    };
    BiLiveNoVIP.prototype._ChangeCSS = function () {
        var elmStyle = document.querySelector('#gunCSS');
        if (elmStyle === null) {
            elmStyle = document.createElement('style');
            elmStyle.id = 'gunCSS';
            document.body.appendChild(elmStyle);
        }
        var cssText = '';
        if (this._config.menu.noKanBanMusume.enable)
            cssText += "\n    .haruna-sekai-de-ichiban-kawaii {\n      display: none !important;\n    }";
        if (this._config.menu.noGuardIcon.enable)
            cssText += "\n    .chat-history-list .guard-icon,\n    .chat-history-list .welcome-guard,\n    .chat-history-list .danmaku-item.guard-level-1:before,\n    .chat-history-list .danmaku-item.guard-level-2:before,\n    .chat-history-list .danmaku-item.guard-level-1:after,\n    .chat-history-list .danmaku-item.guard-level-2:after {\n      display: none !important;\n    }\n    .chat-history-list .danmaku-item.guard-danmaku .vip-icon {\n      margin-right: 5px !important;\n    }\n    .chat-history-list .danmaku-item.guard-danmaku .admin-icon,\n    .chat-history-list .danmaku-item.guard-danmaku .anchor-icon,\n    .chat-history-list .danmaku-item.guard-danmaku .fans-medal-item-ctnr,\n    .chat-history-list .danmaku-item.guard-danmaku .title-label,\n    .chat-history-list .danmaku-item.guard-danmaku .user-level-icon {\n      margin-right: 5px !important;\n    }\n    .chat-history-list .danmaku-item.guard-level-1,\n    .chat-history-list .danmaku-item.guard-level-2 {\n      padding: 4px 5px !important;\n      margin: 0 !important;\n    }\n    .chat-history-list .danmaku-item.guard-danmaku .user-name {\n      color: #23ade5 !important;\n    }\n    .chat-history-list .danmaku-item.guard-danmaku .danmaku-content {\n      color: #646c7a !important;\n    }";
        if (this._config.menu.noHDIcon.enable)
            cssText += "\n    .chat-msg-list a[href^=\"/hd/\"],\n    #santa-hint-ctnr {\n      display: none !important;\n    }";
        if (this._config.menu.noVIPIcon.enable)
            cssText += "\n    .chat-history-list .vip-icon,\n    .chat-history-list .welcome-msg {\n      display: none !important;\n    }";
        if (this._config.menu.noMedalIcon.enable)
            cssText += "\n    .chat-history-list .fans-medal-item-ctnr {\n      display: none !important;\n    }";
        if (this._config.menu.noUserLevelIcon.enable)
            cssText += "\n    .chat-history-list .user-level-icon {\n      display: none !important;\n    }";
        if (this._config.menu.noLiveTitleIcon.enable)
            cssText += "\n    .chat-history-list .title-label {\n      display: none !important;\n    }";
        if (this._config.menu.noSystemMsg.enable)
            cssText += "\n    .bilibili-live-player-video-gift,\n    .chat-history-list .system-msg {\n      display: none !important;\n    }";
        if (this._config.menu.noGiftMsg.enable)
            cssText += "\n    .bilibili-live-player-danmaku-gift,\n    .haruna-sekai-de-ichiban-kawaii .super-gift-bubbles,\n    .chat-history-panel .penury-gift-msg,\n    .chat-history-list .gift-item {\n      display: none !important;\n    }\n    .chat-history-list.with-penury-gift {\n      height: 100% !important;\n    }";
        elmStyle.innerHTML = cssText;
    };
    BiLiveNoVIP.prototype._AddUI = function () {
        var _this = this;
        var elmDivBtns = document.querySelector('.btns, .icon-left-part'), elmDivGun = document.createElement('div'), elmDivMenu = document.createElement('div'), html = '';
        elmDivGun.id = 'gunBut';
        elmDivMenu.id = 'gunMenu';
        elmDivMenu.className = 'gunHide';
        for (var x in this._config.menu) {
            html += "\n      <div>\n        <input type=\"checkbox\" id=\"" + x + "\" class=\"gunHide\" />\n      \t<label for=\"" + x + "\"></label>\n        <span>" + this._config.menu[x].name + "</span>\n      </div>";
        }
        elmDivMenu.innerHTML = html;
        if (elmDivBtns != null) {
            elmDivGun.appendChild(elmDivMenu);
            elmDivBtns.appendChild(elmDivGun);
        }
        document.body.addEventListener('click', function (ev) {
            var evt = ev.target;
            if (elmDivGun.contains(evt)) {
                if (elmDivGun === evt) {
                    elmDivMenu.classList.toggle('gunHide');
                    elmDivGun.classList.toggle('gunActive');
                }
            }
            else {
                elmDivMenu.classList.add('gunHide');
                elmDivGun.classList.remove('gunActive');
            }
        });
        for (var x in this._config.menu) {
            var checkbox = document.getElementById(x);
            checkbox.checked = this._config.menu[x].enable;
            checkbox.addEventListener('change', function (ev) {
                var evt = ev.target;
                _this._config.menu[evt.id].enable = evt.checked;
                GM_setValue('blnvConfig', JSON.stringify(_this._config));
                _this._ChangeCSS();
            });
        }
    };
    BiLiveNoVIP.prototype._AddCSS = function () {
        var cssText = "\n    .gunHide {\n      display: none;\n    }\n    #gunBut {\n      border: 1.5px solid #c8c8c8;\n      border-radius: 50%;\n      color: #c8c8c8;\n      cursor: default;\n      display: inline-block;\n      height: 18px;\n      margin: 0 5px;\n      vertical-align: middle;\n      width: 18px;\n    }\n    #gunBut.gunActive,\n    #gunBut:hover {\n      border: 1.5px solid #23ade5;\n      color: #23ade5;\n    }\n    #gunBut:after {\n      content: '\u6EDA';\n      font-size: 13px;\n      margin: 2px 2.5px;\n      float: left;\n    }\n    #gunBut #gunMenu {\n      animation: gunMenu .4s;\n      background-color: #fff;\n      border: 1px solid #e9eaec;\n      border-radius: 8px;\n      box-shadow: 0 6px 12px 0 rgba(106,115,133,.22);\n      font-size: 12px;\n      height: 185px;\n      left: 0px;\n      padding: 10px;\n      position: absolute;\n      text-align: center;\n      top: -215px;\n      transform-origin: 100px bottom 0px;\n      width: 85px;\n      z-index: 2;\n    }\n    #gunBut #gunMenu > div {\n    \tbackground: darkgray;\n    \tborder-radius: 5px;\n    \theight: 10px;\n    \tmargin: 0 0 12px 0;\n    \tposition: relative;\n    \twidth: 20px;\n    }\n    #gunBut #gunMenu > div > label {\n    \tbackground: dimgray;\n    \tborder-radius: 50%;\n    \tcursor: pointer;\n    \tdisplay: block;\n    \theight: 16px;\n    \tleft: -3px;\n    \tposition: absolute;\n    \ttop: -3px;\n    \ttransition: all .5s ease;\n    \twidth: 16px;\n    }\n    #gunBut #gunMenu > div > input[type=checkbox]:checked + label {\n      background: #4fc1e9;\n    \tleft: 7px;\n    }\n    #gunBut > #gunMenu > div > span {\n      color: #666;\n      left: 0;\n      margin: -3px 0 0 20px;\n      position: absolute;\n      width: 80px;\n    }\n    @keyframes gunMenu {\n      0% {\n        opacity: 0;\n        transform: scale(0);\n      }\n      50% {\n        transform: scale(1.1);\n      }\n      to {\n        opacity: 1;\n        transform: scale(1);\n      }\n  }";
        var elmStyle = document.createElement('style');
        elmStyle.innerHTML = cssText;
        document.body.appendChild(elmStyle);
    };
    return BiLiveNoVIP;
}());
var gun = new BiLiveNoVIP();
gun.Start();
