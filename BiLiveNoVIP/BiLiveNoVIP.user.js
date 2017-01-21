// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     2.0.20
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^http:\/\/live\.bilibili\.com\/\d.*$/
// @require     https://github.com/jabbany/CommentCoreLibrary/raw/master/build/CommentCoreLibrary.js
// @license     MIT
// @grant       none
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
        this._W = window;
        this._D = document;
        this._tempWord = [];
        this._defaultConfig = {
            version: 1484995751472,
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
                },
                replaceDanmaku: {
                    name: '替换弹幕',
                    enable: false
                },
                closeDanmaku: {
                    name: '&nbsp;&nbsp;┣关闭弹幕',
                    enable: false
                },
                popularWords: {
                    name: '&nbsp;&nbsp;┣屏蔽热词',
                    enable: false
                },
                beatStorm: {
                    name: '&nbsp;&nbsp;┗节奏风暴',
                    enable: false
                }
            }
        };
        // 加载设置
        var config = JSON.parse(localStorage.getItem('blnvConfig') || '{}');
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
        var _this = this;
        this._AddUI();
        this._ChangeCSS();
        // flash加载完成后的回调函数
        var flashCallback = this._W['flash_on_ready_callback'];
        this._W['flash_on_ready_callback'] = function () {
            flashCallback();
            if (_this._CM != null)
                return;
            _this._AddDanmaku();
            if (_this._config.menu.replaceDanmaku.enable) {
                _this._ReplaceDanmaku(true);
                if (_this._config.menu.popularWords.enable)
                    _this._PopularWords(true);
                if (_this._config.menu.beatStorm.enable)
                    _this._BeatStorm(true);
            }
            // 排行榜
            if (_this._config.menu.noGuardIcon.enable) {
                var elmDivSevenRank = _this._D.querySelector('.tab-switcher[data-type="seven-rank"]');
                elmDivSevenRank.click();
            }
        };
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
            cssText += "\n    .tab-switcher[data-type=\"guard\"], .guard-rank, #chat-msg-list a[href^=\"/i/guardBuy\"], #chat-msg-list .system-msg.guard-sys, .guard-buy-sys, #chat-msg-list .guard-msg:after, .guard-lv1:before, .guard-lv2:before {\n      display: none !important;\n    }\n    #chat-msg-list .guard-msg {\n      margin: auto !important;\n      padding: 4px 5px !important;\n    }\n    #chat-msg-list .user-name.color {\n      color: #4fc1e9 !important;\n    }\n    #chat-msg-list .msg-content {\n      color: #646c7a !important;\n    }";
        if (this._config.menu.noHDIcon.enable)
            cssText += "\n    #chat-msg-list a[href^=\"/hd/\"], #santa-hint-ctnr {\n      display: none !important;\n    }";
        if (this._config.menu.noVIPIcon.enable)
            cssText += "\n    #chat-msg-list a[href=\"/i#to-vip\"], #chat-msg-list .system-msg > a[href=\"/i#to-vip\"] ~ span {\n      display: none !important;\n    }\n    #chat-msg-list .system-msg {\n      padding:0 10px;\n      height:auto;\n    }";
        if (this._config.menu.noMedalIcon.enable)
            cssText += "\n    #chat-msg-list .medal-icon {\n      display: none !important;\n    }";
        if (this._config.menu.noUserLevelIcon.enable)
            cssText += "\n    #chat-msg-list .user-level-icon {\n      display: none !important;\n    }";
        if (this._config.menu.noLiveTitleIcon.enable)
            cssText += "\n    #chat-msg-list .check-my-title {\n      display: none !important;\n    }";
        if (this._config.menu.noSystemMsg.enable)
            cssText += "\n    #chat-msg-list .announcement-container {\n      display: none !important;\n    }";
        if (this._config.menu.noGiftMsg.enable)
            cssText += "\n    #chat-msg-list .gift-msg, #chat-list-ctnr > .super-gift-ctnr, #chat-list-ctnr > #gift-msg-1000, #super-gift-ctnr-haruna {\n      display: none !important;\n    }\n    #chat-list-ctnr > #chat-msg-list {\n      height: 100% !important;\n    }";
        if (this._config.menu.fixTreasure.enable)
            cssText += "\n    #player-container > .treasure-box-ctnr {\n      margin: -160px 0 !important;\n    }";
        elmStyle.innerHTML = cssText;
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
        elmDivBtns.appendChild(elmDivGun);
        // 获取刚刚插入的DOM
        var elmDivMenu = this._D.querySelector('#gunMenu');
        // 为了和b站更搭, 所以监听body的click
        this._D.body.addEventListener('click', function (ev) {
            var evt = ev.target;
            if (elmDivGun.contains(evt)) {
                if (evt === elmDivGun)
                    elmDivMenu.classList.toggle('gunHide');
            }
            else {
                elmDivMenu.classList.add('gunHide');
            }
        });
        // 循环设置监听插入的DOM
        var replaceDanmakuCheckbox = this._D.querySelector('#replaceDanmaku');
        var closeDanmakuCheckbox = this._D.querySelector('#closeDanmaku');
        var popularWordsCheckbox = this._D.querySelector('#popularWords');
        var beatStormCheckbox = this._D.querySelector('#beatStorm');
        for (var x in this._config.menu) {
            var checkbox = this._D.getElementById(x);
            checkbox.checked = this._config.menu[x].enable;
            checkbox.addEventListener('change', function (ev) {
                var evt = ev.target;
                _this._config.menu[evt.id].enable = evt.checked;
                localStorage.setItem('blnvConfig', JSON.stringify(_this._config));
                switch (evt.id) {
                    case 'replaceDanmaku':
                        _this._ReplaceDanmaku(evt.checked);
                        if (!evt.checked) {
                            // 关闭热词和节奏风暴选项
                            if (closeDanmakuCheckbox.checked = true)
                                closeDanmakuCheckbox.click();
                            if (popularWordsCheckbox.checked = true)
                                popularWordsCheckbox.click();
                            if (beatStormCheckbox.checked = true)
                                beatStormCheckbox.click();
                        }
                        break;
                    case 'closeDanmaku':
                        _this._CM.clear();
                        if (evt.checked && !replaceDanmakuCheckbox.checked)
                            replaceDanmakuCheckbox.click();
                        break;
                    case 'popularWords':
                        _this._PopularWords(evt.checked);
                        if (evt.checked && !replaceDanmakuCheckbox.checked)
                            replaceDanmakuCheckbox.click();
                        break;
                    case 'beatStorm':
                        _this._BeatStorm(evt.checked);
                        if (evt.checked && !replaceDanmakuCheckbox.checked)
                            replaceDanmakuCheckbox.click();
                        break;
                    default:
                        _this._ChangeCSS();
                        break;
                }
            });
        }
    };
    /**
     * 添加弹幕层
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._AddDanmaku = function () {
        var _this = this;
        // 获取播放器节点
        this._playerObject = this._D.querySelector('#player_object');
        // 创建弹幕层
        var danmaku = this._D.createElement('div');
        danmaku.className = 'gunDanmaku';
        var danmakuContainer = this._D.createElement('div');
        danmakuContainer.className = 'gunDanmakuContainer';
        // 插入弹幕层
        danmaku.appendChild(danmakuContainer);
        this._playerObject.parentNode.appendChild(danmaku);
        this._CM = new CommentManager(danmakuContainer);
        // CommentCoreLibrary (//github.com/jabbany/CommentCoreLibrary) - Licensed under the MIT license
        this._CM.init();
        // 透明度
        this._CM.options.scroll.opacity = parseInt(localStorage.getItem('danmuAlpha') || '100') / 100;
        // 存在时间7s
        this._CM.options.scroll.scale = 1.75;
        // 弹幕密度
        this._CM.options.limit = parseDensity(localStorage.getItem('danmuDensity') || '30');
        // 监听视频窗口大小
        var bodyObserver = new MutationObserver(function (ev) {
            _this._CM.width = danmaku.clientWidth;
            _this._CM.height = danmaku.clientHeight;
            // 排行榜
            var evt = ev[0];
            var elmDivRand = _this._D.querySelector('#rank-list-ctnr');
            var elmDivChat = _this._D.querySelector('#chat-list-ctnr');
            if (evt.oldValue && evt.oldValue.indexOf('player-full-win') === -1) {
                elmDivRand.style.cssText = 'display: none';
                elmDivChat.style.cssText = 'height: calc(100% - 150px)';
            }
            else {
                elmDivRand.style.cssText = '';
                elmDivChat.style.cssText = '';
            }
        });
        bodyObserver.observe(this._D.body, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
        this._W.addEventListener('resize', function () {
            _this._CM.width = danmaku.clientWidth;
            _this._CM.height = danmaku.clientHeight;
        });
        // 控制条
        this._D.querySelector('#danmu-alpha-ctrl').addEventListener('input', function (ev) {
            _this._CM.options.scroll.opacity = parseInt(ev.target.value) / 100;
        });
        this._D.querySelector('#danmu-density-ctrl').addEventListener('input', function (ev) {
            _this._CM.options.limit = parseDensity(ev.target.value);
        });
        /**
         * 计算弹幕密度
         *
         * @param {string} density
         * @returns
         */
        function parseDensity(density) {
            var limit;
            switch (density) {
                case '81':
                    limit = 100;
                    break;
                case '82':
                    limit = 200;
                    break;
                case '83':
                    limit = 300;
                    break;
                case '84':
                    limit = 400;
                    break;
                case '85':
                    limit = 500;
                    break;
                case '86':
                    limit = 0;
                    break;
                default:
                    limit = parseInt(density);
                    break;
            }
            return limit;
        }
    };
    /**
     * 替换弹幕
     *
     * @private
     * @param {boolean} enable
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._ReplaceDanmaku = function (enable) {
        var _this = this;
        if (enable) {
            this._CM.start();
            // 替换弹幕
            this._playerObject.showComments(false);
            var masterID_1 = this._W.MASTERID;
            // 获取聊天信息
            this._DANMU_MSG = this._W.protocol.DANMU_MSG;
            this._W.protocol.DANMU_MSG = function (json) {
                // 屏蔽关键词
                if (_this._tempWord.indexOf(json.info[1]) !== -1)
                    return;
                if (!_this._config.menu.closeDanmaku.enable) {
                    // 添加弹幕
                    var danmuColor = 16777215;
                    // 主播与管理员特殊颜色
                    if (json.info[2][2] === 1)
                        danmuColor = (json.info[2][0] === masterID_1) ? 6737151 : 16750592;
                    var danmu = {
                        mode: 1,
                        text: json.info[1],
                        size: 0.25 * parseInt(localStorage.getItem('danmuSize') || '100'),
                        color: danmuColor,
                        shadow: true
                    };
                    _this._CM.send(danmu);
                }
                // 添加到聊天列表
                _this._DANMU_MSG(json);
            };
        }
        else {
            this._W.protocol.DANMU_MSG = this._DANMU_MSG;
            this._W.msg_history = { get: function () { } };
            this._CM.stop();
            this._CM.clear();
            this._playerObject.showComments(true);
        }
    };
    /**
     * 屏蔽热词
     *
     * @private
     * @param {boolean} disable
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._PopularWords = function (disable) {
        this._tempWord = (disable) ? this._W.flash_popularWords() : [];
    };
    /**
     * 屏蔽节奏风暴
     *
     * @private
     * @param {boolean} disable
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._BeatStorm = function (disable) {
        var _this = this;
        if (disable) {
            this._SPECIAL_GIFT = this._W.protocol.SPECIAL_GIFT;
            this._W.protocol.SPECIAL_GIFT = function (json) {
                if (json.data['39'] && json.data['39'].content != null)
                    _this._tempWord.push(json.data['39'].content);
            };
        }
        else
            this._W.protocol.SPECIAL_GIFT = this._SPECIAL_GIFT;
    };
    /**
     * 添加样式
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype._AddCSS = function () {
        var cssText = "\n    #chat-ctrl-panel .chat-ctrl-btns .btn {\n      margin: 0 3px;\n    }\n    .gunHide {\n      display: none;\n    }\n    #gunBut {\n      border: 1px solid #999;\n      border-radius: 50%;\n      cursor: pointer;\n      display: inline-block;\n      font-size: 13px;\n      height: 18px;\n      margin: -3px 3px;\n      text-align: center;\n      width: 18px;\n      vertical-align: text-top;\n    }\n    #gunBut > #gunMenu {\n      animation:move-in-right cubic-bezier(.22,.58,.12,.98) .4s;\n      background-color: #fff;\n      border-radius: 5px;\n      box-shadow: 0 0 2em .1em rgba(0,0,0,0.15);\n      cursor: default;\n      font-size: 12px;\n      height: 300px;\n      margin: -300px -125px;\n      padding: 10px;\n      position: absolute;\n      width: 100px;\n      z-index: 101;\n    }\n    #gunBut > #gunMenu > div {\n    \tbackground: darkgray;\n    \tborder-radius: 5px;\n    \theight: 10px;\n    \tmargin: 0 0 12px 0;\n    \tposition: relative;\n    \twidth: 20px;\n    }\n    #gunBut > #gunMenu > div > label {\n    \tbackground: dimgray;\n    \tborder-radius: 50%;\n    \tcursor: pointer;\n    \tdisplay: block;\n    \theight: 16px;\n    \tleft: -3px;\n    \tposition: absolute;\n    \ttop: -3px;\n    \ttransition: all .5s ease;\n    \twidth: 16px;\n    }\n    #gunBut > #gunMenu > div > input[type=checkbox]:checked + label {\n      background: #4fc1e9;\n    \tleft: 7px;\n    }\n    #gunBut > #gunMenu > div > span {\n      left: 0;\n      margin: -3px 0 0 20px;\n      position: absolute;\n      width: 80px;\n    }\n    .gunDanmaku {\n      position:absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 93%;\n      overflow: hidden;\n      z-index: 1;\n      cursor: pointer;\n      pointer-events: none;\n    }\n    .gunDanmaku .gunDanmakuContainer {\n      transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);\n      position: absolute;\n      display: block;\n      overflow: hidden;\n      margin: 0;\n      border: 0;\n      top: 0;\n      left: 0;\n      bottom: 0;\n      right: 0;\n      z-index: 9999;\n      touch-callout: none;\n      user-select: none;\n    }\n    .gunDanmaku .gunDanmakuContainer .cmt {\n      transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);\n      transform-origin: 0% 0%;\n      position: absolute;\n      padding: 3px 0 0 0;\n      margin: 0;\n      color: #fff;\n      font-family: \"Microsoft YaHei\", SimHei;\n      font-size: 25px;\n      text-decoration: none;\n      text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;\n      text-size-adjust: none;\n      line-height: 100%;\n      letter-spacing: 0;\n      word-break: keep-all;\n      white-space: pre;\n    }\n    .gunDanmaku .gunDanmakuContainer .cmt.noshadow {\n      text-shadow: none;\n    }\n    .gunDanmaku .gunDanmakuContainer .cmt.rshadow {\n      text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;\n    }";
        // 插入css
        var elmStyle = this._D.createElement('style');
        elmStyle.innerHTML = cssText;
        this._D.body.appendChild(elmStyle);
    };
    return BiLiveNoVIP;
}());
var gun = new BiLiveNoVIP();
gun.Start();
