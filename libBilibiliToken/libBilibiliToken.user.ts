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
/// <reference path="libBilibiliToken.d.ts" />
import { GM_xmlhttpRequest } from '../@types/tm_f'

/**
 * 由B站cookie获取token
 * 因为Tampermonkey的限制或者bug, 无法独立设置cookie, 所以不支持多用户
 * 使用之前请确认已经登录
 * 使用方法 await new BilibiliToken().getToken()
 * 更多高级用法请自行开发
 *
 * @class BilibiliToken
 */
class BilibiliToken {
  protected _W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  protected static readonly __loginSecretKey: string = '59b43e04ad6965f34319062b478f83dd'
  public static readonly loginAppKey: string = '4409e2ce8ffd12b8'
  protected static readonly __secretKey: string = '59b43e04ad6965f34319062b478f83dd'
  public static readonly appKey: string = '4409e2ce8ffd12b8'
  public static get biliLocalId(): string { return this.RandomID(20) }
  public biliLocalId = BilibiliToken.biliLocalId
  public static readonly build: string = '102401'
  public static get buvid(): string { return this.RandomID(37).toLocaleUpperCase() }
  public buvid = BilibiliToken.buvid
  public static readonly channel: string = 'master'
  public static readonly device: string = 'Sony'
  // 同一客户端与biliLocalId相同
  public static get deviceId(): string { return this.biliLocalId }
  public deviceId = this.biliLocalId
  public static readonly deviceName: string = 'J9110'
  public static readonly devicePlatform: string = 'Android10SonyJ9110'
  public static get fingerprint(): string { return this.RandomID(62) }
  public fingerprint = BilibiliToken.fingerprint
  // 同一客户端与buvid相同
  public static get guid(): string { return this.buvid }
  public guid = this.buvid
  // 同一客户端与fingerprint相同
  public static get localFingerprint(): string { return this.fingerprint }
  public localFingerprint = this.fingerprint
  // 同一客户端与buvid相同
  public static get localId(): string { return this.buvid }
  public localId = this.buvid
  public static readonly mobiApp: string = 'android_tv_yst'
  public static readonly networkstate: string = 'wifi'
  public static readonly platform: string = 'android'
  /**
   * 谜一样的TS
   *
   * @readonly
   * @static
   * @type {number}
   * @memberof BilibiliToken
   */
  public static get TS(): number { return Math.floor(Date.now() / 1000) }
  /**
   * 谜一样的RND
   *
   * @readonly
   * @static
   * @type {number}
   * @memberof BilibiliToken
   */
  public static get RND(): number { return this.RandomNum(9) }
  /**
   * 谜一样的RandomNum
   *
   * @static
   * @param {number} length
   * @returns {number}
   * @memberof BilibiliToken
   */
  public static RandomNum(length: number): number {
    const words = '0123456789'
    let randomNum = ''
    randomNum += words[Math.floor(Math.random() * 9) + 1]
    for (let i = 0; i < length - 1; i++) randomNum += words[Math.floor(Math.random() * 10)]
    return +randomNum
  }
  /**
   * 谜一样的RandomID
   *
   * @static
   * @param {number} length
   * @returns {string}
   * @memberof BilibiliToken
   */
  public static RandomID(length: number): string {
    const words = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let randomID = ''
    randomID += words[Math.floor(Math.random() * 61) + 1]
    for (let i = 0; i < length - 1; i++) randomID += words[Math.floor(Math.random() * 62)]
    return randomID
  }
  /**
   * 请求头
   *
   * @static
   * @type {XHRheaders}
   * @memberof BilibiliToken
   */
  public static get headers(): XHRheaders {
    return {
      'User-Agent': 'Mozilla/5.0 BiliTV/1.2.4.1 (bbcallen@gmail.com)',
      'APP-KEY': this.mobiApp,
      'Buvid': this.buvid,
      'env': 'prod'
    }
  }
  /**
   * 请求头
   *
   * @type {XHRheaders}
   * @memberof BilibiliToken
   */
  public headers: XHRheaders = {
    'User-Agent': 'Mozilla/5.0 BiliTV/1.2.4.1 (bbcallen@gmail.com)',
    'APP-KEY': BilibiliToken.mobiApp,
    'Buvid': this.buvid,
    'env': 'prod'
  }
  /**
   * 登录请求参数
   *
   * @readonly
   * @static
   * @type {string}
   * @memberof BilibiliToken
   */
  public static get loginQuery(): string {
    const biliLocalId = this.biliLocalId
    const buvid = this.buvid
    const fingerprint = this.fingerprint
    return `appkey=${this.loginAppKey}&bili_local_id=${biliLocalId}&build=${this.build}&buvid=${buvid}&channel=${this.channel}&device=${biliLocalId}\
&device_id=${this.deviceId}&device_name=${this.deviceName}&device_platform=${this.devicePlatform}&fingerprint=${fingerprint}&guid=${buvid}\
&local_fingerprint=${fingerprint}&local_id=${buvid}&mobi_app=${this.mobiApp}&networkstate=${this.networkstate}&platform=${this.platform}`
  }
  /**
   * 登录请求参数
   *
   * @readonly
   * @type {string}
   * @memberof BilibiliToken
   */
  public get loginQuery(): string {
    const biliLocalId = this.biliLocalId
    const buvid = this.buvid
    const fingerprint = this.fingerprint
    return `appkey=${BilibiliToken.loginAppKey}&bili_local_id=${biliLocalId}&build=${BilibiliToken.build}&buvid=${buvid}&channel=${BilibiliToken.channel}&device=${biliLocalId}\
&device_id=${this.deviceId}&device_name=${BilibiliToken.deviceName}&device_platform=${BilibiliToken.devicePlatform}&fingerprint=${fingerprint}&guid=${buvid}\
&local_fingerprint=${fingerprint}&local_id=${buvid}&mobi_app=${BilibiliToken.mobiApp}&networkstate=${BilibiliToken.networkstate}&platform=${BilibiliToken.platform}`
  }
  /**
   * 对参数签名
   *
   * @static
   * @param {string} params
   * @param {boolean} [ts=true]
   * @returns {string}
   * @memberof BilibiliToken
   */
  public static signQuery(params: string, ts = true): string {
    let paramsSort = params
    if (ts) paramsSort = `${params}&ts=${this.TS}`
    paramsSort = paramsSort.split('&').sort().join('&')
    const paramsSecret = paramsSort + this.__secretKey
    const paramsHash = md5(paramsSecret)
    return `${paramsSort}&sign=${paramsHash}`
  }
  /**
   * 对登录参数加参后签名
   *
   * @static
   * @param {string} [params]
   * @returns {string}
   * @memberof BilibiliToken
   */
  public static signLoginQuery(params?: string): string {
    const paramsBase = params === undefined ? this.loginQuery : `${params}&${this.loginQuery}`
    return this.signQuery(paramsBase)
  }
  /**
   * 对登录参数加参后签名
   *
   * @param {string} [params]
   * @returns {string}
   * @memberof BilibiliToken
   */
  public signLoginQuery(params?: string): string {
    const paramsBase = params === undefined ? this.loginQuery : `${params}&${this.loginQuery}`
    return BilibiliToken.signQuery(paramsBase)
  }
  /**
   * 获取二维码
   *
   * @returns {(Promise<string | void>)}
   * @memberof BilibiliToken
   */
  public async getAuthCode(): Promise<string | void> {
    const authCode = await XHR<authCode>({
      GM: true,
      anonymous: true,
      method: 'POST',
      url: 'https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code',
      data: this.signLoginQuery(),
      responseType: 'json',
      headers: this.headers
    })
    if (authCode !== undefined && authCode.response.status === 200 && authCode.body.code === 0) return authCode.body.data.auth_code
    return console.error('getAuthCode', authCode)
  }
  /**
   * 确认二维码
   *
   * @param {string} authCode
   * @param {string} csrf
   * @returns {(Promise<string | void>)}
   * @memberof BilibiliToken
   */
  public async qrcodeConfirm(authCode: string, csrf: string): Promise<string | void> {
    const confirm = await XHR<confirm>({
      GM: true,
      method: 'POST',
      url: 'https://passport.bilibili.com/x/passport-tv-login/h5/qrcode/confirm',
      data: `auth_code=${authCode}&csrf=${csrf}`,
      responseType: 'json',
      headers: this.headers
    })
    if (confirm !== undefined && confirm.response.status === 200 && confirm.body.code === 0) return confirm.body.data.gourl
    return console.error('qrcodeConfirm', confirm)
  }
  /**
   * 取得token
   *
   * @param {string} authCode
   * @returns {(Promise<pollData | void>)}
   * @memberof BilibiliToken
   */
  public async qrcodePoll(authCode: string): Promise<pollData | void> {
    const poll = await XHR<poll>({
      GM: true,
      anonymous: true,
      method: 'POST',
      url: 'https://passport.bilibili.com/x/passport-tv-login/qrcode/poll',
      data: this.signLoginQuery(`auth_code=${authCode}`),
      responseType: 'json',
      headers: this.headers
    })
    if (poll !== undefined && poll.response.status === 200 && poll.body.code === 0) return poll.body.data
    return console.error('qrcodePoll', poll)
  }
  /**
   * 获取此时浏览器登录账号token
   *
   * @returns {(Promise<pollData | void>)}
   * @memberof BilibiliToken
   */
  public async getToken(): Promise<pollData | void> {
    const cookie = this._W.document.cookie.match(/bili_jct=(?<csrf>.*?);/)
    if (cookie === null || cookie.groups === undefined) return console.error('getToken', 'cookie获取失败')
    const csrf = cookie.groups['csrf']
    const authCode = await this.getAuthCode()
    if (authCode === undefined) return
    const confirm = await this.qrcodeConfirm(authCode, csrf)
    if (confirm === undefined) return
    const token = await this.qrcodePoll(authCode)
    if (token === undefined) return
    return token
  }
}
/**
 * 使用Promise封装xhr
 * 因为上下文问题, GM_xmlhttpRequest为单独一项
 * fetch和GM_xmlhttpRequest兼容过于复杂, 所以使用XMLHttpRequest
 * 
 * @template T 
 * @param {XHROptions} XHROptions 
 * @returns {(Promise<response<T> | undefined>)} 
 */
