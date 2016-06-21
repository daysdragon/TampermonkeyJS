// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.1
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
'use strict'

class SteamCardMaximumProfit {
  /**
   * 最大化steam卡牌卖出的利润
   */
  constructor() {
    this._D = document
    this._W = unsafeWindow
  }
  /**
   * 加载程序
   */
  Run() {
    this._AddInput()
    this._Listener()
  }
  /**
   * 添加汇率输入框
   */
  _AddInput() {
    let divInventoryPagecontrols = this._D.querySelector('#inventory_pagecontrols')
    this._inputUSDCNY = this._D.createElement('input')
    this._inputUSDCNY.className = 'filter_search_box'
    this._inputUSDCNY.style.cssText = 'width: 5em; float: right'
    this._inputUSDCNY.value = 6.50
    divInventoryPagecontrols.parentNode.insertBefore(this._inputUSDCNY, divInventoryPagecontrols)
    // 在线获取实时汇率
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'http://data.forex.hexun.com/data/breedExch_bing.ashx?currency1=%c3%c0%d4%aa&currency2=%c8%cb%c3%f1%b1%d2%d4%aa&format=json&callback=currencyExchange',
      onload: (res) => {
        if (res.status == 200) {
          this._inputUSDCNY.value = res.responseText.match(/refePrice:'([^']{5})/)[1]
        }
      }
    })
  }
  /**
   * 添加监听
   */
  _Listener() {
    this._D.addEventListener('click', (e) => {
      if (e.target.className == 'inventory_item_link') {
        // 为了兼容火狐
        this._item = (typeof (wrappedJSObject) == 'undefined') ? e.target.parentNode['rgItem'] : e.target.parentNode.wrappedJSObject['rgItem']
        this._GetPriceOverview()
      }
      else if (e.target.id == 'quick_sell_item') {
        let price = this._W.GetPriceValueAsInt(e.target.innerHTML)
        this._QuickSellItem(price, e.target)
      }
    })
  }
  /**
   * 获取美元区价格
   */
  _GetPriceOverview() {
    if (this._item.marketable != 1) return
    let xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `/market/priceoverview/?country=US&currency=1&appid=${this._item.appid}&market_hash_name=${encodeURIComponent(this._W.GetMarketHashName(this._item))}`,
      true
    )
    xhr.responseType = 'json'
    xhr.send()
    xhr.onload = (res) => {
      if (res.target.status == 200 && res.target.response.success && res.target.response.lowest_price) {
        // 对$进行处理, 否则会报错
        let lowestPrice = res.target.response.lowest_price.replace('$', '')
        this._GetPrice(lowestPrice)
      }
      else {
        // steam对于价格获取频率有限制, 不得不通过抓取商店页面来获取价格
        this._GetListings()
      }
    }
  }
  /**
   * 抓取商店界面
   */
  _GetListings() {
    let xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `/market/listings/${this._item.appid}/${encodeURIComponent(this._W.GetMarketHashName(this._item))}`,
      true
    )
    xhr.send()
    xhr.onload = (res) => {
      if (res.target.status == 200) {
        // 解析出item_nameid
        let nameid = res.target.responseText.match(/Market_LoadOrderSpread\( (\d+)/)[1]
        this._GetItemOrdersHistogram(nameid)
      }
    }
  }
  /**
   * 获取商店价格排序
   * 
   * @param {string} nameid
   */
  _GetItemOrdersHistogram(nameid) {
    let xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=${nameid}&two_factor=0`,
      true
    )
    xhr.responseType = 'json'
    xhr.send()
    xhr.onload = (res) => {
      if (res.target.status == 200 && res.target.response.success) {
        // 转换为带有一个空格的字符串
        let lowestPrice = ' ' + res.target.response.sell_order_graph[0][0]
        this._GetPrice(lowestPrice)
      }
    }
  }
  /**
   * 计算价格并显示
   * 
   * @param {string} lowestPrice 美元区最低价
   */
  _GetPrice(lowestPrice) {
    // 格式化取整
    let firstPrice = this._W.GetPriceValueAsInt(lowestPrice)
    // 手续费
    let publisherFee = (undefined == this._item.market_fee) ? this._W.g_rgWalletInfo['wallet_publisher_fee_percent_default'] : this._item.market_fee
    let feeInfo = this._W.CalculateFeeAmount(firstPrice, publisherFee)
    firstPrice = firstPrice - feeInfo.fees
    // 美元区+1美分
    let secondPrice = Math.floor((firstPrice + 1) * this._inputUSDCNY.value)
    // 格式化
    secondPrice = this._W.v_currencyformat(secondPrice, this._W.GetCurrencyCode(this._W.g_rgWalletInfo['wallet_currency']))
    // 换算成人民币
    firstPrice = Math.floor(firstPrice * this._inputUSDCNY.value)
    firstPrice = this._W.v_currencyformat(firstPrice, this._W.GetCurrencyCode(this._W.g_rgWalletInfo['wallet_currency']))
    // 显示输出
    let div = this._D.createElement('div')
    div.style.margin = '0 1em 1em'
    div.innerHTML = `建议最低售价: <span class="btn_green_white_innerfade" id="quick_sell_item" >${firstPrice}</span>&nbsp<span class="btn_green_white_innerfade" id="quick_sell_item" >${secondPrice}</span>`
    let iteminfo = this._D.querySelector(`#iteminfo${this._W.iActiveSelectView}_item_market_actions`)
    iteminfo.insertBefore(div, iteminfo.lastChild)
  }
  /**
   * 快速出售
   * 
   * @param {number} price 价格
   * @param {HTMLElement} ele
   */
  _QuickSellItem(price, ele) {
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
    xhr.send(`sessionid=${this._W.g_sessionID}&appid=${this._item.appid}&contextid=${this._item.contextid}&assetid=${this._item.id}&amount=1&price=${price}`)
    xhr.onload = (res) => {
      if (res.target.status == 200 && res.target.response.success) {
        ele.innerHTML = 'OK'
      }
    }
  }
}
const app = new SteamCardMaximumProfit()
app.Run()