// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     2.0.19
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
class BiLiveNoVIP {
  constructor() {
    // 加载设置
    let config = <config>JSON.parse(localStorage.getItem('blnvConfig') || '{}')
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
  private _W = window
  private _D = document
  private _DANMU_MSG: (danmu: danmuObject) => void
  private _SPECIAL_GIFT: (beat: SPECIAL_GIFT) => void
  private _playerObject: playerObject
  private _CM: CommentManager
  private _tempWord: string[] = []
  private _config: config
  private _defaultConfig: config = {
    version: 1484236938674,
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
  }
  /**
   * 开始
   * 
   * @memberOf BiLiveNoVIP
   */
  public Start() {
    this._AddUI()
    this._ChangeCSS()
    // flash加载完成后的回调函数
    let flashCallback = this._W['flash_on_ready_callback']
    this._W['flash_on_ready_callback'] = () => {
      flashCallback()
      this._W['flash_on_ready_callback'] = flashCallback
      this._AddDanmaku()
      if (this._config.menu.replaceDanmaku.enable) {
        this._ReplaceDanmaku(true)
        if (this._config.menu.popularWords.enable) this._PopularWords(true)
        if (this._config.menu.beatStorm.enable) this._BeatStorm(true)
      }
      // 排行榜
      if (this._config.menu.noGuardIcon.enable) {
        let elmDivSevenRank = <HTMLDivElement>this._D.querySelector('.tab-switcher[data-type="seven-rank"]')
        elmDivSevenRank.click()
      }
    }
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
    .tab-switcher[data-type="guard"], .guard-rank, #chat-msg-list a[href^="/i/guardBuy"], #chat-msg-list .system-msg.guard-sys, .guard-buy-sys, #chat-msg-list .guard-msg:after, .guard-lv1:before, .guard-lv2:before {
      display: none !important;
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
    #chat-msg-list a[href="/i#to-vip"], #chat-msg-list .system-msg > a[href="/i#to-vip"] ~ span {
      display: none !important;
    }
    #chat-msg-list .system-msg {
      padding:0 10px;
      height:auto;
    }`
    if (this._config.menu.noMedalIcon.enable) cssText += `
    #chat-msg-list .medal-icon {
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
    #chat-msg-list .announcement-container {
      display: none !important;
    }`
    if (this._config.menu.noGiftMsg.enable) cssText += `
    #chat-msg-list .gift-msg, #chat-list-ctnr > .super-gift-ctnr, #chat-list-ctnr > #gift-msg-1000, #super-gift-ctnr-haruna {
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
    elmDivBtns.appendChild(elmDivGun)
    // 获取刚刚插入的DOM
    let elmDivMenu = this._D.querySelector('#gunMenu')
    // 为了和b站更搭, 所以监听body的click
    this._D.body.addEventListener('click', (ev) => {
      let evt = <HTMLElement>ev.target
      if (elmDivGun.contains(evt)) {
        if (evt === elmDivGun) elmDivMenu.classList.toggle('gunHide')
      }
      else {
        elmDivMenu.classList.add('gunHide')
      }
    })
    // 循环设置监听插入的DOM
    let replaceDanmakuCheckbox = <HTMLInputElement>this._D.querySelector('#replaceDanmaku')
    let closeDanmakuCheckbox = <HTMLInputElement>this._D.querySelector('#closeDanmaku')
    let popularWordsCheckbox = <HTMLInputElement>this._D.querySelector('#popularWords')
    let beatStormCheckbox = <HTMLInputElement>this._D.querySelector('#beatStorm')
    for (let x in this._config.menu) {
      let checkbox = <HTMLInputElement>this._D.getElementById(x)
      checkbox.checked = this._config.menu[x].enable
      checkbox.addEventListener('change', (ev) => {
        let evt = <HTMLInputElement>ev.target
        this._config.menu[evt.id].enable = evt.checked
        localStorage.setItem('blnvConfig', JSON.stringify(this._config))
        switch (evt.id) {
          case 'replaceDanmaku':
            this._ReplaceDanmaku(evt.checked)
            if (!evt.checked) {
              // 关闭热词和节奏风暴选项
              if (closeDanmakuCheckbox.checked = true) closeDanmakuCheckbox.click()
              if (popularWordsCheckbox.checked = true) popularWordsCheckbox.click()
              if (beatStormCheckbox.checked = true) beatStormCheckbox.click()
            }
            break
          case 'closeDanmaku':
            this._CM.clear()
            if (evt.checked && !replaceDanmakuCheckbox.checked) replaceDanmakuCheckbox.click()
            break
          case 'popularWords':
            this._PopularWords(evt.checked)
            if (evt.checked && !replaceDanmakuCheckbox.checked) replaceDanmakuCheckbox.click()
            break
          case 'beatStorm':
            this._BeatStorm(evt.checked)
            if (evt.checked && !replaceDanmakuCheckbox.checked) replaceDanmakuCheckbox.click()
            break
          default:
            this._ChangeCSS()
            break
        }
      })
    }
  }
  /**
   * 添加弹幕层
   * 
   * @private
   * @memberOf BiLiveNoVIP
   */
  private _AddDanmaku() {
    // 获取播放器节点
    this._playerObject = <playerObject>this._D.querySelector('#player_object')
    // 创建弹幕层
    let danmaku = this._D.createElement('div')
    danmaku.className = 'gunDanmaku'
    let danmakuContainer = this._D.createElement('div')
    danmakuContainer.className = 'gunDanmakuContainer'
    // 插入弹幕层
    danmaku.appendChild(danmakuContainer)
    this._playerObject.parentNode.appendChild(danmaku)
    this._CM = new CommentManager(danmakuContainer)
    // CommentCoreLibrary (//github.com/jabbany/CommentCoreLibrary) - Licensed under the MIT license
    this._CM.init()
    // 透明度
    this._CM.options.scroll.opacity = parseInt(localStorage.getItem('danmuAlpha') || '100') / 100
    // 存在时间7s
    this._CM.options.scroll.scale = 1.75
    // 弹幕密度
    this._CM.options.limit = parseDensity(localStorage.getItem('danmuDensity') || '30')
    // 监听视频窗口大小
    let bodyObserver = new MutationObserver((ev) => {
      this._CM.width = danmaku.clientWidth
      this._CM.height = danmaku.clientHeight
      // 排行榜
      let evt = ev[0]
      let elmDivRand = <HTMLDivElement>this._D.querySelector('#rank-list-ctnr')
      let elmDivChat = <HTMLDivElement>this._D.querySelector('#chat-list-ctnr')
      if (evt.oldValue && evt.oldValue.indexOf('player-full-win') === -1) {
        elmDivRand.style.cssText = 'display: none'
        elmDivChat.style.cssText = 'height: calc(100% - 150px)'
      }
      else {
        elmDivRand.style.cssText = ''
        elmDivChat.style.cssText = ''
      }
    })
    bodyObserver.observe(this._D.body, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] })
    this._W.addEventListener('resize', () => {
      this._CM.width = danmaku.clientWidth
      this._CM.height = danmaku.clientHeight
    })
    // 控制条
    this._D.querySelector('#danmu-alpha-ctrl').addEventListener('input', (ev) => {
      this._CM.options.scroll.opacity = parseInt((<HTMLInputElement>ev.target).value) / 100
    }
    )
    this._D.querySelector('#danmu-density-ctrl').addEventListener('input', (ev) => {
      this._CM.options.limit = parseDensity((<HTMLInputElement>ev.target).value)
    })
    /**
     * 计算弹幕密度
     * 
     * @param {string} density
     * @returns
     */
    function parseDensity(density: string) {
      let limit: number
      switch (density) {
        case '81':
          limit = 100
          break
        case '82':
          limit = 200
          break
        case '83':
          limit = 300
          break
        case '84':
          limit = 400
          break
        case '85':
          limit = 500
          break
        case '86':
          limit = 0
          break
        default:
          limit = parseInt(density)
          break
      }
      return limit
    }
  }
  /**
   * 替换弹幕
   * 
   * @private
   * @param {boolean} enable
   * @memberOf BiLiveNoVIP
   */
  private _ReplaceDanmaku(enable: boolean) {
    if (enable) {
      this._CM.start()
      // 替换弹幕
      this._playerObject.showComments(false)
      let masterID = this._W.MASTERID
      // 获取聊天信息
      this._DANMU_MSG = this._W.protocol.DANMU_MSG
      this._W.protocol.DANMU_MSG = (json: danmuObject) => {
        // 屏蔽关键词
        if (this._tempWord.indexOf(json.info[1]) !== -1) return
        if (!this._config.menu.closeDanmaku.enable) {
          // 添加弹幕
          let danmuColor = 16777215
          // 主播与管理员特殊颜色
          if (json.info[2][2] === 1) danmuColor = (json.info[2][0] === masterID) ? 6737151 : 16750592
          let danmu = {
            mode: 1,
            text: json.info[1],
            size: 0.25 * parseInt(localStorage.getItem('danmuSize') || '100'),
            color: danmuColor,
            shadow: true
          }
          this._CM.send(danmu)
        }
        // 添加到聊天列表
        this._DANMU_MSG(json)
      }
    }
    else {
      this._W.protocol.DANMU_MSG = this._DANMU_MSG
      this._W.msg_history = { get: () => { } }
      this._CM.stop()
      this._CM.clear()
      this._playerObject.showComments(true)
    }
  }
  /**
   * 屏蔽热词
   * 
   * @private
   * @param {boolean} disable
   * @memberOf BiLiveNoVIP
   */
  private _PopularWords(disable: boolean) {
    this._tempWord = (disable) ? this._W.flash_popularWords() : []
  }
  /**
   * 屏蔽节奏风暴
   * 
   * @private
   * @param {boolean} disable
   * @memberOf BiLiveNoVIP
   */
  private _BeatStorm(disable: boolean) {
    if (disable) {
      this._SPECIAL_GIFT = this._W.protocol.SPECIAL_GIFT
      this._W.protocol.SPECIAL_GIFT = (json: SPECIAL_GIFT) => {
        if (json.data['39'] && json.data['39'].content != null) this._tempWord.push(json.data['39'].content)
      }
    }
    else this._W.protocol.SPECIAL_GIFT = this._SPECIAL_GIFT
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
      height: 300px;
      margin: -300px -125px;
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
    }
    .gunDanmaku {
      position:absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 93%;
      overflow: hidden;
      z-index: 1;
      cursor: pointer;
      pointer-events: none;
    }
    .gunDanmaku .gunDanmakuContainer {
      transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);
      position: absolute;
      display: block;
      overflow: hidden;
      margin: 0;
      border: 0;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      z-index: 9999;
      touch-callout: none;
      user-select: none;
    }
    .gunDanmaku .gunDanmakuContainer .cmt {
      transform: matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);
      transform-origin: 0% 0%;
      position: absolute;
      padding: 3px 0 0 0;
      margin: 0;
      color: #fff;
      font-family: "Microsoft YaHei", SimHei;
      font-size: 25px;
      text-decoration: none;
      text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
      text-size-adjust: none;
      line-height: 100%;
      letter-spacing: 0;
      word-break: keep-all;
      white-space: pre;
    }
    .gunDanmaku .gunDanmakuContainer .cmt.noshadow {
      text-shadow: none;
    }
    .gunDanmaku .gunDanmakuContainer .cmt.rshadow {
      text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;
    }`
    // 插入css
    let elmStyle = this._D.createElement('style')
    elmStyle.innerHTML = cssText
    this._D.body.appendChild(elmStyle)
  }
}
const gun = new BiLiveNoVIP()
gun.Start()