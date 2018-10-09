// ==UserScript==
// @name        I am Groot!
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.4
// @author      lzghzr
// @description I am Groot!
// @match       http://*/*
// @match       https://*/*
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libReplaceText/libReplaceText.user.js?v=0.0.6
// @license     MIT
// @grant       none
// @run-at      document-start
// ==/UserScript==
import ReplaceText from '../libReplaceText/libReplaceText.user'

new ReplaceText([[/^[\s\S]*$/g, 'I am Groot!']], 'match')