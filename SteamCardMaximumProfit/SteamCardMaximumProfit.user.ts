// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.22
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
  public quickSells: ItemInfo[] = []
  public spanQuickSurplus: HTMLSpanElement
  public spanQuickError: HTMLSpanElement
  /**
   * 加载程序
   * 
   * @memberof SteamCardMaximumProfit
   */
  public Start() {
    this._AddUI()
    this._DoLoop()
    let elmDivActiveInventoryPage = <HTMLDivElement>this._D.querySelector('#inventories')
    // 创建观察者对象
    let observer = new MutationObserver((rec) => {
      if (location.hash.match(/^#753|^$/)) {
        // 有点丑的复选框
        for (let r of rec) {
          let rt = <HTMLDivElement>r.target
          if (rt.classList.contains('inventory_page')) {
            let itemHolders = <NodeListOf<HTMLDivElement>>rt.querySelectorAll('.itemHolder')
            for (let i = 0; i < itemHolders.length; i++) {
              let rgItem = this._GetRgItem(itemHolders[i])
              if (rgItem != null && this._divItems.indexOf(rgItem.element) === -1 && rgItem.description.appid === 753 && rgItem.description.marketable === 1) {
                this._divItems.push(rgItem.element)
                // 选择框
                let elmDiv = this._D.createElement('div')
                elmDiv.classList.add('scmpItemCheckbox')
                rgItem.element.appendChild(elmDiv)
              }
            }
          }
        }
      }
    })
    // 传入目标节点和观察选项
    observer.observe(elmDivActiveInventoryPage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  }
  /**
   * 添加样式, 复选框和汇率输入框
   * 
   * @private
   * @memberof SteamCardMaximumProfit
   */
  private async _AddUI() {
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
    this._D.body.appendChild(elmStyle)
    // 插入快速出售按钮
    let elmDivInventoryPageRight = <HTMLDivElement>this._D.querySelector('.inventory_page_right')
      , elmDiv = this._D.createElement('div')
    elmDiv.innerHTML = `
<div class="scmpQuickSell">建议最低售价:
  <span class="btn_green_white_innerfade scmpQuickSellItem">null</span>
  <span class="btn_green_white_innerfade scmpQuickSellItem">null</span>
</div>
<div>
  汇率:
  <input class="filter_search_box" id="scmpExch" type="text">
  <span class="btn_green_white_innerfade" id="scmpQuickAllItem">快速出售</span>
  剩余:
  <span id="scmpQuickSurplus">0</span>
  失败:
  <span id="scmpQuickError">0</span>
</div>`
    elmDivInventoryPageRight.appendChild(elmDiv)
    // 获取快速出售按钮
    let elmSpanQuickSellItems = <NodeListOf<HTMLSpanElement>>elmDiv.querySelectorAll('.scmpQuickSellItem')
    this.spanQuickSurplus = <HTMLSpanElement>elmDiv.querySelector('#scmpQuickSurplus')
    this.spanQuickError = <HTMLSpanElement>elmDiv.querySelector('#scmpQuickError')
    // 监听事件
    this._D.addEventListener('click', async (ev: MouseEvent) => {
      let evt = <HTMLElement>ev.target
      // 点击物品
      if (evt.className === 'inventory_item_link') {
        elmSpanQuickSellItems[0].innerText = 'null'
        elmSpanQuickSellItems[1].innerText = 'null'
        let rgItem = this._GetRgItem(<HTMLDivElement>evt.parentNode)
          , itemInfo = new ItemInfo(rgItem)
          , priceOverview = await this._GetPriceOverview(itemInfo)
        if (priceOverview != null) {
          elmSpanQuickSellItems[0].innerText = <string>priceOverview.firstFormatPrice
          elmSpanQuickSellItems[1].innerText = <string>priceOverview.secondFormatPrice
        }
      }
      // 选择逻辑
      else if (evt.classList.contains('scmpItemCheckbox')) {
        let rgItem = this._GetRgItem(<HTMLDivElement>evt.parentNode)
          , select = evt.classList.contains('scmpItemSelect')
          // 改变背景
          , ChangeClass = (elmDiv: HTMLDivElement) => {
            let elmCheckbox = <HTMLDivElement>elmDiv.querySelector('.scmpItemCheckbox')
            if ((<HTMLDivElement>elmDiv.parentNode).style.display !== 'none' && !elmCheckbox.classList.contains('scmpItemSuccess')) {
              elmCheckbox.classList.remove('scmpItemError')
              elmCheckbox.classList.toggle('scmpItemSelect', !select)
            }
          }
        // shift多选
        if (this._divLastChecked != null && ev.shiftKey) {
          let start = this._divItems.indexOf(this._divLastChecked)
            , end = this._divItems.indexOf(rgItem.element)
            , someDivItems = this._divItems.slice(Math.min(start, end), Math.max(start, end) + 1)
          for (let y of someDivItems) { ChangeClass(y) }
        }
        else ChangeClass(rgItem.element)
        this._divLastChecked = rgItem.element
      }
    })
    // 点击快速出售
    let elmDivQuickSellItem = this._D.querySelectorAll('.scmpQuickSellItem')
    for (let i = 0; i < elmDivQuickSellItem.length; i++) {
      elmDivQuickSellItem[i].addEventListener('click', (ev) => {
        let evt = <HTMLSpanElement>ev.target
          , rgItem = this._GetRgItem(<HTMLDivElement>this._D.querySelector('.activeInfo'))
        if (!(<HTMLDivElement>rgItem.element.querySelector('.scmpItemCheckbox')).classList.contains('scmpItemSuccess') && evt.innerText != 'null') {
          let price = this._W.GetPriceValueAsInt(evt.innerText)
            , itemInfo = new ItemInfo(rgItem, price)
          this._QuickSellItem(itemInfo)
        }
      })
    }
    // 点击全部出售
    (<HTMLSpanElement>this._D.querySelector('#scmpQuickAllItem')).addEventListener('click', () => {
      let itemInfos = this._D.querySelectorAll('.scmpItemSelect')
      for (let i = 0; i < itemInfos.length; i++) {
        let rgItem = this._GetRgItem(<HTMLDivElement>itemInfos[i].parentNode)
          , itemInfo = new ItemInfo(rgItem)
        if (rgItem.description.marketable === 1) this.quickSells.push(itemInfo)
      }
    })
    // 改变汇率
    this._inputUSDCNY = <HTMLInputElement>elmDiv.querySelector('#scmpExch')
    this._inputUSDCNY.value = '6.50'
    // 在线获取实时汇率
    let baiduExch = await tools.XHR<baiduExch>({
      method: 'GET',
      url: `https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=1%E7%BE%8E%E5%85%83%E7%AD%89%E4%BA%8E%E5%A4%9A%E5%B0%91%E4%BA%BA%E6%B0%91%E5%B8%81&resource_id=6017&t=${Date.now()}&ie=utf8&oe=utf8&format=json&tn=baidu`,
      responseType: 'json',
      GM_xmlhttpRequest: true
    }).catch(console.log)
    if (baiduExch != null) this._inputUSDCNY.value = baiduExch.data[0].number2
  }
  /**
   * 获取美元区价格
   * 
   * @private
   * @param {ItemInfo} itemInfo 
   * @returns {(Promise<void | ItemInfo>)} 
   * @memberof SteamCardMaximumProfit
   */
  private async _GetPriceOverview(itemInfo: ItemInfo): Promise<void | ItemInfo> {
    let priceoverview = await tools.XHR<priceoverview>({
      method: 'GET',
      url: `/market/priceoverview/?country=US&currency=1&appid=${itemInfo.rgItem.description.appid}&market_hash_name=${encodeURIComponent(this._W.GetMarketHashName(itemInfo.rgItem.description))}`,
      responseType: 'json'
    }).catch(console.log)
      , stop = () => {
        itemInfo.status = 'error'
        return
      }
    if (priceoverview != null && priceoverview.success && priceoverview.lowest_price !== '') {
      // 对$进行处理, 否则会报错
      itemInfo.lowestPrice = priceoverview.lowest_price.replace('$', '')
      return this._CalculatePrice(itemInfo)
    }
    else {
      let marketListings = await tools.XHR<string>({
        method: 'GET',
        url: `/market/listings/${itemInfo.rgItem.description.appid}/${encodeURIComponent(this._W.GetMarketHashName(itemInfo.rgItem.description))}`,
        responseType: 'text'
      }).catch(console.log)
      if (marketListings == null) return stop()
      let marketLoadOrderSpread = marketListings.toString().match(/Market_LoadOrderSpread\( (\d+)/)
      if (marketLoadOrderSpread == null) return stop()
      let itemordershistogram = await tools.XHR<itemordershistogram>({
        method: 'GET',
        url: `/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=${marketLoadOrderSpread[1]}&two_factor=0`,
        responseType: 'json'
      }).catch(console.log)
      if (itemordershistogram == null) return stop()
      if (itemordershistogram.success) {
        itemInfo.lowestPrice = ' ' + itemordershistogram.sell_order_graph[0][0]
        return this._CalculatePrice(itemInfo)
      }
      else return stop()
    }
  }
  /**
   * 计算价格
   * 
   * @private
   * @param {ItemInfo} itemInfo
   * @returns {ItemInfo}
   * @memberof SteamCardMaximumProfit
   */
  private _CalculatePrice(itemInfo: ItemInfo): ItemInfo {
    // 格式化取整
    let firstPrice = this._W.GetPriceValueAsInt(<string>itemInfo.lowestPrice)
      // 手续费
      , publisherFee = itemInfo.rgItem.description.market_fee || this._W.g_rgWalletInfo.wallet_publisher_fee_percent_default
      , feeInfo = this._W.CalculateFeeAmount(firstPrice, publisherFee)
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
   * @param {ItemInfo} itemInfo
   * @returns {Promise<void>}
   * @memberof SteamCardMaximumProfit
   */
  private async _QuickSellItem(itemInfo: ItemInfo): Promise<void> {
    itemInfo.status = 'run'
    let price = itemInfo.price || itemInfo.firstPrice
      , sellitem = await tools.XHR<sellitem>({
        method: 'POST',
        url: 'https://steamcommunity.com/market/sellitem/',
        data: `sessionid=${this._W.g_sessionID}&appid=${itemInfo.rgItem.description.appid}&contextid=${itemInfo.rgItem.contextid}&assetid=${itemInfo.rgItem.assetid}&amount=1&price=${price}`,
        responseType: 'json',
        cookie: true
      }).catch(console.log)
    if (sellitem == null || !sellitem.success) itemInfo.status = 'error'
    else itemInfo.status = 'success'
  }
  /**
   * 批量出售采用轮询
   * 
   * @private
   * @memberof SteamCardMaximumProfit
   */
  private async _DoLoop() {
    let itemInfo = this.quickSells.shift()
      , loop = () => {
        setTimeout(() => {
          this._DoLoop()
        }, 500)
      }
    if (itemInfo != null) {
      let priceOverview = await this._GetPriceOverview(itemInfo)
      if (priceOverview != null) {
        await this._QuickSellItem(priceOverview)
        this._DoLoop()
      }
      else loop()
    }
    else loop()
  }
  /**
   * 为了兼容火狐sandbox的wrappedJSObject
   * 
   * @private
   * @param {HTMLDivElement} elmDiv
   * @returns {rgItem}
   * @memberof SteamCardMaximumProfit
   */
  private _GetRgItem(elmDiv: HTMLDivElement): rgItem {
    return ('wrappedJSObject' in elmDiv) ? elmDiv.wrappedJSObject.rgItem : elmDiv.rgItem
  }
}
/**
 * 物品信息
 * 
 * @class ItemInfo
 */
class ItemInfo {
  constructor(rgItem: rgItem, price?: number) {
    this.rgItem = rgItem
    if (price != null) this.price = price
  }
  public rgItem: rgItem
  public price?: number
  private _status: string
  public get status(): string {
    return this._status || ''
  }
  public set status(valve: string) {
    this._status = valve
    let elmCheckbox = <HTMLDivElement>this.rgItem.element.querySelector('.scmpItemCheckbox')
    if (elmCheckbox == null) return
    switch (valve) {
      case 'run':
        elmCheckbox.classList.remove('scmpItemError')
        elmCheckbox.classList.remove('scmpItemSelect')
        elmCheckbox.classList.add('scmpItemRun')
        break
      case 'success':
        scmp.spanQuickSurplus.innerText = scmp.quickSells.length.toString()
        elmCheckbox.classList.remove('scmpItemError')
        elmCheckbox.classList.remove('scmpItemRun')
        elmCheckbox.classList.add('scmpItemSuccess')
        break
      case 'error':
        scmp.spanQuickSurplus.innerText = scmp.quickSells.length.toString()
        scmp.spanQuickError.innerText = (parseInt(scmp.spanQuickError.innerText) + 1).toString()
        elmCheckbox.classList.remove('scmpItemRun')
        elmCheckbox.classList.add('scmpItemError')
        elmCheckbox.classList.add('scmpItemSelect')
        break
      default:
        break
    }
  }
  public lowestPrice?: string
  public firstPrice?: number
  public firstFormatPrice?: string
  public secondPrice?: number
  public secondFormatPrice?: string
}
/**
 * 一些通用工具
 * 
 * @class tools
 */
class tools {
  /**
   * 使用Promise封装xhr
   * 
   * @static
   * @template T 
   * @param {XHROptions} XHROptions 
   * @returns {Promise<T>} 
   * @memberof tools
   */
  static XHR<T>(XHROptions: XHROptions): Promise<T> {
    return new Promise((resolve, reject) => {
      if (XHROptions.GM_xmlhttpRequest) {
        GM_xmlhttpRequest({
          method: XHROptions.method,
          url: XHROptions.url,
          user: XHROptions.user,
          password: XHROptions.password,
          responseType: XHROptions.responseType || '',
          timeout: 3e4,
          onload: (res) => {
            if (res.status === 200) resolve(res.response)
            else reject(res)
          },
          onerror: reject,
          ontimeout: reject
        })
      }
      else {
        let xhr = new XMLHttpRequest()
        xhr.open(XHROptions.method, XHROptions.url, true, XHROptions.user, XHROptions.password)
        if (XHROptions.method === 'POST') xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=utf-8')
        if (XHROptions.cookie) xhr.withCredentials = true
        xhr.responseType = XHROptions.responseType || ''
        xhr.timeout = 3e4
        xhr.onload = (ev) => {
          let evt = <XMLHttpRequest>ev.target
          if (evt.status === 200) resolve(evt.response)
          else reject(evt)
        }
        xhr.onerror = reject
        xhr.ontimeout = reject
        xhr.send(XHROptions.data)
      }
    })
  }
}
const scmp = new SteamCardMaximumProfit()
scmp.Start()
