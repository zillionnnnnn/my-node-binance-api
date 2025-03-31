const Binance = require('node-binance-api');

const client = new Binance()

async function main() {
    const ticker = await client.prices('BTCUSDT')
    console.log(ticker)
}

main()