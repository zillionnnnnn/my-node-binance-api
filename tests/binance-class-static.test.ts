// import { sum } from './sum';

import Binance from '../node-binance-api-class.mjs';


test('UseServerTime', async () => {
    const binance = new Binance();
    const time = await binance.useServerTime();
    console.log(time);
});