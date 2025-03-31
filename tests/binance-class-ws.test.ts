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


const binance = new Binance().options({
    APIKEY: 'X4BHNSimXOK6RKs2FcKqExquJtHjMxz5hWqF0BBeVnfa5bKFMk7X0wtkfEz0cPrJ',
    APISECRET: 'x8gLihunpNq0d46F2q0TWJmeCDahX5LMXSlv3lSFNbMI3rujSOpTDKdhbcmPSf2i',
    test: true
});

const futuresBinance = new Binance().options({
    APIKEY: '227719da8d8499e8d3461587d19f259c0b39c2b462a77c9b748a6119abd74401',
    APISECRET: 'b14b935f9cfacc5dec829008733c40da0588051f29a44625c34967b45c11d73c',
    hedgeMode: true,
    test: true
});

const stopSockets = function ( log = false ) {
    let endpoints = binance.websockets.subscriptions();
    for ( let endpoint in endpoints ) {
        if ( log ) console.log( 'Terminated ws endpoint: ' + endpoint );
        binance.websockets.terminate( endpoint );
    }
}


describe( 'Websockets candlesticks', function () {
    let candlesticks;
    let cnt = 0;
    /*global beforeEach*/
    beforeEach( function ( done ) {
        this.timeout( TIMEOUT );
        binance.websockets.candlesticks( [ 'BTCUSDT' ], '1m', a_candlesticks => {
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