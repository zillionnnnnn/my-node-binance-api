

import WebSocket from 'ws';
import request from 'request';
import crypto from 'crypto';
import file from 'fs';
import url from 'url';
import JSONbig from 'json-bigint';
import HttpsProxyAgent from 'https-proxy-agent';
import SocksProxyAgent from 'socks-proxy-agent';
import stringHash from 'string-hash';
import async from 'async';

export default class Binance {

    base = 'https://api.binance.com/api/';
    baseTest = 'https://testnet.binance.vision/api/';
    wapi = 'https://api.binance.com/wapi/';
    sapi = 'https://api.binance.com/sapi/';
    fapi = 'https://fapi.binance.com/fapi/';
    dapi = 'https://dapi.binance.com/dapi/';
    fapiTest = 'https://testnet.binancefuture.com/fapi/';
    dapiTest = 'https://testnet.binancefuture.com/dapi/';
    fstream = 'wss://fstream.binance.com/stream?streams=';
    fstreamSingle = 'wss://fstream.binance.com/ws/';
    fstreamSingleTest = 'wss://stream.binancefuture.com/ws/';
    fstreamTest = 'wss://stream.binancefuture.com/stream?streams=';
    dstream = 'wss://dstream.binance.com/stream?streams=';
    dstreamSingle = 'wss://dstream.binance.com/ws/';
    dstreamSingleTest = 'wss://dstream.binancefuture.com/ws/';
    dstreamTest = 'wss://dstream.binancefuture.com/stream?streams=';
    stream = 'wss://stream.binance.com:9443/ws/';
    combineStream = 'wss://stream.binance.com:9443/stream?streams=';


    userAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
    contentType = 'application/x-www-form-urlencoded';
    SPOT_PREFIX = "x-HNA2TXFJ"
    CONTRACT_PREFIX = "x-Cb7ytekJ"


    subscriptions = {};
    futuresSubscriptions = {};
    futuresInfo = {};
    futuresMeta = {};
    futuresTicks = {};
    futuresRealtime = {};
    futuresKlineQueue = {};
    deliverySubscriptions = {};
    deliveryInfo = {};
    deliveryMeta = {};
    deliveryTicks = {};
    deliveryRealtime = {};
    deliveryKlineQueue = {};
    depthCache = {};
    depthCacheContext = {};
    ohlcLatest = {};
    klineQueue = {};
    ohlc = {};
    info: any = {};
    socketHeartbeatInterval = null;

    default_options = {
        recvWindow: 5000,
        useServerTime: false,
        reconnect: true,
        keepAlive: true,
        verbose: false,
        test: false,
        hedgeMode: false,
        localAddress: false,
        family: 4,
        log: function (...args) {
            console.log(Array.prototype.slice.call(args));
        }
    };

    options: any = {
    };


    constructor(userOptions = {}) {

        if (userOptions) {
            this.setOptions(userOptions);
        }

    }

    setOptions(opt = {}, callback: any = false) {
        if (typeof opt === 'string') { // Pass json config filename
            this.options = JSON.parse(file.readFileSync(opt));
        } else this.options = opt;
        if (typeof this.options.recvWindow === 'undefined') this.options.recvWindow = this.default_options.recvWindow;
        if (typeof this.options.useServerTime === 'undefined') this.options.useServerTime = this.default_options.useServerTime;
        if (typeof this.options.reconnect === 'undefined') this.options.reconnect = this.default_options.reconnect;
        if (typeof this.options.test === 'undefined') this.options.test = this.default_options.test;
        if (typeof this.options.hedgeMode === 'undefined') this.options.hedgeMode = this.default_options.hedgeMode;
        if (typeof this.options.log === 'undefined') this.options.log = this.default_options.log;
        if (typeof this.options.verbose === 'undefined') this.options.verbose = this.default_options.verbose;
        if (typeof this.options.keepAlive === 'undefined') this.options.keepAlive = this.default_options.keepAlive;
        if (typeof this.options.localAddress === 'undefined') this.options.localAddress = this.default_options.localAddress;
        if (typeof this.options.family === 'undefined') this.options.family = this.default_options.family;
        if (typeof this.options.urls !== 'undefined') {
            const { urls } = this.options;
            if (typeof urls.base === 'string') this.base = urls.base;
            if (typeof urls.wapi === 'string') this.wapi = urls.wapi;
            if (typeof urls.sapi === 'string') this.sapi = urls.sapi;
            if (typeof urls.fapi === 'string') this.fapi = urls.fapi;
            if (typeof urls.fapiTest === 'string') this.fapiTest = urls.fapiTest;
            if (typeof urls.stream === 'string') this.stream = urls.stream;
            if (typeof urls.combineStream === 'string') this.combineStream = urls.combineStream;
            if (typeof urls.fstream === 'string') this.fstream = urls.fstream;
            if (typeof urls.fstreamSingle === 'string') this.fstreamSingle = urls.fstreamSingle;
            if (typeof urls.fstreamTest === 'string') this.fstreamTest = urls.fstreamTest;
            if (typeof urls.fstreamSingleTest === 'string') this.fstreamSingleTest = urls.fstreamSingleTest;
            if (typeof urls.dstream === 'string') this.dstream = urls.dstream;
            if (typeof urls.dstreamSingle === 'string') this.dstreamSingle = urls.dstreamSingle;
            if (typeof urls.dstreamTest === 'string') this.dstreamTest = urls.dstreamTest;
            if (typeof urls.dstreamSingleTest === 'string') this.dstreamSingleTest = urls.dstreamSingleTest;
        }
        if (this.options.useServerTime) {

            const publicRequestCallback = (error, response) => {
                this.info.timeOffset = response.serverTime - new Date().getTime();
                if (callback) callback();
            }
            this.publicRequest(this.getSpotUrl() + 'v3/time', {}, publicRequestCallback);

        } else if (callback) callback();
        return this;
    }

