

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


    // Websockets Options
    isAlive = false;
    socketHeartbeatInterval: any = null;
    endpoint: string = ""; // endpoint for WS?
    reconnect = true;


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

    async setOptions(opt = {}, callback: any = false) {
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

            const res = await this.publicRequest(this.getSpotUrl() + 'v3/time');
            this.info.timeOffset = res.serverTime - new Date().getTime();

        }
        return this;
    }



    // ---- HELPER FUNCTIONS ---- //

    getSpotUrl() {
        if (this.options.test) return this.baseTest;
        return this.base;
    }

    uuid22(a?: any) {
        return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + 1e3 + 4e3 + 8e5).replace(/[018]/g, uuid22);
    };

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


    reqHandler(response) {
        this.info.lastRequest = new Date().getTime();
        if (response) {
            this.info.statusCode = response.status || 0;
            if (response.request) this.info.lastURL = response.request.uri.href;
            if (response.headers) {
                this.info.usedWeight = response.headers['x-mbx-used-weight-1m'] || 0;
                this.info.orderCount1s = response.headers['x-mbx-order-count-1s'] || 0;
                this.info.orderCount1m = response.headers['x-mbx-order-count-1m'] || 0;
                this.info.orderCount1h = response.headers['x-mbx-order-count-1h'] || 0;
                this.info.orderCount1d = response.headers['x-mbx-order-count-1d'] || 0;
            }
        }
        // if ( !cb ) return;
        // if ( error ) return cb( error, {} );
        // if ( response && response.statusCode !== 200 ) return cb( response, {} );
        // return cb( null, JSONbig.parse( body ) );
        if (response && response.status !== 200) {
            throw Error(response);
        }
    }

    async proxyRequest(opt: any) {
        // const req = request(this.addProxy(opt), this.reqHandler(cb)).on('error', (err) => { cb(err, {}) });
        const response = await fetch(opt.url, {
            method: opt.method,
            headers: opt.headers,
            // family: opt.family,
            // timeout: opt.timeout,
            body: JSON.stringify(opt.form)
        })
        this.reqHandler(response);
        const json = await response.json();
        return json;
    }

    reqObj(url: string, data: { [key: string]: any } = {}, method = 'GET', key?: string) {
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

    reqObjPOST(url: string, data: { [key: string]: any } = {}, method = 'POST', key: string) {
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


    async publicRequest(url: string, data: { [key: string]: any } = {}, method = 'GET') {
        let opt = this.reqObj(url, data, method);
        const res = await this.proxyRequest(opt);
        return res;
    };

    // used for futures
    async promiseRequest(url: string, data: { [key: string]: any } = {}, flags: { [key: string]: any } = {}) {
        let query = '', headers = {
            'User-Agent': this.userAgent,
            'Content-type': 'application/x-www-form-urlencoded'
        } as { [key: string]: any };
        if (!flags.method) flags.method = 'GET'; // GET POST PUT DELETE
        if (!flags.type) flags.type = false; // TRADE, SIGNED, MARKET_DATA, USER_DATA, USER_STREAM
        else {
            if (!data.recvWindow) data.recvWindow = this.options.recvWindow;
            this.requireApiKey('promiseRequest');
            headers['X-MBX-APIKEY'] = this.options.APIKEY;
        }
        let baseURL = !flags.base ? this.base : flags.base;
        if (this.options.test && baseURL === this.base) baseURL = this.baseTest;
        if (this.options.test && baseURL === this.fapi) baseURL = this.fapiTest;
        if (this.options.test && baseURL === this.dapi) baseURL = this.dapiTest;
        let opt = {
            headers,
            url: baseURL + url,
            method: flags.method,
            timeout: this.options.recvWindow,
            followAllRedirects: true
        };
        if (flags.type === 'SIGNED' || flags.type === 'TRADE' || flags.type === 'USER_DATA') {
            data.timestamp = new Date().getTime() + this.info.timeOffset;
            query = this.makeQueryString(data);
            data.signature = crypto.createHmac('sha256', this.options.APISECRET).update(query).digest('hex'); // HMAC hash header
            opt.url = `${baseURL}${url}?${query}&signature=${data.signature}`;
        }
        opt.qs = data;
        /*if ( flags.method === 'POST' ) {
            opt.form = data;
        } else {
            opt.qs = data;
        }*/
        // try {
        //     request(addProxy(opt), (error, response, body) => {
        //         if (error) return reject(error);
        //         try {
        //             this.info.lastRequest = new Date().getTime();
        //             if (response) {
        //                 this.info.statusCode = response.statusCode || 0;
        //                 if (response.request) this.info.lastURL = response.request.uri.href;
        //                 if (response.headers) {
        //                     this.info.usedWeight = response.headers['x-mbx-used-weight-1m'] || 0;
        //                     this.info.futuresLatency = response.headers['x-response-time'] || 0;
        //                 }
        //             }
        //             if (!error && response.statusCode == 200) return resolve(JSONbig.parse(body));
        //             if (typeof response.body !== 'undefined') {
        //                 return resolve(JSONbig.parse(response.body));
        //             }
        //             return reject(response);
        //         } catch (err) {
        //             return reject(`promiseRequest error #${response.statusCode}`);
        //         }
        //     }).on('error', reject);
        // } catch (err) {
        //     return reject(err);
        // }
        const response = await this.proxyRequest(opt);
        return response;

    };

    // ------ Request Related Functions ------ //


    // XXX: This one works with array (e.g. for dust.transfer)
    // XXX: I _guess_ we could use replace this function with the `qs` module
    makeQueryString(q) {

        const res = Object.keys(q)
            .reduce((a, k) => {
                if (Array.isArray(q[k])) {
                    q[k].forEach(v => {
                        a.push(k + "=" + encodeURIComponent(v))
                    })
                } else if (q[k] !== undefined) {
                    a.push(k + "=" + encodeURIComponent(q[k]));
                }
                return a;
            }, [])
            .join("&");
        return res;
    }

    /**
     * Create a http request to the public API
     * @param {string} url - The http endpoint
     * @param {object} data - The data to send
     * @param {function} callback - The callback method to call
     * @param {string} method - the http method
     * @return {undefined}
     */
    async apiRequest(url: string, data: { [key: string]: any } = {}, method = 'GET') {
        this.requireApiKey('apiRequest');
        let opt = this.reqObj(
            url,
            data,
            method,
            this.options.APIKEY
        );
        const res = await this.proxyRequest(opt);
        return res;
    };


    requireApiKey(source = 'requireApiKey', fatalError = true) {
        if (!this.options.APIKEY) {
            if (fatalError) throw Error(`${source}: Invalid API Key!`);
            return false;
        }
        return true;
    }


    // Check if API secret is present
    requireApiSecret(source = 'requireApiSecret', fatalError = true) {
        if (!this.options.APIKEY) {
            if (fatalError) throw Error(`${source}: Invalid API Key!`);
            return false;
        }
        if (!this.options.APISECRET) {
            if (fatalError) throw Error(`${source}: Invalid API Secret!`);
            return false;
        }
        return true;
    }


    /**
 * Make market request
 * @param {string} url - The http endpoint
 * @param {object} data - The data to send
 * @param {function} callback - The callback method to call
 * @param {string} method - the http method
 * @return {undefined}
 */
    async marketRequest(url: string, data: { [key: string]: any } = {}, method = 'GET') {
        this.requireApiKey('marketRequest');
        let query = this.makeQueryString(data);
        let opt = this.reqObj(
            url + (query ? '?' + query : ''),
            data,
            method,
            this.options.APIKEY
        );
        const res = await this.proxyRequest(opt);
        return res;
    };


    /**
     * Create a signed http request
     * @param {string} url - The http endpoint
     * @param {object} data - The data to send
     * @param {function} callback - The callback method to call
     * @param {string} method - the http method
     * @param {boolean} noDataInSignature - Prevents data from being added to signature
     * @return {undefined}
     */
    async signedRequest(url: string, data: { [key: string]: any } = {}, method = 'GET', noDataInSignature = false) {
        this.requireApiSecret('signedRequest');
        data.timestamp = new Date().getTime() + this.info.timeOffset;
        if (!data.recvWindow) data.recvWindow = this.options.recvWindow;
        let query = method === 'POST' && noDataInSignature ? '' : this.makeQueryString(data);
        let signature = crypto.createHmac('sha256', this.options.APISECRET).update(query).digest('hex'); // set the HMAC hash header
        if (method === 'POST') {
            let opt = this.reqObjPOST(
                url,
                data,
                method,
                this.options.APIKEY
            );
            opt.form.signature = signature;
            const reqPost = await this.proxyRequest(opt);
            return reqPost
        } else {
            let opt = this.reqObj(
                url + '?' + query + '&signature=' + signature,
                data,
                method,
                this.options.APIKEY
            );
            const reqGet = await this.proxyRequest(opt);
            return reqGet
        }
    };

    // --- ENDPOINTS --- //


    /**
     * Create a signed spot order
     * @param {string} side - BUY or SELL
     * @param {string} symbol - The symbol to buy or sell
     * @param {string} quantity - The quantity to buy or sell
     * @param {string} price - The price per unit to transact each unit at
     * @param {object} flags - additional order settings
     * @param {function} callback - the callback function
     * @return {undefined}
     */
    async order(side: string, symbol: string, quantity: number, price?: number, flags: { [key: string]: any } = {}) {
        let endpoint = flags.type === 'OCO' ? 'v3/orderList/oco' : 'v3/order';
        if (typeof flags.test && flags.test) endpoint += '/test';
        let opt = {
            symbol: symbol,
            side: side,
            type: 'LIMIT'
        } as { [key: string]: any };
        if (typeof flags.quoteOrderQty !== undefined && flags.quoteOrderQty > 0)
            opt.quoteOrderQty = flags.quoteOrderQty
        else
            opt.quantity = quantity
        if (typeof flags.type !== 'undefined') opt.type = flags.type;
        if (opt.type.includes('LIMIT')) {
            opt.price = price;
            if (opt.type !== 'LIMIT_MAKER') {
                opt.timeInForce = 'GTC';
            }
        }
        if (opt.type == 'MARKET' && typeof flags.quoteOrderQty !== 'undefined') {
            opt.quoteOrderQty = flags.quoteOrderQty
            delete opt.quantity;
        }
        if (opt.type === 'OCO') {
            opt.price = price;
            opt.stopLimitPrice = flags.stopLimitPrice;
            opt.stopLimitTimeInForce = 'GTC';
            delete opt.type;
            if (typeof flags.listClientOrderId !== 'undefined') opt.listClientOrderId = flags.listClientOrderId;
            if (typeof flags.limitClientOrderId !== 'undefined') opt.limitClientOrderId = flags.limitClientOrderId;
            if (typeof flags.stopClientOrderId !== 'undefined') opt.stopClientOrderId = flags.stopClientOrderId;
        }
        if (typeof flags.timeInForce !== 'undefined') opt.timeInForce = flags.timeInForce;
        if (typeof flags.newOrderRespType !== 'undefined') opt.newOrderRespType = flags.newOrderRespType;
        if (typeof flags.newClientOrderId !== 'undefined') {
            opt.newClientOrderId = flags.newClientOrderId;
        } else {
            opt.newClientOrderId = this.SPOT_PREFIX + this.uuid22();
        }

        /*
         * STOP_LOSS
         * STOP_LOSS_LIMIT
         * TAKE_PROFIT
         * TAKE_PROFIT_LIMIT
         * LIMIT_MAKER
         */
        if (typeof flags.icebergQty !== 'undefined') opt.icebergQty = flags.icebergQty;
        if (typeof flags.stopPrice !== 'undefined') {
            opt.stopPrice = flags.stopPrice;
            if (opt.type === 'LIMIT') throw Error('stopPrice: Must set "type" to one of the following: STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT');
        }
        const response = await this.signedRequest(this.getSpotUrl() + endpoint, opt, 'POST');
        // to do error handling
        // if ( !response ) {
        //     if ( callback ) callback( error, response );
        //     else this.options.log( 'Order() error:', error );
        //     return;
        // }
        // if ( typeof response.msg !== 'undefined' && response.msg === 'Filter failure: MIN_NOTIONAL' ) {
        //     this.options.log( 'Order quantity too small. See exchangeInfo() for minimum amounts' );
        // }
        // if ( callback ) callback( error, response );
        // else this.options.log( side + '(' + symbol + ',' + quantity + ',' + price + ') ', response );
        return response
    };



    /**
     * Create a signed margin order
     * @param {string} side - BUY or SELL
     * @param {string} symbol - The symbol to buy or sell
     * @param {string} quantity - The quantity to buy or sell
     * @param {string} price - The price per unit to transact each unit at
     * @param {object} flags - additional order settings
     * @param {function} callback - the callback function
     * @return {undefined}
     */
    async marginOrder(side: string, symbol: string, quantity: number, price?: number, flags: { [key: string]: any } = {}) {
        let endpoint = 'v1/margin/order';
        if (this.options.test) endpoint += '/test';
        let opt = {
            symbol: symbol,
            side: side,
            type: 'LIMIT',
            quantity: quantity
        } as { [key: string]: any };
        if (typeof flags.type !== 'undefined') opt.type = flags.type;
        if (typeof flags.isIsolated !== 'undefined') opt.isIsolated = flags.isIsolated;
        if (opt.type.includes('LIMIT')) {
            opt.price = price;
            if (opt.type !== 'LIMIT_MAKER') {
                opt.timeInForce = 'GTC';
            }
        }

        if (typeof flags.timeInForce !== 'undefined') opt.timeInForce = flags.timeInForce;
        if (typeof flags.newOrderRespType !== 'undefined') opt.newOrderRespType = flags.newOrderRespType;
        // if ( typeof flags.newClientOrderId !== 'undefined' ) opt.newClientOrderId = flags.newClientOrderId;
        if (typeof flags.newClientOrderId !== 'undefined') {
            opt.newClientOrderId = flags.newClientOrderId;
        } else {
            opt.newClientOrderId = this.SPOT_PREFIX + this.uuid22();
        }
        if (typeof flags.sideEffectType !== 'undefined') opt.sideEffectType = flags.sideEffectType;

        /*
         * STOP_LOSS
         * STOP_LOSS_LIMIT
         * TAKE_PROFIT
         * TAKE_PROFIT_LIMIT
         */
        if (typeof flags.icebergQty !== 'undefined') opt.icebergQty = flags.icebergQty;
        if (typeof flags.stopPrice !== 'undefined') {
            opt.stopPrice = flags.stopPrice;
            if (opt.type === 'LIMIT') throw Error('stopPrice: Must set "type" to one of the following: STOP_LOSS, STOP_LOSS_LIMIT, TAKE_PROFIT, TAKE_PROFIT_LIMIT');
        }
        return await this.signedRequest(this.sapi + endpoint, opt, 'POST');
    };


    // Futures internal functions
    async futuresOrder(side: string, symbol: string, quantity: number, price = false, params: { [key: string]: any } = {}) {
        params.symbol = symbol;
        params.side = side;
        if (quantity) params.quantity = quantity;
        // if in the binance futures setting Hedged mode is active, positionSide parameter is mandatory
        if (!params.positionSide && this.options.hedgeMode) {
            params.positionSide = side === 'BUY' ? 'LONG' : 'SHORT';
        }
        // LIMIT STOP MARKET STOP_MARKET TAKE_PROFIT TAKE_PROFIT_MARKET
        // reduceOnly stopPrice
        if (price) {
            params.price = price;
            if (!params.type) params.type = 'LIMIT';
        } else {
            if (!params.type) params.type = 'MARKET';
        }
        if (!params.timeInForce && (params.type.includes('LIMIT') || params.type === 'STOP' || params.type === 'TAKE_PROFIT')) {
            params.timeInForce = 'GTX'; // Post only by default. Use GTC for limit orders.
        }

        if (!params.newClientOrderId) {
            params.newClientOrderId = this.CONTRACT_PREFIX + this.uuid22();
        }
        return await this.promiseRequest('v1/order', params, { base: this.fapi, type: 'TRADE', method: 'POST' });
    };


    async deliveryOrder(side: string, symbol: string, quantity: number, price = false, params: { [key: string]: any } = {}) {
        params.symbol = symbol;
        params.side = side;
        params.quantity = quantity;
        // if in the binance futures setting Hedged mode is active, positionSide parameter is mandatory
        if (this.options.hedgeMode) {
            params.positionSide = side === 'BUY' ? 'LONG' : 'SHORT';
        }
        // LIMIT STOP MARKET STOP_MARKET TAKE_PROFIT TAKE_PROFIT_MARKET
        // reduceOnly stopPrice
        if (price) {
            params.price = price;
            if (!params.type) params.type = 'LIMIT';
        } else {
            if (!params.type) params.type = 'MARKET';
        }
        if (!params.timeInForce && (params.type.includes('LIMIT') || params.type === 'STOP' || params.type === 'TAKE_PROFIT')) {
            params.timeInForce = 'GTX'; // Post only by default. Use GTC for limit orders.
        }

        if (!params.newClientOrderId) {
            params.newClientOrderId = this.CONTRACT_PREFIX + this.uuid22();
        }
        return await this.promiseRequest('v1/order', params, { base: this.dapi, type: 'TRADE', method: 'POST' });
    };

    // ------ WS RELATED FUNCTIONS ------ //

    noop() {
        return;
    }

    /**
     * Reworked Tuitio's heartbeat code into a shared single interval tick
     * @return {undefined}
     */
    socketHeartbeat() {
        /* Sockets removed from `subscriptions` during a manual terminate()
         will no longer be at risk of having functions called on them */
        for (let endpointId in this.subscriptions) {
            const ws = this.subscriptions[endpointId];
            if (ws.isAlive) {
                ws.isAlive = false;
                if (ws.readyState === WebSocket.OPEN) ws.ping(this.noop);
            } else {
                if (this.options.verbose) this.options.log('Terminating inactive/broken WebSocket: ' + ws.endpoint);
                if (ws.readyState === WebSocket.OPEN) ws.terminate();
            }
        }
    };

    /**
     * Called when socket is opened, subscriptions are registered for later reference
     * @param {function} opened_callback - a callback function
     * @return {undefined}
     */
    handleSocketOpen(opened_callback) {
        this.isAlive = true;
        if (Object.keys(this.subscriptions).length === 0) {
            this.socketHeartbeatInterval = setInterval(this.socketHeartbeat, 30000);
        }
        this.subscriptions[this.endpoint] = this;
        if (typeof opened_callback === 'function') opened_callback(this.endpoint);
    };


    /**
     * Called when socket is closed, subscriptions are de-registered for later reference
     * @param {boolean} reconnect - true or false to reconnect the socket
     * @param {string} code - code associated with the socket
     * @param {string} reason - string with the response
     * @return {undefined}
     */
    handleSocketClose(reconnect: boolean, code, reason: string) {
        delete this.subscriptions[this.endpoint];
        if (this.subscriptions && Object.keys(this.subscriptions).length === 0) {
            clearInterval(this.socketHeartbeatInterval);
        }
        this.options.log('WebSocket closed: ' + this.endpoint +
            (code ? ' (' + code + ')' : '') +
            (reason ? ' ' + reason : ''));
        if (this.options.reconnect && this.reconnect && reconnect) {
            if (this.endpoint && parseInt(this.endpoint.length, 10) === 60) this.options.log('Account data WebSocket reconnecting...');
            else this.options.log('WebSocket reconnecting: ' + this.endpoint + '...');
            try {
                this.reconnect();
            } catch (error) {
                this.options.log('WebSocket reconnect error: ' + error.message);
            }
        }
    };


    /**
 * Called when socket errors
 * @param {object} error - error object message
 * @return {undefined}
 */
    handleSocketError(error) {
        /* Errors ultimately result in a `close` event.
         see: https://github.com/websockets/ws/blob/828194044bf247af852b31c49e2800d557fedeff/lib/websocket.js#L126 */
        this.options.log('WebSocket error: ' + this.endpoint +
            (error.code ? ' (' + error.code + ')' : '') +
            (error.message ? ' ' + error.message : ''));
    };

    /**
     * Called on each socket heartbeat
     * @return {undefined}
     */
    handleSocketHeartbeat() {
        this.isAlive = true;
    };

    // ----- WS ENDPOINTS ----- //

    /**
    * Get Binance server time
    * @return {promise or undefined} - omitting the callback returns a promise
    */
    async time() {
        const res = await this.publicRequest(this.getSpotUrl() + 'v3/time', {});
        return res;
    }



    /**
     * Used to subscribe to a single websocket endpoint
     * @param {string} endpoint - endpoint to connect to
     * @param {function} callback - the function to call when information is received
     * @param {boolean} reconnect - whether to reconnect on disconnect
     * @param {object} opened_callback - the function to call when opened
     * @return {WebSocket} - websocket reference
     */
    subscribe(endpoint: string, callback, reconnect = false, opened_callback = false) {
        let httpsproxy = process.env.https_proxy || false;
        let socksproxy = process.env.socks_proxy || false;
        let ws: WebSocket = undefined;

        if (socksproxy !== false) {
            socksproxy = proxyReplacewithIp(socksproxy);
            if (this.options.verbose) this.options.log('using socks proxy server ' + socksproxy);
            let agent = new SocksProxyAgent({
                protocol: parseProxy(socksproxy)[0],
                host: parseProxy(socksproxy)[1],
                port: parseProxy(socksproxy)[2]
            });
            ws = new WebSocket(stream + endpoint, { agent: agent });
        } else if (httpsproxy !== false) {
            let config = url.parse(httpsproxy);
            let agent = new HttpsProxyAgent(config);
            if (this.options.verbose) this.options.log('using proxy server ' + agent);
            ws = new WebSocket(stream + endpoint, { agent: agent });
        } else {
            ws = new WebSocket(stream + endpoint);
        }

        if (this.options.verbose) this.options.log('Subscribed to ' + endpoint);
        ws.reconnect = this.options.reconnect;
        ws.endpoint = endpoint;
        ws.isAlive = false;
        ws.on('open', handleSocketOpen.bind(ws, opened_callback));
        ws.on('pong', handleSocketHeartbeat);
        ws.on('error', handleSocketError);
        ws.on('close', handleSocketClose.bind(ws, reconnect));
        ws.on('message', data => {
            try {
                callback(JSON.parse(data));
            } catch (error) {
                this.options.log('Parse error: ' + error.message);
            }
        });
        return ws;
    };

    /**
     * Used to subscribe to a combined websocket endpoint
     * @param {string} streams - streams to connect to
     * @param {function} callback - the function to call when information is received
     * @param {boolean} reconnect - whether to reconnect on disconnect
     * @param {object} opened_callback - the function to call when opened
     * @return {WebSocket} - websocket reference
     */
    subscribeCombined(streams, callback, reconnect = false, opened_callback = false) {
        let httpsproxy = process.env.https_proxy || false;
        let socksproxy = process.env.socks_proxy || false;
        const queryParams = streams.join('/');
        let ws = false;
        if (socksproxy !== false) {
            socksproxy = proxyReplacewithIp(socksproxy);
            if (this.options.verbose) this.options.log('using socks proxy server ' + socksproxy);
            let agent = new SocksProxyAgent({
                protocol: parseProxy(socksproxy)[0],
                host: parseProxy(socksproxy)[1],
                port: parseProxy(socksproxy)[2]
            });
            ws = new WebSocket(combineStream + queryParams, { agent: agent });
        } else if (httpsproxy !== false) {
            if (this.options.verbose) this.options.log('using proxy server ' + httpsproxy);
            let config = url.parse(httpsproxy);
            let agent = new HttpsProxyAgent(config);
            ws = new WebSocket(combineStream + queryParams, { agent: agent });
        } else {
            ws = new WebSocket(combineStream + queryParams);
        }

        ws.reconnect = this.options.reconnect;
        ws.endpoint = stringHash(queryParams);
        ws.isAlive = false;
        if (this.options.verbose) {
            this.options.log('CombinedStream: Subscribed to [' + ws.endpoint + '] ' + queryParams);
        }
        ws.on('open', handleSocketOpen.bind(ws, opened_callback));
        ws.on('pong', handleSocketHeartbeat);
        ws.on('error', handleSocketError);
        ws.on('close', handleSocketClose.bind(ws, reconnect));
        ws.on('message', data => {
            try {
                callback(JSON.parse(data).data);
            } catch (error) {
                this.options.log('CombinedStream: Parse error: ' + error.message);
            }
        });
        return ws;
    };

    /**
     * Used to terminate a web socket
     * @param {string} endpoint - endpoint identifier associated with the web socket
     * @param {boolean} reconnect - auto reconnect after termination
     * @return {undefined}
     */
    terminate(endpoint, reconnect = false) {
        let ws = this.subscriptions[endpoint];
        if (!ws) return;
        ws.removeAllListeners('message');
        ws.reconnect = reconnect;
        ws.terminate();
    }


    /**
     * Futures heartbeat code with a shared single interval tick
     * @return {undefined}
     */
    const futuresSocketHeartbeat = () => {
        /* Sockets removed from subscriptions during a manual terminate()
         will no longer be at risk of having functions called on them */
        for (let endpointId in this.futuresSubscriptions) {
            const ws = this.futuresSubscriptions[endpointId];
            if (ws.isAlive) {
                ws.isAlive = false;
                if (ws.readyState === WebSocket.OPEN) ws.ping(noop);
            } else {
                if (this.options.verbose) this.options.log(`Terminating zombie futures WebSocket: ${ws.endpoint}`);
                if (ws.readyState === WebSocket.OPEN) ws.terminate();
            }
        }
    };

    /**
     * Called when a futures socket is opened, subscriptions are registered for later reference
     * @param {function} openCallback - a callback function
     * @return {undefined}
     */
    handleFuturesSocketOpen(openCallback) {
        this.isAlive = true;
        if (Object.keys(this.futuresSubscriptions).length === 0) {
            this.socketHeartbeatInterval = setInterval(futuresSocketHeartbeat, 30000);
        }
        this.futuresSubscriptions[this.endpoint] = this;
        if (typeof openCallback === 'function') openCallback(this.endpoint);
    };

    /**
     * Called when futures websocket is closed, subscriptions are de-registered for later reference
     * @param {boolean} reconnect - true or false to reconnect the socket
     * @param {string} code - code associated with the socket
     * @param {string} reason - string with the response
     * @return {undefined}
     */
    handleFuturesSocketClose(reconnect, code, reason) {
        delete this.futuresSubscriptions[this.endpoint];
        if (this.futuresSubscriptions && Object.keys(this.futuresSubscriptions).length === 0) {
            clearInterval(this.socketHeartbeatInterval);
        }
        this.options.log('Futures WebSocket closed: ' + this.endpoint +
            (code ? ' (' + code + ')' : '') +
            (reason ? ' ' + reason : ''));
        if (this.options.reconnect && this.reconnect && reconnect) {
            if (this.endpoint && parseInt(this.endpoint.length, 10) === 60) this.options.log('Futures account data WebSocket reconnecting...');
            else this.options.log('Futures WebSocket reconnecting: ' + this.endpoint + '...');
            try {
                reconnect();
            } catch (error) {
                this.options.log('Futures WebSocket reconnect error: ' + error.message);
            }
        }
    };

    /**
     * Called when a futures websocket errors
     * @param {object} error - error object message
     * @return {undefined}
     */
    handleFuturesSocketError(error) {
        this.options.log('Futures WebSocket error: ' + this.endpoint +
            (error.code ? ' (' + error.code + ')' : '') +
            (error.message ? ' ' + error.message : ''));
    };

    /**
     * Called on each futures socket heartbeat
     * @return {undefined}
     */
    const handleFuturesSocketHeartbeat = function () {
        this.isAlive = true;
    };

    /**
     * Used to subscribe to a single futures websocket endpoint
     * @param {string} endpoint - endpoint to connect to
     * @param {function} callback - the function to call when information is received
     * @param {object} params - Optional reconnect {boolean} (whether to reconnect on disconnect), openCallback {function}, id {string}
     * @return {WebSocket} - websocket reference
     */
    futuresSubscribeSingle(endpoint, callback, params = {}) {
        if (typeof params === 'boolean') params = { reconnect: params };
        if (!params.reconnect) params.reconnect = false;
        if (!params.openCallback) params.openCallback = false;
        if (!params.id) params.id = false;
        let httpsproxy = process.env.https_proxy || false;
        let socksproxy = process.env.socks_proxy || false;
        let ws = false;

        if (socksproxy !== false) {
            socksproxy = proxyReplacewithIp(socksproxy);
            if (this.options.verbose) this.options.log(`futuresSubscribeSingle: using socks proxy server: ${socksproxy}`);
            let agent = new SocksProxyAgent({
                protocol: parseProxy(socksproxy)[0],
                host: parseProxy(socksproxy)[1],
                port: parseProxy(socksproxy)[2]
            });
            ws = new WebSocket((this.options.test ? fstreamSingleTest : fstreamSingle) + endpoint, { agent });
        } else if (httpsproxy !== false) {
            let config = url.parse(httpsproxy);
            let agent = new HttpsProxyAgent(config);
            if (this.options.verbose) this.options.log(`futuresSubscribeSingle: using proxy server: ${agent}`);
            ws = new WebSocket((this.options.test ? fstreamSingleTest : fstreamSingle) + endpoint, { agent });
        } else {
            ws = new WebSocket((this.options.test ? fstreamSingleTest : fstreamSingle) + endpoint);
        }

        if (this.options.verbose) this.options.log('futuresSubscribeSingle: Subscribed to ' + endpoint);
        ws.reconnect = this.options.reconnect;
        ws.endpoint = endpoint;
        ws.isAlive = false;
        ws.on('open', handleFuturesSocketOpen.bind(ws, params.openCallback));
        ws.on('pong', handleFuturesSocketHeartbeat);
        ws.on('error', handleFuturesSocketError);
        ws.on('close', handleFuturesSocketClose.bind(ws, params.reconnect));
        ws.on('message', data => {
            try {
                callback(JSONbig.parse(data));
            } catch (error) {
                this.options.log('Parse error: ' + error.message);
            }
        });
        return ws;
    };

    /**
     * Used to subscribe to a combined futures websocket endpoint
     * @param {string} streams - streams to connect to
     * @param {function} callback - the function to call when information is received
     * @param {object} params - Optional reconnect {boolean} (whether to reconnect on disconnect), openCallback {function}, id {string}
     * @return {WebSocket} - websocket reference
     */
    futuresSubscribe(streams, callback, params = {}) {
        if (typeof streams === 'string') return futuresSubscribeSingle(streams, callback, params);
        if (typeof params === 'boolean') params = { reconnect: params };
        if (!params.reconnect) params.reconnect = false;
        if (!params.openCallback) params.openCallback = false;
        if (!params.id) params.id = false;
        let httpsproxy = process.env.https_proxy || false;
        let socksproxy = process.env.socks_proxy || false;
        const queryParams = streams.join('/');
        let ws = false;
        if (socksproxy !== false) {
            socksproxy = proxyReplacewithIp(socksproxy);
            if (this.options.verbose) this.options.log(`futuresSubscribe: using socks proxy server ${socksproxy}`);
            let agent = new SocksProxyAgent({
                protocol: parseProxy(socksproxy)[0],
                host: parseProxy(socksproxy)[1],
                port: parseProxy(socksproxy)[2]
            });
            ws = new WebSocket((this.options.test ? fstreamTest : fstream) + queryParams, { agent });
        } else if (httpsproxy !== false) {
            if (this.options.verbose) this.options.log(`futuresSubscribe: using proxy server ${httpsproxy}`);
            let config = url.parse(httpsproxy);
            let agent = new HttpsProxyAgent(config);
            ws = new WebSocket((this.options.test ? fstreamTest : fstream) + queryParams, { agent });
        } else {
            ws = new WebSocket((this.options.test ? fstreamTest : fstream) + queryParams);
        }

        ws.reconnect = this.options.reconnect;
        ws.endpoint = stringHash(queryParams);
        ws.isAlive = false;
        if (this.options.verbose) {
            this.options.log(`futuresSubscribe: Subscribed to [${ws.endpoint}] ${queryParams}`);
        }
        ws.on('open', handleFuturesSocketOpen.bind(ws, params.openCallback));
        ws.on('pong', handleFuturesSocketHeartbeat);
        ws.on('error', handleFuturesSocketError);
        ws.on('close', handleFuturesSocketClose.bind(ws, params.reconnect));
        ws.on('message', data => {
            try {
                callback(JSON.parse(data).data);
            } catch (error) {
                this.options.log(`futuresSubscribe: Parse error: ${error.message}`);
            }
        });
        return ws;
    };

    /**
     * Used to terminate a futures websocket
     * @param {string} endpoint - endpoint identifier associated with the web socket
     * @param {boolean} reconnect - auto reconnect after termination
     * @return {undefined}
     */
    futuresTerminate(endpoint, reconnect = false) {
        let ws = this.futuresSubscriptions[endpoint];
        if (!ws) return;
        ws.removeAllListeners('message');
        ws.reconnect = reconnect;
        ws.terminate();
    }

    /**
     * Combines all futures OHLC data with the latest update
     * @param {string} symbol - the symbol
     * @param {string} interval - time interval
     * @return {array} - interval data for given symbol
     */
    futuresKlineConcat(symbol, interval) {
        let output = this.futuresTicks[symbol][interval];
        if (typeof this.futuresRealtime[symbol][interval].time === 'undefined') return output;
        const time = this.futuresRealtime[symbol][interval].time;
        const last_updated = Object.keys(this.futuresTicks[symbol][interval]).pop();
        if (time >= last_updated) {
            output[time] = this.futuresRealtime[symbol][interval];
            //delete output[time].time;
            output[last_updated].isFinal = true;
            output[time].isFinal = false;
        }
        return output;
    };

    /**
     * Used for websocket futures @kline
     * @param {string} symbol - the symbol
     * @param {object} kline - object with kline info
     * @param {string} firstTime - time filter
     * @return {undefined}
     */
    futuresKlineHandler(symbol, kline, firstTime = 0) {
        // eslint-disable-next-line no-unused-vars
        let { e: eventType, E: eventTime, k: ticks } = kline;
        // eslint-disable-next-line no-unused-vars
        let { o: open, h: high, l: low, c: close, v: volume, i: interval, x: isFinal, q: quoteVolume, V: takerBuyBaseVolume, Q: takerBuyQuoteVolume, n: trades, t: time, T: closeTime } = ticks;
        if (time <= firstTime) return;
        if (!isFinal) {
            // if ( typeof this.futuresRealtime[symbol][interval].time !== 'undefined' ) {
            //     if ( this.futuresRealtime[symbol][interval].time > time ) return;
            // }
            this.futuresRealtime[symbol][interval] = { time, closeTime, open, high, low, close, volume, quoteVolume, takerBuyBaseVolume, takerBuyQuoteVolume, trades, isFinal };
            return;
        }
        const first_updated = Object.keys(this.futuresTicks[symbol][interval]).shift();
        if (first_updated) delete this.futuresTicks[symbol][interval][first_updated];
        this.futuresTicks[symbol][interval][time] = { time, closeTime, open, high, low, close, volume, quoteVolume, takerBuyBaseVolume, takerBuyQuoteVolume, trades, isFinal: false };
    };

    /**
     * Converts the futures liquidation stream data into a friendly object
     * @param {object} data - liquidation data callback data type
     * @return {object} - user friendly data type
     */
    fLiquidationConvertData(data) {
        let eventType = data.e, eventTime = data.E;
        let {
            s: symbol,
            S: side,
            o: orderType,
            f: timeInForce,
            q: origAmount,
            p: price,
            ap: avgPrice,
            X: orderStatus,
            l: lastFilledQty,
            z: totalFilledQty,
            T: tradeTime
        } = data.o;
        return { symbol, side, orderType, timeInForce, origAmount, price, avgPrice, orderStatus, lastFilledQty, totalFilledQty, eventType, tradeTime, eventTime };
    };

    /**
     * Converts the futures ticker stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fTickerConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                p: priceChange,
                P: percentChange,
                w: averagePrice,
                c: close,
                Q: closeQty,
                o: open,
                h: high,
                l: low,
                v: volume,
                q: quoteVolume,
                O: openTime,
                C: closeTime,
                F: firstTradeId,
                L: lastTradeId,
                n: numTrades
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                priceChange,
                percentChange,
                averagePrice,
                close,
                closeQty,
                open,
                high,
                low,
                volume,
                quoteVolume,
                openTime,
                closeTime,
                firstTradeId,
                lastTradeId,
                numTrades
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Converts the futures miniTicker stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fMiniTickerConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                c: close,
                o: open,
                h: high,
                l: low,
                v: volume,
                q: quoteVolume
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                close,
                open,
                high,
                low,
                volume,
                quoteVolume
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Converts the futures bookTicker stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fBookTickerConvertData(data) {
        let {
            u: updateId,
            s: symbol,
            b: bestBid,
            B: bestBidQty,
            a: bestAsk,
            A: bestAskQty
        } = data;
        return {
            updateId,
            symbol,
            bestBid,
            bestBidQty,
            bestAsk,
            bestAskQty
        };
    };

    /**
     * Converts the futures UserData stream MARGIN_CALL data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fUserDataMarginConvertData(data) {
        let {
            e: eventType,
            E: eventTime,
            cw: crossWalletBalance, // only pushed with crossed position margin call
            p: positions
        } = data;
        let positionConverter = position => {
            let {
                s: symbol,
                ps: positionSide,
                pa: positionAmount,
                mt: marginType,
                iw: isolatedWallet, // if isolated position
                mp: markPrice,
                up: unrealizedPnL,
                mm: maintenanceMargin // maintenance margin required
            } = position;
            return {
                symbol,
                positionSide,
                positionAmount,
                marginType,
                isolatedWallet,
                markPrice,
                unrealizedPnL,
                maintenanceMargin
            }
        };
        const convertedPositions = [];
        for (let position of positions) {
            convertedPositions.push(positionConverter(position));
        }
        positions = convertedPositions;
        return {
            eventType,
            eventTime,
            crossWalletBalance,
            positions
        };
    };

    /**
     * Converts the futures UserData stream ACCOUNT_CONFIG_UPDATE into a friendly object
     * @param {object} data - user config callback data type
     * @return {object} - user friendly data type
     */
    fUserConfigDataAccountUpdateConvertData(data) {
        return {
            eventType: data.e,
            eventTime: data.E,
            transactionTime: data.T,
            ac: {
                symbol: data.ac.s,
                leverage: data.ac.l
            }
        };
    };

    /**
     * Converts the futures UserData stream ACCOUNT_UPDATE data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fUserDataAccountUpdateConvertData(data) {
        let {
            e: eventType,
            E: eventTime,
            T: transaction,
            a: updateData
        } = data;
        let updateConverter = updateData => {
            let {
                m: eventReasonType,
                B: balances,
                P: positions
            } = updateData;
            let positionConverter = position => {
                let {
                    s: symbol,
                    pa: positionAmount,
                    ep: entryPrice,
                    cr: accumulatedRealized, // (Pre-fee) Accumulated Realized
                    up: unrealizedPnL,
                    mt: marginType,
                    iw: isolatedWallet, // if isolated position
                    ps: positionSide
                } = position;
                return {
                    symbol,
                    positionAmount,
                    entryPrice,
                    accumulatedRealized,
                    unrealizedPnL,
                    marginType,
                    isolatedWallet,
                    positionSide
                };
            };
            let balanceConverter = balance => {
                let {
                    a: asset,
                    wb: walletBalance,
                    cw: crossWalletBalance,
                    bc: balanceChange
                } = balance;
                return {
                    asset,
                    walletBalance,
                    crossWalletBalance,
                    balanceChange
                };
            };

            const balanceResult = [];
            const positionResult = [];

            for (let balance of balances) {
                balanceResult.push(balanceConverter(balance));
            }
            for (let position of positions) {
                positionResult.push(positionConverter(position));
            }

            balances = balanceResult;
            positions = positionResult;
            return {
                eventReasonType,
                balances,
                positions
            };
        };
        updateData = updateConverter(updateData);
        return {
            eventType,
            eventTime,
            transaction,
            updateData
        };
    };

    /**
     * Converts the futures UserData stream ORDER_TRADE_UPDATE data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fUserDataOrderUpdateConvertData(data) {
        let {
            e: eventType,
            E: eventTime,
            T: transaction, // transaction time
            o: order
        } = data;

        let orderConverter = order => {
            let {
                s: symbol,
                c: clientOrderId,
                // special client order id:
                // starts with "autoclose-": liquidation order
                // "adl_autoclose": ADL auto close order
                S: side,
                o: orderType,
                f: timeInForce,
                q: originalQuantity,
                p: originalPrice,
                ap: averagePrice,
                sp: stopPrice, // please ignore with TRAILING_STOP_MARKET order,
                x: executionType,
                X: orderStatus,
                i: orderId,
                l: orderLastFilledQuantity,
                z: orderFilledAccumulatedQuantity,
                L: lastFilledPrice,
                N: commissionAsset, // will not push if no commission
                n: commission, // will not push if no commission
                T: orderTradeTime,
                t: tradeId,
                b: bidsNotional,
                a: askNotional,
                m: isMakerSide, // is this trade maker side
                R: isReduceOnly, // is this reduce only
                wt: stopPriceWorkingType,
                ot: originalOrderType,
                ps: positionSide,
                cp: closeAll, // if close-all, pushed with conditional order
                AP: activationPrice, // only pushed with TRAILING_STOP_MARKET order
                cr: callbackRate, // only pushed with TRAILING_STOP_MARKET order
                rp: realizedProfit
            } = order;
            return {
                symbol,
                clientOrderId,
                side,
                orderType,
                timeInForce,
                originalQuantity,
                originalPrice,
                averagePrice,
                stopPrice,
                executionType,
                orderStatus,
                orderId,
                orderLastFilledQuantity,
                orderFilledAccumulatedQuantity,
                lastFilledPrice,
                commissionAsset,
                commission,
                orderTradeTime,
                tradeId,
                bidsNotional,
                askNotional,
                isMakerSide,
                isReduceOnly,
                stopPriceWorkingType,
                originalOrderType,
                positionSide,
                closeAll,
                activationPrice,
                callbackRate,
                realizedProfit
            };
        };
        order = orderConverter(order);
        return {
            eventType,
            eventTime,
            transaction,
            order
        };
    };

    /**
     * Converts the futures markPrice stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fMarkPriceConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                p: markPrice,
                i: indexPrice,
                r: fundingRate,
                T: fundingTime
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                markPrice,
                indexPrice,
                fundingRate,
                fundingTime
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Converts the futures aggTrade stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    fAggTradeConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                a: aggTradeId,
                p: price,
                q: amount,
                f: firstTradeId,
                l: lastTradeId,
                T: timestamp,
                m: maker
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                aggTradeId,
                price,
                amount,
                total: price * amount,
                firstTradeId,
                lastTradeId,
                timestamp,
                maker
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Delivery heartbeat code with a shared single interval tick
     * @return {undefined}
     */
    const deliverySocketHeartbeat = () => {
        /* Sockets removed from subscriptions during a manual terminate()
         will no longer be at risk of having functions called on them */
        for (let endpointId in this.deliverySubscriptions) {
            const ws = this.deliverySubscriptions[endpointId];
            if (ws.isAlive) {
                ws.isAlive = false;
                if (ws.readyState === WebSocket.OPEN) ws.ping(noop);
            } else {
                if (this.options.verbose) this.options.log(`Terminating zombie delivery WebSocket: ${ws.endpoint}`);
                if (ws.readyState === WebSocket.OPEN) ws.terminate();
            }
        }
    };

    /**
     * Called when a delivery socket is opened, subscriptions are registered for later reference
     * @param {function} openCallback - a callback function
     * @return {undefined}
     */
    handleDeliverySocketOpen(openCallback) {
        this.isAlive = true;
        if (Object.keys(this.deliverySubscriptions).length === 0) {
            this.socketHeartbeatInterval = setInterval(deliverySocketHeartbeat, 30000);
        }
        this.deliverySubscriptions[this.endpoint] = this;
        if (typeof openCallback === 'function') openCallback(this.endpoint);
    };

    /**
     * Called when delivery websocket is closed, subscriptions are de-registered for later reference
     * @param {boolean} reconnect - true or false to reconnect the socket
     * @param {string} code - code associated with the socket
     * @param {string} reason - string with the response
     * @return {undefined}
     */
    handleDeliverySocketClose(reconnect, code, reason) {
        delete this.deliverySubscriptions[this.endpoint];
        if (this.deliverySubscriptions && Object.keys(this.deliverySubscriptions).length === 0) {
            clearInterval(this.socketHeartbeatInterval);
        }
        this.options.log('Delivery WebSocket closed: ' + this.endpoint +
            (code ? ' (' + code + ')' : '') +
            (reason ? ' ' + reason : ''));
        if (this.options.reconnect && this.reconnect && reconnect) {
            if (this.endpoint && parseInt(this.endpoint.length, 10) === 60) this.options.log('Delivery account data WebSocket reconnecting...');
            else this.options.log('Delivery WebSocket reconnecting: ' + this.endpoint + '...');
            try {
                reconnect();
            } catch (error) {
                this.options.log('Delivery WebSocket reconnect error: ' + error.message);
            }
        }
    };

    /**
     * Called when a delivery websocket errors
     * @param {object} error - error object message
     * @return {undefined}
     */
    handleDeliverySocketError(error) {
        this.options.log('Delivery WebSocket error: ' + this.endpoint +
            (error.code ? ' (' + error.code + ')' : '') +
            (error.message ? ' ' + error.message : ''));
    };

    /**
     * Called on each delivery socket heartbeat
     * @return {undefined}
     */
    const handleDeliverySocketHeartbeat = function () {
        this.isAlive = true;
    };

    /**
     * Used to subscribe to a single delivery websocket endpoint
     * @param {string} endpoint - endpoint to connect to
     * @param {function} callback - the function to call when information is received
     * @param {object} params - Optional reconnect {boolean} (whether to reconnect on disconnect), openCallback {function}, id {string}
     * @return {WebSocket} - websocket reference
     */
    deliverySubscribeSingle(endpoint, callback, params = {}) {
        if (typeof params === 'boolean') params = { reconnect: params };
        if (!params.reconnect) params.reconnect = false;
        if (!params.openCallback) params.openCallback = false;
        if (!params.id) params.id = false;
        let httpsproxy = process.env.https_proxy || false;
        let socksproxy = process.env.socks_proxy || false;
        let ws = false;
        if (socksproxy !== false) {
            socksproxy = proxyReplacewithIp(socksproxy);
            if (this.options.verbose) this.options.log(`deliverySubscribeSingle: using socks proxy server: ${socksproxy}`);
            let agent = new SocksProxyAgent({
                protocol: parseProxy(socksproxy)[0],
                host: parseProxy(socksproxy)[1],
                port: parseProxy(socksproxy)[2]
            });
            ws = new WebSocket((this.options.test ? dstreamSingleTest : dstreamSingle) + endpoint, { agent });
        } else if (httpsproxy !== false) {
            let config = url.parse(httpsproxy);
            let agent = new HttpsProxyAgent(config);
            if (this.options.verbose) this.options.log(`deliverySubscribeSingle: using proxy server: ${agent}`);
            ws = new WebSocket((this.options.test ? dstreamSingleTest : dstreamSingle) + endpoint, { agent });
        } else {
            ws = new WebSocket((this.options.test ? dstreamSingleTest : dstreamSingle) + endpoint);
        }

        if (this.options.verbose) this.options.log('deliverySubscribeSingle: Subscribed to ' + endpoint);
        ws.reconnect = this.options.reconnect;
        ws.endpoint = endpoint;
        ws.isAlive = false;
        ws.on('open', handleDeliverySocketOpen.bind(ws, params.openCallback));
        ws.on('pong', handleDeliverySocketHeartbeat);
        ws.on('error', handleDeliverySocketError);
        ws.on('close', handleDeliverySocketClose.bind(ws, params.reconnect));
        ws.on('message', data => {
            try {
                callback(JSON.parse(data));
            } catch (error) {
                this.options.log('Parse error: ' + error.message);
            }
        });
        return ws;
    };

    /**
     * Used to subscribe to a combined delivery websocket endpoint
     * @param {string} streams - streams to connect to
     * @param {function} callback - the function to call when information is received
     * @param {object} params - Optional reconnect {boolean} (whether to reconnect on disconnect), openCallback {function}, id {string}
     * @return {WebSocket} - websocket reference
     */
    deliverySubscribe(streams, callback, params = {}) {
        if (typeof streams === 'string') return deliverySubscribeSingle(streams, callback, params);
        if (typeof params === 'boolean') params = { reconnect: params };
        if (!params.reconnect) params.reconnect = false;
        if (!params.openCallback) params.openCallback = false;
        if (!params.id) params.id = false;
        let httpsproxy = process.env.https_proxy || false;
        let socksproxy = process.env.socks_proxy || false;
        const queryParams = streams.join('/');
        let ws = false;
        if (socksproxy !== false) {
            socksproxy = proxyReplacewithIp(socksproxy);
            if (this.options.verbose) this.options.log(`deliverySubscribe: using socks proxy server ${socksproxy}`);
            let agent = new SocksProxyAgent({
                protocol: parseProxy(socksproxy)[0],
                host: parseProxy(socksproxy)[1],
                port: parseProxy(socksproxy)[2]
            });
            ws = new WebSocket((this.options.test ? dstreamTest : dstream) + queryParams, { agent });
        } else if (httpsproxy !== false) {
            if (this.options.verbose) this.options.log(`deliverySubscribe: using proxy server ${httpsproxy}`);
            let config = url.parse(httpsproxy);
            let agent = new HttpsProxyAgent(config);
            ws = new WebSocket((this.options.test ? dstreamTest : dstream) + queryParams, { agent });
        } else {
            ws = new WebSocket((this.options.test ? dstreamTest : dstream) + queryParams);
        }

        ws.reconnect = this.options.reconnect;
        ws.endpoint = stringHash(queryParams);
        ws.isAlive = false;
        if (this.options.verbose) {
            this.options.log(`deliverySubscribe: Subscribed to [${ws.endpoint}] ${queryParams}`);
        }
        ws.on('open', handleDeliverySocketOpen.bind(ws, params.openCallback));
        ws.on('pong', handleDeliverySocketHeartbeat);
        ws.on('error', handleDeliverySocketError);
        ws.on('close', handleDeliverySocketClose.bind(ws, params.reconnect));
        ws.on('message', data => {
            try {
                callback(JSON.parse(data).data);
            } catch (error) {
                this.options.log(`deliverySubscribe: Parse error: ${error.message}`);
            }
        });
        return ws;
    };

    /**
     * Used to terminate a delivery websocket
     * @param {string} endpoint - endpoint identifier associated with the web socket
     * @param {boolean} reconnect - auto reconnect after termination
     * @return {undefined}
     */
    deliveryTerminate(endpoint, reconnect = false) {
        let ws = this.deliverySubscriptions[endpoint];
        if (!ws) return;
        ws.removeAllListeners('message');
        ws.reconnect = reconnect;
        ws.terminate();
    }

    /**
     * Combines all delivery OHLC data with the latest update
     * @param {string} symbol - the symbol
     * @param {string} interval - time interval
     * @return {array} - interval data for given symbol
     */
    deliveryKlineConcat(symbol, interval) {
        let output = this.deliveryTicks[symbol][interval];
        if (typeof this.deliveryRealtime[symbol][interval].time === 'undefined') return output;
        const time = this.deliveryRealtime[symbol][interval].time;
        const last_updated = Object.keys(this.deliveryTicks[symbol][interval]).pop();
        if (time >= last_updated) {
            output[time] = this.deliveryRealtime[symbol][interval];
            //delete output[time].time;
            output[last_updated].isFinal = true;
            output[time].isFinal = false;
        }
        return output;
    };

    /**
     * Used for websocket delivery @kline
     * @param {string} symbol - the symbol
     * @param {object} kline - object with kline info
     * @param {string} firstTime - time filter
     * @return {undefined}
     */
    deliveryKlineHandler(symbol, kline, firstTime = 0) {
        // eslint-disable-next-line no-unused-vars
        let { e: eventType, E: eventTime, k: ticks } = kline;
        // eslint-disable-next-line no-unused-vars
        let { o: open, h: high, l: low, c: close, v: volume, i: interval, x: isFinal, q: quoteVolume, V: takerBuyBaseVolume, Q: takerBuyQuoteVolume, n: trades, t: time, T: closeTime } = ticks;
        if (time <= firstTime) return;
        if (!isFinal) {
            // if ( typeof this.futuresRealtime[symbol][interval].time !== 'undefined' ) {
            //     if ( this.futuresRealtime[symbol][interval].time > time ) return;
            // }
            this.deliveryRealtime[symbol][interval] = { time, closeTime, open, high, low, close, volume, quoteVolume, takerBuyBaseVolume, takerBuyQuoteVolume, trades, isFinal };
            return;
        }
        const first_updated = Object.keys(this.deliveryTicks[symbol][interval]).shift();
        if (first_updated) delete this.deliveryTicks[symbol][interval][first_updated];
        this.deliveryTicks[symbol][interval][time] = { time, closeTime, open, high, low, close, volume, quoteVolume, takerBuyBaseVolume, takerBuyQuoteVolume, trades, isFinal: false };
    };

    /**
     * Converts the delivery liquidation stream data into a friendly object
     * @param {object} data - liquidation data callback data type
     * @return {object} - user friendly data type
     */
    dLiquidationConvertData(data) {
        let eventType = data.e, eventTime = data.E;
        let {
            s: symbol,
            S: side,
            o: orderType,
            f: timeInForce,
            q: origAmount,
            p: price,
            ap: avgPrice,
            X: orderStatus,
            l: lastFilledQty,
            z: totalFilledQty,
            T: tradeTime
        } = data.o;
        return { symbol, side, orderType, timeInForce, origAmount, price, avgPrice, orderStatus, lastFilledQty, totalFilledQty, eventType, tradeTime, eventTime };
    };

    /**
     * Converts the delivery ticker stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    dTickerConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                p: priceChange,
                P: percentChange,
                w: averagePrice,
                c: close,
                Q: closeQty,
                o: open,
                h: high,
                l: low,
                v: volume,
                q: quoteVolume,
                O: openTime,
                C: closeTime,
                F: firstTradeId,
                L: lastTradeId,
                n: numTrades
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                priceChange,
                percentChange,
                averagePrice,
                close,
                closeQty,
                open,
                high,
                low,
                volume,
                quoteVolume,
                openTime,
                closeTime,
                firstTradeId,
                lastTradeId,
                numTrades
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Converts the delivery miniTicker stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    dMiniTickerConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                c: close,
                o: open,
                h: high,
                l: low,
                v: volume,
                q: quoteVolume
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                close,
                open,
                high,
                low,
                volume,
                quoteVolume
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Converts the delivery bookTicker stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    dBookTickerConvertData(data) {
        let {
            u: updateId,
            s: symbol,
            b: bestBid,
            B: bestBidQty,
            a: bestAsk,
            A: bestAskQty
        } = data;
        return {
            updateId,
            symbol,
            bestBid,
            bestBidQty,
            bestAsk,
            bestAskQty
        };
    }

    /**
     * Converts the delivery markPrice stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    dMarkPriceConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                p: markPrice,
                r: fundingRate,
                T: fundingTime
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                markPrice,
                fundingRate,
                fundingTime
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
     * Converts the delivery aggTrade stream data into a friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    dAggTradeConvertData(data) {
        let friendlyData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                a: aggTradeId,
                p: price,
                q: amount,
                f: firstTradeId,
                l: lastTradeId,
                T: timestamp,
                m: maker
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                aggTradeId,
                price,
                amount,
                total: price * amount,
                firstTradeId,
                lastTradeId,
                timestamp,
                maker
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                result.push(friendlyData(obj));
            }
            return result;
        }
        return friendlyData(data);
    }

    /**
   * Converts the delivery UserData stream ORDER_TRADE_UPDATE data into a friendly object
   * @param {object} data - user data callback data type
   * @return {object} - user friendly data type
   */
    dUserDataOrderUpdateConvertData(data) {
        let {
            e: eventType,
            E: eventTime,
            T: transaction, // transaction time
            o: order,
        } = data;

        let orderConverter = (order) => {
            let {
                s: symbol,
                c: clientOrderId,
                // special client order id:
                // starts with "autoclose-": liquidation order
                // "adl_autoclose": ADL auto close order
                S: side,
                o: orderType,
                f: timeInForce,
                q: originalQuantity,
                p: originalPrice,
                ap: averagePrice,
                sp: stopPrice, // please ignore with TRAILING_STOP_MARKET order,
                x: executionType,
                X: orderStatus,
                i: orderId,
                l: orderLastFilledQuantity,
                z: orderFilledAccumulatedQuantity,
                L: lastFilledPrice,
                ma: marginAsset,
                N: commissionAsset, // will not push if no commission
                n: commission, // will not push if no commission
                T: orderTradeTime,
                t: tradeId,
                rp: realizedProfit,
                b: bidsNotional,
                a: askNotional,
                m: isMakerSide, // is this trade maker side
                R: isReduceOnly, // is this reduce only
                wt: stopPriceWorkingType,
                ot: originalOrderType,
                ps: positionSide,
                cp: closeAll, // if close-all, pushed with conditional order
                AP: activationPrice, // only pushed with TRAILING_STOP_MARKET order
                cr: callbackRate, // only pushed with TRAILING_STOP_MARKET order
                pP: priceProtect, // If conditional order trigger is protected
            } = order;
            return {
                symbol,
                clientOrderId,
                side,
                orderType,
                timeInForce,
                originalQuantity,
                originalPrice,
                averagePrice,
                stopPrice,
                executionType,
                orderStatus,
                orderId,
                orderLastFilledQuantity,
                orderFilledAccumulatedQuantity,
                lastFilledPrice,
                marginAsset,
                commissionAsset,
                commission,
                orderTradeTime,
                tradeId,
                bidsNotional,
                askNotional,
                isMakerSide,
                isReduceOnly,
                stopPriceWorkingType,
                originalOrderType,
                positionSide,
                closeAll,
                activationPrice,
                callbackRate,
                realizedProfit,
                priceProtect,
            };
        };
        order = orderConverter(order);
        return {
            eventType,
            eventTime,
            transaction,
            order,
        };
    };

    /**
     * Used as part of the user data websockets callback
     * @param {object} data - user data callback data type
     * @return {undefined}
     */
    userDataHandler(data) {
        let type = data.e;
        if (type === 'outboundAccountInfo') {
            // XXX: Deprecated in 2020-09-08
        } else if (type === 'executionReport') {
            if (this.options.execution_callback) this.options.execution_callback(data);
        } else if (type === 'listStatus') {
            if (this.options.list_status_callback) this.options.list_status_callback(data);
        } else if (type === 'outboundAccountPosition' || type === 'balanceUpdate') {
            this.options.balance_callback(data);
        } else {
            this.options.log('Unexpected userData: ' + type);
        }
    };

    /**
     * Used as part of the user data websockets callback
     * @param {object} data - user data callback data type
     * @return {undefined}
     */
    userMarginDataHandler(data) {
        let type = data.e;
        if (type === 'outboundAccountInfo') {
            // XXX: Deprecated in 2020-09-08
        } else if (type === 'executionReport') {
            if (this.options.margin_execution_callback) this.options.margin_execution_callback(data);
        } else if (type === 'listStatus') {
            if (this.options.margin_list_status_callback) this.options.margin_list_status_callback(data);
        } else if (type === 'outboundAccountPosition' || type === 'balanceUpdate') {
            this.options.margin_balance_callback(data);
        } else {
            this.options.log('Unexpected userMarginData: ' + type);
        }
    };

    /**
     * Used as part of the user data websockets callback
     * @param {object} data - user data callback data type
     * @return {undefined}
     */
    userFutureDataHandler(data) {
        let type = data.e;
        if (type === 'MARGIN_CALL') {
            this.options.future_margin_call_callback(this.fUserDataMarginConvertData(data));
        } else if (type === 'ACCOUNT_UPDATE') {
            if (this.options.future_account_update_callback) {
                this.options.future_account_update_callback(this.fUserDataAccountUpdateConvertData(data));
            }
        } else if (type === 'ORDER_TRADE_UPDATE') {
            if (this.options.future_order_update_callback) {
                this.options.future_order_update_callback(this.fUserDataOrderUpdateConvertData(data));
            }
        } else if (type === 'ACCOUNT_CONFIG_UPDATE') {
            if (this.options.future_account_config_update_callback) {
                this.options.future_account_config_update_callback(this.fUserConfigDataAccountUpdateConvertData(data));
            }
        } else {
            this.options.log('Unexpected userFutureData: ' + type);
        }
    };

    /**
   * Used as part of the user data websockets callback
   * @param {object} data - user data callback data type
   * @return {undefined}
   */
    userDeliveryDataHandler(data) {
        let type = data.e;
        if (type === "MARGIN_CALL") {
            this.options.delivery_margin_call_callback(
                this.fUserDataMarginConvertData(data)
            );
        } else if (type === "ACCOUNT_UPDATE") {
            if (this.options.delivery_account_update_callback) {
                this.options.delivery_account_update_callback(
                    this.fUserDataAccountUpdateConvertData(data)
                );
            }
        } else if (type === "ORDER_TRADE_UPDATE") {
            if (this.options.delivery_order_update_callback) {
                this.options.delivery_order_update_callback(
                    this.dUserDataOrderUpdateConvertData(data)
                );
            }
        } else {
            this.options.log("Unexpected userDeliveryData: " + type);
        }
    };

    /**
    * Universal Transfer requires API permissions enabled 
    * @param {string} type - ENUM , example MAIN_UMFUTURE for SPOT to USDT futures, see https://binance-docs.github.io/apidocs/spot/en/#user-universal-transfer
    * @param {string} asset - the asset - example :USDT    * 
    * @param {number} amount - the callback function
    * @return {promise}
    */
    async universalTransfer(type: string, asset: string, amount: number) {
        let parameters = Object.assign({
            asset,
            amount,
            type,
        });
        return await this.signedRequest(
            this.sapi + "v1/asset/transfer",
            parameters,
            "POST"
        );
    }

    /**
   * Transfer between main account and futures/delivery accounts
   * @param {string} asset - the asset
   * @param {number} amount - the asset
   * @param {object} options - additional options
   * @return {undefined}
   */
    async transferBetweenMainAndFutures(
        asset: string,
        amount: number,
        type: string,
    ) {
        let parameters = Object.assign({
            asset,
            amount,
            type,
        });
        return await this.signedRequest(
            this.sapi + "v1/futures/transfer",
            parameters,
            "POST"
        );
    };

    /**
     * Converts the previous day stream into friendly object
     * @param {object} data - user data callback data type
     * @return {object} - user friendly data type
     */
    prevDayConvertData(data) {
        let convertData = data => {
            let {
                e: eventType,
                E: eventTime,
                s: symbol,
                p: priceChange,
                P: percentChange,
                w: averagePrice,
                x: prevClose,
                c: close,
                Q: closeQty,
                b: bestBid,
                B: bestBidQty,
                a: bestAsk,
                A: bestAskQty,
                o: open,
                h: high,
                l: low,
                v: volume,
                q: quoteVolume,
                O: openTime,
                C: closeTime,
                F: firstTradeId,
                L: lastTradeId,
                n: numTrades
            } = data;
            return {
                eventType,
                eventTime,
                symbol,
                priceChange,
                percentChange,
                averagePrice,
                prevClose,
                close,
                closeQty,
                bestBid,
                bestBidQty,
                bestAsk,
                bestAskQty,
                open,
                high,
                low,
                volume,
                quoteVolume,
                openTime,
                closeTime,
                firstTradeId,
                lastTradeId,
                numTrades
            };
        }
        if (Array.isArray(data)) {
            const result = [];
            for (let obj of data) {
                let converted = convertData(obj);
                result.push(converted);
            }
            return result;
            // eslint-disable-next-line no-else-return
        } else {
            return convertData(data);
        }
    }

    /**
     * Parses the previous day stream and calls the user callback with friendly object
     * @param {object} data - user data callback data type
     * @param {function} callback - user data callback data type
     * @return {undefined}
     */
    prevDayStreamHandler(data, callback) {
        const converted = this.prevDayConvertData(data);
        callback(null, converted);
    };

    /**
     * Gets the price of a given symbol or symbols
     * @param {array} data - array of symbols
     * @return {array} - symbols with their current prices
     */
    priceData(data) {
        const prices = {};
        if (Array.isArray(data)) {
            for (let obj of data) {
                prices[obj.symbol] = obj.price;
            }
        } else { // Single price returned
            prices[data.symbol] = data.price;
        }
        return prices;
    };

    /**
     * Used by bookTickers to format the bids and asks given given symbols
     * @param {array} data - array of symbols
     * @return {object} - symbols with their bids and asks data
     */
    bookPriceData(data) {
        let prices = {};
        for (let obj of data) {
            prices[obj.symbol] = {
                bid: obj.bidPrice,
                bids: obj.bidQty,
                ask: obj.askPrice,
                asks: obj.askQty
            };
        }
        return prices;
    };

    /**
     * Used by balance to get the balance data
     * @param {array} data - account info object
     * @return {object} - balances hel with available, onorder amounts
     */
    balanceData(data) {
        let balances = {};
        if (typeof data === 'undefined') return {};
        if (typeof data.balances === 'undefined') {
            this.options.log('balanceData error', data);
            return {};
        }
        for (let obj of data.balances) {
            balances[obj.asset] = { available: obj.free, onOrder: obj.locked };
        }
        return balances;
    };

    /**
     * Used by web sockets depth and populates OHLC and info
     * @param {string} symbol - symbol to get candlestick info
     * @param {string} interval - time interval, 1m, 3m, 5m ....
     * @param {array} ticks - tick array
     * @return {undefined}
     */
    klineData(symbol, interval, ticks) { // Used for /depth
        let last_time = 0;
        if (isIterable(ticks)) {
            for (let tick of ticks) {
                // eslint-disable-next-line no-unused-vars
                let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
                this.ohlc[symbol][interval][time] = { open: open, high: high, low: low, close: close, volume: volume };
                last_time = time;
            }

            this.info[symbol][interval].timestamp = last_time;
        }
    };

    /**
     * Combines all OHLC data with latest update
     * @param {string} symbol - the symbol
     * @param {string} interval - time interval, 1m, 3m, 5m ....
     * @return {array} - interval data for given symbol
     */
    klineConcat(symbol, interval) {
        let output = this.ohlc[symbol][interval];
        if (typeof this.ohlcLatest[symbol][interval].time === 'undefined') return output;
        const time = this.ohlcLatest[symbol][interval].time;
        const last_updated = Object.keys(this.ohlc[symbol][interval]).pop();
        if (time >= last_updated) {
            output[time] = this.ohlcLatest[symbol][interval];
            delete output[time].time;
            output[time].isFinal = false;
        }
        return output;
    };

    /**
     * Used for websocket @kline
     * @param {string} symbol - the symbol
     * @param {object} kline - object with kline info
     * @param {string} firstTime - time filter
     * @return {undefined}
     */
    klineHandler(symbol, kline, firstTime = 0) {
        // TODO: add Taker buy base asset volume
        // eslint-disable-next-line no-unused-vars
        let { e: eventType, E: eventTime, k: ticks } = kline;
        // eslint-disable-next-line no-unused-vars
        let { o: open, h: high, l: low, c: close, v: volume, i: interval, x: isFinal, q: quoteVolume, t: time } = ticks; //n:trades, V:buyVolume, Q:quoteBuyVolume
        if (time <= firstTime) return;
        if (!isFinal) {
            if (typeof this.ohlcLatest[symbol][interval].time !== 'undefined') {
                if (this.ohlcLatest[symbol][interval].time > time) return;
            }
            this.ohlcLatest[symbol][interval] = { open: open, high: high, low: low, close: close, volume: volume, time: time };
            return;
        }
        // Delete an element from the beginning so we don't run out of memory
        const first_updated = Object.keys(this.ohlc[symbol][interval]).shift();
        if (first_updated) delete this.ohlc[symbol][interval][first_updated];
        this.ohlc[symbol][interval][time] = { open: open, high: high, low: low, close: close, volume: volume };
    };


    /**
     * Used by futures websockets chart cache
     * @param {string} symbol - symbol to get candlestick info
     * @param {string} interval - time interval, 1m, 3m, 5m ....
     * @param {array} ticks - tick array
     * @return {undefined}
     */
    futuresKlineData(symbol, interval, ticks) {
        let last_time = 0;
        if (this.isIterable(ticks)) {
            for (let tick of ticks) {
                // eslint-disable-next-line no-unused-vars
                let [time, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBaseVolume, takerBuyQuoteVolume, ignored] = tick;
                this.futuresTicks[symbol][interval][time] = { time, closeTime, open, high, low, close, volume, quoteVolume, takerBuyBaseVolume, takerBuyQuoteVolume, trades };
                last_time = time;
            }
            this.futuresMeta[symbol][interval].timestamp = last_time;
        }
    };

    /**
     * Used by delivery websockets chart cache
     * @param {string} symbol - symbol to get candlestick info
     * @param {string} interval - time interval, 1m, 3m, 5m ....
     * @param {array} ticks - tick array
     * @return {undefined}
     */
    deliveryKlineData(symbol, interval, ticks) {
        let last_time = 0;
        if (this.isIterable(ticks)) {
            for (let tick of ticks) {
                // eslint-disable-next-line no-unused-vars
                let [time, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBaseVolume, takerBuyQuoteVolume, ignored] = tick;
                this.deliveryTicks[symbol][interval][time] = { time, closeTime, open, high, low, close, volume, quoteVolume, takerBuyBaseVolume, takerBuyQuoteVolume, trades };
                last_time = time;
            }
            this.deliveryMeta[symbol][interval].timestamp = last_time;
        }
    };

    /**
     * Used for /depth endpoint
     * @param {object} data - containing the bids and asks
     * @return {undefined}
     */
    depthData(data) {
        if (!data) return { bids: [], asks: [] };
        let bids = {}, asks = {}, obj;
        if (typeof data.bids !== 'undefined') {
            for (obj of data.bids) {
                bids[obj[0]] = parseFloat(obj[1]);
            }
        }
        if (typeof data.asks !== 'undefined') {
            for (obj of data.asks) {
                asks[obj[0]] = parseFloat(obj[1]);
            }
        }
        return { lastUpdateId: data.lastUpdateId, bids: bids, asks: asks };
    }

    /**
     * Used for /depth endpoint
     * @param {object} depth - information
     * @return {undefined}
     */
    depthHandler(depth) {
        let symbol = depth.s, obj;
        let context = this.depthCacheContext[symbol];
        let updateDepthCache = () => {
            this.depthCache[symbol].eventTime = depth.E;
            for (obj of depth.b) { //bids
                if (obj[1] == 0) {
                    delete this.depthCache[symbol].bids[obj[0]];
                } else {
                    this.depthCache[symbol].bids[obj[0]] = parseFloat(obj[1]);
                }
            }
            for (obj of depth.a) { //asks
                if (obj[1] == 0) {
                    delete this.depthCache[symbol].asks[obj[0]];
                } else {
                    this.depthCache[symbol].asks[obj[0]] = parseFloat(obj[1]);
                }
            }
            context.skipCount = 0;
            context.lastEventUpdateId = depth.u;
            context.lastEventUpdateTime = depth.E;
        };

        // This now conforms 100% to the Binance docs constraints on managing a local order book
        if (context.lastEventUpdateId) {
            const expectedUpdateId = context.lastEventUpdateId + 1;
            if (depth.U <= expectedUpdateId) {
                updateDepthCache();
            } else {
                let msg = 'depthHandler: [' + symbol + '] The depth cache is out of sync.';
                msg += ' Symptom: Unexpected Update ID. Expected "' + expectedUpdateId + '", got "' + depth.U + '"';
                if (this.options.verbose) this.options.log(msg);
                throw new Error(msg);
            }
        } else if (depth.U > context.snapshotUpdateId + 1) {
            /* In this case we have a gap between the data of the stream and the snapshot.
             This is an out of sync error, and the connection must be torn down and reconnected. */
            let msg = 'depthHandler: [' + symbol + '] The depth cache is out of sync.';
            msg += ' Symptom: Gap between snapshot and first stream data.';
            if (this.options.verbose) this.options.log(msg);
            throw new Error(msg);
        } else if (depth.u < context.snapshotUpdateId + 1) {
            /* In this case we've received data that we've already had since the snapshot.
             This isn't really an issue, and we can just update the cache again, or ignore it entirely. */

            // do nothing
        } else {
            // This is our first legal update from the stream data
            updateDepthCache();
        }
    };

    /**
     * Gets depth cache for given symbol
     * @param {string} symbol - the symbol to fetch
     * @return {object} - the depth cache object
     */
    getDepthCache(symbol: string) {
        if (typeof this.depthCache[symbol] === 'undefined') return { bids: {}, asks: {} };
        return this.depthCache[symbol];
    };

    /**
     * Calculate Buy/Sell volume from DepthCache
     * @param {string} symbol - the symbol to fetch
     * @return {object} - the depth volume cache object
     */
    depthVolume(symbol: string) {
        let cache = this.getDepthCache(symbol), quantity, price;
        let bidbase = 0, askbase = 0, bidqty = 0, askqty = 0;
        for (price in cache.bids) {
            quantity = cache.bids[price];
            bidbase += parseFloat((quantity * parseFloat(price)).toFixed(8));
            bidqty += quantity;
        }
        for (price in cache.asks) {
            quantity = cache.asks[price];
            askbase += parseFloat((quantity * parseFloat(price)).toFixed(8));
            askqty += quantity;
        }
        return { bids: bidbase, asks: askbase, bidQty: bidqty, askQty: askqty };
    };

    /**
     * Checks whether or not an array contains any duplicate elements
     * @param {array} array - the array to check
     * @return {boolean} - true or false
     */
    isArrayUnique(array) {
        return new Set(array).size === array.length;
    };

}