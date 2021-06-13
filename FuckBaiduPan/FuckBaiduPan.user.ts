// ==UserScript==
// @name        FuckBaiduPan
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.3
// @author      lzghzr
// @description FuckBaiduPan
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @match       *://pan.baidu.com/*
// @match       *://yun.baidu.com/*
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
/// <reference path="FuckBaiduPan.d.ts" />
export { }

const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow

W.require = new Proxy(W.require, {
  apply: function (target, _this, args) {
    if (args[0] === 'function-widget-1:share/util/newShare/linkSetting.js') {
      const share = target([...args])
      Reflect.defineProperty(share, 'makePrivatePassword', {
        value: () => prompt('请输入自定义的密码', 'null')
      })
      return share
    }
    return Reflect.apply(target, _this, args)
  }
})