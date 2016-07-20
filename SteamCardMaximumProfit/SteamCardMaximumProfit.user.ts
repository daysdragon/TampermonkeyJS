// ==UserScript==
// @name        steam卡牌利润最大化
// @namespace   https://github.com/lzghzr/GreasemonkeyJS
// @version     0.2.9
// @author      lzghzr
// @description 按照美元区出价, 最大化steam卡牌卖出的利润
// @supportURL  https://github.com/lzghzr/GreasemonkeyJS/issues
// @include     /^https?:\/\/steamcommunity\.com\/.*\/inventory/
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==

/**
 * 最大化steam卡牌卖出的利润
 * 
 * @class SteamCardMaximumProfit
 */
class SteamCardMaximumProfit {
  constructor() {
  }
  private D = document
  private W: unsafeWindow = (typeof unsafeWindow === 'undefined') ? window : unsafeWindow
  private inputUSDCNY: HTMLInputElement
  private divItems: HTMLDivElement[] = []
  private divLastChecked: HTMLDivElement
  private spanFirstPrice: HTMLSpanElement
  private spanSecondPrice: HTMLSpanElement
  private quickSells: { itemInfo: rgItem, price: number }[] = []
  private spanQuickSurplus: HTMLSpanElement
  private spanQuickError: HTMLSpanElement
  /**
   * 加载程序
   */
  public Start() {
    let elmDivActiveInventoryPage = <HTMLDivElement>this.D.querySelector('#active_inventory_page')
    // 创建观察者对象
    let observer = new MutationObserver((rec) => {
      if (location.hash.match(/^#753|^$/) === null || rec[0].oldValue !== 'display: none;') return
      this.AddUI()
      this.Listener()
      this.QuickSellItem()
      observer.disconnect()
    })
    // 传入目标节点和观察选项
    observer.observe(elmDivActiveInventoryPage, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] })
  }
  /**
   * 添加样式, 复选框和汇率输入框
   * 
   * @private
   */
  private AddUI() {
    // 样式
    let elmStyle = this.D.createElement('style')
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
    this.D.querySelector('body').appendChild(elmStyle)
    // 有点丑
    let elmDivItems = <NodeListOf<HTMLDivElement>>this.D.querySelectorAll('.itemHolder')
    let elmDivItemsArray = <HTMLDivElement[]>Array.prototype.slice.call(elmDivItems)
    for (let y of elmDivItemsArray) {
      let iteminfo = this.GetRgItem(y)
      if (typeof iteminfo !== 'undefined' && iteminfo.appid.toString() === '753' && iteminfo.marketable === 1) {
        this.divItems.push(iteminfo.element)
        // 选择框
        let elmDiv = this.D.createElement('div')
        elmDiv.classList.add('scmpItemCheckbox')
        iteminfo.element.appendChild(elmDiv)
      }
    }
    // 插入快速出售按钮
    let elmDivInventoryPageRight = <HTMLDivElement>this.D.querySelector('.inventory_page_right')
    let elmDiv = this.D.createElement('div')
    elmDiv.innerHTML = `
<div class="scmpQuickSell">建议最低售价: <span class="btn_green_white_innerfade scmpQuickSellItem">null</span> <span class="btn_green_white_innerfade scmpQuickSellItem">null</span></div>
<div>汇率: <input class="filter_search_box" id="scmpExch" type="text"><span class="btn_green_white_innerfade" id="scmpQuickAllItem">快速出售</span> 剩余: <span id="scmpQuickSurplus">0</span> 失败: <span id="scmpQuickError">0</span></div>`
    elmDivInventoryPageRight.appendChild(elmDiv)
    // 获取快速出售按钮
    let elmSpanQuickSellItems = <NodeListOf<HTMLSpanElement>>elmDiv.querySelectorAll('.scmpQuickSellItem')
    this.spanFirstPrice = elmSpanQuickSellItems[0]
    this.spanSecondPrice = elmSpanQuickSellItems[1]
    this.spanQuickSurplus = <HTMLSpanElement>elmDiv.querySelector('#scmpQuickSurplus')
    this.spanQuickError = <HTMLSpanElement>elmDiv.querySelector('#scmpQuickError')
    // 改变汇率
    this.inputUSDCNY = <HTMLInputElement>elmDiv.querySelector('#scmpExch')
    this.inputUSDCNY.value = '6.50'
    // 在线获取实时汇率
    if (typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=1%E7%BE%8E%E5%85%83%E7%AD%89%E4%BA%8E%E5%A4%9A%E5%B0%91%E4%BA%BA%E6%B0%91%E5%B8%81&resource_id=6017&t=${Date.now()}&ie=utf8&oe=utf8&format=json&tn=baidu`,
        responseType: 'json',
        onload: (res) => {
          if (res.status === 200 && (<baiduExch>res.response).status === '0') {
            this.inputUSDCNY.value = (<baiduExch>res.response).data[0].number2
          }
        }
      })
    }
  }
  /**
   * 添加监听
   * 
   * @private
   */
  private Listener() {
    this.D.addEventListener('click', (ev: MouseEvent) => {
      let evt = <HTMLElement>ev.target
      // 点击物品
      if (evt.className === 'inventory_item_link') {
        this.spanFirstPrice.innerText = 'null'
        this.spanSecondPrice.innerText = 'null'
        let itemInfo = this.GetRgItem(<HTMLDivElement>evt.parentNode)
        this.GetPriceOverview(itemInfo)
      }
      // 选择逻辑
      else if (evt.classList.contains('scmpItemCheckbox')) {
        let itemInfo = this.GetRgItem(<HTMLDivElement>evt.parentNode)
        let select = evt.classList.contains('scmpItemSelect')
        // shift多选
        if (typeof this.divLastChecked !== 'undefined' && ev.shiftKey) {
          let start = this.divItems.indexOf(this.divLastChecked)
          let end = this.divItems.indexOf(itemInfo.element)
          let someDivItems = this.divItems.slice(Math.min(start, end), Math.max(start, end) + 1)
          for (let y of someDivItems) { ChangeClass(y) }
        }
        else {
          ChangeClass(itemInfo.element)
        }
        this.divLastChecked = itemInfo.element
        /**
         * 改变背景
         * 
         * @param {HTMLDivElement} elmDiv
         */
        function ChangeClass(elmDiv: HTMLDivElement) {
          let elmCheckbox = elmDiv.querySelector('.scmpItemCheckbox')
          if (elmCheckbox.classList.contains('scmpItemSuccess') === false) {
            elmCheckbox.classList.remove('scmpItemError')
            elmCheckbox.classList.toggle('scmpItemSelect', !select)
          }
        }
      }
    })
    // 点击快速出售
    let elmDivQuickSellItem = this.D.querySelectorAll('.scmpQuickSellItem')
    let elmDivQuickSellItemArray = <Element[]>Array.prototype.slice.call(elmDivQuickSellItem)
    for (let y of elmDivQuickSellItemArray) {
      y.addEventListener('click', (ev) => {
        let evt = <HTMLSpanElement>ev.target
        let itemInfo = this.GetRgItem(<HTMLDivElement>this.D.querySelector('.activeInfo'))
        if (itemInfo.element.querySelector('.scmpItemCheckbox').classList.contains('scmpItemSuccess') === false && evt.innerText !== 'null') {
          let price = this.W.GetPriceValueAsInt(evt.innerText)
          this.quickSells.push({ itemInfo, price })
        }
      })
    }
    // 点击全部出售
    this.D.querySelector('#scmpQuickAllItem').addEventListener('click', (ev) => {
      let itemInfos = this.D.querySelectorAll('.scmpItemSelect')
      let itemInfosArray = <Element[]>Array.prototype.slice.call(itemInfos)
      for (let y of itemInfosArray) {
        let itemInfo = this.GetRgItem(<HTMLDivElement>y.parentNode)
        this.GetPriceOverview(itemInfo, true)
      }
    })
  }
  /**
   * 获取美元区价格
   * 
   * @private
   * @param {rgItem} itemInfo
   * @param {boolean} [quick=false]
   */
  private GetPriceOverview(itemInfo: rgItem, quick = false) {
    if (itemInfo.marketable !== 1) return
    let priceoverview = `/market/priceoverview/?country=US&currency=1&appid=${itemInfo.appid}&market_hash_name=${encodeURIComponent(this.W.GetMarketHashName(itemInfo))}`
    this.XHR<priceoverview>(priceoverview, 'json')
      .then((resolve) => {
        if (resolve.success && resolve.lowest_price) {
          // 对$进行处理, 否则会报错
          let lowestPrice = resolve.lowest_price.replace('$', '')
          this.GetPrice(itemInfo, lowestPrice, quick)
        }
        else {
          let marketListings = `/market/listings/${itemInfo.appid}/${encodeURIComponent(this.W.GetMarketHashName(itemInfo))}`
          this.XHR<string>(marketListings)
            .then((resolve) => {
              let nameid = resolve.match(/Market_LoadOrderSpread\( (\d+)/)[1]
              let marketItemordershistogram = `/market/itemordershistogram/?country=US&language=english&currency=1&item_nameid=${nameid}&two_factor=0`
              return this.XHR<itemordershistogram>(marketItemordershistogram, 'json')
            })
            .then((resolve) => {
              if (resolve.success) {
                // 转换为带有一个空格的字符串
                let lowestPrice = ' ' + resolve.sell_order_graph[0][0]
                this.GetPrice(itemInfo, lowestPrice, quick)
              }
              else {
                this.QuickSellStatus(itemInfo, 'error')
              }
            })
            .catch((reject) => {
              this.QuickSellStatus(itemInfo, 'error')
            })
        }
      })
      .catch((reject) => {
        this.QuickSellStatus(itemInfo, 'error')
      })
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
    let publisherFee = (typeof itemInfo.market_fee === 'undefined') ? this.W.g_rgWalletInfo.wallet_publisher_fee_percent_default : itemInfo.market_fee
    let feeInfo = this.W.CalculateFeeAmount(firstPrice, publisherFee)
    firstPrice = firstPrice - feeInfo.fees
    // 美元区+1美分
    let secondPrice = Math.floor((firstPrice + 1) * parseFloat(this.inputUSDCNY.value))
    // 格式化
    let formatSecondPrice = this.W.v_currencyformat(secondPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo.wallet_currency))
    // 换算成人民币
    firstPrice = Math.floor(firstPrice * parseFloat(this.inputUSDCNY.value))
    let formatFirstPrice = this.W.v_currencyformat(firstPrice, this.W.GetCurrencyCode(this.W.g_rgWalletInfo.wallet_currency))
    if (quick) {
      let price = firstPrice
      this.quickSells.push({ itemInfo, price })
    }
    else {
      // 显示输出
      this.spanFirstPrice.innerText = formatFirstPrice
      this.spanSecondPrice.innerText = formatSecondPrice
    }
  }
  /**
   * 快速出售，目前采用轮询
   * 
   * @private
   */
  private QuickSellItem() {
    // 顺序触发不好处理, 所以轮询吧
    let quickSell = this.quickSells.shift()
    if (typeof quickSell !== 'undefined') {
      let itemInfo = quickSell.itemInfo
      let price = quickSell.price
      this.QuickSellStatus(itemInfo, 'run')
      let marketSellitem = `https://steamcommunity.com/market/sellitem/?sessionid=${this.W.g_sessionID}&appid=${itemInfo.appid}&contextid=${itemInfo.contextid}&assetid=${itemInfo.id}&amount=1&price=${price}`
      this.XHR<sellitem>(marketSellitem, 'json', 'POST', true)
        .then((resolve) => {
          this.QuickSellItem()
          if (resolve.success) {
            this.QuickSellStatus(itemInfo, 'success')
          }
          else {
            this.QuickSellStatus(itemInfo, 'error')
          }
        })
        .catch((reject) => {
          this.QuickSellStatus(itemInfo, 'error')
        })
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
    let elmCheckbox = itemInfo.element.querySelector('.scmpItemCheckbox')
    if (status === 'run') {
      this.spanQuickSurplus.innerText = this.quickSells.length.toString()
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
      this.spanQuickError.innerText = (parseInt(this.spanQuickError.innerText) + 1).toString()
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
   */
  private XHR<T>(url: string, type = '', method = 'GET', cookie = false): Promise<T> {
    return new Promise((resolve, reject) => {
      // 并不需要处理错误
      let timeout = setTimeout(reject, 3e4) //30秒
      let path = url
      if (type === 'jsonp') {
        // 感觉引入jquery还是太大材小用
        let elmScript = this.D.createElement('script')
        this.D.body.appendChild(elmScript)
        this.W['cb'] = (json) => {
          clearTimeout(timeout)
          this.D.body.removeChild(elmScript)
          this.W['cb'] = undefined
          resolve(json)
        }
        elmScript.src = `${path}&callback=cb & _=${Date.now()} `
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

// 只是为了避免类型错误, 编译时会自动去除
interface Node {
  rgItem: rgItem
  wrappedJSObject: wrappedJSObject
}
interface wrappedJSObject {
  rgItem: rgItem
}
interface rgItem {
  appid: string
  contextid: string
  element: HTMLDivElement
  id: string
  market_fee: string
  marketable: number
}

interface FeeAmount {
  steam_fee: number
  publisher_fee: number
  fees: number
  amount: number
}

interface rgWalletInfo {
  wallet_currency: number;
  wallet_country: string;
  wallet_fee: number;
  wallet_fee_minimum: number;
  wallet_fee_percent: string;
  wallet_publisher_fee_percent_default: string;
  wallet_fee_base: number;
  wallet_balance: number;
  wallet_delayed_balance: number;
  wallet_max_balance: number;
  wallet_trade_max_balance: number;
  success: boolean;
  rwgrsn: number;
}

interface unsafeWindow extends Window {
  iActiveSelectView: number
  g_rgWalletInfo: rgWalletInfo
  g_sessionID: string
  CalculateFeeAmount(amount: number, publisherFee: string): FeeAmount
  GetCurrencyCode(currencyId: number): string
  GetMarketHashName(rgDescriptionData: rgItem): string
  GetPriceValueAsInt(strAmount: string): number
  v_currencyformat(valueInCents: number, currencyCode: string): string
}

interface baiduExch {
  status: string;
  data: exchData[];
}
interface exchData {
  number2: string;
}

interface priceoverview {
  success: boolean;
  lowest_price: string;
  volume: string;
  median_price: string;
}

interface itemordershistogram {
  success: number;
  sell_order_table: string;
  sell_order_summary: string;
  buy_order_table: string;
  buy_order_summary: string;
  highest_buy_order: string;
  lowest_sell_order: string;
  buy_order_graph: any[][];
  sell_order_graph: any[][];
  graph_max_y: number;
  graph_min_x: number;
  graph_max_x: number;
  price_prefix: string;
  price_suffix: string;
}

interface sellitem {
  success: boolean;
  requires_confirmation: number;
  needs_mobile_confirmation: boolean;
  needs_email_confirmation: boolean;
  email_domain: string;
}