// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     3.2.3
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.bilibili\.com\/(?:blanc\/)?\d/
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-start
// ==/UserScript==
/// <reference path="BiLiveNoVIP.d.ts" />
import { GM_addStyle, GM_getValue, GM_setValue } from '../@types/tm_f'

class NoVIP {
  public noBBChat = false
  public noBBDanmaku = false
  public elmStyleCSS!: HTMLStyleElement
  public chatObserver!: MutationObserver
  public danmakuObserver!: MutationObserver
  public Start() {
    // css
    this.elmStyleCSS = GM_addStyle('')
    // 添加相关css
    this.AddCSS()
    // 刷屏聊天信息
    const chatMessage = new Map<string, number>()
    this.chatObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => {
          if (addedNode instanceof HTMLDivElement && addedNode.classList.contains('danmaku-item')) {
            const chatNode = <HTMLSpanElement>addedNode.querySelector('.danmaku-content')
            if (chatNode !== null) {
              const chatText = chatNode.innerText
              const dateNow = Date.now()
              if (chatMessage.has(chatText) && dateNow - <number>chatMessage.get(chatText) < 5000) addedNode.remove()
              chatMessage.set(chatText, dateNow)
            }
          }
        })
      })
    })
    // 刷屏弹幕
    const danmakuMessage = new Map<string, number>()
    this.danmakuObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => {
          const danmakuNode = addedNode instanceof Text ? <HTMLDivElement>addedNode.parentElement : <HTMLDivElement>addedNode
          if (danmakuNode.className === 'bilibili-danmaku') {
            const danmakuText = danmakuNode.innerText
            const dateNow = Date.now()
            if (danmakuMessage.has(danmakuText) && dateNow - <number>danmakuMessage.get(danmakuText) < 5000) danmakuNode.innerText = ''
            danmakuMessage.set(danmakuText, dateNow)
          }
        })
      })
    })
    // 定时清空, 虽说应该每条分开统计, 但是刷起屏来实在是太快了, 比较消耗资源
    setInterval(() => {
      const dateNow = Date.now()
      chatMessage.forEach((value, key) => {
        if (dateNow - value > 60 * 1000) chatMessage.delete(key)
      })
      danmakuMessage.forEach((value, key) => {
        if (dateNow - value > 60 * 1000) danmakuMessage.delete(key)
      })
    }, 60 * 1000)
    this.ChangeCSS()
    // 监听相关DOM
    let done = 0
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => {
          if (done !== 1 && done !== 3 && addedNode instanceof HTMLLIElement && addedNode.innerText === '七日榜') {
            done += 1
            addedNode.click()
          }
          else if (done !== 2 && done !== 3 && addedNode instanceof HTMLDivElement && addedNode.classList.contains('block-effect-ctnr')) {
            done += 2
            this.AddUI(addedNode)
          }
          if (done === 3) bodyObserver.disconnect()
        })
      })
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })
  }
  /**
   * 启用聊天过滤
   *
   * @memberof NoVIP
   */
  public enableNOBBChat() {
    if (this.noBBChat) return
    const elmDivChatList = document.querySelector('#chat-items')
    if (elmDivChatList !== null) {
      this.noBBChat = true
      this.chatObserver.observe(elmDivChatList, { childList: true })
    }
  }
  /**
   * 停用聊天过滤
   *
   * @memberof NoVIP
   */
  public disableNOBBChat() {
    if (!this.noBBChat) return
    this.noBBChat = false
    this.chatObserver.disconnect()
  }
  /**
   * 启用弹幕过滤
   *
   * @memberof NoVIP
   */
  public enableNOBBDanmaku() {
    if (this.noBBDanmaku) return
    const elmDivDanmaku = document.querySelector('.bilibili-live-player-video-danmaku')
    if (elmDivDanmaku !== null) {
      this.noBBDanmaku = true
      this.danmakuObserver.observe(elmDivDanmaku, { childList: true, subtree: true })
    }
  }
  /**
   * 停用弹幕过滤
   *
   * @memberof NoVIP
   */
  public disableNOBBDanmaku() {
    if (!this.noBBDanmaku) return
    this.noBBDanmaku = false
    this.danmakuObserver.disconnect()
  }
  /**
   * 覆盖原有css
   *
   * @memberof NoVIP
   */
  public ChangeCSS() {
    //css内容
    let cssText = ''
    if (config.menu.noKanBanMusume.enable) cssText += `
  #my-dear-haruna-vm {
    display: none !important;
  }`
    if (config.menu.noGuardIcon.enable) cssText += `
  .chat-item.guard-buy,
  .chat-item.welcome-guard,
  .chat-item .guard-icon,
  .chat-item.guard-level-1:after,
  .chat-item.guard-level-2:after,
  .chat-item.guard-level-1:before,
  .chat-item.guard-level-2:before {
    display: none !important;
  }
  .chat-item.guard-danmaku .vip-icon {
    margin-right: 4px !important;
  }
  .chat-item.guard-danmaku .admin-icon,
  .chat-item.guard-danmaku .anchor-icon,
  .chat-item.guard-danmaku .fans-medal-item-ctnr,
  .chat-item.guard-danmaku .guard-icon,
  .chat-item.guard-danmaku .title-label,
  .chat-item.guard-danmaku .user-level-icon,
  .chat-item.guard-danmaku .user-lpl-logo {
    margin-right: 5px !important;
  }
  .chat-item.guard-level-1,
  .chat-item.guard-level-2 {
    padding: 4px 5px !important;
    margin: 0 !important;
  }
  .chat-item.guard-danmaku .user-name {
    color: #23ade5 !important;
  }`
    if (config.menu.noVIPIcon.enable) cssText += `
  #activity-welcome-area-vm,
  .chat-item .vip-icon,
  .chat-item.welcome-msg {
    display: none !important;
  }`
    if (config.menu.noMedalIcon.enable) cssText += `
  .chat-item .fans-medal-item-ctnr {
    display: none !important;
  }`
    if (config.menu.noUserLevelIcon.enable) cssText += `
  .chat-item .user-level-icon {
    display: none !important;
  }`
    if (config.menu.noLiveTitleIcon.enable) cssText += `
  .chat-item .title-label {
    display: none !important;
  }`
    if (config.menu.noSystemMsg.enable) cssText += `
  .chat-item.misc-msg {
    display: none !important;
  }`
    if (config.menu.noGiftMsg.enable) cssText += `
  #chat-gift-bubble-vm,
  #penury-gift-msg,
  #gift-screen-animation-vm,
  #my-dear-haruna-vm .super-gift-bubbles,
  .chat-item.gift-item,
  .chat-item.system-msg,
  
  .bilibili-live-player-video-operable-container>div:first-child>div:last-child,
  .bilibili-live-player-video-gift,
  .bilibili-live-player-danmaku-gift {
    display: none !important;
  }
  .chat-history-list.with-penury-gift {
    height: 100% !important;
  }`
    if (config.menu.noRaffle.enable) cssText += `
  #player-effect-vm,
  #chat-draw-area-vm {
    display: none !important;
  }`
    if (config.menu.noBBChat.enable) this.enableNOBBChat()
    else this.disableNOBBChat()
    if (config.menu.noBBDanmaku.enable) this.enableNOBBDanmaku()
    else this.disableNOBBDanmaku()
    this.elmStyleCSS.innerHTML = cssText
  }
  /**
   * 添加设置菜单
   *
   * @param {HTMLDivElement} addedNode
   * @memberof NoVIP
   */
  public AddUI(addedNode: HTMLDivElement) {
    const elmUList = <HTMLUListElement>addedNode.firstElementChild
    const listLength = elmUList.childElementCount
    const itemHTML = <HTMLLIElement>(<HTMLLIElement>elmUList.firstElementChild).cloneNode(true)
    const itemInput = <HTMLInputElement>itemHTML.querySelector('input')
    const itemLabel = <HTMLLabelElement>itemHTML.querySelector('Label')
    itemInput.id = itemInput.id.replace(/\d/, '')
    itemLabel.htmlFor = itemLabel.htmlFor.replace(/\d/, '')

    const selectedCheckBox = (spanClone: HTMLSpanElement) => {
      spanClone.classList.remove('checkbox-default')
      spanClone.classList.add('checkbox-selected')
    }
    const defaultCheckBox = (spanClone: HTMLSpanElement) => {
      spanClone.classList.remove('checkbox-selected')
      spanClone.classList.add('checkbox-default')
    }

    // 循环插入内容
    let i = listLength
    for (const x in config.menu) {
      const itemHTMLClone = <HTMLLIElement>itemHTML.cloneNode(true)
      const itemSpanClone = <HTMLSpanElement>itemHTMLClone.querySelector('span')
      const itemInputClone = <HTMLInputElement>itemHTMLClone.querySelector('input')
      const itemLabelClone = <HTMLLabelElement>itemHTMLClone.querySelector('label')
      itemInputClone.id += i
      itemLabelClone.htmlFor += i
      i++
      itemLabelClone.innerText = config.menu[x].name

      itemInputClone.checked = config.menu[x].enable
      if (itemInputClone.checked) selectedCheckBox(itemSpanClone)
      else defaultCheckBox(itemSpanClone)
      itemInputClone.addEventListener('change', (ev) => {
        const evt = <HTMLInputElement>ev.target
        if (evt.checked) selectedCheckBox(itemSpanClone)
        else defaultCheckBox(itemSpanClone)
        config.menu[x].enable = evt.checked
        GM_setValue('blnvConfig', JSON.stringify(config))
        this.ChangeCSS()
      })

      elmUList.appendChild(itemHTMLClone)
    }
  }
  /**
   * 添加菜单所需css
   *
   * @memberof NoVIP
   */
  public AddCSS() {
    GM_addStyle(`
  .gift-block {
    border: 2px solid #c8c8c8;
    border-radius: 50%;
    display: inline-block;
    height: 17px;
    text-align: center;
    width: 17px;
  }
  .gift-block:hover {
    border-color: #23ade5;
  }
  .gift-block:before {
    content: '滚' !important;
    font-size: 13px;
    vertical-align: top;
  }
  /*隐藏网页全屏榜单*/
  .player-full-win .rank-list-section {
    display: none !important;
  }
  .player-full-win .chat-history-panel {
    height: calc(100% - 135px) !important;
  }`)
  }
}

