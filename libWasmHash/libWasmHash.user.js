// ==UserScript==
// @name        libWasmHash
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.1
// @author      lzghzr
// @description WebAssembly实现的Hash
// @resource    wasm_rust_hash https://github.com/lzghzr/wasm-rust-hash/releases/download/0.1.0/wasm_rust_hash_bg.wasm
// @license     MIT
// @grant       GM_getResourceURL
// @run-at      document-start
// ==/UserScript==
class WasmHash {
    constructor() {
        this._WASM_VECTOR_LEN = 0;
        this._cachedTextEncoder = new TextEncoder();
        this._cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    }
    hash(algorithm, data) {
        try {
            var ptr0 = this._passStringToWasm0(algorithm, this._wasm.__wbindgen_malloc, this._wasm.__wbindgen_realloc);
            var len0 = this._WASM_VECTOR_LEN;
            var ptr1 = this._passStringToWasm0(data, this._wasm.__wbindgen_malloc, this._wasm.__wbindgen_realloc);
            var len1 = this._WASM_VECTOR_LEN;
            this._wasm.hash(8, ptr0, len0, ptr1, len1);
            var r0 = this._getInt32Memory0()[8 / 4 + 0];
            var r1 = this._getInt32Memory0()[8 / 4 + 1];
            return this._getStringFromWasm0(r0, r1);
        }
        finally {
            this._wasm.__wbindgen_free(r0, r1);
        }
    }
    async init() {
        this._cachedTextDecoder.decode();
        const { instance } = await WebAssembly.instantiateStreaming(fetch(GM_getResourceURL("wasm_rust_hash").replace(/^data:.*?;base64/, "data:application/wasm;base64")));
        this._wasm = instance.exports;
    }
    _encodeString(arg, view) {
        return this._cachedTextEncoder.encodeInto(arg, view);
    }
    _getStringFromWasm0(ptr, len) {
        return this._cachedTextDecoder.decode(this._getUint8Memory0().subarray(ptr, ptr + len));
    }
    _getUint8Memory0() {
        if (this._cachegetUint8Memory0 === undefined || this._cachegetUint8Memory0.buffer !== this._wasm.memory.buffer) {
            this._cachegetUint8Memory0 = new Uint8Array(this._wasm.memory.buffer);
        }
        return this._cachegetUint8Memory0;
    }
    _getInt32Memory0() {
        if (this._cachegetInt32Memory0 === undefined || this._cachegetInt32Memory0.buffer !== this._wasm.memory.buffer) {
            this._cachegetInt32Memory0 = new Int32Array(this._wasm.memory.buffer);
        }
        return this._cachegetInt32Memory0;
    }
    _passStringToWasm0(arg, malloc, realloc) {
        if (realloc === undefined) {
            const buf = this._cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            this._getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            this._WASM_VECTOR_LEN = buf.length;
            return ptr;
        }
        let len = arg.length;
        let ptr = malloc(len);
        const mem = this._getUint8Memory0();
        let offset = 0;
        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F)
                break;
            mem[ptr + offset] = code;
        }
        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = this._getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = this._encodeString(arg, view);
            offset += ret.written;
        }
        this._WASM_VECTOR_LEN = offset;
        return ptr;
    }
}