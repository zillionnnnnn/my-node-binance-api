const Binance = require('node-binance-api');

const client = new Binance({test: true})

async function main() {
    const ticker = await client.prices('BTCUSDT')
    console.log(ticker)
}

main()