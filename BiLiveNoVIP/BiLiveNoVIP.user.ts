// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     2.0.27
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
class BiLiveNoVIP {
  constructor() {
    // 加载设置
    let config = <config>JSON.parse(GM_getValue('blnvConfig') || '{}')
    let defaultConfig = this._defaultConfig
    if (config.version === undefined || config.version < defaultConfig.version) {
      for (let x in defaultConfig.menu) {
        try {
          defaultConfig.menu[x].enable = config.menu[x].enable
        }
        catch (error) {
          console.error(error)
        }
      }
      this._config = defaultConfig
    }
    else {
      this._config = config
    }
  }
  private _D = document
  private _config: config
  private _defaultConfig: config = {
    version: 1498307392622,
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
  }
  /**
   * 开始
   * 
   * @memberOf BiLiveNoVIP
   */
  public Start() {
    this._AddUI()
    this._ChangeCSS()
    this._ChangeRankList()
  }
  /**
   * 模拟实时屏蔽
   * 
   * @private
   * @memberOf BiLiveNoVIP
   */
  private _ChangeCSS() {
    // 获取或者插入style
    let elmStyle = <HTMLStyleElement>this._D.querySelector('#gunCSS')
    if (elmStyle === null) {
      elmStyle = this._D.createElement('style')
      elmStyle.id = 'gunCSS'
      this._D.body.appendChild(elmStyle)
    }
    //css内容
    let cssText = ''
    if (this._config.menu.noKanBanMusume.enable) cssText += `
    .live-haruna-ctnr {
      display: none !important;
    }`
    if (this._config.menu.noGuardIcon.enable) cssText += `
    .guard-rank, #chat-msg-list .guard-icon-small, #chat-msg-list .guard-sys, .guard-buy-sys, #chat-msg-list .guard-msg:after, .guard-lv1:before, .guard-lv2:before {
      display: none !important;
    }
    .has-guard-rank {
      max-height: 100px !important;
      min-height: 100px !important;
    }
    #chat-msg-list .guard-msg {
      margin: auto !important;
      padding: 4px 5px !important;
    }
    #chat-msg-list .user-name.color {
      color: #4fc1e9 !important;
    }
    #chat-msg-list .msg-content {
      color: #646c7a !important;
    }`
    if (this._config.menu.noHDIcon.enable) cssText += `
    #chat-msg-list a[href^="/hd/"], #santa-hint-ctnr {
      display: none !important;
    }`
    if (this._config.menu.noVIPIcon.enable) cssText += `
    #chat-msg-list .vip-icon, #chat-msg-list .system-msg:not(.guard-sys) .v-middle {
      display: none !important;
    }
    #chat-msg-list .system-msg {
      padding:0 5px;
    }`
    if (this._config.menu.noMedalIcon.enable) cssText += `
    #chat-msg-list .fans-medal-item {
      display: none !important;
    }`
    if (this._config.menu.noUserLevelIcon.enable) cssText += `
    #chat-msg-list .user-level-icon {
      display: none !important;
    }`
    if (this._config.menu.noLiveTitleIcon.enable) cssText += `
    #chat-msg-list .check-my-title {
      display: none !important;
    }`
    if (this._config.menu.noSystemMsg.enable) cssText += `
    #chat-msg-list .announcement-container, .bilibili-live-player-video-gift {
      display: none !important;
    }`
    if (this._config.menu.noGiftMsg.enable) cssText += `
    #chat-msg-list .gift-msg, #chat-list-ctnr > .super-gift-ctnr, #chat-list-ctnr > #gift-msg-1000, #super-gift-ctnr-haruna, .bilibili-live-player-danmaku-gift {
      display: none !important;
    }
    #chat-list-ctnr > #chat-msg-list {
      height: 100% !important;
    }`
    if (this._config.menu.fixTreasure.enable) cssText += `
    #player-container > .treasure-box-ctnr {
      margin: -160px 0 !important;
    }`
    elmStyle.innerHTML = cssText
  }
  /**
   * 改良排行榜
   * 
   * @private
   * @memberof BiLiveNoVIP
   */
  private _ChangeRankList() {
    if (this._config.menu.noGuardIcon.enable) {
      let elmRankList = <HTMLUListElement>this._D.querySelector('.rank-list-tab')
      if (elmRankList != null) {
        let rankObserver = new MutationObserver(() => {
          // .tab-switcher[data-type="guard"], 
          let elmTabSwitchers = <NodeListOf<HTMLLIElement>>elmRankList.querySelectorAll('.tab-switcher')
          if (elmTabSwitchers.length !== 0) {
            for (let i = 0; i < elmTabSwitchers.length; i++) {
              let elmTabSwitcher = elmTabSwitchers[i]
              if (elmTabSwitcher.innerText === '七日榜') {
                elmTabSwitcher.click()
              }
              else if (elmTabSwitcher.innerText === '舰队') {
                elmTabSwitcher.remove()
              }
            }
            rankObserver.disconnect()
          }
        })
        rankObserver.observe(elmRankList, { childList: true, attributes: true })
      }
    }
    let bodyObserver = new MutationObserver(() => {
      let elmDivRand = <HTMLDivElement>this._D.querySelector('#rank-list-ctnr')
      let elmDivChat = <HTMLDivElement>this._D.querySelector('#chat-list-ctnr')
      if (this._D.body.classList.contains('player-full-win')) {
        elmDivRand.style.cssText = 'display: none'
        elmDivChat.style.cssText = 'height: calc(100% - 150px)'
      }
      else {
        elmDivRand.style.cssText = ''
        elmDivChat.style.cssText = ''
      }
    })
    bodyObserver.observe(this._D.body, { attributes: true, attributeFilter: ['class'] })
  }
  /**
   * 添加按钮
   * 
   * @private
   * @memberOf BiLiveNoVIP
   */
  private _AddUI() {
    // 添加按钮相关的css
    this._AddCSS()
    // 获取按钮插入的位置
    let elmDivBtns = this._D.querySelector('.btns')
    // 传说中的UI, 真的很丑
    let elmDivGun = this._D.createElement('div')
    elmDivGun.id = 'gunBut'
    let html = '滚<div id="gunMenu" class="gunHide">'
    // 循环插入内容
    for (let x in this._config.menu) {
      html += `
      <div>
        <input type="checkbox" id="${x}" class="gunHide" />
      	<label for="${x}"></label>
        <span>${this._config.menu[x].name}</span>
      </div>`
    }
    html += '</div>'
    elmDivGun.innerHTML = html
    // 插入菜单按钮
    if (elmDivBtns != null) elmDivBtns.appendChild(elmDivGun)
    // 获取刚刚插入的DOM
    let elmDivMenu = this._D.querySelector('#gunMenu')
    // 为了和b站更搭, 所以监听body的click
    this._D.body.addEventListener('click', (ev) => {
      let evt = <HTMLElement>ev.target
      if (elmDivGun.contains(evt)) {
        if (elmDivMenu != null && elmDivGun === evt) elmDivMenu.classList.toggle('gunHide')
      }
      else {
        if (elmDivMenu != null) elmDivMenu.classList.add('gunHide')
      }
    })
    // 循环设置监听插入的DOM
    for (let x in this._config.menu) {
      let checkbox = <HTMLInputElement>this._D.getElementById(x)
      checkbox.checked = this._config.menu[x].enable
      checkbox.addEventListener('change', (ev) => {
        let evt = <HTMLInputElement>ev.target
        this._config.menu[evt.id].enable = evt.checked
        GM_setValue('blnvConfig', JSON.stringify(this._config))
        this._ChangeCSS()
      })
    }
  }
  /**
   * 添加样式
   * 
   * @private
   * @memberOf BiLiveNoVIP
   */
  private _AddCSS() {
    let cssText = `
    #chat-ctrl-panel .chat-ctrl-btns .btn {
      margin: 0 3px;
    }
    .gunHide {
      display: none;
    }
    #gunBut {
      border: 1px solid #999;
      border-radius: 50%;
      cursor: pointer;
      display: inline-block;
      font-size: 13px;
      height: 18px;
      margin: -3px 3px;
      text-align: center;
      width: 18px;
      vertical-align: text-top;
    }
    #gunBut > #gunMenu {
      animation:move-in-right cubic-bezier(.22,.58,.12,.98) .4s;
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 0 2em .1em rgba(0,0,0,0.15);
      cursor: default;
      font-size: 12px;
      height: 210px;
      margin: -250px -125px;
      padding: 10px;
      position: absolute;
      width: 100px;
      z-index: 101;
    }
    #gunBut > #gunMenu > div {
    	background: darkgray;
    	border-radius: 5px;
    	height: 10px;
    	margin: 0 0 12px 0;
    	position: relative;
    	width: 20px;
    }
    #gunBut > #gunMenu > div > label {
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
    #gunBut > #gunMenu > div > input[type=checkbox]:checked + label {
      background: #4fc1e9;
    	left: 7px;
    }
    #gunBut > #gunMenu > div > span {
      left: 0;
      margin: -3px 0 0 20px;
      position: absolute;
      width: 80px;
    }`
    // 插入css
    let elmStyle = this._D.createElement('style')
    elmStyle.innerHTML = cssText
    this._D.body.appendChild(elmStyle)
  }
}
const gun = new BiLiveNoVIP()
gun.Start()