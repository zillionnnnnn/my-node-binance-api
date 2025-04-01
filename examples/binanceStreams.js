import Binance from "../src/node-binance-api.js"


async function main() {
    const binance = new Binance({
        APIKEY: '',
        APISECRET: '',
        test: true
    });
    const logger = (message) => {
        console.log(message);
    }
    binance.tradesStream("BTCUSDT", logger);
}

main()