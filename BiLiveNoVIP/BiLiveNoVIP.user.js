// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     3.0.7
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/live\.bilibili\.com\/\d/
// @license     MIT
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-end
// ==/UserScript==
const defaultConfig = {
    version: 1528362160578,
    menu: {
        noKanBanMusume: {
            name: '看&nbsp;&nbsp;板&nbsp;&nbsp;娘',
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
const elmStyleCSS = GM_addStyle('');
AddCSS();
ChangeCSS();
const elmDivAside = document.querySelector('.aside-area');
if (elmDivAside !== null) {
    let done = false;
    const asideObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(addedNode => {
                if (!done && addedNode instanceof HTMLLIElement && addedNode.parentElement !== null && addedNode.parentElement.className === 'tab-list') {
                    asideObserver.disconnect();
                    done = true;
                    addedNode.parentElement.firstElementChild.click();
                    AddUI();
                }
            });
        });
    });
    asideObserver.observe(elmDivAside, { childList: true, subtree: true });
}
const bodyObserver = new MutationObserver(() => {
    const elmDivRand = document.querySelector('#rank-list-vm');
    const elmDivGift = document.querySelector('#gift-control-vm');
    const elmDivPlayer = document.querySelector('.player-section');
    const elmDivChat = document.querySelector('.chat-history-panel');
    if (document.body.classList.contains('player-full-win')) {
        elmDivRand.style.cssText = 'display: none !important';
        elmDivGift.style.cssText = 'display: none !important';
        elmDivPlayer.style.cssText = 'height: 100% !important';
        elmDivChat.style.cssText = 'height: calc(100% - 135px) !important';
    }
    else {
        elmDivRand.style.cssText = '';
        elmDivGift.style.cssText = '';
        elmDivPlayer.style.cssText = '';
        elmDivChat.style.cssText = '';
    }
});
bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
function ChangeCSS() {
    let cssText = '';
    if (config.menu.noKanBanMusume.enable)
        cssText += `
.haruna-sekai-de-ichiban-kawaii {
  display: none !important;
}`;
    if (config.menu.noGuardIcon.enable)
        cssText += `
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
}`;
    if (config.menu.noHDIcon.enable)
        cssText += `
.chat-history-list a[href^="/hd/"],
.monster-wrapper,
#santa-hint-ctnr {
  display: none !important;
}
.chat-history-list .chat-item.danmaku-item .user-name {
  color: #23ade5 !important;
}`;
    if (config.menu.noVIPIcon.enable)
        cssText += `
.chat-history-list .vip-icon,
.chat-history-list .welcome-msg {
  display: none !important;
}`;
    if (config.menu.noMedalIcon.enable)
        cssText += `
.chat-history-list .fans-medal-item-ctnr {
  display: none !important;
}`;
    if (config.menu.noUserLevelIcon.enable)
        cssText += `
.chat-history-list .user-level-icon {
  display: none !important;
}`;
    if (config.menu.noLiveTitleIcon.enable)
        cssText += `
.chat-history-list .title-label {
  display: none !important;
}`;
    if (config.menu.noSystemMsg.enable)
        cssText += `
#pk-vm+div,
.bilibili-live-player-video-gift,
.chat-history-list .system-msg {
  display: none !important;
}`;
    if (config.menu.noGiftMsg.enable)
        cssText += `
.chat-history-list .gift-item,
.bilibili-live-player-danmaku-gift,
.chat-history-panel .penury-gift-msg,
.haruna-sekai-de-ichiban-kawaii .super-gift-bubbles {
  display: none !important;
}
.chat-history-list.with-penury-gift {
  height: 100% !important;
}`;
    elmStyleCSS.innerHTML = cssText;
}
function AddUI() {
    const elmDivBtns = document.querySelector('.icon-left-part');
    const elmDivGun = document.createElement('div');
    const elmDivMenu = document.createElement('div');
    let html = '';
    elmDivGun.id = 'gunBut';
    elmDivMenu.id = 'gunMenu';
    elmDivMenu.className = 'gunHide';
    for (const x in config.menu) {
        html += `
<div>
  <input type="checkbox" id="${x}" class="gunHide" />
  <label for="${x}">
    <span>${config.menu[x].name}</span>
  </label>
</div>`;
    }
    elmDivMenu.innerHTML = html;
    elmDivGun.appendChild(elmDivMenu);
    if (elmDivBtns !== null)
        elmDivBtns.appendChild(elmDivGun);
    document.body.addEventListener('click', ev => {
        const evt = ev.target;
        if (elmDivGun.contains(evt)) {
            if (elmDivGun === evt) {
                elmDivMenu.classList.toggle('gunHide');
                elmDivGun.classList.toggle('gunActive');
            }
        }
        else {
            elmDivMenu.classList.add('gunHide');
            elmDivGun.classList.remove('gunActive');
        }
    });
    for (const x in config.menu) {
        const checkbox = document.getElementById(x);
        checkbox.checked = config.menu[x].enable;
        checkbox.addEventListener('change', (ev) => {
            const evt = ev.target;
            config.menu[evt.id].enable = evt.checked;
            GM_setValue('blnvConfig', JSON.stringify(config));
            ChangeCSS();
        });
    }
}
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
}
#gunBut #gunMenu {
  animation: gunMenu .4s;
  background-color: #fff;
  border: 1px solid #e9eaec;
  border-radius: 8px;
  box-shadow: 0 6px 12px 0 rgba(106,115,133,.22);
  font-size: 12px;
  height: 190px;
  left: 0px;
  padding: 10px;
  position: absolute;
  text-align: center;
  top: -220px;
  transform-origin: 100px bottom 0px;
  width: 90px;
  z-index: 2;
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
}`);
}