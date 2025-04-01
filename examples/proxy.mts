// import Binance from "node-binance-api"
import Binance from "../node-binance-api-class.mjs"


async function main () {
  const exchange = new Binance().options({});
  exchange.httpsProxy = 'http://188.34.194.190:8911';
  //
  // ### socksProxy ###
  // exchange.socksProxy = 'socks5://127.0.0.1:1080';
  //
  // ### cors/redirection proxy ###
  // exchange.urlProxy = 'https://example.com/?getUrl=';
  //
  const res = await exchange.futuresTime();
  console.log( res );
}

main ();