function XHR<T>(XHROptions: XHROptions): Promise<response<T> | undefined> {
  return new Promise(resolve => {
    const onerror = (error: any) => {
      console.error(error)
      resolve(undefined)
    }
    if (XHROptions.GM) {
      if (XHROptions.method === 'POST') {
        if (XHROptions.headers === undefined) XHROptions.headers = {}
        if (XHROptions.headers['Content-Type'] === undefined)
          XHROptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8'
      }
      XHROptions.timeout = 30 * 1000
      XHROptions.onload = res => resolve({ response: res, body: res.response })
      XHROptions.onerror = onerror
      XHROptions.ontimeout = onerror
      GM_xmlhttpRequest(XHROptions)
    }
    else {
      const xhr = new XMLHttpRequest()
      xhr.open(XHROptions.method, XHROptions.url)
      if (XHROptions.method === 'POST' && xhr.getResponseHeader('Content-Type') === null)
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8')
      if (XHROptions.cookie) xhr.withCredentials = true
      if (XHROptions.responseType !== undefined) xhr.responseType = XHROptions.responseType
      xhr.timeout = 30 * 1000
      xhr.onload = ev => {
        const res = <XMLHttpRequest>ev.target
        resolve({ response: res, body: res.response })
      }
      xhr.onerror = onerror
      xhr.ontimeout = onerror
      xhr.send(XHROptions.data)
    }
  })
}

export default BilibiliToken