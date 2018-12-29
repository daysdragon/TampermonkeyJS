// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     3.0.12
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.bilibili\.com\/(?:blanc\/)?\d/
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-end
// ==/UserScript==
/// <reference path="BiLiveNoVIP.d.ts" />
import { GM_addStyle, GM_getValue, GM_setValue } from '../@types/tm_f'

// 加载设置
const defaultConfig: config = {
  version: 1540298642287,
  menu: {
    noKanBanMusume: {
      name: '看\u00a0\u00a0板\u00a0\u00a0娘',
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
    },
    noBBChat: {
      name: '刷屏聊天',
      enable: false
    },
    noBBDanmaku: {
      name: '刷屏弹幕',
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
// css
const elmStyleCSS = GM_addStyle('')
// noBB
let noBBChat = false
let noBBDanmaku = false
// 添加相关css
AddCSS()
// 刷屏聊天信息
const chatMessage = new Map<string, number>()
const chatObserver = new MutationObserver(mutations => {
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
const danmakuObserver = new MutationObserver(mutations => {
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
ChangeCSS()
// 监听相关DOM
const elmDivAside = <HTMLDivElement>document.querySelector('.aside-area')
if (elmDivAside !== null) {
  let done = false
  const asideObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(addedNode => {
        if (!done && addedNode instanceof HTMLLIElement && addedNode.parentElement !== null && addedNode.parentElement.className === 'tab-list') {
          asideObserver.disconnect()
          done = true;
          (<HTMLLIElement>addedNode.parentElement.firstElementChild).click()
          AddUI()
        }
      })
    })
  })
  asideObserver.observe(elmDivAside, { childList: true, subtree: true })
}
/**
 * 启用聊天过滤
 *
 */
function enableNOBBChat() {
  if (noBBChat) return
  const elmDivChatList = document.querySelector('#chat-history-list')
  if (elmDivChatList !== null) {
    noBBChat = true
    chatObserver.observe(elmDivChatList, { childList: true })
  }
}
/**
 * 停用聊天过滤
 *
 */
function disableNOBBChat() {
  if (!noBBChat) return
  noBBChat = false
  chatObserver.disconnect()
}
/**
 * 启用弹幕过滤
 *
 */
function enableNOBBDanmaku() {
  if (noBBDanmaku) return
  const elmDivDanmaku = document.querySelector('.bilibili-live-player-video-danmaku')
  if (elmDivDanmaku !== null) {
    noBBDanmaku = true
    danmakuObserver.observe(elmDivDanmaku, { childList: true, subtree: true })
  }
}
/**
 * 停用弹幕过滤
 *
 */
function disableNOBBDanmaku() {
  if (!noBBDanmaku) return
  noBBDanmaku = false
  danmakuObserver.disconnect()
}
/**
 * 覆盖原有css
 * 
 */
function ChangeCSS() {
  //css内容
  let cssText = ''
  if (config.menu.noKanBanMusume.enable) cssText += `
.haruna-sekai-de-ichiban-kawaii {
  display: none !important;
}`
  if (config.menu.noGuardIcon.enable) cssText += `
.chat-history-list .guard-buy,
.chat-history-list .guard-icon,
.chat-history-list .welcome-guard,
.chat-history-list .danmaku-item.guard-level-1:after,
.chat-history-list .danmaku-item.guard-level-2:after,
.chat-history-list .danmaku-item.guard-level-1:before,
.chat-history-list .danmaku-item.guard-level-2:before {
  display: none !important;
}
.chat-history-list .danmaku-item.guard-danmaku .vip-icon {
  margin-right: 5px !important;
}
.chat-history-list .danmaku-item.guard-danmaku .admin-icon,
.chat-history-list .danmaku-item.guard-danmaku .title-label,
.chat-history-list .danmaku-item.guard-danmaku .anchor-icon,
.chat-history-list .danmaku-item.guard-danmaku .user-level-icon,
.chat-history-list .danmaku-item.guard-danmaku .fans-medal-item-ctnr {
  margin-right: 5px !important;
}
.chat-history-list .danmaku-item.guard-level-1,
.chat-history-list .danmaku-item.guard-level-2 {
  padding: 4px 5px !important;
  margin: 0 !important;
}
.chat-history-list .danmaku-item.guard-danmaku .user-name {
  color: #23ade5 !important;
}
.chat-history-list .danmaku-item.guard-danmaku .danmaku-content {
  color: #646c7a !important;
}`
  if (config.menu.noHDIcon.enable) cssText += `
.chat-history-list a[href^="/hd/"],
.monster-wrapper,
#santa-hint-ctnr {
  display: none !important;
}
.chat-history-list .chat-item.danmaku-item .user-name {
  color: #23ade5 !important;
}`
  if (config.menu.noVIPIcon.enable) cssText += `
#activity-welcome-area-vm,
.chat-history-list .vip-icon,
.chat-history-list .welcome-msg {
  display: none !important;
}`
  if (config.menu.noMedalIcon.enable) cssText += `
.chat-history-list .fans-medal-item-ctnr {
  display: none !important;
}`
  if (config.menu.noUserLevelIcon.enable) cssText += `
.chat-history-list .user-level-icon {
  display: none !important;
}`
  if (config.menu.noLiveTitleIcon.enable) cssText += `
.chat-history-list .title-label {
  display: none !important;
}`
  if (config.menu.noSystemMsg.enable) cssText += `
#pk-vm+div,
.bilibili-live-player-video-gift,
.chat-history-list .system-msg {
  display: none !important;
}`
  if (config.menu.noGiftMsg.enable) cssText += `
#gift-screen-animation-vm,
.chat-history-list .gift-item,
.bilibili-live-player-danmaku-gift,
.chat-history-panel .penury-gift-msg,
.haruna-sekai-de-ichiban-kawaii .super-gift-bubbles {
  display: none !important;
}
.chat-history-list.with-penury-gift {
  height: 100% !important;
}`
  if (config.menu.noBBChat.enable) enableNOBBChat()
  else disableNOBBChat()
  if (config.menu.noBBDanmaku.enable) enableNOBBDanmaku()
  else disableNOBBDanmaku()
  elmStyleCSS.innerHTML = cssText
}
/**
 *添加设置菜单
 *
 */
function AddUI() {
  const elmDivBtns = document.querySelector('.icon-left-part');
  // 传说中的UI, 真的很丑
  const elmDivGun = document.createElement('div')
  const elmDivMenu = document.createElement('div')
  let html = ''
  elmDivGun.id = 'gunBut'
  elmDivMenu.id = 'gunMenu'
  elmDivMenu.className = 'gunHide'
  // 循环插入内容
  for (const x in config.menu) {
    html += `
<div>
  <input type="checkbox" id="${x}" class="gunHide" />
  <label for="${x}">
    <span>${config.menu[x].name}</span>
  </label>
</div>`
  }
  elmDivMenu.innerHTML = html
  // 插入菜单按钮
  elmDivGun.appendChild(elmDivMenu)
  if (elmDivBtns !== null) elmDivBtns.appendChild(elmDivGun)
  // 为了和b站更搭, 所以监听body的click
  document.body.addEventListener('click', ev => {
    const evt = <HTMLElement>ev.target
    if (elmDivGun.contains(evt)) {
      if (elmDivGun === evt) {
        elmDivMenu.classList.toggle('gunHide')
        elmDivGun.classList.toggle('gunActive')
      }
    }
    else {
      elmDivMenu.classList.add('gunHide')
      elmDivGun.classList.remove('gunActive')
    }
  })
  // 循环设置监听插入的DOM
  for (const x in config.menu) {
    const checkbox = <HTMLInputElement>document.getElementById(x)
    checkbox.checked = config.menu[x].enable
    checkbox.addEventListener('change', (ev) => {
      const evt = <HTMLInputElement>ev.target
      config.menu[evt.id].enable = evt.checked
      GM_setValue('blnvConfig', JSON.stringify(config))
      ChangeCSS()
    })
  }
}
/**
 * 添加菜单所需css
 * 
 */
function AddCSS() {
  GM_addStyle(`
.gunHide {
  display: none;
}
#gunBut {
  border: 2px solid #c8c8c8;
  border-radius: 50%;
  color: #c8c8c8;
  cursor: default;
  display: inline-block;
  height: 17px;
  line-height: 15px;
  margin: 0 5px;
  text-align: center;
  width: 17px;
}
#gunBut.gunActive,
#gunBut:hover {
  border-color: #23ade5;
  color: #23ade5;
}
#gunBut:after {
  content: '滚';
  font-size: 13px;
  vertical-align: middle;
}
#gunBut #gunMenu {
  animation: gunMenu .4s;
  background-color: #fff;
  border: 1px solid #e9eaec;
  border-radius: 8px;
  box-shadow: 0 6px 12px 0 rgba(106,115,133,.22);
  font-size: 12px;
  height: 234px;
  left: 0px;
  padding: 10px;
  position: absolute;
  text-align: center;
  top: -264px;
  transform-origin: 100px bottom 0px;
  width: 90px;
  z-index: 2147483647;
}
#gunBut #gunMenu:before {
  background: #fff;
  content: "";
  height: 10px;
  left: 86px;
  position: absolute;
  top: 204px;
  transform: skew(30deg,30deg);
  width: 15px;
}
#gunBut #gunMenu > div {
	height: 22px;
	position: relative;
}
#gunBut #gunMenu > div > label:after {
	background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 3px 0 rgba(105,115,133,.2);
  content: "";
	cursor: pointer;
	display: block;
	height: 20px;
	left: -8px;
	position: absolute;
	top: -3px;
  transition: all .3s;
  width: 20px;
}
#gunBut #gunMenu > div > label:before {
	background: #e3ebec;
  border-radius: 7px;
  content: "";
  cursor: pointer;
  height: 14px;
  left: 0;
  position: absolute;
  transition: all .3s;
	width: 26px;
}
#gunBut #gunMenu > div > input[type=checkbox]:checked + label:after {
	left: 14px;
}
#gunBut #gunMenu > div > input[type=checkbox]:checked + label:before {
	background: #23ade5;
}
#gunBut > #gunMenu > div > label > span {
  color: #646c7a;
  cursor: pointer;
  left: 40px;
  position: absolute;
  top: 1px;
  user-select: none;
}
@keyframes gunMenu {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/*隐藏网页全屏榜单*/
.player-full-win .rank-list-section {
  display: none !important;
}
.player-full-win .chat-history-panel {
  height: calc(100% - 135px) !important;
}`)
}