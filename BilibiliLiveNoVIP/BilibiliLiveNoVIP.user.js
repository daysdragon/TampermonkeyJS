// ==UserScript==
// @name        bilibili直播净化
// @description 屏蔽聊天室礼物以及关键字，净化聊天室环境
// @version     1.1.2.4
// @author      lzzr
// @namespace   https://lzzr.me/
// @include     /^http\:\/\/live\.bilibili\.com\/\d.*$/
// @downloadURL https://github.com/lzghzr/GreasemonkeyJS/raw/master/BilibiliLiveNoVIP/BilibiliLiveNoVIP.user.js
// @updateURL   https://github.com/lzghzr/GreasemonkeyJS/raw/master/BilibiliLiveNoVIP/BilibiliLiveNoVIP.meta.js
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @license     Apache Licence 2.0
// @compatible  chrome
// @compatible  firefox
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       unsafeWindow
// @run-at      document-end
// ==/UserScript==

var config = {
    content: '233|666|999|fff|gg|hhh|哈哈哈',
    seed: true,
    document: document,
    unsafeWindow: unsafeWindow,
    contentReg: null,
    lockDiv: null,
    msgDiv: null,
    roomID: null,
    masterID: null,
    UID: null
}
GM_addStyle('\
#chat-msg-list {\
    height: 100% !important;\
}\
.fLeft {\
    float: left;\
}\
.fRight {\
    float: right;\
}\
.gift-msg {\
    display: none !important;\
}\
.gunBlue {\
    color: #4fc1e9;\
    cursor: pointer;\
    margin: 0 2px;\
}\
#gunBut {\
    border: 1px solid #999;\
    border-radius: 9px;\
    cursor: pointer;\
    display: inline-block;\
    font-size: 13px;\
    height: 18px;\
    margin: -3px 5px;\
    text-align: center;\
    width: 18px;\
    vertical-align: text-top;\
}\
#gunMeun {\
    animation:gunMeun 300ms;\
    background-color: #fff;\
    border-radius: 5px;\
    box-shadow: 0 0 20px;\
    cursor: default;\
    font-size: 12px;\
    height: 50px;\
    margin: 10px -425px;\
    padding: 10px;\
    position: absolute;\
    width: 400px;\
}\
#gunSeed {\
    cursor: pointer;\
}\
#gunText {\
    width: 100%;\
}\
.treasure {\
   margin: -160px 0 !important;\
}\
@keyframes gunMeun\
{\
from {margin: 10px -500px; opacity: 0;}\
to {margin: 10px -425px; opacity: 1;}\
}\
');
if (undefined === GM_getValue('content_key')) { GM_setValue('content_key', config.content) }
if (undefined === GM_getValue('seed_key')) { GM_setValue('seed_key', config.seed) }
config.contentReg = RegExp((GM_getValue('content_key')), 'i');
function Welcome(json) {
    if (json.data.isadmin) {
        var div = config.document.createElement('div');
        div.className = 'system-msg';
        var html = (json.data.uid == config.masterID) ? '<span class="square-icon master">播主</span>' : '<span class="square-icon admin">房管</span>';
        html += '<span class="welcome v-middle" style="color: #ffb100">' + json.data.uname + '</span><span class="v-middle">进入直播间</span>';
        div.innerHTML = html;
        AddHistory(div);
    }
}
function MsgHistory() {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.status == 200 && xhr.response.code === 0) {
            var fragment = config.document.createDocumentFragment();
            for (var i = 0, j = xhr.response.data.room.length; i < j; i++) {
                var obj = xhr.response.data.room[i];
                if (!config.contentReg.test(obj.text)) {
                    var div = config.document.createElement('div');
                    div.className = 'chat-msg';
                    div.setAttribute('data-uname', obj.nickname);
                    div.setAttribute('data-uid', obj.uid);
                    var html = '';
                    if (obj.isadmin) { html += (obj.uid == config.masterID) ? '<span class="square-icon master">播主</span>' : '<span class="square-icon admin">房管</span>' }
                    html += (obj.uid == config.UID) ? '<span class="user-name color">[自己] : </span>' : '<span class="user-name color">' + obj.nickname + ' : </span>';
                    html += '<span class="msg-content">' + obj.text + '</span>';
                    div.innerHTML = html;
                    fragment.appendChild(div);
                }
            }
            AddHistory(fragment);
        }
    }
    xhr.open('post', '/ajax/msg', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr.responseType = 'json';
    xhr.send('roomid=' + config.roomID);
}
function AddMessage(data) {
    if (!config.contentReg.test(data.info[1]) && 'btn lock-chat' == config.lockDiv.className) {
        var div = config.document.createElement('div');
        div.className = 'chat-msg';
        div.setAttribute('data-uname', data.info[2][1]);
        div.setAttribute('data-uid', data.info[2][0]);
        var html = '';
        if (data.info[2][2]) { html += (data.info[2][0] == config.masterID) ? '<span class="square-icon master">播主</span>' : '<span class="square-icon admin">房管</span>' }
        html += (data.info[2][0] == config.UID) ? '<span class="user-name color">[自己] : </span>' : '<span class="user-name color">' + data.info[2][1] + ' : </span>';
        html += '<span class="msg-content">' + data.info[1] + '</span>';
        div.innerHTML = html;
        AddHistory(div);
    }
}
function AddHistory(div) {
    config.msgDiv.appendChild(div);
    if (config.msgDiv.scrollHeight - config.msgDiv.scrollTop < 750 ) {
        RemoveOverflow();
        config.msgDiv.scrollTop = config.msgDiv.scrollHeight;
    }
}
function RemoveOverflow() {
    if (config.msgDiv.childNodes.length >= 100) {
        config.msgDiv.removeChild(config.msgDiv.firstChild);
        RemoveOverflow();
    }
}
function ContentConfUI() {
    var div = config.document.getElementsByClassName('btns')[0];
    var butDiv = config.document.createElement('div');
    butDiv.id = 'gunBut';
    butDiv.innerHTML = '滚';
    var meunDiv = config.document.createElement('div');
    meunDiv.id = 'gunMeun';
    meunDiv.style.display = 'none';
    meunDiv.innerHTML = '\
<div class = "fLeft">关键字(以"|"分割,不区分大小写):</div>\
<div id = "gunRec" class = "fLeft gunBlue">恢复默认</div>\
<div id = "gunHis" class = "fLeft gunBlue">加载历史</div>\
<input type = "checkbox" id = "gunSeed" class = "fRight" />\
<div class = "fRight">领瓜子</div>\
<input type = "text" id = "gunText" />';
    butDiv.appendChild(meunDiv);
    div.appendChild(butDiv);
    var gunRec = config.document.getElementById('gunRec');
    var gunHis = config.document.getElementById('gunHis');
    var gunSeed = config.document.getElementById('gunSeed');
    var gunText = config.document.getElementById('gunText');
    butDiv.onclick = function (event) {
        if ('gunBut' == event.target.id) {
            if ('none' == meunDiv.style.display) {
                gunText.value = GM_getValue('content_key');
                gunSeed.checked = GM_getValue('seed_key');
                meunDiv.style.display = 'block';
            } else {
                var contentConf = gunText.value;
                if ('' === contentConf) {
                    GM_setValue('content_key', '/');
                } else if (RegExp(contentConf, 'i')) {
                    GM_setValue('content_key', contentConf);
                }
                config.contentReg = RegExp((GM_getValue('content_key')), 'i');
                GM_setValue('seed_key', gunSeed.checked);
                meunDiv.style.display = 'none';
            }
        }
    }
    gunRec.onclick = function () {
        gunText.value = config.content;
    }
    gunHis.onclick = function () {
        MsgHistory();
    }
}
function DoSign() {
    var xhr = new XMLHttpRequest();
    xhr.open('get', '/sign/doSign', true);
    xhr.send();
}
function GetSurplus() {
    config.unsafeWindow.countdown();
    setTimeout(function () {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.status == 200 && xhr.response.data.silver) {
                var surplus = xhr.response.data.surplus * 60000 + 5000;
                setTimeout(GetAward, surplus);
            }
        }
        xhr.open('get', '/FreeSilver/getSurplus?r=' + Math.random() + '&roomid=' + config.roomID, true);
        xhr.responseType = 'json';
        xhr.send();
    }, 2000);
}
function GetAward() {
    var captcha = new Image();
    captcha.onload = function () {
        function Bin(pixe, xi, yj, t) {
            if (t) {
                var pixels = context.getImageData(xi, yj, 2, 2).data;
                var sum = 0;
                for (var i = 0, j = 0; j < 4; j++) {
                    sum += Bin(pixels, i, j, 0);
                }
                return (sum > 2) ? 1 : 0;
            } else {
                return (pixe[yj * 4] * 0.299 + pixe[yj * 4 + 1] * 0.587 + pixe[yj * 4 + 2] * 0.114 < 128) ? 1 : 0;
            }
        }
        var canvas = config.document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.drawImage(captcha, 20, 6, 80, 31, 0, 0, 80, 31);
        var id = 0, num = [];
        for (var i = 0; i < 80; i++) {
            var pixels = context.getImageData(i, 0, 1, 31).data;
            var sum = 0;
            for (var j = 0; j < 31; j++) {
                sum += Bin(pixels, i, j, 0);
            }
            if (sum > 3) {
                for (var k = 0; k < 31; k++) {
                    if (Bin(pixels, i, k, 0)) {
                        if (k < 3) {
                            if (Bin(pixels, i, 12, 1)) {
                                if (Bin(pixels, i + 12, 5, 1)) {
                                    if (Bin(pixels, i, 19, 1)) {
                                        if (Bin(pixels, i + 6, 14, 1)) {
                                            num[id] = 6;
                                            id++;
                                            i += 15;
                                            break;
                                        } else {
                                            num[id] = 0;
                                            id++;
                                            i += 15;
                                            break;
                                        }
                                    } else {
                                        num[id] = 9;
                                        id++;
                                        i += 15;
                                        break;
                                    }
                                } else {
                                    num[id] = 5;
                                    id++;
                                    i += 15;
                                    break;
                                }
                            } else {
                                if (Bin(pixels, i, 28, 1)) {
                                    if (Bin(pixels, i + 12, 23, 1)) {
                                        if (Bin(pixels, i, 18, 1)) {
                                            num[id] = 8;
                                            id++;
                                            i += 15;
                                            break;
                                        } else {
                                            num[id] = 3;
                                            id++;
                                            i += 15;
                                            break;
                                        }
                                    } else {
                                        num[id] = 2;
                                        id++;
                                        i += 15;
                                        break;
                                    }
                                } else {
                                    num[id] = 7;
                                    id++;
                                    i += 15;
                                    break;
                                }
                            }
                        } else if (k < 10) {
                            num[id] = 1;
                            id++;
                            i += 6;
                            break;
                        } else if (k < 18) {
                            if (Bin(pixels, i + 6, 12, 1)) {
                                num[id] = '+';
                                id++;
                                i += 16;
                                break;
                            } else {
                                num[id] = '-';
                                id++;
                                i += 8;
                                break;
                            }
                        } else {
                            num[id] = 4;
                            id++;
                            i += 16;
                            break;
                        }
                    }
                }
            }
        }
        if (4 == num.length) {
            var s = ('+' == num[2]) ? num[0] * 10 + num[1] + num[3] : num[0] * 10 + num[1] - num[3];
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status == 200 && xhr.response.code === 0) {
                    GetSurplus();
                } else {
                    GetAward();
                }
            }
            xhr.open('get', '/FreeSilver/getAward?r=' + Math.random() + '&captcha=' + s, true);
            xhr.responseType = 'json';
            xhr.send();
        } else {
            GetAward();
        }
    }
    captcha.src = '/FreeSilver/getCaptcha?t=' + Math.random();
}
function Gift() { }
function WaitProtocol() {
    config.roomID = config.unsafeWindow.ROOMID;
    config.masterID = config.unsafeWindow.MASTERID;
    config.UID = config.unsafeWindow.UID;
    if ('function' == typeof (exportFunction)) {
        exportFunction(Welcome, config.unsafeWindow, { defineAs: '_Welcome' });
        exportFunction(AddMessage, config.unsafeWindow, { defineAs: '_AddMessage' });
        exportFunction(Gift, config.unsafeWindow, { defineAs: '_Gift' });
        config.unsafeWindow.protocol.WELCOME = config.unsafeWindow._Welcome;
        config.unsafeWindow.protocol.DANMU_MSG = config.unsafeWindow._AddMessage;
        config.unsafeWindow.protocol.SEND_GIFT = config.unsafeWindow._Gift;
        config.unsafeWindow.protocol.SYS_MSG = config.unsafeWindow._Gift;
        config.unsafeWindow.addMessage = config.unsafeWindow._Gift;
    } else {
        config.unsafeWindow.protocol.WELCOME = Welcome;
        config.unsafeWindow.protocol.DANMU_MSG = AddMessage;
        config.unsafeWindow.protocol.SEND_GIFT = Gift;
        config.unsafeWindow.protocol.SYS_MSG = Gift;
        config.unsafeWindow.addMessage = Gift;
    }
    config.msgDiv.innerHTML = '';
    config.msgDiv.style.visibility = 'visible';
    MsgHistory();
    ContentConfUI();
    DoSign();
    if (GM_getValue('seed_key')) { setTimeout(GetSurplus, 5000) }
}
(function () {
    var sgcDiv = config.document.getElementsByClassName('super-gift-ctnr')[0];
    sgcDiv.parentNode.removeChild(sgcDiv);
    var gm1Div = config.document.getElementById('gift-msg-1000');
    gm1Div.parentNode.removeChild(gm1Div);
    config.lockDiv = config.document.getElementsByClassName('btn lock-chat')[0];
    config.msgDiv = config.document.getElementById('chat-msg-list');
    config.msgDiv.style.visibility = 'hidden';
    config.msgDiv.addEventListener('DOMNodeInserted', function one() {
        setTimeout(WaitProtocol, 500);
        config.msgDiv.removeEventListener('DOMNodeInserted', one);
    });
})();