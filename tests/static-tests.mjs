import chai from 'chai';
import path from 'path';
import utils from 'util';
import Binance from  '../node-binance-api.js'
import nock from 'nock';
const assert = chai.assert;

const binance = new Binance({})

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
})