// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.6
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
'use strict'

/**
 * 最大化steam卡牌卖出的利润
 * 
 * @class SteamCardMaximumProfit
 */
class SteamCardMaximumProfit {
  /**
   * Creates an instance of SteamCardMaximumProfit.
   * 
   */
  constructor() {
    this.D = document
    this.W = (typeof unsafeWindow === 'undefined') ? window : unsafeWindow
  }
  private D: Document
  private W: unsafeWindow
  private inputUSDCNY: HTMLInputElement
  private divItems: HTMLDivElement[] = []
  private lastChecked: HTMLDivElement
  private quickSells: { itemInfo: rgItem, price: number }[] = []
  private quickSurplus: HTMLSpanElement
  private quickError: HTMLSpanElement
  /**
   * 加载程序
   */
  public Run() {
    let elmActiveInventoryPage = this.D.querySelector('#active_inventory_page')
    // 创建观察者对象
    let observer = new MutationObserver((rec) => {
      if (location.hash.match(/^#753|^$/) === null || rec[0].oldValue !== 'display: none;') return
      this.AddUI()
      this.Listener()
      this.QuickSellItem()
      observer.disconnect()
    })
    // 传入目标节点和观察选项
    observer.observe(elmActiveInventoryPage, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] })
  }
  /**
   * 添加样式, 复选框和汇率输入框
   * 
   * @private
   */
  private AddUI() {
    // 样式
    let elmStyle = this.D.createElement('style')
    elmStyle.type = 'text/css'
    elmStyle.innerHTML = '\
.scmpItemSelect {\
  background: yellow;\
}\
.scmpItemRun {\
  background: blue;\
}\
.scmpItemSuccess {\
  background: green;\
}\
.scmpItemError {\
  background: red;\
}\
#scmpItemCheckbox {\
  position: absolute;\
  z-index: 100;\
  top: 0;\
  left: 0;\
  width: 20px;\
  height: 20px;\
  border: 2px solid yellow;\
  opacity: 0.7;\
  cursor: default;\
}\
#scmpItemCheckbox:hover {\
  opacity: 1;\
}\
#scmpQuickSell {\
  margin: 0px 1em 1em;\
}\
#scmpExch {\
  width: 5em;\
}'
    this.D.querySelector('body').appendChild(elmStyle)
    // 有点丑
    let elmItems = this.D.querySelectorAll('.itemHolder') as NodeListOf<HTMLDivElement>
    for (let i = 0; i < elmItems.length; i++) {
      let iteminfo = this.GetRgItem(elmItems[i])
      if (typeof iteminfo !== 'undefined' && iteminfo.appid.toString() === '753' && iteminfo.marketable === 1) {
        this.divItems.push(iteminfo.element)
        // 选择框
        let elmDiv = this.D.createElement('div')
        elmDiv.id = 'scmpItemCheckbox'
        iteminfo.element.appendChild(elmDiv)
      }
    }
    // 汇率输入框
    let elmInventoryPageRight = this.D.querySelector('.inventory_page_right') as HTMLDivElement
    let elmDiv = this.D.createElement('div')
    elmDiv.innerHTML = '\
<div>\
  <span>汇率: </span>\
  <input class="filter_search_box" id="scmpExch" type="text">\
  <span class="btn_green_white_innerfade" id="scmpQuickAllItem">快速出售</span><span> 剩余: <span id="scmpQuickSurplus">0</span> 失败: <span id="scmpQuickError">0</span></span>\
</div>'
    elmInventoryPageRight.appendChild(elmDiv)

    this.quickSurplus = this.D.querySelector('#scmpQuickSurplus') as HTMLSpanElement
    this.quickError = this.D.querySelector('#scmpQuickError') as HTMLSpanElement
    // 改变汇率
    this.inputUSDCNY = this.D.querySelector('#scmpExch') as HTMLInputElement
    this.inputUSDCNY.value = '6.50'
    // 在线获取实时汇率
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'http://data.forex.hexun.com/data/breedExch_bing.ashx?currency1=%c3%c0%d4%aa&currency2=%c8%cb%c3%f1%b1%d2%d4%aa&format=json&callback=currencyExchange',
      onload: (res) => {
        if (res.status === 200) {
          this.inputUSDCNY.value = res.responseText.match(/refePrice:'([^']{5})/)[1]
        }
      }
    })
  }
  /**
   * 添加监听
   * 
   * @private
   */
  private Listener() {
    this.D.addEventListener('click', (e) => {
      let evt = e.target as HTMLElement
      // 点击物品
      if (evt.className === 'inventory_item_link') {
        let itemInfo = this.GetRgItem(evt.parentNode as HTMLDivElement)
        this.GetPriceOverview(itemInfo)
      }
      // 选择逻辑
      else if (evt.id === 'scmpItemCheckbox') {
        let itemInfo = this.GetRgItem(evt.parentNode as HTMLDivElement)
        let select = evt.classList.contains('scmpItemSelect')
        if (typeof this.lastChecked !== 'undefined' && e.shiftKey) {
          let start = this.divItems.indexOf(this.lastChecked)
          let end = this.divItems.indexOf(itemInfo.element)
          let someDivItems = this.divItems.slice(Math.min(start, end), Math.max(start, end) + 1)
          for (let x of someDivItems) {
            ChangeClass(x)
          }
        }
        else {
          ChangeClass(itemInfo.element)
        }
        this.lastChecked = itemInfo.element
        /**
         * 改变背景
         * 
         * @param {HTMLDivElement} elmDiv
         */
        function ChangeClass(elmDiv:HTMLDivElement) {
          let elmCheckbox = elmDiv.querySelector('#scmpItemCheckbox')
          if (elmCheckbox.classList.contains('scmpItemSuccess')) return
          elmCheckbox.classList.remove('scmpItemError')
          elmCheckbox.classList.toggle('scmpItemSelect', !select)
        }
      }
      // 点击快速出售
      else if (evt.id === 'scmpQuickSellItem') {
        let itemInfo = this.GetRgItem(this.D.querySelector('.activeInfo') as HTMLDivElement)
        if (itemInfo.element.querySelector('#scmpItemCheckbox').classList.contains('scmpItemSuccess')) return
        let price = this.W.GetPriceValueAsInt(evt.innerHTML)
        this.quickSells.push({ itemInfo, price })
      }
      // 点击全部出售
      else if (evt.id === 'scmpQuickAllItem') {
        let iteminfos = this.D.querySelectorAll('.scmpItemSelect')
        for (let i = 0; i < iteminfos.length; i++) {
          let itemInfo = this.GetRgItem(iteminfos[i].parentNode as HTMLDivElement)
          this.GetPriceOverview(itemInfo, true)
        }
      }
    })
  }
  /**
   * 获取美元区价格, 为了兼容还是采用回调的方式
   * 
   * @private
   * @param {rgItem} itemInfo
   * @param {boolean} [quick=false]
   */
  private GetPriceOverview(itemInfo: rgItem, quick = false) {
    if (itemInfo.marketable !== 1) return
    let xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `/market/priceoverview/?country=US&currency=1&appid=${itemInfo.appid}&market_hash_name=${encodeURIComponent(this.W.GetMarketHashName(itemInfo))}`,
      true
    )
    xhr.responseType = 'json'
    xhr.send()
    xhr.onload = (res) => {
      let evt = res.target as XMLHttpRequest
      if (evt.status === 200 && evt.response.success && evt.response.lowest_price) {
        // 对$进行处理, 否则会报错
        let lowestPrice = evt.response.lowest_price.replace('$', '')
        this.GetPrice(itemInfo, lowestPrice, quick)
      }
      else {
        // steam对于价格获取频率有限制, 不得不通过抓取商店页面来获取价格
        let xhr = new XMLHttpRequest()
        xhr.open(
          'GET',
          `/market/listings/${itemInfo.appid}/${encodeURIComponent(this.W.GetMarketHashName(itemInfo))}`,
          true
        )
        xhr.send()
        xhr.onload = (res) => {
          let evt = res.target as XMLHttpRequest
          if (evt.status === 200) {
            // 解析出item_nameid
            let nameid = evt.responseText.match(/Market_LoadOrderSpread\( (\d+)/)[1]
            let xhr = new XMLHttpRequest()
            xhr.open(
              'GET',
              `/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=${nameid}&two_factor=0`,
              true
            )
            xhr.responseType = 'json'
            xhr.send()
            xhr.onload = (res) => {
              let evt = res.target as XMLHttpRequest
              if (evt.status === 200 && evt.response.success) {
                // 转换为带有一个空格的字符串
                let lowestPrice = ' ' + evt.response.sell_order_graph[0][0]
                this.GetPrice(itemInfo, lowestPrice, quick)
              }
              else {
                this.QuickSellStatus(itemInfo, 'error')
              }
            }
          }
          else {
            this.QuickSellStatus(itemInfo, 'error')
          }
        }
      }
    }
  }
  /**
   * 计算价格
   * 
   * @private
   * @param {rgItem} itemInfo
   * @param {string} lowestPrice
   * @param {boolean} quick
   */
  private GetPrice(itemInfo: rgItem, lowestPrice: string, quick: boolean) {
    // 格式化取整
    let firstPrice = this.W.GetPriceValueAsInt(lowestPrice)
    // 手续费
    let publisherFee = (typeof itemInfo.market_fee === 'undefined') ? this.W.g_rgWalletInfo['wallet_publisher_fee_percent_default'] : itemInfo.market_fee
    let feeInfo = this.W.CalculateFeeAmount(firstPrice, publisherFee)
    firstPrice = firstPrice - feeInfo.fees
    // 美元区+1美分
    let secondPrice = Math.floor((firstPrice + 1) * parseFloat(this.inputUSDCNY.value))
    // 格式化
    let formatSecondPrice = this.W.v_currencyformat(secondPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo['wallet_currency']))
    // 换算成人民币
    firstPrice = Math.floor(firstPrice * parseFloat(this.inputUSDCNY.value))
    let formatFirstPrice = this.W.v_currencyformat(firstPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo['wallet_currency']))
    if (quick) {
      let price = firstPrice
      this.quickSells.push({ itemInfo, price })
    }
    else {
      // 显示输出
      let elmDiv = this.D.createElement('div')
      elmDiv.id = 'scmpQuickSell'
      elmDiv.innerHTML = `建议最低售价: <span class="btn_green_white_innerfade" id="scmpQuickSellItem" >${formatFirstPrice}</span>&nbsp<span class="btn_green_white_innerfade" id="scmpQuickSellItem" >${formatSecondPrice}</span>`
      let elmDivActions = this.D.querySelector(`#iteminfo${this.W.iActiveSelectView}_item_market_actions`) as HTMLDivElement
      elmDivActions.firstChild.appendChild(elmDiv)
    }
  }
  /**
   * 快速出售，目前采用轮询
   * 
   * @private
   */
  private QuickSellItem() {
    // 用了回调, 顺序触发就不好处理了, 所以轮询吧
    let quickSell = this.quickSells.shift()
    if (typeof quickSell !== 'undefined') {
      let itemInfo = quickSell.itemInfo
      let price = quickSell.price
      this.QuickSellStatus(itemInfo, 'run')
      let xhr = new XMLHttpRequest()
      xhr.open(
        'POST',
        'https://steamcommunity.com/market/sellitem/',
        true
      )
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      // 交易采用HTTPS, 有时会产生跨域问题
      xhr.withCredentials = true
      xhr.responseType = 'json'
      xhr.send(`sessionid=${this.W.g_sessionID}&appid=${itemInfo.appid}&contextid=${itemInfo.contextid}&assetid=${itemInfo.id}&amount=1&price=${price}`)
      xhr.onload = (res) => {
        this.QuickSellItem()
        let evt = res.target as XMLHttpRequest
        if (evt.status === 200 && evt.response.success) {
          this.QuickSellStatus(itemInfo, 'success')
        }
        else {
          this.QuickSellStatus(itemInfo, 'error')
        }
      }
    }
    else {
      setTimeout(() => {
        this.QuickSellItem()
      }, 1000);
    }
  }
  /**
   * 就是改一下框框
   * 
   * @private
   * @param {rgItem} itemInfo
   * @param {string} status
   */
  private QuickSellStatus(itemInfo: rgItem, status: string) {
    let elmCheckbox = itemInfo.element.querySelector('#scmpItemCheckbox')
    if (status === 'run') {
      this.quickSurplus.innerHTML = this.quickSells.length.toString()
      elmCheckbox.classList.remove('scmpItemError')
      elmCheckbox.classList.remove('scmpItemSelect')
      elmCheckbox.classList.add('scmpItemRun')
    }
    else if (status === 'success') {
      elmCheckbox.classList.remove('scmpItemError')
      elmCheckbox.classList.remove('scmpItemRun')
      elmCheckbox.classList.add('scmpItemSuccess')
    }
    else if (status === 'error') {
      this.quickError.innerHTML = (parseInt(this.quickError.innerHTML) + 1).toString()
      elmCheckbox.classList.remove('scmpItemRun')
      elmCheckbox.classList.add('scmpItemError')
      elmCheckbox.classList.add('scmpItemSelect')
    }
  }
  /**
   * 为了兼容火狐sandbox的wrappedJSObject
   * 
   * @private
   * @param {HTMLDivElement} elmDiv
   * @returns {rgItem}
   */
  private GetRgItem(elmDiv: HTMLDivElement): rgItem {
    return ('wrappedJSObject' in elmDiv) ? elmDiv.wrappedJSObject.rgItem : elmDiv.rgItem
  }
}
const app = new SteamCardMaximumProfit()
app.Run()

// 只是为了避免类型错误, 编译时会自动去除
interface rgItem {
  appid: string
  contextid: string
  element: HTMLDivElement
  id: string
  market_fee: string
  marketable: number
}
interface wrappedJSObject {
  rgItem: rgItem
}
interface Node {
  rgItem: rgItem
  wrappedJSObject: wrappedJSObject
}
interface FeeAmount {
  steam_fee: number
  publisher_fee: number
  fees: number
  amount: number
}
interface g_rgWalletInfo {
  wallet_country: string
  wallet_publisher_fee_percent_default: string
}
interface unsafeWindow {
  iActiveSelectView: number
  g_rgWalletInfo: g_rgWalletInfo
  g_sessionID: string
  CalculateFeeAmount(amount: number, publisherFee: string): FeeAmount
  GetCurrencyCode(currencyId: number): string
  GetMarketHashName(rgDescriptionData: rgItem): string
  GetPriceValueAsInt(strAmount: string): number
  v_currencyformat(valueInCents: number, currencyCode: string): string
}
