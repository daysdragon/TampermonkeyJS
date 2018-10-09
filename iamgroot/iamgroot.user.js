// ==UserScript==
// @name        I am Groot!
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.2
// @author      lzghzr
// @description I am Groot!
// @match       http://*/*
// @match       https://*/*
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libReplaceText/libReplaceText.user.js
// @license     MIT
// @grant       none
// @run-at      document-start
// ==/UserScript==
new ReplaceText([[/.*/g, 'I am Groot!']], 'match');