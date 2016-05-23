// ==UserScript==
// @name        bilibili直播净化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     1.1.2.9
// @author      lzghzr
// @description 屏蔽聊天室礼物以及关键字, 净化聊天室环境
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^http:\/\/live\.bilibili\.com\/\d.*$/
// @license     Apache-2.0
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       unsafeWindow
// @run-at      document-end
// ==/UserScript==

(function () {
    'use strict';
    // 为了兼容Tampermonkey
    var content = 'gg|(.)\\1{3,}',
        D = document,
        hotWords = [],
        locked = false,
        masterID = null,
        roomID = null,
        smallTV = true,
        seed = true,
        UID = null,
        W = unsafeWindow;
    // 已被转义弄懵逼了, 能用就行
    var contentReg = RegExp(GM_getValue('content', content), 'i');
    // 移除礼物连击
    var divSGC = D.getElementsByClassName('super-gift-ctnr')[0];
    divSGC.parentNode.removeChild(divSGC);
    // 移除小型礼物
    var divGM1 = D.getElementById('gift-msg-1000');
    divGM1.parentNode.removeChild(divGM1);
    // 获取热词
    var divHotWords = D.getElementsByClassName('hot-words-ctnr')[0].getElementsByTagName('a');
    for (var i = 0, j = divHotWords.length; i < j; i++) {
        hotWords.push(divHotWords[i].innerHTML);
    }
    // 获取聊天列表并暂时隐藏, 等待加载第一个弹幕
    var divMsg = D.getElementById('chat-msg-list');
    divMsg.style.visibility = 'hidden';
    divMsg.addEventListener('DOMNodeInserted', function one() {
        setTimeout(WaitProtocol, 500);
        divMsg.removeEventListener('DOMNodeInserted', one);
    });
    // 添加样式
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
#gunLock {\
    background-color: rgba(79,193,233,0.6);\
    font-size: 12px;\
    line-height: 30px;\
    margin: -68px -224px;\
    position: absolute;\
    width: 281px;\
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
#gunSmallTV {\
    cursor: pointer;\
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
    /**
     * (欢迎信息, 已改造为仅管理有效)
     * 
     * @param {JSON} json (土豪信息)
     */
    function Welcome(json) {
        if (json.data.isadmin) {
            // 虽然不知道为什么加空div, 不过为了兼容
            var div = D.createElement('div');
            var html = '<div class="system-msg">';
            html += (json.data.uid == masterID) ? '<span class="square-icon master">播主</span>' : '<span class="square-icon admin">房管</span>';
            html += '<span class="welcome v-middle" style="color: #ffb100">' + json.data.uname + '</span><span class="v-middle">进入直播间</span></div>';
            div.innerHTML = html;
            AddHistory(div);
        }
    }
    /**
     * (加载历史弹幕)
     */
    function MsgHistory() {
        var xhr = new XMLHttpRequest();
        xhr.open(
            'post',
            '/ajax/msg',
            true
        );
        // 默认会出错所以手动设置一下头
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.responseType = 'json';
        xhr.send('roomid=' + roomID);
        xhr.onload = function () {
            if (this.response.code == 0) {
                for (var i = 0, j = this.response.data.room.length; i < j; i++) {
                    var data = this.response.data.room[i];
                    // 按照弹幕格式进行格式化
                    var json = {
                        'info': [
                            [],
                            data.text,
                            [
                                data.uid,
                                data.nickname,
                                data.isadmin
                            ]
                        ]
                    }
                    AddMessage(json);
                }
            }
        }
    }
    /**
     * (生成弹幕div)
     * 
     * @param {JSON} json (格式化弹幕)
     */
    function AddMessage(json) {
        // 锁定或者被屏蔽则跳过
        if (!(locked || contentReg.test(json.info[1]) || hotWords.indexOf(json.info[1]) >= 0)) {
            var div = D.createElement('div');
            var html = '<div class="chat-msg" data-uname="' + json.info[2][1] + '" data-uid="' + json.info[2][0] + '">';
            if (json.info[2][2]) { html += (json.info[2][0] == masterID) ? '<span class="square-icon master">播主</span>' : '<span class="square-icon admin">房管</span>' }
            html += (json.info[2][0] == UID) ? '<span class="user-name color">[自己] : </span>' : '<span class="user-name color">' + json.info[2][1] + ' : </span>';
            html += '<span class="msg-content">' + json.info[1] + '</span></div>';
            div.innerHTML = html;
            AddHistory(div);
        }
    }
    /**
     * (在聊天列表插入div)
     * 
     * @param {Node} div (格式化div)
     */
    function AddHistory(div) {
        divMsg.appendChild(div);
        // 理想状态是向上滚动自动锁定
        if (divMsg.scrollHeight - divMsg.scrollTop < 550) {
            RemoveOverflow();
            divMsg.scrollTop = divMsg.scrollHeight;
        }
        /**
         * (移除多余的聊天信息)
         */
        function RemoveOverflow() {
            if (divMsg.childNodes.length >= 100) {
                divMsg.removeChild(divMsg.firstChild);
                RemoveOverflow();
            }
        }
    }
    /**
     * (加载设置界面)
     */
    function ContentConfUI() {
        // 获取弹幕锁定状态
        var divLock = D.getElementsByClassName('lock-chat')[0];
        // 获取按钮插入的位置
        var divBtns = D.getElementsByClassName('btns')[0];
        // 传说中的UI, 真的很丑
        var divGun = D.createElement('div');
        divGun.id = 'gunBut';
        divGun.innerHTML = '滚\
<div id="gunMeun" style="display: none;">\
    <div class="fLeft">关键字(正则, 不区分大小写):</div>\
    <div id="gunRec" class="fLeft gunBlue">恢复默认</div>\
    <div id="gunHis" class="fLeft gunBlue">加载历史</div>\
    <input type="checkbox" id="gunSeed" class="fRight">\
    <div class="fRight">领瓜子</div>\
    <input type="checkbox" id="gunSmallTV" class="fRight">\
    <div class="fRight">小电视</div>\
    <input type="text" id="gunText">\
</div>\
<div id="gunLock" style="display: none;">点击返回底部\
</div>\
';
        // 插入菜单按钮
        divBtns.appendChild(divGun);
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
        for (var x in div) { div[x] = D.getElementById(x); }
        // 为了和b站更搭, 所以监听body的click
        D.body.addEventListener('click',
            /**
             * (监听body的点击事件)
             * 
             * @param {MouseEvent} event
             */
            function (event) {
                // save与菜单显示与否相同
                var save = (div.gunMeun.style.display == 'block') ? true : false;
                // 菜单
                if (divGun.contains(event.target)) {
                    // 加载历史
                    if (event.target == div.gunHis) {
                        MsgHistory();
                    }
                    // 恢复默认
                    else if (event.target == div.gunRec) {
                        div.gunText.value = content;
                    }
                    // 滚动锁定
                    else if (event.target == div.gunLock) {
                        divMsg.scrollTop = divMsg.scrollHeight;
                    }
                    // 如果点击菜单按钮, 菜单没显示的话就显示出来
                    if (event.target == divGun) {
                        if (!save) {
                            div.gunText.value = GM_getValue('content', content);
                            div.gunSmallTV.checked = GM_getValue('smallTV', smallTV);
                            div.gunSeed.checked = GM_getValue('seed', seed);
                            div.gunMeun.style.display = 'block';
                        }
                    }
                    else {
                        save = false;
                    }
                }
                // 锁定
                else if (event.target == divLock) {
                    // 因为冒泡顺序, 触发时className已改变
                    locked = (divLock.className == 'btn lock-chat active') ? true : false;
                }
                // 存储
                if (save) {
                    // 遇到'\'会出错, 不管了...
                    var contentConf = div.gunText.value;
                    if (contentConf == '') {
                        // b站屏蔽了'/'
                        GM_setValue('content', '/');
                    }
                    else {
                        GM_setValue('content', contentConf);
                    }
                    contentReg = RegExp(GM_getValue('content', content), 'i');
                    GM_setValue('smallTV', div.gunSmallTV.checked);
                    GM_setValue('seed', div.gunSeed.checked);
                    div.gunMeun.style.display = 'none';
                }
            });
        // 增加一个点击返回的提示条
        divMsg.addEventListener('scroll',
            /**
             * (监听聊天历史的滚动事件)
             */
            function () {
                if (divMsg.scrollHeight - divMsg.scrollTop < 550) {
                    div.gunLock.style.display = 'none';
                }
                else {
                    div.gunLock.style.display = 'block';
                }
            });
    }
    /**
     * (签到)
     */
    function DoSign() {
        var xhr = new XMLHttpRequest();
        xhr.open(
            'get',
            '/sign/doSign',
            true
        );
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
            xhr.open(
                'get',
                '/FreeSilver/getSurplus?r=' + Math.random() + '&roomid=' + roomID,
                true
            );
            xhr.responseType = 'json';
            xhr.send();
            xhr.onload = function () {
                if (this.response.data.silver) {
                    var surplus = this.response.data.surplus * 60000 + 5000;
                    setTimeout(GetAward, surplus);
                }
            }
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
                                // 可能数字1
                                else if (k < 10) {
                                    num[id] = 1;
                                    id++;
                                    i += 6;
                                    break;
                                }
                                // 可能数字'+', '-'
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
                    xhr.open(
                        'get',
                        '/FreeSilver/getAward?r=' + Math.random() + '&captcha=' + s,
                        true
                    );
                    xhr.responseType = 'json';
                    xhr.send();
                    xhr.onload = function () {
                        if (this.response.code == 0) {
                            GetSurplus();
                        }
                        else {
                            GetAward();
                        }
                    }
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
            }
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
            xhr.open(
                'get',
                json.url,
                true
            );
            xhr.send();
            xhr.onload = function () {
                if (this.status == 200) {
                    var regRoomID = /var ROOMID = (\d+)/;
                    var roomID = regRoomID.exec(this.responseText)[1];
                    GetSmallTV(roomID);
                }
            }
        }
        /**
         * (获取房间内抽奖信息)
         * 
         * @param {Number} urlRoomID (房间号)
         */
        function GetSmallTV(urlRoomID) {
            var xhr = new XMLHttpRequest();
            xhr.open(
                'get',
                '/SmallTV/index?roomid=' + urlRoomID + '&_=' + (new Date()).getTime(),
                true
            );
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
            }
        }
        /**
         * (参与小电视抽奖)
         * 
         * @param {Number} urlRoomID (房间号)
         * @param {Number} id (活动序号)
         */
        function JoinSmallTV(urlRoomID, id) {
            var xhr = new XMLHttpRequest();
            xhr.open(
                'get',
                '/SmallTV/join?roomid=' + urlRoomID + '&id=' + id + '&_=' + (new Date()).getTime(),
                true
            );
            xhr.responseType = 'json';
            xhr.send();
            xhr.onload = function () {
                if (this.response.code == 0 && this.response.data.status == 1) {
                    // setTimeout传递参数没搞懂, 为了避免同时多个小电视冲突
                    setTimeout(
                        function () {
                            GetReward(id);
                        },
                        this.response.data.dtime * 1000);
                }
            }
        }
        /**
         * (获取开奖进度)
         * 
         * @param {Number} id (活动序号)
         */
        function GetReward(id) {
            var xhr = new XMLHttpRequest();
            xhr.open(
                'get',
                '/SmallTV/getReward?id=' + id + '&_=' + (new Date()).getTime(),
                true
            );
            xhr.responseType = 'json';
            xhr.send();
            xhr.onload = function () {
                if (this.response.code == 0) {
                    if (this.response.data.status == 2) {
                        // 开奖时刻总是那么漫长, 等待再次获取开奖信息
                        setTimeout(
                            function () {
                                GetReward(id);
                            },
                            5000);
                    }
                    // 万一呢, 那万一呢, 那万一中了呢
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
            }
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
        if (GM_getValue('seed', seed)) { setTimeout(GetSurplus, 5000) }
    }
})();