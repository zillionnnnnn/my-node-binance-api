import Binance from '../src/node-binance-api';
import { assert } from 'chai';
import util from 'util';

const WARN_SHOULD_BE_OBJ = 'should be an object';
const WARN_SHOULD_BE_NULL = 'should be null';
const WARN_SHOULD_BE_NOT_NULL = 'should not be null';
const WARN_SHOULD_HAVE_KEY = 'should have key ';
const WARN_SHOULD_NOT_HAVE_KEY = 'should not have key ';
const WARN_SHOULD_BE_UNDEFINED = 'should be undefined';
const WARN_SHOULD_BE_TYPE = 'should be a ';
const TIMEOUT = 40000;


const futuresBinance = new Binance().options({
    APIKEY: 'HjhMFvuF1veWQVdUbLIy7TiCYe9fj4W6sEukmddD8TM9kPVRHMK6nS2SdV5mwE5u',
    APISECRET: 'Suu9pWcO9zbvVuc6cSQsVuiiw2DmmA8DgHrUfePF9s2RtaHa0zxK3eAF4MfIk7Pd',
    hedgeMode: true,
    demo: true,
    httpsProxy: 'http://188.245.226.105:3128'
});


const stopSockets = function ( log = false ) {
    let endpoints = futuresBinance.websockets.subscriptions();
    for ( let endpoint in endpoints ) {
        if ( log ) console.log( 'Terminated ws endpoint: ' + endpoint );
        futuresBinance.websockets.terminate( endpoint );
    }
}

describe( 'Websockets candlesticks', function () {
    let candlesticks;
    let cnt = 0;
    /*global beforeEach*/
    beforeEach( function ( done ) {
        this.timeout( TIMEOUT );
        futuresBinance.futuresCandlesticksStream( [ 'BTCUSDT' ], '1m', a_candlesticks => {
            cnt++;
            if ( cnt > 1 ) return;
            candlesticks = a_candlesticks;
            stopSockets();
            done();
        } );
    } );

    it( 'Calls spot candlesticks websocket', function () {
        assert( typeof ( candlesticks ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( candlesticks !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.keys( candlesticks ).length >= 0, 'should at least 1 currency pairs?' );

        let keys = [ 't', 'T', 's', 'i', 'f', 'L', 'o', 'c', 'h', 'l', 'v', 'n', 'x', 'q', 'V', 'Q', 'B' ];
        assert( Object.prototype.hasOwnProperty.call( candlesticks, 'e' ), WARN_SHOULD_HAVE_KEY + 'e' );
        assert( Object.prototype.hasOwnProperty.call( candlesticks, 'E' ), WARN_SHOULD_HAVE_KEY + 'E' );
        assert( Object.prototype.hasOwnProperty.call( candlesticks, 's' ), WARN_SHOULD_HAVE_KEY + 's' );
        assert( Object.prototype.hasOwnProperty.call( candlesticks, 's' ), WARN_SHOULD_HAVE_KEY + 'k' );

        keys.forEach( function ( key ) {
            assert( Object.prototype.hasOwnProperty.call( candlesticks.k, key ), WARN_SHOULD_HAVE_KEY + key );
        } );
    } );
} );

describe( 'Websockets futures ticker stream', function () {
    let response;
    let cnt = 0;

    beforeEach( function ( done ) {
        this.timeout( TIMEOUT );
        futuresBinance.websockets.futuresTicker( undefined, a_response => {
            cnt++;
            if ( cnt > 1 ) return;
            stopSockets();
            response = a_response;
            done();
        } )
    } );

    it( 'Calls prevDay websocket for symbol', function () {
        assert( typeof ( response ) === 'object', WARN_SHOULD_BE_OBJ );
    } );
} );


describe( 'Websockets miniticker', function () {
    let markets;
    let cnt = 0;
    beforeEach( function ( done ) {
        this.timeout( TIMEOUT );
        futuresBinance.websockets.futuresMiniTicker( undefined, tick => {
            cnt++;
            if ( cnt > 1 ) return;
            markets = tick;
            stopSockets();
            done();
        } );
    } );

    it( 'check miniticker websocket', function () {
        assert( typeof ( markets ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( markets !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.keys( markets ).length >= 0, 'should at least 1 currency pairs?' );

        Object.keys( markets ).forEach( function ( symbol ) {
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'close' ), WARN_SHOULD_HAVE_KEY + 'close' );
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'open' ), WARN_SHOULD_HAVE_KEY + 'open' );
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'high' ), WARN_SHOULD_HAVE_KEY + 'high' );
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'low' ), WARN_SHOULD_HAVE_KEY + 'low' );
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'volume' ), WARN_SHOULD_HAVE_KEY + 'volume' );
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'quoteVolume' ), WARN_SHOULD_HAVE_KEY + 'quoteVolume' );
            assert( Object.prototype.hasOwnProperty.call( markets[symbol], 'eventTime' ), WARN_SHOULD_HAVE_KEY + 'eventTime' );
        } );
    } );
} );



describe( 'Websockets chart', function () {
    let chart;
    let interval;
    let symbol;
    let cnt = 0;
    beforeEach( function ( done ) {
        this.timeout( TIMEOUT );
        futuresBinance.websockets.futuresChart( 'BTCUSDT', '1m', ( a_symbol, a_interval, a_chart ) => {
            cnt++;
            if ( cnt > 1 ) {
                stopSockets();
                return;
            }
            chart = a_chart;
            interval = a_interval;
            symbol = a_symbol;
            stopSockets();
            done();
        } );
    } );

    it( 'Calls chart websocket', function () {
        assert( typeof ( chart ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( typeof ( symbol ) === 'string', WARN_SHOULD_BE_OBJ );
        assert( typeof ( interval ) === 'string', WARN_SHOULD_BE_OBJ );
        assert( chart !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( symbol !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( interval !== null, WARN_SHOULD_BE_NOT_NULL );

        let keys = [ 'open', 'high', 'open', 'close', 'volume' ];
        assert( Object.keys( chart ).length > 0, 'Should not be empty' );

        Object.keys( chart ).forEach( function ( c ) {
            keys.forEach( function ( key ) {
                assert( Object.prototype.hasOwnProperty.call( chart[c], key ), WARN_SHOULD_HAVE_KEY + key );
            } );
        } );
    } );
} );


describe( 'Websockets aggregated trades', function () {
    let trades;
    let cnt = 0;
    /*global beforeEach*/
    beforeEach( function ( done ) {
        this.timeout( TIMEOUT );
        futuresBinance.websockets.futuresAggTrades( [ 'BTCUSDT', 'ETHBTC' ], e_trades => {
            cnt++;
            if ( cnt > 1 ) return;
            trades = e_trades;
            stopSockets();
            done();
        } );
    } );

    it( 'Calls trades websocket', function () {
        assert( typeof ( trades ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( trades !== null, WARN_SHOULD_BE_NOT_NULL );
    } );
} );