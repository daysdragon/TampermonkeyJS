// ==UserScript==
// @name        I am groot!
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.2
// @author      lzghzr
// @description I am groot!
// @match       http://*/*
// @match       https://*/*
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libReplaceText/libReplaceText.user.js
// @license     MIT
// @grant       none
// @run-at      document-start
// ==/UserScript==
import ReplaceText from '../libReplaceText/libReplaceText.user'

new ReplaceText([[/.*/g, 'I am groot!']], 'match')