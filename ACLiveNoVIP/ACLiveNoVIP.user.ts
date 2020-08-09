// ==UserScript==
// @name        acfun直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.acfun\.cn\/live\/\d/
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-start
// ==/UserScript==
import { GM_addStyle, GM_getValue, GM_setValue } from '../@types/tm_f'

class NoVIP {
  public noBBChat = false
  public noBBDanmaku = false
  public elmStyleCSS!: HTMLStyleElement
  public divBlockIcon!: HTMLDivElement
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
          if (addedNode instanceof HTMLDivElement && addedNode.classList.contains('comment')) {
            const chatNode = <HTMLSpanElement>addedNode.querySelector('span:last-child')
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
          if (addedNode instanceof HTMLSpanElement) {
            const danmakuText = addedNode.innerText
            const dateNow = Date.now()
            if (danmakuMessage.has(danmakuText) && dateNow - <number>danmakuMessage.get(danmakuText) < 5000) addedNode.innerText = ''
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
    // 监听相关DOM
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => {
          if (addedNode instanceof HTMLDivElement && addedNode.classList.contains('live-feed')) {
            this.AddUI(addedNode)
            this.ChangeCSS()
            bodyObserver.disconnect()
          }
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
    const elmDivChatList = document.querySelector('.live-feed-messages')
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
    const elmDivDanmaku = document.querySelector('.danmaku-screen')
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
    if (config.menu.noFollowMsg.enable) cssText += `
.live-feed-messages .follow {
  display: none !important;
}`
    if (config.menu.noLikeMsg.enable) cssText += `
.live-feed-messages .like {
display: none !important;
}`
    if (config.menu.noUserEnterMsg.enable) cssText += `
.live-feed-messages .user-enter {
display: none !important;
}`
    if (config.menu.noSystemMsg.enable) cssText += `
.live-feed-messages .sys {
  display: none !important;
}`
    if (config.menu.noGiftMsg.enable) cssText += `
.live-feed .container-live-slot,
.live-feed-messages .gift {
  display: none !important;
}`
    if (config.menu.noBBChat.enable) this.enableNOBBChat()
    else this.disableNOBBChat()
    if (config.menu.noBBDanmaku.enable) this.enableNOBBDanmaku()
    else this.disableNOBBDanmaku()

    if (this.divBlockIcon !== null) {
      let active = false
      for (const x in config.menu)
        if (config.menu[x].enable) {
          active = true
          break
        }
      if (active) this.divBlockIcon.classList.add('block-icon-active')
      else this.divBlockIcon.classList.remove('block-icon-active')
    }

    this.elmStyleCSS.innerHTML = cssText
  }
  /**
   * 添加设置菜单
   *
   * @param {HTMLDivElement} addedNode
   * @memberof NoVIP
   */
  public AddUI(addedNode: HTMLDivElement) {
    this.divBlockIcon = <HTMLDivElement>document.body.querySelector('.block-icon')
    const divBlockItems = <HTMLDivElement>addedNode.querySelector('.block-message-content')
    const listLength = divBlockItems.childElementCount
    const divItemHTML = <HTMLDivElement>(<HTMLDivElement>divBlockItems.firstElementChild).cloneNode(true)

    // 循环插入内容
    let i = listLength
    for (const x in config.menu) {
      const divItemHTMLClone = <HTMLLIElement>divItemHTML.cloneNode(true)
      const divItemsIconClone = <HTMLDivElement>divItemHTMLClone.firstElementChild
      const divItemsTextClone = <HTMLDivElement>divItemHTMLClone.lastElementChild

      divItemsIconClone.setAttribute('data-type', x)
      divItemsTextClone.innerText = config.menu[x].name
      if (config.menu[x].enable)
        divItemsIconClone.classList.add('block-items-icon-checked')

      divItemsIconClone.addEventListener('click', ev => {
        const evt = <HTMLDivElement>ev.target
        evt.classList.toggle('block-items-icon-checked')
        config.menu[x].enable = evt.classList.contains('block-items-icon-checked') ? true : false
        GM_setValue('blnvConfig', JSON.stringify(config))
        this.ChangeCSS()
      })

      divBlockItems.appendChild(divItemHTMLClone)
      i++
    }
    divBlockItems.style.height = `${28 * i + 30}px`
  }
  /**
   * 添加菜单所需css
   *
   * @memberof NoVIP
   */
  public AddCSS() {
    GM_addStyle(`
.block-icon {
  border: 2px solid rgba(153,153,153,0.9);
  border-radius: 50%;
  display: inline-block;
  height: 17px !important;
  text-align: center;
  width: 17px !important;
}
.block-icon:before {
  content: '滚' !important;
  font-size: 12px;
  vertical-align: top;
}
.block-icon-active {
  border-color: rgba(253,76,93,0.9);
}
/*隐藏网页全屏榜单*/
.film-mode .container-live-feed-watching {
  display: none !important;
}
.film-mode .container-live-feed-messages {
  top: 0px !important;
}`)
  }
}

// 加载设置
const defaultConfig: config = {
  version: 1596940481086,
  menu: {
    noFollowMsg: {
      name: '屏蔽关注消息',
      enable: false
    },
    noLikeMsg: {
      name: '屏蔽点赞消息',
      enable: false
    },
    noUserEnterMsg: {
      name: '屏蔽进场消息',
      enable: false
    },
    noSystemMsg: {
      name: '屏蔽系统消息',
      enable: false
    },
    noGiftMsg: {
      name: '屏蔽礼物消息',
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

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'complete') new NoVIP().Start()
})