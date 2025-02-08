const binance = require( './node-binance-api.js' );

async function run() {
    const res = await binance.futuresTime();
    console.log( res );
}


run();