// 加载设置
const defaultConfig: config = {
  version: 1593108024672,
  menu: {
    noKanBanMusume: {
      name: '屏蔽看板娘',
      enable: false
    },
    noGuardIcon: {
      name: '屏蔽舰队标识',
      enable: false
    },
    noVIPIcon: {
      name: '屏蔽老爷标识',
      enable: false
    },
    noMedalIcon: {
      name: '屏蔽粉丝勋章',
      enable: false
    },
    noUserLevelIcon: {
      name: '屏蔽用户等级',
      enable: false
    },
    noLiveTitleIcon: {
      name: '屏蔽成就头衔',
      enable: false
    },
    noSystemMsg: {
      name: '屏蔽系统公告',
      enable: false
    },
    noGiftMsg: {
      name: '屏蔽礼物信息',
      enable: false
    },
    noRaffle: {
      name: '屏蔽抽奖弹窗',
      enable: false
    },
    noBBChat: {
      name: '屏蔽刷屏聊天',
      enable: false
    },
    noBBDanmaku: {
      name: '屏蔽刷屏弹幕',
      enable: false
    },
    noActivityPlat: {
      name: '屏蔽房间皮肤',
      enable: false
    }
  }
}
const userConfig = <config>JSON.parse(GM_getValue('blnvConfig', JSON.stringify(defaultConfig)))
let config: config
if (userConfig.version === undefined || userConfig.version < defaultConfig.version) {
  for (const x in defaultConfig.menu) {
    try {
      defaultConfig.menu[x].enable = userConfig.menu[x].enable
    }
    catch (error) {
      console.error(error)
    }
  }
  config = defaultConfig
}
else config = userConfig

  ; (async () => {
    if (config.menu.noActivityPlat.enable && !document.head.innerHTML.includes('addWaifu')) {
      document.open()
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') new NoVIP().Start()
      })
      const roomPath = location.pathname.match(/\/(\d+)/)
      if (roomPath !== null) {
        const roomID = roomPath[1]
        const room4 = await fetch('/4', { credentials: 'include' }).then(res => res.text().catch(() => undefined)).catch(() => undefined)
        const roomPlayInfo = await fetch(`//api.live.bilibili.com/xlive/web-room/v1/index/getRoomPlayInfo?room_id=${roomID}&play_url=1&mask=1&qn=0&platform=web&ptype=16`, { credentials: 'include' }).then(res => res.text().catch(() => undefined)).catch(() => undefined)
        if (room4 !== undefined && roomPlayInfo !== undefined) {
          document.write(room4.replace(/<script>window\.__NEPTUNE_IS_MY_WAIFU__=.*?<\/script>/, `<script>window.__NEPTUNE_IS_MY_WAIFU__={"roomInitRes":${roomPlayInfo}}</script>`))
          document.close()
        }
      }
    }
    else document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') new NoVIP().Start()
    })
  })()