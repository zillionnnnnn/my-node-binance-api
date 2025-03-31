import Binance from '../src/node-binance-api';
import {assert} from 'chai';
import util from 'util';

const WARN_SHOULD_BE_OBJ = 'should be an object';
const WARN_SHOULD_BE_NULL = 'should be null';
const WARN_SHOULD_BE_NOT_NULL = 'should not be null';
const WARN_SHOULD_HAVE_KEY = 'should have key ';
const WARN_SHOULD_NOT_HAVE_KEY = 'should not have key ';
const WARN_SHOULD_BE_UNDEFINED = 'should be undefined';
const WARN_SHOULD_BE_TYPE = 'should be a ';
const TIMEOUT = 40000;

let spotOrderId: number;
let futuresOrderId: number; // used to fetch order status

let logger = {
    log: function ( msg ) {
        let logLineDetails = ( ( new Error().stack ).split( 'at ' )[3] ).trim();
        let logLineNum = logLineDetails.split( ':' );
        console.log( 'DEBUG', logLineNum[1] + ':' + logLineNum[2], msg );
    }
}

let debug = function ( x ) {
    if ( typeof ( process.env.node_binance_api ) === 'undefined' ) {
        return;
    }
    logger.log( typeof ( x ) );
    logger.log( util.inspect( x ) );
}


const binance = new Binance().options( {
    APIKEY: 'X4BHNSimXOK6RKs2FcKqExquJtHjMxz5hWqF0BBeVnfa5bKFMk7X0wtkfEz0cPrJ',
    APISECRET: 'x8gLihunpNq0d46F2q0TWJmeCDahX5LMXSlv3lSFNbMI3rujSOpTDKdhbcmPSf2i',
    test: true
} );

const futuresBinance = new Binance().options( {
    APIKEY: '227719da8d8499e8d3461587d19f259c0b39c2b462a77c9b748a6119abd74401',
    APISECRET: 'b14b935f9cfacc5dec829008733c40da0588051f29a44625c34967b45c11d73c',
    hedgeMode: true,
    test: true
} );

/*global describe*/
/*eslint no-undef: "error"*/
describe( 'Construct', function () {
    /*global it*/
    /*eslint no-undef: "error"*/
    it( 'Construct the binance object', function ( ) {
        binance.options( {
            APIKEY: 'X4BHNSimXOK6RKs2FcKqExquJtHjMxz5hWqF0BBeVnfa5bKFMk7X0wtkfEz0cPrJ',
            APISECRET: 'x8gLihunpNq0d46F2q0TWJmeCDahX5LMXSlv3lSFNbMI3rujSOpTDKdhbcmPSf2i',
            useServerTime: true,
            reconnect: false,
            verbose: true,
            test: true,
            log: debug
        } );
        assert( typeof ( binance ) === 'object', 'Binance is not an object' );
        // //done();
    } ).timeout( TIMEOUT );

    it( 'Construct the binance object in various ways', function () {

        let keyOffset = 1000;
        let key = keyOffset;
        let secret = "secret";

        // Every variant is listed twice to make sure that the options are not shared (which happened in the past)
        let objs = [
            new Binance().options( { APIKEY: key++, APISECRET: secret } ),
            new Binance().options( { APIKEY: key++, APISECRET: secret } ),
            // Binance().options( { APIKEY: key++, APISECRET: secret } ),
            // Binance().options( { APIKEY: key++, APISECRET: secret } ),
            new Binance( { APIKEY: key++, APISECRET: secret } ),
            new Binance( { APIKEY: key++, APISECRET: secret } ),
            // Binance( { APIKEY: key++, APISECRET: secret } ),
            // Binance( { APIKEY: key++, APISECRET: secret } ),
        ];

        // Make sure that all objects have their own options
        for ( let i = 0; i < objs.length; i++ ) {
            let expectedKey = keyOffset + i;
            let actualKey = objs[i].getOption( "APIKEY" );
            assert( expectedKey === actualKey, `APIKEY: ${ expectedKey } != ${ actualKey }` );
        }

    } );

} );

