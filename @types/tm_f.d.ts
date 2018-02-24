// https://tampermonkey.net/documentation.php

/**
 * Adds the given style to the document and returns the injected style element.
 * 
 * @param {string} css 
 * @returns {HTMLStyleElement} 
 */
declare function GM_addStyle(css: string): HTMLStyleElement

/**
 * Deletes 'name' from storage.
 * 
 * @param {string} name 
 */
declare function GM_deleteValue(name: string): void

/**
 * List all names of the storage.
 * 
 * @returns {string[]} 
 */
declare function GM_listValues(): string[]

/**
 * Adds a change listener to the storage and returns the listener ID. 
 * 'name' is the name of the observed variable. 
 * The 'remote' argument of the callback function shows whether this value was modified from the instance of another tab (true) or within this script instance (false). 
 * Therefore this functionality can be used by scripts of different browser tabs to communicate with each other.
 * 
 * @param {string} name 
 * @param {(name: string, old_value: any, new_value: any, remote: boolean) => void} callback 
 * @returns {number} 
 */
declare function GM_addValueChangeListener(name: string, callback: (name: string, old_value: any, new_value: any, remote: boolean) => void): number

/**
 * Removes a change listener by its ID.
 * 
 * @param {number} listener_id 
 */
declare function GM_removeValueChangeListener(listener_id: number): void

/**
 * Set the value of 'name' to the storage.
 * 
 * @param {string} name 
 * @param {*} value 
 */
declare function GM_setValue(name: string, value: any): void

/**
 * Get the value of 'name' from storage.
 * 
 * @param {string} name 
 * @param {*} [defaultValue] 
 * @returns {*} 
 */
declare function GM_getValue(name: string, defaultValue?: any): any

/**
 * Log a message to the console.
 * 
 * @param {*} message 
 */
declare function GM_log(message: any): void

/**
 * Get the content of a predefined @resource tag at the script header.
 * 
 * @param {string} name 
 * @returns {string} 
 */
declare function GM_getResourceText(name: string): string

/**
 * Get the base64 encoded URI of a predefined @resource tag at the script header.
 * 
 * @param {string} name 
 * @returns {string} 
 */
declare function GM_getResourceURL(name: string): string

/**
 * Register a menu to be displayed at the Tampermonkey menu at pages where this script runs and returns a menu command ID.
 * 
 * @param {string} name 
 * @param {() => void} fn 
 * @param {string} [accessKey] 
 * @returns {number} 
 */
declare function GM_registerMenuCommand(name: string, fn: () => void, accessKey?: string): number

/**
 * Unregister a menu command that was previously registered by GM_registerMenuCommand with the given menu command ID.
 * 
 * @param {number} menuCmdId 
 */
declare function GM_unregisterMenuCommand(menuCmdId: number): void

/**
 * Open a new tab with this url.
 * 
 * @param {string} url 
 * @param {GMOpenInTabOptions} [options] 
 * @returns {GMOpenInTabRetuens} 
 */
declare function GM_openInTab(url: string, options?: GMOpenInTabOptions): GMOpenInTabRetuens
declare function GM_openInTab(url: string, loadInBackground?: boolean): GMOpenInTabRetuens

/**
 * Make an xmlHttpRequest.
 * 
 * @param {GMXMLHttpRequestOptions} details 
 * @returns {GMXMLHttpRequestReturns} 
 */
declare function GM_xmlhttpRequest(details: GMXMLHttpRequestOptions): GMXMLHttpRequestReturns

/**
 * Downloads a given URL to the local disk.
 * 
 * @param {GMDownloadOptions} details 
 * @returns {GMDownloadReturns} 
 */
declare function GM_download(details: GMDownloadOptions): GMDownloadReturns
declare function GM_download(url: string, name: string): GMDownloadReturns

/**
 * Get a Object that is persistent as long as this tab is open.
 * 
 * @param {(tab: any) => void} cb 
 */
declare function GM_getTab(cb: (tab: any) => void): void

/**
 * Save the tab Object to reopen it after a page unload.
 * 
 * @param {*} tab 
 */
declare function GM_saveTab(tab: any): void

/**
 * Get all tab Objects as a hash to communicate with other script instances.
 * 
 * @param {(tabs: { [index: number]: any }) => void} cb 
 */
declare function GM_getTabs(cb: (tabs: { [index: number]: any }) => void): void

/**
 * Shows a HTML5 Desktop notification and/or highlight the current tab.
 * 
 * @param {GMNotificationOptions} details 
 * @param {(click: boolean) => void} [ondone] 
 */
declare function GM_notification(details: GMNotificationOptions, ondone?: (click: boolean) => void): void
declare function GM_notification(text: string, title?: string, image?: string, onclick?: () => void): void

/**
 * Copies data into the clipboard. The parameter 'info' can be an Object like "{ type: 'text', mimetype: 'text/plain'}" or just a string expressing the type ("text" or "html").
 * 
 * @param {string} data 
 * @param {(GMSetClipboardInfo | string)} info 
 */
declare function GM_setClipboard(data: string, info: GMSetClipboardInfo | string): void

export {
  GM_addStyle,
  GM_deleteValue,
  GM_listValues,
  GM_addValueChangeListener,
  GM_removeValueChangeListener,
  GM_setValue,
  GM_getValue,
  GM_log,
  GM_getResourceText,
  GM_getResourceURL,
  GM_registerMenuCommand,
  GM_unregisterMenuCommand,
  GM_openInTab,
  GM_xmlhttpRequest,
  GM_download,
  GM_getTab,
  GM_saveTab,
  GM_getTabs,
  GM_notification,
  GM_setClipboard
}