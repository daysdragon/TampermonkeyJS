// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     1.1.2.9
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^http:\/\/live\.bilibili\.com\/\d.*$/
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
class BiLiveNoVIP {
    constructor() {
        this.W = window;
        this.D = document;
        this.locked = false;
        this.autoSmallTV = true;
        this.autoSeed = true;
        this.noVIPIcon = true;
        this.noMedalIcon = true;
        this.noUserLevelIcon = true;
        this.noLiveTitleIcon = true;
        this.noSystemMsg = true;
        this.noGiftMsg = true;
        this.noSuperGift = true;
        this.noSmallGift = true;
        this.fixTreasure = true;
        this.roomID = this.W.ROOMID;
        this.UID = this.W.UID;
    }
    Start() {
        this.AddCSS();
        this.AddUI();
        this.RemovePopularWords();
    }
    AddCSS() {
        let cssText = `
.gunBlue {
  color: #4fc1e9;
  cursor: pointer;
  margin: 0 2px;
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
#gunLock {
  background-color: rgba(79,193,233,0.6);
  font-size: 12px;
  line-height: 30px;
  margin: -68px -224px;
  position: absolute;
  width: 281px;
}
#gunMeun {
  animation:gunMeun 300ms;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 0 20px;
  cursor: default;
  font-size: 12px;
  height: 50px;
  margin: 10px -425px;
  padding: 10px;
  position: absolute;
  width: 400px;
}
#gunSmallTV {
  cursor: pointer;
}
#gunSeed {
  cursor: pointer;
}
#gunText {
  width: 100%;
}
@keyframes gunMeun {
  from {
    margin: 10px -500px;
    opacity: 0;
  }
  to {
    margin: 10px -425px;
    opacity: 1;
  }
}`;
        if (this.noVIPIcon)
            cssText += '.vip-icon {display: none !important;}';
        if (this.noMedalIcon)
            cssText += '.medal-icon {display: none !important;}';
        if (this.noUserLevelIcon)
            cssText += '.user-level-icon {display: none !important;}';
        if (this.noLiveTitleIcon)
            cssText += '.live-title-icon {display: none !important;}';
        if (this.noSystemMsg)
            cssText += '.system-msg {display: none !important;} .announcement-container {display: none !important;}';
        if (this.noGiftMsg)
            cssText += '.gift-msg {display: none !important;}';
        if (this.noSuperGift)
            cssText += '.super-gift-ctnr {display: none !important;}';
        if (this.noSmallGift)
            cssText += '.gift-msg-1000 {display: none !important;} .chat-msg-list {height: 100% !important;}';
        if (this.fixTreasure)
            cssText += '.treasure {margin: -160px 0 !important;}';
        // 插入css
        let elmStyle = this.D.createElement('style');
        elmStyle.innerHTML = cssText;
        this.D.body.appendChild(elmStyle);
    }
    AddUI() {
        // 获取按钮插入的位置
        var elmDivBtns = this.D.querySelector('.btns');
        // 传说中的UI, 真的很丑
        var elmDivGun = this.D.createElement('div');
        elmDivGun.id = 'gunBut';
        elmDivGun.innerHTML = `滚
<div id="gunMeun" style="display: none;">
    <input type="checkbox" id="gunSeed">
    <span>领瓜子</span>
    <input type="checkbox" id="gunSmallTV">
    <span>小电视</span>
</div>`;
        // 插入菜单按钮
        elmDivBtns.appendChild(elmDivGun);
        // 获取刚刚插入的一些DOM
        var div = {
            'gunHis': null,
            'gunLock': null,
            'gunMeun': null,
            'gunRec': null,
            'gunSmallTV': null,
            'gunSeed': null,
            'gunText': null
        };
        for (var x in div) {
            div[x] = this.D.getElementById(x);
        }
        // 为了和b站更搭, 所以监听body的click
        this.D.body.addEventListener('click', (ev) => {
            // 菜单
            if (elmDivGun.contains(ev.target)) {
                if (ev.target === elmDivGun) {
                    div.gunMeun.style.display = 'block'
                }
            }
            else {
                div.gunMeun.style.display = 'none'
            }
        })
    }
}
/**
 * 屏蔽热词
 *
 * @private
 */
