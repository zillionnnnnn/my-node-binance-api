import Binance from "../src/node-binance-api.js"


async function main() {
    const binance = new Binance({
        APIKEY: 'X4BHNSimXOK6RKs2FcKqExquJtHjMxz5hWqF0BBeVnfa5bKFMk7X0wtkfEz0cPrJ',
        APISECRET: 'x8gLihunpNq0d46F2q0TWJmeCDahX5LMXSlv3lSFNbMI3rujSOpTDKdhbcmPSf2i',
        test: true
    });

    // const callback = (e) => console.log(e);
    // const url = binance.futuresAggTradeStream('BTCUSDT', callback);
    // console.log('WebSocket URL:', url);
    // await new Promise(r => setTimeout(r, 5000));
    // console.log('after sleep')
    // binance.futuresTerminate(url);

    binance.websockets.depthCache( [ 'BTCUSDT', 'ETHUSDT' ], ( a_symbol, a_depth ) => {
        console.log( a_symbol, a_depth );
    } );
}

main()