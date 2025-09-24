import Binance from "../src/node-binance-api.js"


async function main() {

    const binance = new Binance({
        APIKEY: '',
        APISECRET: '',
        verbose: true
    });

    const symbol = 'LTCUSDT';
    const side = 'SELL';
    const quantity = 0.1;

    const params = {
        // below order
        belowType: 'STOP_LOSS_LIMIT',
        belowPrice: 51,
        belowStopPrice: 50,
        belowTimeInForce: 'GTC',


        // above order
        aboveType: 'TAKE_PROFIT_LIMIT',
        aboveStopPrice: 160,
        abovePrice: 120,
        aboveTimeInForce: 'GTC',
    }

    const oco1 = await binance.ocoOrder(side, symbol, quantity, params);
    console.log('oco1', oco1.orderListId);
    console.log(oco1.orderReports[0].orderId)
    console.log(oco1.orderReports[1].orderId)

}

main()


// RESPONSE

// oco1 {
//   orderListId: 218029,
//   contingencyType: 'OCO',
//   listStatusType: 'EXEC_STARTED',
//   listOrderStatus: 'EXECUTING',
//   listClientOrderId: 'x-B3AUXNYV9e56b68a11d646f4b8da07',
//   transactionTime: 1758726001738,
//   symbol: 'LTCUSDT',
//   orders: [
//     {
//       symbol: 'LTCUSDT',
//       orderId: 21409867,
//       clientOrderId: 'MVM96szzkULu3dD7eN8xrZ'
//     },
//     {
//       symbol: 'LTCUSDT',
//       orderId: 21409868,
//       clientOrderId: 'yTaqP6Txvp6mwF7Oo7RWnb'
//     }
//   ],
//   orderReports: [
//     {
//       symbol: 'LTCUSDT',
//       orderId: 21409867,
//       orderListId: 218029,
//       clientOrderId: 'MVM96szzkULu3dD7eN8xrZ',
//       transactTime: 1758726001738,
//       price: '51.00000000',
//       origQty: '0.10000000',
//       executedQty: '0.00000000',
//       origQuoteOrderQty: '0.00000000',
//       cummulativeQuoteQty: '0.00000000',
//       status: 'NEW',
//       timeInForce: 'GTC',
//       type: 'STOP_LOSS_LIMIT',
//       side: 'SELL',
//       stopPrice: '50.00000000',
//       workingTime: -1,
//       selfTradePreventionMode: 'EXPIRE_MAKER'
//     },
//     {
//       symbol: 'LTCUSDT',
//       orderId: 21409868,
//       orderListId: 218029,
//       clientOrderId: 'yTaqP6Txvp6mwF7Oo7RWnb',
//       transactTime: 1758726001738,
//       price: '120.00000000',
//       origQty: '0.10000000',
//       executedQty: '0.00000000',
//       origQuoteOrderQty: '0.00000000',
//       cummulativeQuoteQty: '0.00000000',
//       status: 'NEW',
//       timeInForce: 'GTC',
//       type: 'TAKE_PROFIT_LIMIT',
//       side: 'SELL',
//       stopPrice: '160.00000000',
//       workingTime: -1,
//       selfTradePreventionMode: 'EXPIRE_MAKER'
//     }
//   ]
// }