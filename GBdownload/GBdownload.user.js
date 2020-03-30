// ==UserScript==
// @name        gb688下载
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     1.0.6
// @author      lzghzr
// @description 下载gb688.cn上的国标文件
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @match       *://*.gb688.cn/bzgk/gb/newGbInfo*
// @match       *://*.samr.gov.cn/bzgk/gb/newGbInfo*
// @connect     c.gb688.cn
// @license     MIT
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// ==/UserScript==
const online = document.querySelector('button.btn.ck_btn.btn-sm.btn-primary');
if (online === null || online.innerText !== '在线预览')
    throw '没有预览, 没有下载';
const download = document.querySelector('button.btn.xz_btn.btn-sm.btn-warning');
if (download !== null)
    download.remove();
const GBdownload = document.createElement('button');
GBdownload.style.cssText = 'margin-right:20px';
GBdownload.className = 'btn xz_btn btn-sm btn-warning';
GBdownload.innerText = '下载标准';
online.insertAdjacentElement('afterend', GBdownload);
const hcno = online.dataset.value;
if (hcno === null) {
    GBdownload.innerText = '未获取到hcno';
    throw '未获取到hcno';
}
GBdownload.onclick = async () => {
    const GBname = document.body.innerText.match(/标准号：(?<id>.*?)\n中文标准名称：(?<name>.*?)\s\n/);
    if (GBname === null) {
        GBdownload.innerText = '文件名获取失败';
        throw '文件名获取失败';
    }
    const { id, name } = GBname.groups;
    let pdf = '';
    GBdownload.innerText = '下载中...0%';
    for (let i = 0; i < 10; i++) {
        const view = await XHR({
            GM: true,
            method: 'POST',
            url: `http://c.gb688.cn/bzgk/gb/viewGb?type=online&hcno=${hcno}${i === 0 ? '' : `.00${i}`}`,
            headers: {
                'Accept': 'text/plain, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'zh-CN,zh-TW;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6',
                'Connection': 'keep-alive',
                'DNT': 1,
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
                'X-Requested-With': 'XMLHttpRequest'
            },
            cookie: true,
            responseType: 'text'
        });
        if (view === undefined || view.response.status !== 200) {
            GBdownload.innerText = '文件获取失败';
            throw '文件获取失败';
        }
        GBdownload.innerText = `下载中...${i * 10}%`;
        pdf += view.body || '';
    }
    GBdownload.innerText = '下载标准';
    const tempLink = document.createElement('a');
    tempLink.download = `${id.replace('/', '')}(${name}).pdf`;
    const BlobURL = await fetch(`data:application/pdf;base64,${pdf}`)
        .then(res => res.blob())
        .then(blob => URL.createObjectURL(blob));
    tempLink.href = BlobURL;
    tempLink.click();
};
function XHR(XHROptions) {
    return new Promise(resolve => {
        const onerror = (error) => {
            console.error(error);
            resolve(undefined);
        };
        if (XHROptions.GM) {
            if (XHROptions.method === 'POST') {
                if (XHROptions.headers === undefined)
                    XHROptions.headers = {};
                if (XHROptions.headers['Content-Type'] === undefined)
                    XHROptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
            }
            XHROptions.timeout = 30 * 1000;
            XHROptions.onload = res => resolve({ response: res, body: res.response });
            XHROptions.onerror = onerror;
            XHROptions.ontimeout = onerror;
            GM_xmlhttpRequest(XHROptions);
        }
        else {
            const xhr = new XMLHttpRequest();
            xhr.open(XHROptions.method, XHROptions.url);
            if (XHROptions.method === 'POST' && xhr.getResponseHeader('Content-Type') === null)
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            if (XHROptions.cookie)
                xhr.withCredentials = true;
            if (XHROptions.responseType !== undefined)
                xhr.responseType = XHROptions.responseType;
            xhr.timeout = 30 * 1000;
            xhr.onload = ev => {
                const res = ev.target;
                resolve({ response: res, body: res.response });
            };
            xhr.onerror = onerror;
            xhr.ontimeout = onerror;
            xhr.send(XHROptions.data);
        }
    });
}