RemovePopularWords() {
    let player = `/api/player?id=cid:${this.roomID}&ts=${Date.now().toString(16)}`;
    let popularWords = this.W.flash_popularWords();
    this.Request(player, 'GET', 'document')
        .then((resolve) => {
            return resolve.querySelector('user_sheid_keyword').innerHTML;
        })
        .then((resolve) => {
            let userKeyword = resolve.split(',');
            let hotWords = new Set([...new Set(popularWords)].filter((x) => !new Set(userKeyword).has(x)));
            for (let y of hotWords) {
                let shield = `/liveact/shield_keyword?keyword=${encodeURIComponent(y)}&roomid=${this.roomID}&type=1`;
                this.Request(shield, 'POST');
            }
        });
}
Request(url, method = 'GET', type = '') {
    return new Promise((resolve, reject) => {
        let path = url;
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
        xhr.send(postData);
        xhr.onload = (ev) => {
            resolve(ev.target.response);
        };
    });
}
}
const gun = new BiLiveNoVIP();
gun.Start();

/**
 * (签到)
 */
function DoSign() {
    var xhr = new XMLHttpRequest();
    xhr.open('get', '/sign/doSign', true);
    xhr.send();
}
/**
 * (等大招CD)
 */
function GetSurplus() {
    // 本来想禁用的, 不过还要每天初始化一次
    W.countdown();
    // 延时好烦
    setTimeout(function () {
        var xhr = new XMLHttpRequest();
        xhr.open('get', '/FreeSilver/getSurplus?r=' + Math.random() + '&roomid=' + roomID, true);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function () {
            if (this.response.data.silver) {
                var surplus = this.response.data.surplus * 60000 + 5000;
                setTimeout(GetAward, surplus);
            }
        };
    }, 2000);
    /**
     * (领瓜子)
     */
    function GetAward() {
        // 非常古老的依靠像素位置识别图片, 验证码升级后会弃用
        var captcha = new Image();
        captcha.src = '/FreeSilver/getCaptcha?t=' + Math.random();
        captcha.onload = function () {
            var canvas = D.createElement('canvas');
            var context = canvas.getContext('2d');
            // 从20, 6开始剪裁出80*31大小
            context.drawImage(captcha, 20, 6, 80, 31, 0, 0, 80, 31);
            // 将结果储存在数组, id为位置
            var id = 0, num = [];
            // 逐列扫描
            for (var i = 0; i < 80; i++) {
                // 获取第i列像素数据
                var pixels = context.getImageData(i, 0, 1, 31).data;
                // 计算这一列的像素个数
                var sum = 0;
                for (var j = 0; j < 31; j++) {
                    sum += Bin(pixels, i, j, false);
                }
                // 像素个数大于3判断为有效列
                if (sum > 3) {
                    // 逐个分析此列像素信息
                    for (var k = 0; k < 31; k++) {
                        // 分析像素位置
                        if (Bin(pixels, i, k, false)) {
                            // 可能数字0, 2, 3, 5, 6, 7, 8, 9
                            if (k < 3) {
                                // 此列第12行有像素则可能数字0, 5, 6, 9
                                if (Bin(pixels, i, 12, true)) {
                                    // 右移12列第5行有像素则可能数字0, 6, 9
                                    if (Bin(pixels, i + 12, 5, true)) {
                                        // 此列第19行有像素则可能数字0, 6
                                        if (Bin(pixels, i, 19, true)) {
                                            // 右移16列第14行有像素则可能数字6
                                            if (Bin(pixels, i + 6, 14, true)) {
                                                num[id] = 6;
                                                id++;
                                                i += 15;
                                                break;
                                            }
                                            else {
                                                num[id] = 0;
                                                id++;
                                                i += 15;
                                                break;
                                            }
                                        }
                                        else {
                                            num[id] = 9;
                                            id++;
                                            i += 15;
                                            break;
                                        }
                                    }
                                    else {
                                        num[id] = 5;
                                        id++;
                                        i += 15;
                                        break;
                                    }
                                }
                                else {
                                    // 此列第28行有像素则可能数字2, 3, 8
                                    if (Bin(pixels, i, 28, true)) {
                                        // 右移12列第23行有像素则可能数字3, 8
                                        if (Bin(pixels, i + 12, 23, true)) {
                                            // 此列第18行有像素则可能数字8
                                            if (Bin(pixels, i, 18, true)) {
                                                num[id] = 8;
                                                id++;
                                                i += 15;
                                                break;
                                            }
                                            else {
                                                num[id] = 3;
                                                id++;
                                                i += 15;
                                                break;
                                            }
                                        }
                                        else {
                                            num[id] = 2;
                                            id++;
                                            i += 15;
                                            break;
                                        }
                                    }
                                    else {
                                        num[id] = 7;
                                        id++;
                                        i += 15;
                                        break;
                                    }
                                }
                            }
                            else if (k < 10) {
                                num[id] = 1;
                                id++;
                                i += 6;
                                break;
                            }
                            else if (k < 18) {
                                // 右移6列第12行有像素则可能数字'+'
                                if (Bin(pixels, i + 6, 12, true)) {
                                    num[id] = '+';
                                    id++;
                                    i += 16;
                                    break;
                                }
                                else {
                                    num[id] = '-';
                                    id++;
                                    i += 8;
                                    break;
                                }
                            }
                            else {
                                num[id] = 4;
                                id++;
                                i += 16;
                                break;
                            }
                        }
                    }
                }
            }
            // 最后结果为四位则可能正确
            if (num.length == 4) {
                var s = (num[2] == '+') ? num[0] * 10 + num[1] + num[3] : num[0] * 10 + num[1] - num[3];
                var xhr = new XMLHttpRequest();
                xhr.open('get', '/FreeSilver/getAward?r=' + Math.random() + '&captcha=' + s, true);
                xhr.responseType = 'json';
                xhr.send();
                xhr.onload = function () {
                    if (this.response.code == 0) {
                        GetSurplus();
                    }
                    else {
                        GetAward();
                    }
                };
            }
            else {
                GetAward();
            }
            /**
             * (二值化)
             *
             * @param {ArrayBuffer} pixe (像素信息)
             * @param {Number} xi (横坐标)
             * @param {Number} yj (纵坐标)
             * @param {Boolean} t (true 测试指定区域是否有像素|false 二值化)
             * @returns {Number} (因为要求和, 不返回bool)
             */
            function Bin(pixe, xi, yj, t) {
                if (t) {
                    var pixels = context.getImageData(xi, yj, 2, 2).data;
                    var sum = 0;
                    for (var i = 0, j = 0; j < 4; j++) {
                        sum += Bin(pixels, i, j, false);
                    }
                    return (sum > 2) ? 1 : 0;
                }
                else {
                    return (pixe[yj * 4] * 0.299 + pixe[yj * 4 + 1] * 0.587 + pixe[yj * 4 + 2] * 0.114 < 128) ? 1 : 0;
                }
            }
        };
    }
}
/**
 * (自动参与小电视抽奖)
 *
 * @param {JSON} json (系统消息)
 */
