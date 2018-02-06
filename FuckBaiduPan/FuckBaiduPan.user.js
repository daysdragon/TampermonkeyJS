// ==UserScript==
// @name        FuckBaiduPan
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.2
// @author      lzghzr
// @description FuckBaiduPan
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @match       *://pan.baidu.com/*
// @match       *://yun.baidu.com/*
// @license     MIT
// @grant       none
// @run-at      document-start
// ==/UserScript==
"use strict";
{
    Reflect.defineProperty(window.navigator, 'platform', { value: 'iPad' });
    window.addEventListener('load', () => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    if (addedNode.id === 'share') {
                        const share = window.require(['function-widget-1:share/util/shareFriend/createLinkShare.js']);
                        Reflect.defineProperty(share.prototype, 'makePrivatePassword', {
                            value: () => prompt('请输入自定义的密码', 'null')
                        });
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true });
    });
}
