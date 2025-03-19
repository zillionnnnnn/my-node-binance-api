

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

    reqObj(url: string, data: { [key: string]: any }  ={}, method = 'GET', key?: string) {
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

    reqObjPOST(url: string, data: { [key: string]: any }  ={}, method = 'POST', key: string) {
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


    async publicRequest(url: string, data: { [key: string]: any }  ={}, method = 'GET') {
        let opt = this.reqObj(url, data, method);
        const res = await this.proxyRequest(opt);
        return res;
    };

    // used for futures
    async promiseRequest(url: string, data: { [key: string]: any }  ={}, flags: { [key: string]: any }  ={}) {
        let query = '', headers = {
            'User-Agent': this.userAgent,
            'Content-type': 'application/x-www-form-urlencoded'
        } as { [key: string]: any };
        if (!flags.method) flags.method = 'GET'; // GET POST PUT DELETE
        if (!flags.type) flags.type = false; // TRADE, SIGNED, MARKET_DATA, USER_DATA, USER_STREAM
        else {
            if ( !data.recvWindow ) data.recvWindow = this.options.recvWindow;
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
    async apiRequest(url: string, data: { [key: string]: any }  ={}, method = 'GET') {
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
    async marketRequest(url: string, data: { [key: string]: any }  ={}, method = 'GET') {
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
    async signedRequest(url: string, data: { [key: string]: any }  ={}, method = 'GET', noDataInSignature = false) {
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
    async order(side: string, symbol: string, quantity: number, price?: number, flags: { [key: string]: any }  ={}) {
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
    async marginOrder(side: string, symbol: string, quantity: number, price?: number, flags: { [key: string]: any }  ={}) {
        let endpoint = 'v1/margin/order';
        if (this.options.test) endpoint += '/test';
        let opt = {
            symbol: symbol,
            side: side,
            type: 'LIMIT',
            quantity: quantity
        } as { [key: string]: any } ;
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
    async futuresOrder(side: string, symbol: string, quantity: number, price = false, params: { [key: string]: any }  ={}) {
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


    async deliveryOrder( side: string, symbol: string, quantity: number, price = false, params: { [key: string]: any }  ={} ) {
        params.symbol = symbol;
        params.side = side;
        params.quantity = quantity;
        // if in the binance futures setting Hedged mode is active, positionSide parameter is mandatory
        if( this.options.hedgeMode ){
            params.positionSide = side === 'BUY' ? 'LONG' : 'SHORT';
        }
        // LIMIT STOP MARKET STOP_MARKET TAKE_PROFIT TAKE_PROFIT_MARKET
        // reduceOnly stopPrice
        if ( price ) {
            params.price = price;
            if ( !params.type ) params.type = 'LIMIT';
        } else {
            if ( !params.type ) params.type = 'MARKET';
        }
        if ( !params.timeInForce && ( params.type.includes( 'LIMIT' ) || params.type === 'STOP' || params.type === 'TAKE_PROFIT' ) ) {
            params.timeInForce = 'GTX'; // Post only by default. Use GTC for limit orders.
        }

        if ( !params.newClientOrderId ) {
            params.newClientOrderId = this.CONTRACT_PREFIX + this.uuid22();
        }
        return this.promiseRequest( 'v1/order', params, { base: this.dapi, type:'TRADE', method:'POST' } );
    };


    /**
    * Get Binance server time
    * @return {promise or undefined} - omitting the callback returns a promise
    */
    async time() {
        const res = await this.publicRequest(this.getSpotUrl() + 'v3/time', {});
        return res;
    }

}