function SmallTV(json) {
    if (json.styleType == 2 && json.url != '') {
        // 暂时没有找到更好的办法获取房间号
        var xhr = new XMLHttpRequest();
        xhr.open('get', json.url, true);
        xhr.send();
        xhr.onload = function () {
            if (this.status == 200) {
                var regRoomID = /var ROOMID = (\d+)/;
                var roomID = regRoomID.exec(this.responseText)[1];
                GetSmallTV(roomID);
            }
        };
    }
    /**
     * (获取房间内抽奖信息)
     *
     * @param {Number} urlRoomID (房间号)
     */
    function GetSmallTV(urlRoomID) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', '/SmallTV/index?roomid=' + urlRoomID + '&_=' + (new Date()).getTime(), true);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function () {
            if (this.response.code == 0) {
                // 虽说没几个人一起送这么多, 况且一起送这么多会分开广播
                var unjoin = this.response.data.unjoin;
                for (var x in unjoin) {
                    JoinSmallTV(urlRoomID, unjoin[x].id);
                }
            }
        };
    }
    /**
     * (参与小电视抽奖)
     *
     * @param {Number} urlRoomID (房间号)
     * @param {Number} id (活动序号)
     */
    function JoinSmallTV(urlRoomID, id) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', '/SmallTV/join?roomid=' + urlRoomID + '&id=' + id + '&_=' + (new Date()).getTime(), true);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function () {
            if (this.response.code == 0 && this.response.data.status == 1) {
                // setTimeout传递参数没搞懂, 为了避免同时多个小电视冲突
                setTimeout(function () {
                    GetReward(id);
                }, this.response.data.dtime * 1000);
            }
        };
    }
    /**
     * (获取开奖进度)
     *
     * @param {Number} id (活动序号)
     */
    function GetReward(id) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', '/SmallTV/getReward?id=' + id + '&_=' + (new Date()).getTime(), true);
        xhr.responseType = 'json';
        xhr.send();
        xhr.onload = function () {
            if (this.response.code == 0) {
                if (this.response.data.status == 2) {
                    // 开奖时刻总是那么漫长, 等待再次获取开奖信息
                    setTimeout(function () {
                        GetReward(id);
                    }, 5000);
                }
                else if (this.response.data.status == 0 && this.response.data.reward.id == 1) {
                    var ohNo = new W.livePopup({
                        title: "你™居然中了个小电视!&nbsp;&nbsp;&nbsp;（#-_-)┯━┯",
                        content: '你™居然中了个小电视!!&nbsp;&nbsp;&nbsp;(╯°口°)╯(┴—┴<br \><br \>\
                                    你™居然中了个小电视!!!&nbsp;&nbsp;&nbsp;(╬ﾟдﾟ)▄︻┻┳═一',
                        button: {
                            Confirm: '我错了',
                            Cancel: '我有罪'
                        },
                        width: 450,
                        noCloseButton: true,
                        onConfirm: function () {
                            ohNo.remove();
                            ohNo = null;
                        },
                        onCancel: function () {
                            ohNo.remove();
                            ohNo = null;
                        }
                    });
                }
            }
        };
    }
}
/**
 * (用于替换的空函数)
 */
