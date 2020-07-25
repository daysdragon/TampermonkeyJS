// ==UserScript==
// @name        BiliveClientHeart
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.1.0
// @author      lzghzr
// @description B站直播客户端心跳
// @include     /^https?:\/\/live\.bilibili\.com\/(?:blanc\/)?\d/
// @connect     passport.bilibili.com
// @connect     api.live.bilibili.com
// @connect     live-trace.bilibili.com
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libBilibiliToken/libBilibiliToken.user.js?v=0.0.3
// @require     https://github.com/lzghzr/TampermonkeyJS/raw/master/libWasmHash/libWasmHash.user.js?v=0.0.1
// @resource    wasm_rust_hash https://github.com/lzghzr/wasm-rust-hash/releases/download/0.1.0/wasm_rust_hash_bg.wasm
// @license     MIT
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceURL
// @run-at      document-end
// ==/UserScript==
(async () => {
    await Sleep(5000);
    const W = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
    if (W.BilibiliLive === undefined)
        return console.error(GM_info.script.name, "未获取到uid");
    const uid = W.BilibiliLive.UID;
    const tid = W.BilibiliLive.ANCHOR_UID;
    if (uid === 0)
        return console.error(GM_info.script.name, "未获取到uid");
    const appToken = new BilibiliToken();
    const baseQuery = `actionKey=appkey&appkey=${BilibiliToken.appKey}&build=5561000&channel=bili&device=android&mobi_app=android&platform=android&statistics=%7B%22appId%22%3A1%2C%22platform%22%3A3%2C%22version%22%3A%225.57.0%22%2C%22abtest%22%3A%22%22%7D`;
    let tokenData = JSON.parse(GM_getValue("userToken", "{}"));
    const setToken = async () => {
        const userToken = await appToken.getToken();
        if (userToken === undefined)
            return console.error(GM_info.script.name, "未获取到token");
        tokenData = userToken;
        GM_setValue("userToken", JSON.stringify(tokenData));
        return "OK";
    };
    const getInfo = () => XHR({
        GM: true,
        anonymous: true,
        method: "GET",
        url: `https://passport.bilibili.com/x/passport-login/oauth2/info?${appToken.signLoginQuery(`access_key=${tokenData.access_token}`)}`,
        responseType: "json",
        headers: appToken.headers
    });
    const mobileOnline = () => XHR({
        GM: true,
        anonymous: true,
        method: "POST",
        url: `https://api.live.bilibili.com/heartbeat/v1/OnLine/mobileOnline?${BilibiliToken.signQuery(`access_key=${tokenData.access_token}&${baseQuery}`)}`,
        data: `room_id=${W.BilibiliLive.ROOMID}&scale=xxhdpi`,
        responseType: "json",
        headers: appToken.headers
    });
    const RandomHex = (length) => {
        const words = '0123456789abcdef';
        let randomID = '';
        randomID += words[Math.floor(Math.random() * 15) + 1];
        for (let i = 0; i < length - 1; i++)
            randomID += words[Math.floor(Math.random() * 16)];
        return randomID;
    };
    const uuid = () => RandomHex(32).replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$3-$5');
    const mobileHeartBeatJSON = {
        platform: "android",
        uuid: uuid(),
        buvid: appToken.buvid,
        seq_id: "1",
        room_id: "{room_id}",
        parent_id: "6",
        area_id: "283",
        timestamp: "{timestamp}",
        secret_key: "axoaadsffcazxksectbbb",
        watch_time: "300",
        up_id: "{target_id}",
        up_level: "40",
        jump_from: "30000",
        gu_id: RandomHex(43),
        play_type: "0",
        play_url: "",
        s_time: "0",
        data_behavior_id: "",
        data_source_id: "",
        up_session: "l:one:live:record:{room_id}:{last_wear_time}",
        visit_id: RandomHex(32),
        watch_status: "%7B%22pk_id%22%3A0%2C%22screen_status%22%3A1%7D",
        click_id: uuid(),
        session_id: "",
        player_type: "0",
        client_ts: "{client_ts}"
    };
    const mobileHeartBeatData = (data) => {
        let postData = '';
        for (let i in data)
            postData += `&${i}=${encodeURIComponent(data[i])}`;
        return postData.substring(1);
    };
    const wasm = new WasmHash();
    await wasm.init();
    const clientSign = (data) => wasm.hash('BLAKE2b512', wasm.hash('SHA3-384', wasm.hash('SHA384', wasm.hash('SHA3-512', wasm.hash('SHA512', JSON.stringify(data))))));
    const getFansMedal = () => XHR({
        GM: true,
        anonymous: true,
        method: "GET",
        url: `https://api.live.bilibili.com/fans_medal/v1/FansMedal/get_list_in_room?${BilibiliToken.signQuery(`access_key=${tokenData.access_token}&target_id=${tid}&uid=${uid}&${baseQuery}`)}`,
        responseType: "json",
        headers: appToken.headers
    });
    const mobileHeartBeat = (data) => XHR({
        GM: true,
        anonymous: true,
        method: "POST",
        url: "https://live-trace.bilibili.com/xlive/data-interface/v1/heartbeat/mobileHeartBeat",
        data,
        responseType: "json",
        headers: appToken.headers
    });
    if (tokenData.access_token === undefined && await setToken() === undefined)
        return;
    else {
        const userInfo = await getInfo();
        if (userInfo === undefined)
            return console.error(GM_info.script.name, "获取用户信息错误");
        if (userInfo.body.code !== 0 && await setToken() === undefined)
            return;
        else if (userInfo.body.data.mid !== uid && await setToken() === undefined)
            return;
    }
    console.log(GM_info.script.name, "开始客户端心跳");
    mobileOnline();
    setInterval(() => mobileOnline(), 5 * 60 * 1000);
    let count = 0;
    const fansMedal = await getFansMedal();
    if (fansMedal !== undefined && fansMedal.response.status === 200 && fansMedal.body.code === 0) {
        const fansMedalData = fansMedal.body.data;
        while (true) {
            if (count > 24)
                break;
            for (let listData of fansMedalData) {
                if (count > 24)
                    break;
                const postData = Object.assign({}, mobileHeartBeatJSON);
                postData.room_id = listData.room_id.toString();
                postData.timestamp = (BilibiliToken.TS - 300).toString();
                postData.up_id = listData.target_id.toString();
                postData.up_session = `l:one:live:record:${listData.room_id}:${listData.last_wear_time}`;
                postData.client_ts = BilibiliToken.TS.toString();
                const heartBeatData = mobileHeartBeatData(postData);
                const dataSign = clientSign(postData);
                mobileHeartBeat(BilibiliToken.signQuery(`access_key=${tokenData.access_token}&${heartBeatData}&client_sign=${dataSign}&${baseQuery}`));
                count++;
            }
            await Sleep(300 * 1000);
        }
    }
})();
function XHR(XHROptions) {
    return new Promise(resolve => {
        const onerror = (error) => {
            console.error(GM_info.script.name, error);
            resolve(undefined);
        };
        if (XHROptions.GM) {
            if (XHROptions.method === "POST") {
                if (XHROptions.headers === undefined)
                    XHROptions.headers = {};
                if (XHROptions.headers["Content-Type"] === undefined)
                    XHROptions.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
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
            if (XHROptions.method === "POST" && xhr.getResponseHeader("Content-Type") === null)
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
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
function Sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve("sleep"), ms));
}