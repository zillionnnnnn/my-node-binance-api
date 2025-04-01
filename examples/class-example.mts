import Binance from "../src/node-binance-api.js"


async function main() {
    const binance = new Binance({
        APIKEY: 'X4BHNSimXOK6RKs2FcKqExquJtHjMxz5hWqF0BBeVnfa5bKFMk7X0wtkfEz0cPrJ',
        APISECRET: 'x8gLihunpNq0d46F2q0TWJmeCDahX5LMXSlv3lSFNbMI3rujSOpTDKdhbcmPSf2i',
        test: true
    });
    const order = await binance.marketBuy("LTCUSDT", 0.1);
    console.log( order );
    console.log( 'Hello, World!' );
}

main()