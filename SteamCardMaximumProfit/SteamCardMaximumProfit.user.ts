// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.15
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
/// <reference path="SteamCardMaximumProfit.d.ts" />
/**
 * 最大化steam卡牌卖出的利润
 * 
 * @class SteamCardMaximumProfit
 */
class SteamCardMaximumProfit {
  constructor() {
  }
  private _D = document
  private _W = unsafeWindow || window
  private _inputUSDCNY: HTMLInputElement
  private _divItems: HTMLDivElement[] = []
  private _divLastChecked: HTMLDivElement
  private _spanFirstPrice: HTMLSpanElement
  private _spanSecondPrice: HTMLSpanElement
  private _quickSells: itemInfo[] = []
  private _spanQuickSurplus: HTMLSpanElement
  private _spanQuickError: HTMLSpanElement
  /**
   * 加载程序
   * 
   * @memberOf SteamCardMaximumProfit
   */
  public Start() {
    let elmDivActiveInventoryPage = <HTMLDivElement>this._D.querySelector('#inventories')
    // 创建观察者对象
    let observer = new MutationObserver((rec) => {
      let display = false
      for (let i = 0; i < rec.length; i++) {
        let rgItem = rec[i].target.rgItem
        if (rgItem != null && rgItem.description.appid === 753 && rgItem.description.marketable === 1) {
          display = true
          break
        }
      }
      if (location.hash.match(/^#753|^$/) != null && display) {
        this._AddUI()
        this._Listener()
        this._DoLoop()
        observer.disconnect()
      }
    })
    // 传入目标节点和观察选项
    observer.observe(elmDivActiveInventoryPage, { childList: true, subtree: true })
  }
  /**
   * 添加样式, 复选框和汇率输入框
   * 
   * @private
   * @memberOf SteamCardMaximumProfit
   */
  private _AddUI() {
    // 样式
    let elmStyle = this._D.createElement('style')
    elmStyle.innerHTML = `
    .scmpItemSelect {
      background: yellow;
    }
    .scmpItemRun {
      background: blue;
    }
    .scmpItemSuccess {
      background: green;
    }
    .scmpItemError {
      background: red;
    }
    .scmpQuickSell {
      margin: 0 0 1em;
    }
    .scmpItemCheckbox {
      position: absolute;
      z-index: 100;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border: 2px solid yellow;
      opacity: 0.7;
      cursor: default;
    }
    .scmpItemCheckbox:hover {
      opacity: 1;
    }
    #scmpExch {
      width: 5em;
    }`
    this._D.querySelector('body').appendChild(elmStyle)
    // 有点丑的复选框
    let elmDivItems = <NodeListOf<HTMLDivElement>>this._D.querySelectorAll('.itemHolder')
    for (let i = 0; i < elmDivItems.length; i++) {
      let rgItem = this._GetRgItem(elmDivItems[i])
      if (rgItem != null && rgItem.description.appid === 753 && rgItem.description.marketable === 1) {
        this._divItems.push(rgItem.element)
        // 选择框
        let elmDiv = this._D.createElement('div')
        elmDiv.classList.add('scmpItemCheckbox')
        rgItem.element.appendChild(elmDiv)
      }
    }
    // 插入快速出售按钮
    let elmDivInventoryPageRight = <HTMLDivElement>this._D.querySelector('.inventory_page_right')
    let elmDiv = this._D.createElement('div')
    elmDiv.innerHTML = `
    <div class="scmpQuickSell">建议最低售价: <span class="btn_green_white_innerfade scmpQuickSellItem">null</span> <span class="btn_green_white_innerfade scmpQuickSellItem">null</span></div>
    <div>汇率: <input class="filter_search_box" id="scmpExch" type="text"><span class="btn_green_white_innerfade" id="scmpQuickAllItem">快速出售</span> 剩余: <span id="scmpQuickSurplus">0</span> 失败: <span id="scmpQuickError">0</span></div>`
    elmDivInventoryPageRight.appendChild(elmDiv)
    // 获取快速出售按钮
    let elmSpanQuickSellItems = <NodeListOf<HTMLSpanElement>>elmDiv.querySelectorAll('.scmpQuickSellItem')
    this._spanFirstPrice = elmSpanQuickSellItems[0]
    this._spanSecondPrice = elmSpanQuickSellItems[1]
    this._spanQuickSurplus = <HTMLSpanElement>elmDiv.querySelector('#scmpQuickSurplus')
    this._spanQuickError = <HTMLSpanElement>elmDiv.querySelector('#scmpQuickError')
    // 改变汇率
    this._inputUSDCNY = <HTMLInputElement>elmDiv.querySelector('#scmpExch')
    this._inputUSDCNY.value = '6.50'
    // 在线获取实时汇率
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=1%E7%BE%8E%E5%85%83%E7%AD%89%E4%BA%8E%E5%A4%9A%E5%B0%91%E4%BA%BA%E6%B0%91%E5%B8%81&resource_id=6017&t=${Date.now()}&ie=utf8&oe=utf8&format=json&tn=baidu`,
      responseType: 'json',
      onload: (res) => {
        if (res.status === 200 && (<baiduExch>res.response).status === '0') this._inputUSDCNY.value = (<baiduExch>res.response).data[0].number2
      }
    })
  }
  /**
   * 添加监听
   * 
   * @private
   * @memberOf SteamCardMaximumProfit
   */
  private _Listener() {
    this._D.addEventListener('click', (ev: MouseEvent) => {
      let evt = <HTMLElement>ev.target
      // 点击物品
      if (evt.className === 'inventory_item_link') {
        this._spanFirstPrice.innerText = 'null'
        this._spanSecondPrice.innerText = 'null'
        let rgItem = this._GetRgItem(<HTMLDivElement>evt.parentNode)
        this._GetPriceOverview({ rgItem })
          .then((resolve) => {
            this._spanFirstPrice.innerText = <string>resolve.firstFormatPrice
            this._spanSecondPrice.innerText = <string>resolve.secondFormatPrice
          })
          .catch((reject) => {
            reject.status = 'error'
            this._QuickSellStatus(reject)
          })
      }
      // 选择逻辑
      else if (evt.classList.contains('scmpItemCheckbox')) {
        let rgItem = this._GetRgItem(<HTMLDivElement>evt.parentNode)
        let select = evt.classList.contains('scmpItemSelect')
        // 改变背景
        let ChangeClass = (elmDiv: HTMLDivElement) => {
          let elmCheckbox = elmDiv.querySelector('.scmpItemCheckbox')
          if (elmCheckbox.classList.contains('scmpItemSuccess') === false) {
            elmCheckbox.classList.remove('scmpItemError')
            elmCheckbox.classList.toggle('scmpItemSelect', !select)
          }
        }
        // shift多选
        if (this._divLastChecked !== undefined && ev.shiftKey) {
          let start = this._divItems.indexOf(this._divLastChecked)
          let end = this._divItems.indexOf(rgItem.element)
          let someDivItems = this._divItems.slice(Math.min(start, end), Math.max(start, end) + 1)
          for (let y of someDivItems) { ChangeClass(y) }
        }
        else {
          ChangeClass(rgItem.element)
        }
        this._divLastChecked = rgItem.element
      }
    })
    // 点击快速出售
    let elmDivQuickSellItem = this._D.querySelectorAll('.scmpQuickSellItem')
    for (let i = 0; i < elmDivQuickSellItem.length; i++) {
      elmDivQuickSellItem[i].addEventListener('click', (ev) => {
        let evt = <HTMLSpanElement>ev.target
        let rgItem = this._GetRgItem(<HTMLDivElement>this._D.querySelector('.activeInfo'))
        if (rgItem.element.querySelector('.scmpItemCheckbox').classList.contains('scmpItemSuccess') === false && evt.innerText != 'null') {
          let price = this._W.GetPriceValueAsInt(evt.innerText)
          this._QuickSellItem({ rgItem, price })
        }
      })
    }
    // 点击全部出售
    this._D.querySelector('#scmpQuickAllItem').addEventListener('click', () => {
      let itemInfos = this._D.querySelectorAll('.scmpItemSelect')
      for (let i = 0; i < itemInfos.length; i++) {
        let rgItem = this._GetRgItem(<HTMLDivElement>itemInfos[i].parentNode)
        if (rgItem.description.marketable === 1) {
          this._GetPriceOverview({ rgItem })
            .then((resolve) => {
              this._quickSells.push(resolve)
            })
        }
      }
    })
  }
  /**
   * 获取美元区价格
   * 
   * @private
   * @param {itemInfo} itemInfo
   * @returns {Promise<itemInfo>}
   * @memberOf SteamCardMaximumProfit
   */
  private _GetPriceOverview(itemInfo: itemInfo): Promise<itemInfo> {
    return new Promise((resolved, rejected) => {
      let priceoverview = `/market/priceoverview/?country=US&currency=1&appid=${itemInfo.rgItem.description.appid}&market_hash_name=${encodeURIComponent(this._W.GetMarketHashName(itemInfo.rgItem.description))}`
      this._XHR<priceoverview>(priceoverview, 'json')
        .then((resolve) => {
          if (resolve != null && resolve.success && resolve.lowest_price !== '') {
            // 对$进行处理, 否则会报错
            itemInfo.lowestPrice = resolve.lowest_price.replace('$', '')
            resolved(this._CalculatePrice(itemInfo))
          }
          else {
            let marketListings = `/market/listings/${itemInfo.rgItem.description.appid}/${encodeURIComponent(this._W.GetMarketHashName(itemInfo.rgItem.description))}`
            this._XHR<string>(marketListings)
              .then((resolve) => {
                let marketLoadOrderSpread = resolve.toString().match(/Market_LoadOrderSpread\( (\d+)/)
                if (marketLoadOrderSpread != null) {
                  let nameid = marketLoadOrderSpread[1]
                  let marketItemordershistogram = `/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=${nameid}&two_factor=0`
                  return this._XHR<itemordershistogram>(marketItemordershistogram, 'json')
                }
                else {
                  return Promise.reject(itemInfo)
                }
              })
              .then((resolve) => {
                if (resolve != null && resolve.success) {
                  // 转换为带有一个空格的字符串
                  itemInfo.lowestPrice = ' ' + resolve.sell_order_graph[0][0]
                  resolved(this._CalculatePrice(itemInfo))
                }
              })
              .catch(() => {
                rejected(itemInfo)
              })
          }
        })
        .catch(() => {
          rejected(itemInfo)
        })
    })
  }
  /**
   * 计算价格
   * 
   * @private
   * @param {itemInfo} itemInfo
   * @returns {itemInfo}
   * @memberOf SteamCardMaximumProfit
   */
  private _CalculatePrice(itemInfo: itemInfo): itemInfo {
    // 格式化取整
    let firstPrice = this._W.GetPriceValueAsInt(<string>itemInfo.lowestPrice)
    // 手续费
    let publisherFee = itemInfo.rgItem.description.market_fee || this._W.g_rgWalletInfo.wallet_publisher_fee_percent_default
    let feeInfo = this._W.CalculateFeeAmount(firstPrice, publisherFee)
    firstPrice = firstPrice - feeInfo.fees
    // 换算成人民币
    itemInfo.firstPrice = Math.floor(firstPrice * parseFloat(this._inputUSDCNY.value))
    // 美元区+1美分
    itemInfo.secondPrice = Math.floor((firstPrice + 1) * parseFloat(this._inputUSDCNY.value))
    // 格式化
    itemInfo.firstFormatPrice = this._W.v_currencyformat(itemInfo.firstPrice, this._W.GetCurrencyCode(this._W.g_rgWalletInfo.wallet_currency))
    itemInfo.secondFormatPrice = this._W.v_currencyformat(itemInfo.secondPrice, this._W.GetCurrencyCode(this._W.g_rgWalletInfo.wallet_currency))
    return itemInfo
  }
  /**
   * 快速出售
   * 
   * @private
   * @param {itemInfo} itemInfo
   * @returns {Promise<void>}
   * @memberOf SteamCardMaximumProfit
   */
  private _QuickSellItem(itemInfo: itemInfo): Promise<void> {
    let price = itemInfo.price || itemInfo.firstPrice
    itemInfo.status = 'run'
    this._QuickSellStatus(itemInfo)
    let marketSellitem = `https://steamcommunity.com/market/sellitem/?sessionid=${this._W.g_sessionID}&appid=${itemInfo.rgItem.description.appid}&contextid=${itemInfo.rgItem.contextid}&assetid=${itemInfo.rgItem.assetid}&amount=1&price=${price}`
    return this._XHR<sellitem>(marketSellitem, 'json', 'POST', true)
      .then((resolve) => {
        if (resolve != null && resolve.success) {
          itemInfo.status = 'success'
          this._QuickSellStatus(itemInfo)
        }
        else {
          itemInfo.status = 'error'
          this._QuickSellStatus(itemInfo)
        }
      })
      .catch(() => {
        itemInfo.status = 'error'
        this._QuickSellStatus(itemInfo)
      })
  }
  /**
   * 就是改一下框框
   * 
   * @private
   * @param {itemInfo} itemInfo
   * @memberOf SteamCardMaximumProfit
   */
  private _QuickSellStatus(itemInfo: itemInfo) {
    let elmCheckbox = itemInfo.rgItem.element.querySelector('.scmpItemCheckbox')
    if (itemInfo.status === 'run') {
      this._spanQuickSurplus.innerText = this._quickSells.length.toString()
      elmCheckbox.classList.remove('scmpItemError')
      elmCheckbox.classList.remove('scmpItemSelect')
      elmCheckbox.classList.add('scmpItemRun')
    }
    else if (itemInfo.status === 'success') {
      elmCheckbox.classList.remove('scmpItemError')
      elmCheckbox.classList.remove('scmpItemRun')
      elmCheckbox.classList.add('scmpItemSuccess')
    }
    else if (itemInfo.status === 'error') {
      this._spanQuickError.innerText = (parseInt(this._spanQuickError.innerText) + 1).toString()
      elmCheckbox.classList.remove('scmpItemRun')
      elmCheckbox.classList.add('scmpItemError')
      elmCheckbox.classList.add('scmpItemSelect')
    }
  }
  /**
   * 批量出售采用轮询
   * 
   * @private
   * @memberOf SteamCardMaximumProfit
   */
  private _DoLoop() {
    let itemInfo = this._quickSells.shift()
    if (itemInfo !== undefined) {
      this._QuickSellItem(itemInfo)
        .then(() => {
          this._DoLoop()
        })
    }
    else {
      setTimeout(() => {
        this._DoLoop()
      }, 1000)
    }
  }
  /**
   * 为了兼容火狐sandbox的wrappedJSObject
   * 
   * @private
   * @param {HTMLDivElement} elmDiv
   * @returns {rgItem}
   * @memberOf SteamCardMaximumProfit
   */
  private _GetRgItem(elmDiv: HTMLDivElement): rgItem {
    return ('wrappedJSObject' in elmDiv) ? elmDiv.wrappedJSObject.rgItem : elmDiv.rgItem
  }
  /**
   * 使用Promise封装xhr
   * 
   * @private
   * @template T
   * @param {string} url
   * @param {string} [type='']
   * @param {string} [method='GET']
   * @param {boolean} [cookie=false]
   * @returns {Promise<T>}
   * @memberOf SteamCardMaximumProfit
   */
  private _XHR<T>(url: string, type = '', method = 'GET', cookie = false): Promise<T> {
    return new Promise((resolve, reject) => {
      // 并不需要处理错误
      let timeout = setTimeout(reject, 3e4) //30秒
      let path = url
      if (type === 'jsonp') {
        // 感觉引入jquery还是太大材小用
        let cbRandom = Math.floor(Math.random() * 1e15)
        let elmScript = this._D.createElement('script')
        this._D.body.appendChild(elmScript)
        this._W[`cb${cbRandom}`] = (json) => {
          clearTimeout(timeout)
          this._D.body.removeChild(elmScript)
          this._W[`cb${cbRandom}`] = undefined
          resolve(json)
        }
        elmScript.src = `${path}&callback=cb${cbRandom}&_=${Date.now()} `
      }
      else {
        let postData = ''
        let xhr = new XMLHttpRequest()
        if (method === 'POST') {
          path = url.split('?')[0]
          postData = url.split('?')[1]
        }
        xhr.open(method, path, true)
        if (method === 'POST') xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        if (cookie) xhr.withCredentials = true
        xhr.responseType = type
        xhr.onload = (ev) => {
          clearTimeout(timeout)
          resolve((<XMLHttpRequest>ev.target).response)
        }
        xhr.send(postData)
      }
    })
  }
}
const scmp = new SteamCardMaximumProfit()
scmp.Start()
