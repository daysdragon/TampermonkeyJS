// ==UserScript==
// @name        BiliveClientHeart
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.2
// @author      lzghzr
// @description B站直播客户端心跳
// @include     /^https?:\/\/live\.bilibili\.com\/(?:blanc\/)?\d/
// @connect     passport.bilibili.com
// @connect     api.live.bilibili.com
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libBilibiliToken/libBilibiliToken.user.js?v=0.0.3
// @license     MIT
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
/// <reference path="BiliveClientHeart.d.ts" />
import BilibiliToken from '../libBilibiliToken/libBilibiliToken.user'
import { GM_getValue, GM_setValue, GM_xmlhttpRequest } from '../@types/tm_f'

  ;
(async () => {
  // BilibiliLive写入较慢, 需要等一会儿
  await Sleep(5000)
  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow

  if (W.BilibiliLive === undefined) return console.error(GM_info.script.name, '未获取到uid')
  const uid: number = W.BilibiliLive.UID
  if (uid === 0) return console.error(GM_info.script.name, '未获取到uid')
  // 利用libBilibiliToken实现一些客户端功能
  const appToken = new BilibiliToken()
  const baseQuery = `actionKey=appkey&appkey=${BilibiliToken.appKey}&build=5561000&channel=bili&device=android&mobi_app=android&platform=android&statistics=%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%225.57.0%22%2C%22abtest%22%3A%22%22%7D`
  // 可以直接保存json, 这里只是习惯
  let tokenData = <BiliveClientHeartConfig>JSON.parse(GM_getValue('userToken', '{}'))
  const setToken = async () => {
    const userToken = await appToken.getToken()
    if (userToken === undefined) return console.error(GM_info.script.name, '未获取到token')
    tokenData = userToken
    GM_setValue('userToken', JSON.stringify(tokenData))
    return 'OK'
  }
  const getInfo = () => XHR<userinfo>({
    GM: true,
    anonymous: true,
    method: 'GET',
    url: `https://passport.bilibili.com/x/passport-login/oauth2/info?${appToken.signLoginQuery(`access_key=${tokenData.access_token}`)}`,
    responseType: 'json',
    headers: appToken.headers
  })
  const mobileOnline = () => XHR<mobileOnline>({
    GM: true,
    anonymous: true,
    method: 'POST',
    url: `https://api.live.bilibili.com/heartbeat/v1/OnLine/mobileOnline?${BilibiliToken.signQuery(`access_key=${tokenData.access_token}&${baseQuery}`)}`,
    data: `room_id=${W.BilibiliLive.ROOMID}&scale=xxhdpi`,
    responseType: 'json',
    headers: appToken.headers
  })
  if (tokenData.access_token === undefined && await setToken() === undefined) return
  else {
    const userInfo = await getInfo()
    if (userInfo === undefined) return console.error(GM_info.script.name, '获取用户信息错误')
    if (userInfo.body.code !== 0 && await setToken() === undefined) return
    else if (userInfo.body.data.mid !== uid && await setToken() === undefined) return
  }
  console.log(GM_info.script.name, '开始客户端心跳')
  mobileOnline()
  setInterval(() => mobileOnline(), 5 * 60 * 1000)
})()
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
      console.error(GM_info.script.name, error)
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
/**
 *
 * @param {number} ms
 * @returns {Promise<'sleep'>}
 */
function Sleep(ms: number): Promise<'sleep'> {
  return new Promise<'sleep'>(resolve => setTimeout(() => resolve('sleep'), ms))
}