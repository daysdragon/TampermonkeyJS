// ==UserScript==
// @name        libBilibiliToken
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description 哔哩哔哩cookie获取token
// @match       *://*.bilibili.com/*
// @require     https://greasyfork.org/scripts/130-portable-md5-function/code/Portable%20MD5%20Function.js?version=10066
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-start
// ==/UserScript==
class BilibiliToken {
    constructor() {
        this._W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
        this.biliLocalId = BilibiliToken.biliLocalId;
        this.buvid = BilibiliToken.buvid;
        this.deviceId = this.biliLocalId;
        this.fingerprint = BilibiliToken.fingerprint;
        this.guid = this.buvid;
        this.localFingerprint = this.fingerprint;
        this.localId = this.buvid;
        this.headers = {
            'User-Agent': 'Mozilla/5.0 BiliTV/1.2.4.1 (bbcallen@gmail.com)',
            'APP-KEY': BilibiliToken.mobiApp,
            'Buvid': this.buvid,
            'env': 'prod'
        };
    }
    static get biliLocalId() { return this.RandomID(20); }
    static get buvid() { return this.RandomID(37).toLocaleUpperCase(); }
    static get deviceId() { return this.biliLocalId; }
    static get fingerprint() { return this.RandomID(62); }
    static get guid() { return this.buvid; }
    static get localFingerprint() { return this.fingerprint; }
    static get localId() { return this.buvid; }
    static get TS() { return Math.floor(Date.now() / 1000); }
    static get RND() { return this.RandomNum(9); }
    static RandomNum(length) {
        const words = '0123456789';
        let randomNum = '';
        randomNum += words[Math.floor(Math.random() * 9) + 1];
        for (let i = 0; i < length - 1; i++)
            randomNum += words[Math.floor(Math.random() * 10)];
        return +randomNum;
    }
    static RandomID(length) {
        const words = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let randomID = '';
        randomID += words[Math.floor(Math.random() * 61) + 1];
        for (let i = 0; i < length - 1; i++)
            randomID += words[Math.floor(Math.random() * 62)];
        return randomID;
    }
    static get headers() {
        return {
            'User-Agent': 'Mozilla/5.0 BiliTV/1.2.4.1 (bbcallen@gmail.com)',
            'APP-KEY': this.mobiApp,
            'Buvid': this.buvid,
            'env': 'prod'
        };
    }
    static get loginQuery() {
        const biliLocalId = this.biliLocalId;
        const buvid = this.buvid;
        const fingerprint = this.fingerprint;
        return `appkey=${this.loginAppKey}&bili_local_id=${biliLocalId}&build=${this.build}&buvid=${buvid}&channel=${this.channel}&device=${biliLocalId}\
&device_id=${this.deviceId}&device_name=${this.deviceName}&device_platform=${this.devicePlatform}&fingerprint=${fingerprint}&guid=${buvid}\
&local_fingerprint=${fingerprint}&local_id=${buvid}&mobi_app=${this.mobiApp}&networkstate=${this.networkstate}&platform=${this.platform}`;
    }
    get loginQuery() {
        const biliLocalId = this.biliLocalId;
        const buvid = this.buvid;
        const fingerprint = this.fingerprint;
        return `appkey=${BilibiliToken.loginAppKey}&bili_local_id=${biliLocalId}&build=${BilibiliToken.build}&buvid=${buvid}&channel=${BilibiliToken.channel}&device=${biliLocalId}\
&device_id=${this.deviceId}&device_name=${BilibiliToken.deviceName}&device_platform=${BilibiliToken.devicePlatform}&fingerprint=${fingerprint}&guid=${buvid}\
&local_fingerprint=${fingerprint}&local_id=${buvid}&mobi_app=${BilibiliToken.mobiApp}&networkstate=${BilibiliToken.networkstate}&platform=${BilibiliToken.platform}`;
    }
    static signQuery(params, ts = true, secretKey = this.__secretKey) {
        let paramsSort = params;
        if (ts)
            paramsSort = `${params}&ts=${this.TS}`;
        paramsSort = paramsSort.split('&').sort().join('&');
        const paramsSecret = paramsSort + secretKey;
        const paramsHash = md5(paramsSecret);
        return `${paramsSort}&sign=${paramsHash}`;
    }
    static signLoginQuery(params) {
        const paramsBase = params === undefined ? this.loginQuery : `${params}&${this.loginQuery}`;
        return this.signQuery(paramsBase, true, this.__loginSecretKey);
    }
    signLoginQuery(params) {
        const paramsBase = params === undefined ? this.loginQuery : `${params}&${this.loginQuery}`;
        return BilibiliToken.signQuery(paramsBase, true, BilibiliToken.__loginSecretKey);
    }
    async getAuthCode() {
        const authCode = await XHR({
            GM: true,
            anonymous: true,
            method: 'POST',
            url: 'https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code',
            data: this.signLoginQuery(),
            responseType: 'json',
            headers: this.headers
        });
        if (authCode !== undefined && authCode.response.status === 200 && authCode.body.code === 0)
            return authCode.body.data.auth_code;
        return console.error('getAuthCode', authCode);
    }
    async qrcodeConfirm(authCode, csrf) {
        const confirm = await XHR({
            GM: true,
            method: 'POST',
            url: 'https://passport.bilibili.com/x/passport-tv-login/h5/qrcode/confirm',
            data: `auth_code=${authCode}&csrf=${csrf}`,
            responseType: 'json',
            headers: this.headers
        });
        if (confirm !== undefined && confirm.response.status === 200 && confirm.body.code === 0)
            return confirm.body.data.gourl;
        return console.error('qrcodeConfirm', confirm);
    }
    async qrcodePoll(authCode) {
        const poll = await XHR({
            GM: true,
            anonymous: true,
            method: 'POST',
            url: 'https://passport.bilibili.com/x/passport-tv-login/qrcode/poll',
            data: this.signLoginQuery(`auth_code=${authCode}`),
            responseType: 'json',
            headers: this.headers
        });
        if (poll !== undefined && poll.response.status === 200 && poll.body.code === 0)
            return poll.body.data;
        return console.error('qrcodePoll', poll);
    }
    async getToken() {
        const cookie = this._W.document.cookie.match(/bili_jct=(?<csrf>.*?);/);
        if (cookie === null || cookie.groups === undefined)
            return console.error('getToken', 'cookie获取失败');
        const csrf = cookie.groups['csrf'];
        const authCode = await this.getAuthCode();
        if (authCode === undefined)
            return;
        const confirm = await this.qrcodeConfirm(authCode, csrf);
        if (confirm === undefined)
            return;
        const token = await this.qrcodePoll(authCode);
        if (token === undefined)
            return;
        return token;
    }
}
BilibiliToken.__loginSecretKey = '59b43e04ad6965f34319062b478f83dd';
BilibiliToken.loginAppKey = '4409e2ce8ffd12b8';
BilibiliToken.__secretKey = '59b43e04ad6965f34319062b478f83dd';
BilibiliToken.appKey = '4409e2ce8ffd12b8';
BilibiliToken.build = '102401';
BilibiliToken.channel = 'master';
BilibiliToken.device = 'Sony';
BilibiliToken.deviceName = 'J9110';
BilibiliToken.devicePlatform = 'Android10SonyJ9110';
BilibiliToken.mobiApp = 'android_tv_yst';
BilibiliToken.networkstate = 'wifi';
BilibiliToken.platform = 'android';
function XHR(XHROptions) {
    return new Promise(resolve => {
        const onerror = (error) => {
            console.error(error);
            resolve(undefined);
        };
        if (XHROptions.GM) {
            if (XHROptions.method === 'POST') {
                if (XHROptions.headers === undefined)
                    XHROptions.headers = {};
                if (XHROptions.headers['Content-Type'] === undefined)
                    XHROptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
            }
            XHROptions.timeout = 30 * 1000;
            XHROptions.onload = res => resolve({ response: res, body: res.response });
            XHROptions.onerror = onerror;
            XHROptions.ontimeout = onerror;
            GM_xmlhttpRequest(XHROptions);
        }
        else {
            const xhr = new XMLHttpRequest();
            xhr.open(XHROptions.method, XHROptions.url);
            if (XHROptions.method === 'POST' && xhr.getResponseHeader('Content-Type') === null)
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            if (XHROptions.cookie)
                xhr.withCredentials = true;
            if (XHROptions.responseType !== undefined)
                xhr.responseType = XHROptions.responseType;
            xhr.timeout = 30 * 1000;
            xhr.onload = ev => {
                const res = ev.target;
                resolve({ response: res, body: res.response });
            };
            xhr.onerror = onerror;
            xhr.ontimeout = onerror;
            xhr.send(XHROptions.data);
        }
    });
}