describe( 'UseServerTime', function () {
    it( 'Call use server time', async function ( ) {
        await binance.useServerTime();
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Prices', function () {
    it( 'Checks the price of BNBBTC', async function () {
        const ticker = await binance.prices( 'BNBBTC' )
        assert( typeof ( ticker ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( ticker !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.prototype.hasOwnProperty.call( ticker, 'BNBBTC' ), WARN_SHOULD_HAVE_KEY + 'BNBBTC' );
        assert( Object.prototype.hasOwnProperty.call( ticker, 'ETHBTC' ) === false, WARN_SHOULD_NOT_HAVE_KEY + 'ETHBTC' );
        //done()
    } ).timeout( TIMEOUT );
} );

describe( 'All Prices', function () {
    it( 'Checks the prices of coin pairs', async function  () {
        const ticker = await binance.prices();
        assert( typeof ( ticker ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( ticker !== null, WARN_SHOULD_BE_NOT_NULL );
    } ).timeout( TIMEOUT );
} );

describe( 'Balances', function () {
    it( 'Get the balances in the account', async function () {
        const balances = await binance.balance();
        assert( balances !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( balances );
        assert( Object.prototype.hasOwnProperty.call( balances, 'BNB' ), WARN_SHOULD_HAVE_KEY + 'BNB' );
        assert( Object.prototype.hasOwnProperty.call( balances.BNB, 'available' ), WARN_SHOULD_HAVE_KEY + 'available' );
        assert( Object.prototype.hasOwnProperty.call( balances.BNB, 'onOrder' ), WARN_SHOULD_HAVE_KEY + 'onOrder' );
        //done()
    } ).timeout( TIMEOUT );
} );

describe( 'Book Ticker', function () {
    it( 'Get the BNB book ticker', async function () {
        const tickers = await binance.bookTickers( 'BNBBTC' )
        const ticker = tickers['BNBBTC'];
        assert( ticker !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( ticker );
        let members = ['bidPrice', 'bidQty', 'askPrice', 'askQty' ];
        members.forEach( function ( value ) {
            assert( Object.prototype.hasOwnProperty.call( ticker, value ), WARN_SHOULD_HAVE_KEY + value );
        } );
        //done()
    } ).timeout( TIMEOUT );

    it( 'Get all book tickers', async function () {
        const tickers = await binance.bookTickers( )
        assert( tickers !== undefined );
        //done()
    } ).timeout( TIMEOUT );
} );

describe( 'Booker Tickers', function () {
    it( 'Get the tickers for all pairs', async function () {
        const ticker = await binance.bookTickers();
        assert( typeof ( ticker ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( ticker !== null, WARN_SHOULD_BE_NOT_NULL );

        let members = [ 'bidPrice', 'bidQty', 'askPrice', 'askQty' ];
        const tickers = Object.values( ticker );
        tickers.forEach( function ( obj ) {
            members.forEach( function ( member ) {
                assert( Object.prototype.hasOwnProperty.call( obj, member ), WARN_SHOULD_HAVE_KEY + member );
            } );
        } );
        //done()
    } ).timeout( TIMEOUT * 2);
} );

describe( 'Market', function () {
    it( 'Get the market base symbol of a symbol pair', function ( ) {
        let tocheck = [ 'TRXBNB', 'BNBBTC', 'BNBETH', 'BNBUSDT' ];
        tocheck.forEach( function ( element ) {
            let mark = binance.getMarket( element );
            assert( typeof ( mark ) === 'string', WARN_SHOULD_BE_TYPE + 'string' );
            assert( element.endsWith( mark ), 'should end with: ' + mark );
        } );

        assert.isNotOk( binance.getMarket( 'ABCDEFG' ), WARN_SHOULD_BE_UNDEFINED );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'ping', function () {
    it( 'call ping', async function ( ) {
        await binance.ping();
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Depth chart BNB', function () {
    it( 'Get the depth chart information for BNBBTC', async function () {
        const depth = await binance.depth( 'BNBBTC');
        assert( depth !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( typeof ( depth ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( Object.keys( depth ).length === 4, 'should have length 3' );

        let members = [ 'lastUpdateId', 'asks', 'bids', 'symbol' ];
        members.forEach( function ( value ) {
            assert( Object.prototype.hasOwnProperty.call( depth, value ), WARN_SHOULD_HAVE_KEY + value );
        } );
        //done()
    } ).timeout( TIMEOUT * 2 );
} );

// describe( 'Buy', function () {
//     it( 'Attempt to buy ETH', function ( ) {
//         let quantity = 1;
//         let price = 0.069;
//         assert( typeof ( binance.buy( 'ETHBTC', quantity, price ) ) === 'undefined', WARN_SHOULD_BE_UNDEFINED );
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

// describe( 'Sell', function () {
//     it( 'Attempt to sell ETH', function ( ) {
//         let quantity = 1;
//         let price = 0.069;
//         assert( typeof ( binance.sell( 'ETHBTC', quantity, price ) ) === 'undefined', WARN_SHOULD_BE_UNDEFINED );
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

describe( 'MarketBuy', function () {
    it( 'Attempt to buy LTC at market price', async function () {
        let quantity = 0.5;
        const res = await binance.marketBuy( 'LTCUSDT', quantity )
        assert( res['orderId'] !== undefined )
        spotOrderId = res['orderId'];
        // //done();
    } ).timeout( TIMEOUT );
} );


describe( 'MarketSell', function () {
    it( 'Attempt to buy LTC at market price', async function () {
        let quantity = 0.5;
        const res = await binance.marketSell( 'LTCUSDT', quantity )
        assert( res['orderId'] !== undefined )
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Futures MarketBuy', function () {
    it( 'futures Attempt to buy ETH at market price', async function () {
        let quantity = 0.1;
        const res = await futuresBinance.futuresMarketBuy( 'ETHUSDT', quantity )
        assert( res['orderId'] !== undefined )
        futuresOrderId = res['orderId'];
        // //done();
    } ).timeout( TIMEOUT );
} );


describe( 'Futures MarketSell', function () {
    it( 'futures Attempt to buy ETH at market price', async function () {
        let quantity = 0.1;
        const res = await futuresBinance.futuresMarketSell( 'ETHUSDT', quantity )
        assert( res['orderId'] !== undefined )
        // //done();
    } ).timeout( TIMEOUT );
} );

// describe( 'MarketSell', function () {
//     it( 'Attempt to sell ETH at market price', function ( ) {
//         let quantity = 1;
//         assert( typeof ( binance.marketSell( 'ETHBTC', quantity ) ) === 'undefined', WARN_SHOULD_BE_UNDEFINED );
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

// describe( 'Buy order advanced', function () {
//     it( 'Attempt to buy BNB specifying order type', function ( ) {
//         let type = 'LIMIT';
//         let quantity = 1;
//         let price = 0.069;
//         assert( typeof ( binance.buy( 'BNBETH', quantity, price, { type: type } ) ) === 'undefined', WARN_SHOULD_BE_UNDEFINED );
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

// describe( 'Sell Stop loess', function () {
//     it( 'Attempt to create a stop loss order', function ( ) {
//         let type = 'STOP_LOSS';
//         let quantity = 1;
//         let price = 0.069;
//         let stopPrice = 0.068;
//         assert( typeof ( binance.sell( 'ETHBTC', quantity, price, { stopPrice: stopPrice, type: type } ) ) === 'undefined', WARN_SHOULD_BE_UNDEFINED );
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

// describe( 'Iceberg sell order', function () {
//     it( 'Attempt to create a sell order', function ( ) {
//         let quantity = 1;
//         let price = 0.069;
//         assert( typeof ( binance.sell( 'ETHBTC', quantity, price, { icebergQty: 10 } ) ) === 'undefined', WARN_SHOULD_BE_UNDEFINED );
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

describe( 'Cancel order', function () {
    it( 'Attempt to cancel an order', async function ( ) {
        let orderid = spotOrderId;
        try {
            const res = await binance.cancel( 'ETHBTC', orderid)
            assert( res !== null, WARN_SHOULD_BE_NOT_NULL );
        } catch(e) {
            assert( e.toString().includes('{"code":-2011,"msg":"Unknown order sent."}'));
        }
        // //done();
    } ).timeout( TIMEOUT );
} );

// describe( 'Cancel orders', function () {
//     it( 'Attempt to cancel all orders given a symbol', async function ( ) {
//         try {
//             await binance.cancelOrders( 'XMRBTC');
//         } catch(e) {

//         }
//         // //done();
//     } ).timeout( TIMEOUT );
// } );

describe( 'Open Orders', function () {
    it( 'Attempt to show all orders to ETHBTC', async function ( ) {
        const openOrders = await binance.openOrders( 'ETHBTC');
        assert( typeof ( openOrders ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( openOrders !== null, WARN_SHOULD_BE_NOT_NULL );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Open Orders', function () {
    it( 'Attempt to show all orders for all symbols', async function ( ) {
        const openOrders = await binance.openOrders();
        assert( openOrders !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.keys( openOrders ).length === 0 );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Order status', function () {
    it( 'Attempt to get the order status for a given order id', async function ( ) {
        try {
            const orderStatus = await binance.orderStatus( 'ETHBTC', '1234567890');
            assert( typeof ( orderStatus ) === 'object', WARN_SHOULD_BE_OBJ );
            assert( orderStatus !== null, WARN_SHOULD_BE_NOT_NULL );
            assert( Object.keys( orderStatus ).length === 0 );
        } catch(e) {
            assert( e.toString().includes('{"code":-2013,"msg":"Order does not exist."}'));
        }
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'trades', function () {
    it( 'Attempt get all trade history for given symbol', async function ( ) {
        const trades = await binance.trades( 'BTCUSDT');
        assert( typeof ( trades ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( trades !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.keys( trades ).length === 0 );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Orders', function () {
    it( 'Attempt get all orders for given symbol', async function ( ) {
        const orders = await binance.allOrders( 'ETHBTC');
        assert( typeof ( orders ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( orders !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.keys( orders ).length === 0 );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Prevday all symbols', function () {
    it( 'Attempt get prevday trade status for all symbols', async function ( ) {
        const prevDay = await binance.prevDay( );
        assert( typeof ( prevDay ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( prevDay !== null, WARN_SHOULD_BE_NOT_NULL );
        // assert( Object.keys( prevDay ).length >= num_pairs, 'should at least ' + num_pairs + 'currency pairs?' );

        let members = [
            'symbol', 'priceChange', 'priceChangePercent', 'weightedAvgPrice', 'prevClosePrice',
            'lastPrice', 'lastQty', 'bidPrice', 'bidQty', 'askQty', 'openPrice', 'highPrice', 'lowPrice',
            'volume', 'quoteVolume', 'openTime', 'closeTime', 'firstId', 'lastId', 'count'
        ];
        (prevDay as any[]).forEach( function ( obj ) {
            members.forEach( function ( key ) {
                assert( Object.prototype.hasOwnProperty.call( obj, key ), WARN_SHOULD_HAVE_KEY + key );
            } );
        } );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Prevday', function () {
    it( 'Attempt get prevday trade status for given symbol', async function ( ) {
        const prevDay = await binance.prevDay( 'BNBBTC');
        assert( typeof ( prevDay ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( prevDay !== null, WARN_SHOULD_BE_NOT_NULL );

        let members = [
            'symbol', 'priceChange', 'priceChangePercent', 'weightedAvgPrice', 'prevClosePrice',
            'lastPrice', 'lastQty', 'bidPrice', 'bidQty', 'askQty', 'openPrice', 'highPrice', 'lowPrice',
            'volume', 'quoteVolume', 'openTime', 'closeTime', 'firstId', 'lastId', 'count'
        ];
        members.forEach( function ( key ) {
            assert( Object.prototype.hasOwnProperty.call( prevDay, key ), WARN_SHOULD_HAVE_KEY + key );
        } );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Candle sticks', function () {
    it( 'Attempt get candlesticks for a given symbol', async function () {
        const ticks = await binance.candlesticks( 'BNBBTC', '5m', {
            limit: 500,
            endTime: 1514764800000
        } );
        assert( typeof ( ticks ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( ticks !== null, WARN_SHOULD_BE_NOT_NULL );

        ticks.forEach( function ( tick ) {
            assert( tick.high !== undefined );
            assert( tick.low !== undefined );
            assert( tick.open !== undefined );
        } );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Object keys', function () {
    describe( 'First', function () {
        it( 'Gets the first key', function ( ) {
            let first = binance.first( { first: '1', second: '2', third: '3' } );
            assert.strictEqual( 'first', first, 'should be first' );
            // //done();
        } ).timeout( TIMEOUT );
    } );

    describe( 'Last', function () {
        it( 'Gets the last key', function ( ) {
            let last = binance.last( { first: '1', second: '2', third: '3' } );
            assert.strictEqual( 'third', last, 'should be third' );
            // //done();
        } ).timeout( TIMEOUT );
    } );

    describe( 'slice', function () {
        it( 'Gets slice of the object keys', function ( ) {
            let slice = binance.slice( { first: '1', second: '2', third: '3' }, 2 );
            assert.deepEqual( [ 'third' ], slice, 'should be ian array with the third' );
            // //done();
        } ).timeout( TIMEOUT );
    } );

    describe( 'Min', function () {
        it( 'Gets the math min of object', function ( ) {
            binance.min( { first: '1', second: '2', third: '3' } );
            // //done();
        } ).timeout( TIMEOUT );
    } );

    describe( 'Max', function () {
        it( 'Gets the math max of object', function ( ) {
            binance.max( { first: '1', second: '2', third: '3' } );
            // //done();
        } ).timeout( TIMEOUT );
    } );
} );

describe( 'Set/Get options', function () {
    it( 'Sets/Gets option to specified value', function ( ) {
        binance.setOption( 'test', 'value' );
        assert.equal( binance.getOption( 'test' ), 'value', 'should be value' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Get options', function () {
    it( 'Gets all options', function ( ) {
        assert( typeof ( binance.getOptions() ) === 'object', 'should be object' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Percent', function () {
    it( 'Get Percentage of two values', function ( ) {
        assert( binance.percent( 25, 100 ) === 25, 'should be 25 percent' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Sum', function () {
    it( 'Get sum of array of values', function ( ) {
        assert( binance.sum( [ 1, 2, 3 ] ) === 6, 'should be 6' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Reverse', function () {
    it( 'Reverse the keys in an object', function ( ) {
        assert( binance.reverse( { '3': 3, '2': 2, '1': 1 } ).toString() === { '1': 1, '2': 2, '3': 3 }.toString(), 'should be {\'1\': 1, \'2\': 2, \'3\': 3 }' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Array', function () {
    it( 'Convert object to an array', function ( ) {
        let actual = binance.array( { 'a': 1, 'b': 2, 'c': 3 } );
        let expected = [ [ NaN, 1 ], [ NaN, 2 ], [ NaN, 3 ] ];
        assert.isArray( actual, 'should be an array' );
        assert( actual.length === 3, 'should be of lenght 3' );
        assert.deepEqual( actual, expected, 'should be both arrays with same vlaues' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'sortBids', function () {
    it( 'Sorts symbols bids and returns an object', function ( ) {
    /* let actual = binance.sortBids( 'BNBBTC' );
       debug( actual ); */
        // debug( 'todo' );
        // //done();
    } );
} );

describe( 'sortAsks', function () {
    it( 'Sorts symbols asks and returns an object', function ( ) {
    //let actual = binance.sortBids( 'BNBBTC' );
        // debug( 'todo' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Exchange Info', function () {
    let async_error;
    let async_data;
    /*global beforeEach*/
    /*eslint no-undef: "error"*/
    // beforeEach( async function () {
    //     binance.exchangeInfo( function ( error, data ) {
    //         async_error = error;
    //         async_data = data;
    //         done( error );
    //     } )
    // } ).timeout( TIMEOUT * 5 );

    // it( 'Gets the exchange info as an object', function () {
    //     assert( typeof ( async_error ) === 'object', 'error should be object' );
    //     assert( async_error === null, 'Error should be null' );
    //     assert( typeof ( async_data ) === 'object', 'data should be object' );
    //     assert( async_data !== null, 'data should not be null' );
    //     assert( Object.prototype.hasOwnProperty.call( async_data, 'symbols' ), 'data should have property \'symbols\'' );

    //     let symbolMembers = [ 'status', 'orderTypes', 'icebergAllowed', 'baseAsset', 'baseAssetPrecision', 'quoteAsset', 'quotePrecision', 'quoteAssetPrecision' ];
    //     async_data.symbols.forEach( function ( symbol ) {
    //         symbolMembers.forEach( function ( member ) {
    //             assert( Object.prototype.hasOwnProperty.call( symbol, member ), WARN_SHOULD_HAVE_KEY + member );
    //         } );
    //     } );
    // } ).timeout( TIMEOUT * 5 );
} );



describe( 'Account', function () {
    it( 'Attempt to get account information', async function () {
        const data = await binance.account();
        assert( typeof ( data ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( data !== null, WARN_SHOULD_BE_NOT_NULL );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Time', function () {
    it( 'Attempt to get server time', async function () {
        const data = await binance.time()
        assert( typeof ( data ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( data !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( Object.prototype.hasOwnProperty.call( data, 'serverTime' ), WARN_SHOULD_HAVE_KEY + 'serverTime' );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Aggtrades', function () {
    it( 'Attempt to get aggTrades for given symbol', async function () {
        const response = await binance.aggTrades( 'BNBBTC', { limit: 500 });
        assert( typeof ( response ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( response !== null, WARN_SHOULD_BE_NOT_NULL );
        // //done();
    } ).timeout( TIMEOUT );
} );

describe( 'Recent Trades', function () {
    it( 'Attempt get recent Trades for a given symbol', async function () {
        const data = await binance.recentTrades( 'BNBBTC');
        assert( typeof ( data ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( data !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( data.length > 0 );
        data.forEach( function ( obj ) {
            assert( Object.prototype.hasOwnProperty.call( obj, 'id' ), WARN_SHOULD_HAVE_KEY + 'id' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'price' ), WARN_SHOULD_HAVE_KEY + 'price' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'qty' ), WARN_SHOULD_HAVE_KEY + 'qty' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'time' ), WARN_SHOULD_HAVE_KEY + 'time' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'isBuyerMaker' ), WARN_SHOULD_HAVE_KEY + 'isBuyerMaker' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'isBestMatch' ), WARN_SHOULD_HAVE_KEY + 'isBestMatch' );
        } );
    } ).timeout( TIMEOUT );
} );

describe( 'Historical Trades', function () {
    it( 'Attempt get Historical Trades for a given symbol', async function () {
        const data = await binance.historicalTrades( 'BNBBTC' );
        assert( typeof ( data ) === 'object', WARN_SHOULD_BE_OBJ );
        assert( data !== null, WARN_SHOULD_BE_NOT_NULL );
        assert( data.length > 0 );
        data.forEach( function ( obj ) {
            assert( Object.prototype.hasOwnProperty.call( obj, 'id' ), WARN_SHOULD_HAVE_KEY + 'id' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'price' ), WARN_SHOULD_HAVE_KEY + 'price' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'qty' ), WARN_SHOULD_HAVE_KEY + 'qty' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'time' ), WARN_SHOULD_HAVE_KEY + 'time' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'isBuyerMaker' ), WARN_SHOULD_HAVE_KEY + 'isBuyerMaker' );
            assert( Object.prototype.hasOwnProperty.call( obj, 'isBestMatch' ), WARN_SHOULD_HAVE_KEY + 'isBestMatch' );
        } );
    } ).timeout( TIMEOUT );
} );

describe( 'getInfo', function () {
    it( 'Gets the info array form the binance object', function ( ) {
        assert( typeof ( binance.getInfo() ) === 'object', 'Should be of type array' )
        // //done();
    } ).timeout( TIMEOUT );
} );

