import Binance from 'node-binance-api'
const client = new Binance()

async function main() {
    const ticker = await client.bookTickers('BTCUSDT')
    const res = ticker['BTCUSDT'];
    console.log(res)
}

main()