    // ------ Request Related Functions ------ //

    /**
     * Replaces socks connection uri hostname with IP address
     * @param {string} connString - socks connection string
     * @return {string} modified string with ip address
     */
    proxyReplacewithIp(connString: string) {
        return connString;
    }

    /**
     * Returns an array in the form of [host, port]
     * @param {string} connString - connection string
     * @return {array} array of host and port
     */
    parseProxy(connString: string) {
        let arr = connString.split('/');
        let host = arr[2].split(':')[0];
        let port = arr[2].split(':')[1];
        return [arr[0], host, port];
    }

    /**
     * Checks to see of the object is iterable
     * @param {object} obj - The object check
     * @return {boolean} true or false is iterable
     */
    isIterable(obj) {
        if (obj === null) return false;
        return typeof obj[Symbol.iterator] === 'function';
    }

    addProxy(opt) {
        if (this.options.proxy) {
            const proxyauth = this.options.proxy.auth ? `${this.options.proxy.auth.username}:${this.options.proxy.auth.password}@` : '';
            opt.proxy = `http://${proxyauth}${this.options.proxy.host}:${this.options.proxy.port}`;
        }
        return opt;
    }

    reqHandler(cb) {
        return (error, response, body) => { // Arrow function keeps `this` from the class
            this.info.lastRequest = new Date().getTime();

            if (response) {
                this.info.statusCode = response.statusCode || 0;
                if (response.request) this.info.lastURL = response.request.uri.href;
                if (response.headers) {
                    this.info.usedWeight = response.headers['x-mbx-used-weight-1m'] || 0;
                    this.info.orderCount1s = response.headers['x-mbx-order-count-1s'] || 0;
                    this.info.orderCount1m = response.headers['x-mbx-order-count-1m'] || 0;
                    this.info.orderCount1h = response.headers['x-mbx-order-count-1h'] || 0;
                    this.info.orderCount1d = response.headers['x-mbx-order-count-1d'] || 0;
                }
            }

            if (!cb) return;
            if (error) return cb(error, {});
            if (response && response.statusCode !== 200) return cb(response, {});

            return cb(null, JSONbig.parse(body));
        };
    }

    proxyRequest(opt, cb) {
        const req = request(this.addProxy(opt), this.reqHandler(cb)).on('error', (err) => { cb(err, {}) });
        return req;
    }

    reqObj(url: string, data = {}, method = 'GET', key?: string) {
        return {
            url: url,
            qs: data,
            method: method,
            family: this.options.family,
            localAddress: this.options.localAddress,
            timeout: this.options.recvWindow,
            forever: this.options.keepAlive,
            headers: {
                'User-Agent': this.userAgent,
                'Content-type': this.contentType,
                'X-MBX-APIKEY': key || ''
            }
        }
    }

    reqObjPOST(url: string, data = {}, method = 'POST', key: string) {
        return {
            url: url,
            form: data,
            method: method,
            family: this.options.family,
            localAddress: this.options.localAddress,
            timeout: this.options.recvWindow,
            forever: this.options.keepAlive,
            qsStringifyOptions: {
                arrayFormat: 'repeat'
            },
            headers: {
                'User-Agent': this.userAgent,
                'Content-type': this.contentType,
                'X-MBX-APIKEY': key || ''
            }
        }
    }


    // ------ Request Related Functions ------ //

    publicRequest = (url: string, data = {}, callback: any, method = 'GET') => {
        let opt = this.reqObj(url, data, method);
        this.proxyRequest(opt, callback);
    };


    getSpotUrl() {
        if (this.options.test) return this.baseTest;
        return this.base;
    }

    uuid22(a: any) {
        return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + 1e3 + 4e3 + 8e5).replace(/[018]/g, uuid22);
    };

}