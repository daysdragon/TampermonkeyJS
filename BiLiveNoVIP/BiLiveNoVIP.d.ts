interface Window {
  flash_popularWords(): string[]
  player_fullwin(full: boolean): void
  protocol: Protocol
  ROOMID: number
  MASTERID: number
}
interface Protocol {
  DANMU_MSG(danmu: danmuObject): void
  SPECIAL_GIFT(beat: SPECIAL_GIFT): void
}
// CommentCoreLibrary
declare class CommentManager {
  constructor(HTMLElement: HTMLElement)
  width: number
  height: number
  options: CCLOptions
  init(): void
  start(): void
  clear(): void
  stop(): void
  send(CommentObject: CommentObject): void
}
interface CommentObject {
  mode: number
  text: string
  shadow?: boolean
  color?: number
  size?: number
}
interface CCLOptions {
  global: {
    scale: number
    opacity: number
    className: string
  }
  scroll: {
    scale: number
    opacity: number
  }
  limit: number
}
// player_object
interface playerObject extends HTMLElement {
  showComments(show: boolean): boolean
  wrappedJSObject: playerObject
}
// 设置信息
interface config {
  version: number
  menu: configMenu
}
interface configMenu {
  [index: string]: configMenuData
  noKanBanMusume: configMenuData
  noGuardIcon: configMenuData
  noHDIcon: configMenuData
  noVIPIcon: configMenuData
  noMedalIcon: configMenuData
  noUserLevelIcon: configMenuData
  noLiveTitleIcon: configMenuData
  noSystemMsg: configMenuData
  noGiftMsg: configMenuData
  // fixTreasure: configMenuData
  // replaceDanmaku: configMenuData
  // popularWords: configMenuData
  // beatStorm: configMenuData
  // closeDanmaku: configMenuData
}
interface configMenuData {
  name: string
  enable: boolean
}
// 弹幕格式
interface danmuObject {
  text: string
  info: [
    any[],
    string,
    [
      number,
      string,
      number
    ]
  ]
  cmd: string
  color: number
}
// 特殊礼物消息
interface SPECIAL_GIFT {
  cmd: string
  data: SPECIAL_GIFT_Data
  roomid: number
}
interface SPECIAL_GIFT_Data {
  '39': SPECIAL_GIFT_Data_BeatStorm
}
interface SPECIAL_GIFT_Data_BeatStorm {
  id: string
  num: number
  time: number
  content: string
  hadJoin: number
  action: string
}
interface playerType {
  type: string
}
// 监听聊天窗口
// let chatObserver = new MutationObserver((res) => {
//   for (let y of res) {
//     let chatNodes = y.addedNodes
//     if (chatNodes.length !== 0) {
//       let chatMsg = <HTMLElement>chatNodes[0].firstChild
//       if (chatMsg.className === 'chat-msg') {
//         let danmuColor = 16777215
//         if (chatMsg.querySelector('.master') !== null) {
//           danmuColor = 6737151
//         }
//         else if (chatMsg.querySelector('.admin') !== null) {
//           danmuColor = 16750592
//         }
//         let chatText = (<HTMLElement>chatMsg.lastChild).innerText
//         let danmu = {
//           mode: 1,
//           text: chatText,
//           size: 0.25 * localStorage.getItem('danmuSize'),
//           color: danmuColor,
//           shadow: true
//         }
//         CM.send(danmu)
//       }
//     }
//   }
// })