// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     3.4.2
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.bilibili\.com\/(?:blanc\/)?\d/
// @require     https://cdn.jsdelivr.net/gh/lzghzr/TampermonkeyJS@ba7671a0d7d7d13253c293724cfea78a8dc1665c/Ajax-hook/Ajax-hook.js
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-start
// ==/UserScript==
class NoVIP {
    constructor() {
        this.noBBChat = false;
        this.noBBDanmaku = false;
    }
    Start() {
        this.elmStyleCSS = GM_addStyle('');
        this.AddCSS();
        const chatMessage = new Map();
        this.chatObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    if (addedNode instanceof HTMLDivElement && addedNode.classList.contains('danmaku-item')) {
                        const chatNode = addedNode.querySelector('.danmaku-content');
                        if (chatNode !== null) {
                            const chatText = chatNode.innerText;
                            const dateNow = Date.now();
                            if (chatMessage.has(chatText) && dateNow - chatMessage.get(chatText) < 5000)
                                addedNode.remove();
                            chatMessage.set(chatText, dateNow);
                        }
                    }
                });
            });
        });
        const danmakuMessage = new Map();
        this.danmakuObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    const danmakuNode = addedNode instanceof Text ? addedNode.parentElement : addedNode;
                    if (danmakuNode.className === 'bilibili-danmaku') {
                        const danmakuText = danmakuNode.innerText;
                        const dateNow = Date.now();
                        if (danmakuMessage.has(danmakuText) && dateNow - danmakuMessage.get(danmakuText) < 5000)
                            danmakuNode.innerText = '';
                        danmakuMessage.set(danmakuText, dateNow);
                    }
                });
            });
        });
        setInterval(() => {
            const dateNow = Date.now();
            chatMessage.forEach((value, key) => {
                if (dateNow - value > 60 * 1000)
                    chatMessage.delete(key);
            });
            danmakuMessage.forEach((value, key) => {
                if (dateNow - value > 60 * 1000)
                    danmakuMessage.delete(key);
            });
        }, 60 * 1000);
        this.ChangeCSS();
        const bodyObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    if (addedNode instanceof HTMLLIElement && addedNode.innerText === '七日榜')
                        addedNode.click();
                    else if (addedNode instanceof HTMLDivElement && addedNode.classList.contains('dialog-ctnr')) {
                        const blockEffectCtnr = addedNode.querySelector('.block-effect-ctnr');
                        if (blockEffectCtnr !== null)
                            this.AddUI(blockEffectCtnr);
                    }
                });
            });
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }
    enableNOBBChat() {
        if (this.noBBChat)
            return;
        const elmDivChatList = document.querySelector('#chat-items');
        if (elmDivChatList !== null) {
            this.noBBChat = true;
            this.chatObserver.observe(elmDivChatList, { childList: true });
        }
    }
    disableNOBBChat() {
        if (!this.noBBChat)
            return;
        this.noBBChat = false;
        this.chatObserver.disconnect();
    }
    enableNOBBDanmaku() {
        if (this.noBBDanmaku)
            return;
        const elmDivDanmaku = document.querySelector('.bilibili-live-player-video-danmaku');
        if (elmDivDanmaku !== null) {
            this.noBBDanmaku = true;
            this.danmakuObserver.observe(elmDivDanmaku, { childList: true, subtree: true });
        }
    }
    disableNOBBDanmaku() {
        if (!this.noBBDanmaku)
            return;
        this.noBBDanmaku = false;
        this.danmakuObserver.disconnect();
    }
    ChangeCSS() {
        let height = 62;
        let cssText = `
.chat-item .user-name {
  color: #23ade5 !important;
}`;
        if (config.menu.noKanBanMusume.enable)
            cssText += `
#my-dear-haruna-vm {
  display: none !important;
}`;
        if (config.menu.noGuardIcon.enable)
            cssText += `
#guard-welcome-area-vm,
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
.chat-item.chat-colorful-bubble {
  display: block !important;
  margin: 0 !important;
  border-radius: 0px !important;
  background-color: rgba(248, 248, 248, 0) !important;
}`;
        if (config.menu.noVIPIcon.enable)
            cssText += `
#activity-welcome-area-vm,
.chat-item .vip-icon,
.chat-item.welcome-msg {
  display: none !important;
}`;
        if (config.menu.noMedalIcon.enable)
            cssText += `
.chat-item .fans-medal-item-ctnr {
  display: none !important;
}`;
        if (config.menu.noUserLevelIcon.enable)
            cssText += `
.chat-item .user-level-icon {
  display: none !important;
}`;
        if (config.menu.noLiveTitleIcon.enable)
            cssText += `
.chat-item .title-label {
  display: none !important;
}`;
        if (config.menu.noSystemMsg.enable) {
            height -= 30;
            cssText += `
.chat-history-list.with-brush-prompt {
  height: 100% !important;
}
#brush-prompt,
.chat-item.important-prompt-item,
.chat-item.misc-msg {
  display: none !important;
}`;
        }
        if (config.menu.noGiftMsg.enable) {
            height -= 32;
            cssText += `
.chat-history-list.with-penury-gift {
  height: 100% !important;
}
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
}`;
        }
        if (config.menu.noRaffle.enable)
            cssText += `
body[style*="overflow: hidden;"] {
  overflow-y: auto !important;
}
.anchor-lottery-entry,
#player-effect-vm,
#chat-draw-area-vm {
  display: none !important;
}`;
        cssText += `
.chat-history-list.with-penury-gift.with-brush-prompt {
  height: calc(100% - ${height}px) !important;
}`;
        if (config.menu.noBBChat.enable)
            this.enableNOBBChat();
        else
            this.disableNOBBChat();
        if (config.menu.noBBDanmaku.enable)
            this.enableNOBBDanmaku();
        else
            this.disableNOBBDanmaku();
        this.elmStyleCSS.innerHTML = cssText;
    }
    AddUI(addedNode) {
        let menuName = '';
        for (const x in config.menu)
            menuName += `\n${config.menu[x].name}`;
        if (addedNode.innerText.includes(menuName))
            return;
        const elmUList = addedNode.firstElementChild;
        const listLength = elmUList.childElementCount;
        const itemHTML = elmUList.firstElementChild.cloneNode(true);
        const itemInput = itemHTML.querySelector('input');
        const itemLabel = itemHTML.querySelector('Label');
        itemInput.id = itemInput.id.replace(/\d/, '');
        itemLabel.htmlFor = itemLabel.htmlFor.replace(/\d/, '');
        const selectedCheckBox = (spanClone) => {
            spanClone.classList.remove('checkbox-default');
            spanClone.classList.add('checkbox-selected');
        };
        const defaultCheckBox = (spanClone) => {
            spanClone.classList.remove('checkbox-selected');
            spanClone.classList.add('checkbox-default');
        };
        let i = listLength;
        for (const x in config.menu) {
            const itemHTMLClone = itemHTML.cloneNode(true);
            const itemSpanClone = itemHTMLClone.querySelector('span');
            const itemInputClone = itemHTMLClone.querySelector('input');
            const itemLabelClone = itemHTMLClone.querySelector('label');
            itemInputClone.id += i;
            itemLabelClone.htmlFor += i;
            i++;
            itemLabelClone.innerText = config.menu[x].name;
            itemInputClone.checked = config.menu[x].enable;
            if (itemInputClone.checked)
                selectedCheckBox(itemSpanClone);
            else
                defaultCheckBox(itemSpanClone);
            itemInputClone.addEventListener('change', ev => {
                const evt = ev.target;
                if (evt.checked)
                    selectedCheckBox(itemSpanClone);
                else
                    defaultCheckBox(itemSpanClone);
                config.menu[x].enable = evt.checked;
                GM_setValue('blnvConfig', JSON.stringify(config));
                this.ChangeCSS();
            });
            elmUList.appendChild(itemHTMLClone);
        }
    }
    AddCSS() {
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
}`);
    }
}
const defaultConfig = {
    version: 1596879572820,
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
        },
        noRoundPlay: {
            name: '屏蔽视频轮播',
            enable: false
        },
        invisible: {
            name: '隐身入场',
            enable: false
        }
    }
};
const userConfig = JSON.parse(GM_getValue('blnvConfig', JSON.stringify(defaultConfig)));
let config;
if (userConfig.version === undefined || userConfig.version < defaultConfig.version) {
    for (const x in defaultConfig.menu) {
        try {
            defaultConfig.menu[x].enable = userConfig.menu[x].enable;
        }
        catch (error) {
            console.error(error);
        }
    }
    config = defaultConfig;
}
else
    config = userConfig;
(async () => {
    if (config.menu.invisible.enable || config.menu.noRoundPlay.enable) {
        if (config.menu.noRoundPlay.enable)
            Reflect.defineProperty(unsafeWindow, '__NEPTUNE_IS_MY_WAIFU__', {});
        ah.proxy({
            onRequest: (XHRconfig, handler) => {
                if (config.menu.invisible.enable && XHRconfig.url.includes('//api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser'))
                    XHRconfig.url = '//api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=7';
                handler.next(XHRconfig);
            },
            onResponse: (response, handler) => {
                if (config.menu.invisible.enable && response.config.url.includes('//api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser'))
                    response.response = response.response.replace('"is_room_admin":false', '"is_room_admin":true');
                if (config.menu.noRoundPlay.enable) {
                    if (response.config.url.includes('//api.live.bilibili.com/xlive/web-room/v1/index/getRoomPlayInfo'))
                        response.response = response.response.replace('"live_status":2', '"live_status":0');
                    if (response.config.url.includes('//api.live.bilibili.com/live/getRoundPlayVideo'))
                        response.status = 403;
                }
                handler.next(response);
            }
        });
    }
    if (config.menu.noActivityPlat.enable)
        if (location.pathname.startsWith('/blanc'))
            history.replaceState(null, '', location.href.replace(`${location.origin}/blanc`, location.origin));
        else
            location.href = location.href.replace(location.origin, `${location.origin}/blanc`);
    document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete')
            new NoVIP().Start();
    });
})();