function Gift() { }
/**
 * (替换函数以及获取参数)
 */
function WaitProtocol() {
    roomID = W.ROOMID;
    masterID = W.MASTERID;
    UID = W.UID;
    // 为了兼容火狐
    if (typeof (exportFunction) == 'function') {
        exportFunction(Welcome, W, { defineAs: 'NewWelcome' });
        exportFunction(AddMessage, W, { defineAs: 'NewAddMessage' });
        exportFunction(SmallTV, W, { defineAs: 'NewSmallTV' });
        exportFunction(Gift, W, { defineAs: 'NewGift' });
        W.protocol.WELCOME = W.NewWelcome;
        W.protocol.DANMU_MSG = W.NewAddMessage;
        W.protocol.SEND_GIFT = W.NewGift;
        W.protocol.SYS_MSG = GM_getValue('smallTV', smallTV) ? W.NewSmallTV : W.NewGift;
        W.addMessage = W.NewGift;
    }
    else {
        W.protocol.WELCOME = Welcome;
        W.protocol.DANMU_MSG = AddMessage;
        W.protocol.SEND_GIFT = Gift;
        W.protocol.SYS_MSG = GM_getValue('smallTV', smallTV) ? SmallTV : Gift;
        W.addMessage = Gift;
    }
    divMsg.innerHTML = '';
    divMsg.style.visibility = 'visible';
    MsgHistory();
    ContentConfUI();
    DoSign();
    if (GM_getValue('seed', seed)) {
        setTimeout(GetSurplus, 5000);
    }
}
