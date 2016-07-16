// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     2.0.1
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^http:\/\/live\.bilibili\.com\/\d.*$/
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
/**
 * 屏蔽B站直播间聊天室内容
 *
 * @class BiLiveNoVIP
 */
class BiLiveNoVIP {
    constructor() {
        this.W = window;
        this.D = document;
        this.defaultConfig = {
            noVIPIcon: {
                name: '隐藏VIP',
                enable: false
            },
            noMedalIcon: {
                name: '隐藏勋章',
                enable: false
            },
            noUserLevelIcon: {
                name: '隐藏等级',
                enable: false
            },
            noLiveTitleIcon: {
                name: '隐藏头衔',
                enable: false
            },
            noSystemMsg: {
                name: '隐藏系统消息',
                enable: false
            },
            noGiftMsg: {
                name: '隐藏礼物',
                enable: false
            },
            noSuperGift: {
                name: '隐藏礼物连击',
                enable: false
            },
            noSmallGift: {
                name: '隐藏下方礼物',
                enable: false
            },
            fixTreasure: {
                name: '下移宝箱',
                enable: false
            },
            popularWords: {
                name: '屏蔽热词',
                enable: false
            }
        };
        this.roomID = this.W.ROOMID;
        // 加载设置
        let config = localStorage.getItem('blnvConfig');
        this.config = (config === null) ? this.defaultConfig : JSON.parse(config);
    }
    /**
     * 开始
     */
    Start() {
        this.AddUI();
        this.ChangeCSS();
        if (this.config.popularWords.enable)
            this.PopularWords(true);
    }
    /**
     * 模拟实时屏蔽
     *
     * @private
     */
    ChangeCSS() {
        // 获取或者插入style
        let elmStyle = this.D.querySelector('#gunCSS');
        if (elmStyle === null) {
            elmStyle = this.D.createElement('style');
            elmStyle.id = 'gunCSS';
            this.D.body.appendChild(elmStyle);
        }
        //css内容
        let cssText = '';
        if (this.config.noVIPIcon.enable)
            cssText += '.vip-icon {display: none !important;}';
        if (this.config.noMedalIcon.enable)
            cssText += '.medal-icon {display: none !important;}';
        if (this.config.noUserLevelIcon.enable)
            cssText += '.user-level-icon {display: none !important;}';
        if (this.config.noLiveTitleIcon.enable)
            cssText += '.live-title-icon {display: none !important;}';
        if (this.config.noSystemMsg.enable)
            cssText += '.system-msg {display: none !important;} .announcement-container {display: none !important;}';
        if (this.config.noGiftMsg.enable)
            cssText += '.gift-msg {display: none !important;}';
        if (this.config.noSuperGift.enable)
            cssText += '.super-gift-ctnr {display: none !important;}';
        if (this.config.noSmallGift.enable)
            cssText += '.gift-msg-1000 {display: none !important;} .chat-msg-list {height: 100% !important;}';
        if (this.config.fixTreasure.enable)
            cssText += '.treasure {margin: -160px 0 !important;}';
        elmStyle.innerHTML = cssText;
    }
    /**
     * 添加按钮
     *
     * @private
     */
    AddUI() {
        // 添加按钮相关的css
        this.AddCSS();
        // 获取按钮插入的位置
        let elmDivBtns = this.D.querySelector('.btns');
        // 传说中的UI, 真的很丑
        let elmDivGun = this.D.createElement('div');
        elmDivGun.id = 'gunBut';
        let html = '滚<div id="gunMeun" class="gunHide">';
        // 循环插入内容
        for (let x in this.config) {
            html += `
<div>
  <input type="checkbox" id="${x}" class="gunHide" />
	<label for="${x}"></label>
  <span>${this.config[x].name}</span>
</div>`;
        }
        html += '</div>';
        elmDivGun.innerHTML = html;
        // 插入菜单按钮
        elmDivBtns.appendChild(elmDivGun);
        // 获取刚刚插入的DOM
        let elmDivMeun = this.D.querySelector('#gunMeun');
        // 为了和b站更搭, 所以监听body的click
        this.D.body.addEventListener('click', (ev) => {
            let evt = ev.target;
            if (elmDivGun.contains(evt)) {
                if (evt === elmDivGun) {
                    elmDivMeun.classList.toggle('gunHide');
                }
            }
            else {
                elmDivMeun.classList.add('gunHide');
            }
        });
        // 循环设置监听插入的DOM
        for (let x in this.config) {
            let checkbox = this.D.getElementById(x);
            checkbox.checked = this.config[x].enable;
            checkbox.addEventListener('change', (ev) => {
                let evt = ev.target;
                this.config[evt.id].enable = checkbox.checked;
                localStorage.setItem('blnvConfig', JSON.stringify(this.config));
                if (evt.id === 'popularWords') {
                    this.PopularWords(checkbox.checked);
                }
                else {
                    this.ChangeCSS();
                }
            });
        }
    }
    AddCSS() {
        let cssText = `
.gunHide {
  display: none;
}
#gunBut {
  border: 1px solid #999;
  border-radius: 9px;
  cursor: pointer;
  display: inline-block;
  font-size: 13px;
  height: 18px;
  margin: -3px 5px;
  text-align: center;
  width: 18px;
  vertical-align: text-top;
}
#gunBut #gunMeun {
  animation:gunMeun 300ms;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 0 20px;
  cursor: default;
  font-size: 12px;
  height: 210px;
  margin: -250px -125px;
  padding: 10px;
  position: absolute;
  width: 100px;
}
#gunBut #gunMeun div {
	background: darkgray;
	border-radius: 5px;
	height: 10px;
	margin: 0 0 12px 0;
	position: relative;
	width: 20px;
}
#gunBut #gunMeun div label {
	background: dimgray;
	border-radius: 50%;
	cursor: pointer;
	display: block;
	height: 16px;
	left: -3px;
	position: absolute;
	top: -3px;
	transition: all .5s ease;
	width: 16px;
}
#gunBut #gunMeun div input[type=checkbox]:checked + label {
  background: #4fc1e9;
	left: 7px;
}
#gunBut #gunMeun div span {
  left: 0;
  margin: -3px 0 0 20px;
  position: absolute;
  width: 80px;
}
@keyframes gunMeun {
  from {
    margin: -250px -200px;
    opacity: 0;
  }
  to {
    margin: -250px -125px;
    opacity: 1;
  }
}`;
        // 插入css
        let elmStyle = this.D.createElement('style');
        elmStyle.innerHTML = cssText;
        this.D.body.appendChild(elmStyle);
    }
    /**
     * 屏蔽热词
     *
     * @private
     */
    PopularWords(disable) {
        let player = `/api/player?id=cid:${this.roomID}&ts=${Date.now().toString(16)}`;
        let popularWords = this.W.flash_popularWords();
        this.XHR(player, 'document')
            .then((resolve) => {
            return resolve.querySelector('user_sheid_keyword').innerHTML;
        })
            .then((resolve) => {
            let userKeyword = new Set(resolve.split(','));
            let hotWords = [...popularWords].filter((y) => (disable) ? !userKeyword.has(y) : userKeyword.has(y));
            for (let y of hotWords) {
                let shield = `/liveact/shield_keyword?keyword=${encodeURIComponent(y)}&roomid=${this.roomID}&type=${(disable) ? 1 : 0}`;
                this.XHR(shield, '', 'POST');
            }
        });
    }
    /**
     * 使用Promise封装xhr
     *
     * @private
     * @template T
     * @param {string} url
     * @param {string} [type='']
     * @param {string} [method='GET']
     * @returns {Promise<T>}
     */
    XHR(url, type = '', method = 'GET') {
        return new Promise((resolve, reject) => {
            // 并不需要处理错误
            let timeout = setTimeout(reject, 3e4); //30秒
            let path = url;
            if (type === 'jsonp') {
                // 感觉引入jquery还是太大材小用
                let elmScript = this.D.createElement('script');
                this.D.body.appendChild(elmScript);
                this.W['cb'] = (json) => {
                    clearTimeout(timeout);
                    this.D.body.removeChild(elmScript);
                    this.W['cb'] = undefined;
                    resolve(json);
                };
                elmScript.src = `${path}&callback=cb & _=${Date.now()} `;
            }
            else {
                let postData = '';
                let xhr = new XMLHttpRequest();
                if (method === 'POST') {
                    path = url.split('?')[0];
                    postData = url.split('?')[1];
                }
                xhr.open(method, path, true);
                if (method === 'POST')
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                xhr.responseType = type;
                xhr.onload = (ev) => {
                    clearTimeout(timeout);
                    resolve(ev.target.response);
                };
                xhr.send(postData);
            }
        });
    }
}
const gun = new BiLiveNoVIP();
gun.Start();
