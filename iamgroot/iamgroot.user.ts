// ==UserScript==
// @name        I am Groot!
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.3
// @author      lzghzr
// @description I am Groot!
// @match       http://*/*
// @match       https://*/*
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libReplaceText/libReplaceText.user.js?v=0.0.5
// @license     MIT
// @grant       none
// @run-at      document-start
// ==/UserScript==
import ReplaceText from '../libReplaceText/libReplaceText.user'

new ReplaceText([[/.*/g, 'I am Groot!']], 'match')