// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     2.0.12
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
        this.W = window;
        this.D = document;
        this.tempWord = [];
        this.defaultConfig = {
            version: 1478004841701,
            menu: {
                noHDIcon: {
                    name: '活动标识',
                    enable: false
                },
                noVIPIcon: {
                    name: '老爷标签',
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
                    name: '系统消息',
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
        var defaultConfig = this.defaultConfig;
        if (config.version === undefined || config.version < defaultConfig.version) {
            for (var x in defaultConfig.menu) {
                try {
                    defaultConfig.menu[x].enable = config.menu[x].enable;
                }
                catch (error) {
                    console.error(error);
                }
            }
            this.config = defaultConfig;
        }
        else {
            this.config = config;
        }
    }
    /**
     * 开始
     *
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.Start = function () {
        var _this = this;
        this.AddUI();
        this.ChangeCSS();
        this.AddDanmaku();
        // flash加载完成后的回调函数
        this.W.msg_history = {
            get: function () {
                if (_this.config.menu.replaceDanmaku.enable) {
                    _this.ReplaceDanmaku(true);
                    if (_this.config.menu.popularWords.enable)
                        _this.PopularWords(true);
                    if (_this.config.menu.beatStorm.enable)
                        _this.BeatStorm(true);
                }
            }
        };
    };
    /**
     * 模拟实时屏蔽
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.ChangeCSS = function () {
        // 获取或者插入style
        var elmStyle = this.D.querySelector('#gunCSS');
        if (elmStyle === null) {
            elmStyle = this.D.createElement('style');
            elmStyle.id = 'gunCSS';
            this.D.body.appendChild(elmStyle);
        }
        //css内容
        var cssText = '';
        if (this.config.menu.noHDIcon.enable)
            cssText += "\n    #chat-msg-list a[href^=\"/hd/\"], #chat-msg-list .guard-msg:after, .guard-lv1:before, .guard-lv2:before {\n      display: none !important;\n    }\n    #chat-msg-list .guard-msg {\n      margin: auto !important;\n      padding: 4px 5px !important;\n    }\n    #chat-msg-list .user-name.color {\n      color: #4fc1e9 !important;\n    }\n    #chat-msg-list .msg-content {\n      color: #646c7a !important;\n    }";
        if (this.config.menu.noVIPIcon.enable)
            cssText += "\n    #chat-msg-list a[href=\"/i#to-vip\"] {\n      display: none !important;\n    }";
        if (this.config.menu.noMedalIcon.enable)
            cssText += "\n    #chat-msg-list .medal-icon {\n      display: none !important;\n    }";
        if (this.config.menu.noUserLevelIcon.enable)
            cssText += "\n    #chat-msg-list .user-level-icon {\n      display: none !important;\n    }";
        if (this.config.menu.noLiveTitleIcon.enable)
            cssText += "\n    #chat-msg-list .check-my-title {\n      display: none !important;\n    }";
        if (this.config.menu.noSystemMsg.enable)
            cssText += "\n    #chat-msg-list .system-msg, #chat-msg-list .announcement-container {\n      display: none !important;\n    }";
        if (this.config.menu.noGiftMsg.enable)
            cssText += "\n    #chat-msg-list .gift-msg, #chat-list-ctnr > .super-gift-ctnr, #chat-list-ctnr > #gift-msg-1000 {\n      display: none !important;\n    }\n    #chat-list-ctnr > #chat-msg-list {\n      height: 100% !important;\n    }";
        if (this.config.menu.fixTreasure.enable)
            cssText += "\n    #player-container > .treasure-box-ctnr {\n      margin: -160px 0 !important;\n    }";
        elmStyle.innerHTML = cssText;
    };
    /**
     * 添加按钮
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.AddUI = function () {
        var _this = this;
        // 添加按钮相关的css
        this.AddCSS();
        // 获取按钮插入的位置
        var elmDivBtns = this.D.querySelector('.btns');
        // 传说中的UI, 真的很丑
        var elmDivGun = this.D.createElement('div');
        elmDivGun.id = 'gunBut';
        var html = '滚<div id="gunMenu" class="gunHide">';
        // 循环插入内容
        for (var x in this.config.menu) {
            html += "\n      <div>\n        <input type=\"checkbox\" id=\"" + x + "\" class=\"gunHide\" />\n      \t<label for=\"" + x + "\"></label>\n        <span>" + this.config.menu[x].name + "</span>\n      </div>";
        }
        html += '</div>';
        elmDivGun.innerHTML = html;
        // 插入菜单按钮
        elmDivBtns.appendChild(elmDivGun);
        // 获取刚刚插入的DOM
        var elmDivMenu = this.D.querySelector('#gunMenu');
        // 为了和b站更搭, 所以监听body的click
        this.D.body.addEventListener('click', function (ev) {
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
        var replaceDanmakuCheckbox = this.D.querySelector('#replaceDanmaku');
        var closeDanmakuCheckbox = this.D.querySelector('#closeDanmaku');
        var popularWordsCheckbox = this.D.querySelector('#popularWords');
        var beatStormCheckbox = this.D.querySelector('#beatStorm');
        for (var x in this.config.menu) {
            var checkbox = this.D.getElementById(x);
            checkbox.checked = this.config.menu[x].enable;
            checkbox.addEventListener('change', function (ev) {
                var evt = ev.target;
                _this.config.menu[evt.id].enable = evt.checked;
                localStorage.setItem('blnvConfig', JSON.stringify(_this.config));
                switch (evt.id) {
                    case 'replaceDanmaku':
                        _this.ReplaceDanmaku(evt.checked);
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
                        _this.CM.clear();
                        if (evt.checked && !replaceDanmakuCheckbox.checked)
                            replaceDanmakuCheckbox.click();
                        break;
                    case 'popularWords':
                        _this.PopularWords(evt.checked);
                        if (evt.checked && !replaceDanmakuCheckbox.checked)
                            replaceDanmakuCheckbox.click();
                        break;
                    case 'beatStorm':
                        _this.BeatStorm(evt.checked);
                        if (evt.checked && !replaceDanmakuCheckbox.checked)
                            replaceDanmakuCheckbox.click();
                        break;
                    default:
                        _this.ChangeCSS();
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
    BiLiveNoVIP.prototype.AddDanmaku = function () {
        var _this = this;
        // 获取播放器节点
        this.playerObject = this.D.querySelector('#player_object');
        // 创建弹幕层
        var danmaku = this.D.createElement('div');
        danmaku.className = 'gunDanmaku';
        var danmakuContainer = this.D.createElement('div');
        danmakuContainer.className = 'gunDanmakuContainer';
        // 插入弹幕层
        danmaku.appendChild(danmakuContainer);
        this.playerObject.parentNode.appendChild(danmaku);
        this.CM = new CommentManager(danmakuContainer);
        // CommentCoreLibrary (//github.com/jabbany/CommentCoreLibrary) - Licensed under the MIT license
        this.CM.init();
        // 透明度
        this.CM.options.scroll.opacity = parseInt(localStorage.getItem('danmuAlpha') || '100') / 100;
        // 存在时间7s
        this.CM.options.scroll.scale = 1.75;
        // 弹幕密度
        this.CM.options.limit = parseDensity(localStorage.getItem('danmuDensity') || '30');
        // 监听视频窗口大小
        var bodyObserver = new MutationObserver(function () {
            _this.CM.width = danmaku.clientWidth;
            _this.CM.height = danmaku.clientHeight;
        });
        bodyObserver.observe(this.D.body, { attributes: true, attributeFilter: ['class'] });
        this.W.addEventListener('resize', function () {
            _this.CM.width = danmaku.clientWidth;
            _this.CM.height = danmaku.clientHeight;
        });
        // 控制条
        this.D.querySelector('#danmu-alpha-ctrl').addEventListener('input', function (ev) {
            _this.CM.options.scroll.opacity = parseInt(ev.target.value) / 100;
        });
        this.D.querySelector('#danmu-density-ctrl').addEventListener('input', function (ev) {
            _this.CM.options.limit = parseDensity(ev.target.value);
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
    BiLiveNoVIP.prototype.ReplaceDanmaku = function (enable) {
        var _this = this;
        if (enable) {
            this.CM.start();
            // 替换弹幕
            this.playerObject.showComments(false);
            var masterID_1 = this.W.MASTERID;
            // 获取聊天信息
            this.DANMU_MSG = this.W.protocol.DANMU_MSG;
            this.W.protocol.DANMU_MSG = function (json) {
                // 屏蔽关键词
                if (_this.tempWord.indexOf(json.info[1]) !== -1)
                    return;
                if (!_this.config.menu.closeDanmaku.enable) {
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
                    _this.CM.send(danmu);
                }
                // 添加到聊天列表
                _this.DANMU_MSG(json);
            };
        }
        else {
            this.W.protocol.DANMU_MSG = this.DANMU_MSG;
            this.W.msg_history = { get: function () { } };
            this.CM.stop();
            this.CM.clear();
            this.playerObject.showComments(true);
        }
    };
    /**
     * 屏蔽热词
     *
     * @private
     * @param {boolean} disable
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.PopularWords = function (disable) {
        this.tempWord = (disable) ? this.W.flash_popularWords() : [];
    };
    /**
     * 屏蔽节奏风暴
     *
     * @private
     * @param {boolean} disable
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.BeatStorm = function (disable) {
        var _this = this;
        if (disable) {
            this.sendBeatStorm = this.W.sendBeatStorm;
            this.W.sendBeatStorm = function (json) {
                _this.tempWord.push(json.content);
            };
        }
        else
            this.W.sendBeatStorm = this.sendBeatStorm;
    };
    /**
     * 添加样式
     *
     * @private
     * @memberOf BiLiveNoVIP
     */
    BiLiveNoVIP.prototype.AddCSS = function () {
        var cssText = "\n    .gunHide {\n      display: none;\n    }\n    #gunBut {\n      border: 1px solid #999;\n      border-radius: 50%;\n      cursor: pointer;\n      display: inline-block;\n      font-size: 13px;\n      height: 18px;\n      margin: -3px 5px;\n      text-align: center;\n      width: 18px;\n      vertical-align: text-top;\n    }\n    #gunBut > #gunMenu {\n      animation:move-in-right cubic-bezier(.22,.58,.12,.98) .4s;\n      background-color: #fff;\n      border-radius: 5px;\n      box-shadow: 0 0 2em .1em rgba(0,0,0,0.15);\n      cursor: default;\n      font-size: 12px;\n      height: 250px;\n      margin: -250px -125px;\n      padding: 10px;\n      position: absolute;\n      width: 100px;\n    }\n    #gunBut > #gunMenu > div {\n    \tbackground: darkgray;\n    \tborder-radius: 5px;\n    \theight: 10px;\n    \tmargin: 0 0 12px 0;\n    \tposition: relative;\n    \twidth: 20px;\n    }\n    #gunBut > #gunMenu > div > label {\n    \tbackground: dimgray;\n    \tborder-radius: 50%;\n    \tcursor: pointer;\n    \tdisplay: block;\n    \theight: 16px;\n    \tleft: -3px;\n    \tposition: absolute;\n    \ttop: -3px;\n    \ttransition: all .5s ease;\n    \twidth: 16px;\n    }\n    #gunBut > #gunMenu > div > input[type=checkbox]:checked + label {\n      background: #4fc1e9;\n    \tleft: 7px;\n    }\n    #gunBut > #gunMenu > div > span {\n      left: 0;\n      margin: -3px 0 0 20px;\n      position: absolute;\n      width: 80px;\n    }\n    .gunDanmaku {\n      position:absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 93%;\n      overflow: hidden;\n      z-index: 1;\n      cursor: pointer;\n      pointer-events: none;\n    }\n    .gunDanmaku .gunDanmakuContainer {\n      transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);\n      position: absolute;\n      display: block;\n      overflow: hidden;\n      margin: 0;\n      border: 0;\n      top: 0;\n      left: 0;\n      bottom: 0;\n      right: 0;\n      z-index: 9999;\n      touch-callout: none;\n      user-select: none;\n    }\n    .gunDanmaku .gunDanmakuContainer .cmt {\n      transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);\n      transform-origin: 0% 0%;\n      position: absolute;\n      padding: 3px 0 0 0;\n      margin: 0;\n      color: #fff;\n      font-family: \"Microsoft YaHei\", SimHei;\n      font-size: 25px;\n      text-decoration: none;\n      text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;\n      text-size-adjust: none;\n      line-height: 100%;\n      letter-spacing: 0;\n      word-break: keep-all;\n      white-space: pre;\n    }\n    .gunDanmaku .gunDanmakuContainer .cmt.noshadow {\n      text-shadow: none;\n    }\n    .gunDanmaku .gunDanmakuContainer .cmt.rshadow {\n      text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;\n    }";
        // 插入css
        var elmStyle = this.D.createElement('style');
        elmStyle.innerHTML = cssText;
        this.D.body.appendChild(elmStyle);
    };
    return BiLiveNoVIP;
}());
var gun = new BiLiveNoVIP();
gun.Start();
