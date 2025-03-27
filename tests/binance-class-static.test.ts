import Binance from '../src/node-binance-api';
import { assert } from 'chai';
import util from 'util';
import nock from 'nock';

const binance = new Binance({
    APIKEY: 'XXXXXXXXXXXXXXXXXXXXXXX',
    APISECRET: 'YYYYYYYYYYYYYYYYYYYYYY',
})


function urlToObject(queryString) {
    const params = new URLSearchParams(queryString);
    const obj = Object.fromEntries(params.entries());
    return obj;
}

describe( 'Static tests', async function () {

    let interceptedUrl = null;
    let interceptedBody = null;

    beforeEach(() => {

        interceptedUrl = null;
        interceptedBody = null;
        nock(/.*/)
            .get(/.*/)
            .reply(200, function (uri, requestBody) {
                interceptedUrl =  `${this.req.options.proto}://${this.req.options.hostname}${uri}`;
                interceptedBody = requestBody; // Capture the request body
                return { success: true };
            });
        nock(/.*/)
            .post(/.*/)
            .reply(200, function (uri, requestBody) {
                interceptedUrl =  `${this.req.options.proto}://${this.req.options.hostname}${uri}`;
                interceptedBody = requestBody; // Capture the request body
                return { success: true };
            });
        nock(/.*/)
            .delete(/.*/)
            .reply(200, function (uri, requestBody) {
                interceptedUrl =  `${this.req.options.proto}://${this.req.options.hostname}${uri}`;
                interceptedBody = requestBody; // Capture the request body
                return { success: true };
            });
    });

    it( 'FetchTicker', async function ( ) {
        await binance.prices( 'BNBBTC' )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/ticker/price?symbol=BNBBTC' )
    })

    it( 'FetchOrderBook', async function ( ) {
        await binance.depth( 'BTCUSDT' )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100' )

    })

    it( 'Futures OrderBook', async function ( ) {
        await binance.futuresDepth( 'BTCUSDT' )
        assert.equal( interceptedUrl, 'https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT' )

    })

    it( 'OHLCVS', async function ( ) {
        await binance.candlesticks( 'BTCUSDT' )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=500' )

    })

    it( 'Futures OHLCVS', async function ( ) {
        await binance.futuresCandles( 'BTCUSDT' )
        assert.equal( interceptedUrl, 'https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=30m' )

    })

    it( 'Trades', async function ( ) {
        await binance.aggTrades( 'BTCUSDT' )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/aggTrades?symbol=BTCUSDT' )

    })

    it( 'FuturesTrades', async function ( ) {
        await binance.futuresTrades( 'BTCUSDT' )
        assert.equal( interceptedUrl, 'https://fapi.binance.com/fapi/v1/trades?symbol=BTCUSDT' )

    })

    it( 'PositionRisk V3', async function ( ) {
        await binance.futuresPositionRisk()
        assert.isTrue( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v3/positionRisk') )

    })

    it( 'PositionRisk V2', async function ( ) {
        await binance.futuresPositionRiskV2()
        assert.isTrue( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v2/positionRisk') )

    })

    it( 'CancelOrder', async function ( ) {
        await binance.cancel( 'LTCUSDT', '34234234' )
        assert( interceptedUrl.startsWith('https://api.binance.com/api/v3/order' ))
        const obj = urlToObject( interceptedUrl.replace('https://api.binance.com/api/v3/order', '') )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.orderId, '34234234')
    })

    it( 'Futures CancelOrder', async function ( ) {
        await binance.futuresCancel( 'LTCUSDT', '34234234')
        assert( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v1/order'))
        const obj = urlToObject( interceptedUrl.replace('https://fapi.binance.com/fapi/v1/order', '') )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.orderId, '34234234')
    })

    const SPOT_PREFIX = "x-HNA2TXFJ"

    it( 'MarketBuy', async function ( ) {
        await binance.marketBuy( 'LTCUSDT', 0.5 )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/order' )
        const obj = urlToObject( interceptedBody )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'MARKET' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(SPOT_PREFIX))
    })

    it( 'MarketSell', async function ( ) {
        await binance.marketSell( 'LTCUSDT', 0.5 )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/order' )
        const obj = urlToObject( interceptedBody )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'SELL' )
        assert.equal( obj.type, 'MARKET' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(SPOT_PREFIX))
    })

    it( 'LimitBuy', async function ( ) {
        await binance.order('LIMIT', 'BUY', 'LTCUSDT', 0.5 )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/order' )
        const obj = urlToObject( interceptedBody )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'LIMIT' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(SPOT_PREFIX))
    })

    it( 'LimitSell', async function ( ) {
        await binance.order('LIMIT', 'SELL', 'LTCUSDT', 0.5 )
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/order' )
        const obj = urlToObject( interceptedBody )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'SELL' )
        assert.equal( obj.type, 'LIMIT' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(SPOT_PREFIX))
    })

    it( 'cancel order', async function ( ) {
        await binance.cancel( 'LTCUSDT', '34234234' )
        const url = 'https://api.binance.com/api/v3/order'
        assert.isTrue( interceptedUrl.startsWith(url) )
        const obj = urlToObject( interceptedUrl.replace(url, '') )
        assert.equal( obj.orderId, '34234234' )
        assert.equal( obj.symbol, 'LTCUSDT' )
    })

    const CONTRACT_PREFIX = "x-Cb7ytekJ"

    it( 'Futures MarketBuy', async function ( ) {
        await binance.futuresMarketBuy( 'LTCUSDT', 0.5 )
        assert.isTrue( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v1/order' ))
        const obj = urlToObject( interceptedUrl.replace('https://fapi.binance.com/fapi/v1/order?', '') )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'MARKET' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(CONTRACT_PREFIX))
    })

    it( 'Futures MarketSell', async function ( ) {
        await binance.futuresMarketSell( 'LTCUSDT', 0.5 )
        assert.isTrue( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v1/order' ))
        const obj = urlToObject( interceptedUrl.replace('https://fapi.binance.com/fapi/v1/order?', '')  )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'SELL' )
        assert.equal( obj.type, 'MARKET' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(CONTRACT_PREFIX))
    })

    it( 'Futures LimitBuy', async function ( ) {
        await binance.futuresOrder('LIMIT', 'BUY', 'LTCUSDT', 0.5, 100 )
        assert.isTrue( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v1/order' ))
        const obj = urlToObject( interceptedUrl.replace('https://fapi.binance.com/fapi/v1/order?', '')  )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'LIMIT' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(CONTRACT_PREFIX))
    })

    it( 'Futures LimitSell', async function ( ) {
        await binance.futuresOrder('LIMIT', 'SELL', 'LTCUSDT', 0.5, 100 )
        assert.isTrue( interceptedUrl.startsWith('https://fapi.binance.com/fapi/v1/order' ))
        const obj = urlToObject( interceptedUrl.replace('https://fapi.binance.com/fapi/v1/order?', '')  )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'SELL' )
        assert.equal( obj.type, 'LIMIT' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(CONTRACT_PREFIX))
    })

    it( 'cancel order', async function ( ) {
        await binance.futuresCancel( 'LTCUSDT', '34234234' )
        const url = 'https://fapi.binance.com/fapi/v1/order'
        assert.isTrue( interceptedUrl.startsWith(url) )
        const obj = urlToObject( interceptedUrl.replace(url, '') )
        assert.equal( obj.orderId, '34234234' )
        assert.equal( obj.symbol, 'LTCUSDT' )
    })

    it( 'MarketBuy test', async function ( ) {
        await binance.marketBuy( 'LTCUSDT', 0.5, {'test': true})
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/order/test' )
        const obj = urlToObject( interceptedBody )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'MARKET' )
        assert.equal( obj.quantity, 0.5 )
        assert(obj.newClientOrderId.startsWith(SPOT_PREFIX))
    })

    it( 'spot order with custom clientorderId', async function ( ) {
        await binance.order( 'LIMIT', 'BUY', 'LTCUSDT', 0.5, 100, {'newClientOrderId': 'myid'})
        assert.equal( interceptedUrl, 'https://api.binance.com/api/v3/order' )
        const obj = urlToObject( interceptedBody )
        assert.equal( obj.symbol, 'LTCUSDT' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'LIMIT' )
        assert.equal( obj.quantity, 0.5 )
        assert.equal( obj.price, 100 )
        assert.equal( obj.newClientOrderId, 'myid')
    })

    it( 'delivery OrderBook', async function ( ) {
        await binance.deliveryDepth( 'BTCUSD_PERP' )
        assert.equal( interceptedUrl, 'https://dapi.binance.com/dapi/v1/depth?symbol=BTCUSD_PERP' )

    })

    it( 'delivery MarketBuy', async function ( ) {
        await binance.deliveryOrder( 'MARKET', 'BUY', 'BTCUSD_PERP', 0.1 )
        assert.isTrue( interceptedUrl.startsWith('https://dapi.binance.com/dapi/v1/order' ))
        const obj = urlToObject( interceptedUrl.replace('https://dapi.binance.com/dapi/v1/order', '') )
        assert.equal( obj.symbol, 'BTCUSD_PERP' )
        assert.equal( obj.side, 'BUY' )
        assert.equal( obj.type, 'MARKET' )
        assert.equal( obj.quantity, 0.1 )
        assert(obj.newClientOrderId.startsWith(CONTRACT_PREFIX))
    })

})