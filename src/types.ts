
// trying to keep them compatible with
// https://github.com/ViewBlock/binance-api-node/blob/master/index.d.ts

export type Interval =
    | '1m'
    | '3m'
    | '5m'
    | '15m'
    | '30m'
    | '1h'
    | '2h'
    | '4h'
    | '6h'
    | '8h'
    | '12h'
    | '1d'
    | '3d'
    | '1w'
    | '1M'

export type OrderType =
    | 'LIMIT'
    | 'MARKET'
    | 'STOP'
    | 'STOP_MARKET'
    | 'TAKE_PROFIT'
    | 'TAKE_PROFIT_MARKET'
    | 'LIMIT_MAKER'
    | 'TRAILING_STOP_MARKET'

export type OrderSide = 'BUY' | 'SELL'

export type OrderStatus =
    | 'CANCELED'
    | 'EXPIRED'
    | 'FILLED'
    | 'NEW'
    | 'PARTIALLY_FILLED'
    | 'PENDING_CANCEL'
    | 'REJECTED'

export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTE_GTC' | 'GTD'


export interface Candle {
    openTime: number
    open: string
    high: string
    low: string
    close: string
    volume: string
    closeTime: number
    quoteVolume: string
    trades: number
    baseAssetVolume: string
    quoteAssetVolume: string
  }

export interface OrderFill {
    tradeId: number
    price: string
    qty: string
    commission: string
    commissionAsset: string
}

export interface Order {
    clientOrderId: string
    cummulativeQuoteQty: string
    executedQty: string
    fills?: OrderFill[]
    icebergQty?: string
    isIsolated?: boolean
    isWorking: boolean
    orderId: number
    orderListId: number
    origQty: string
    price: string
    side: OrderSide
    status: OrderStatus
    stopPrice?: string
    symbol: string
    time: number
    timeInForce: TimeInForce
    transactTime?: number
    type: OrderType
    updateTime: number
  }

  export interface FuturesOrder {
    clientOrderId: string
    cumQty: string
    cumQuote: string
    executedQty: string
    orderId: number
    avgPrice: string
    origQty: string
    price: string
    reduceOnly: boolean
    side: OrderSide
    positionSide: PositionSide
    status: OrderStatus
    stopPrice: string
    closePosition: boolean
    symbol: string
    timeInForce: TimeInForce
    type: OrderType
    origType: OrderType
    activatePrice: string
    priceRate: string
    updateTime: number
    workingType: WorkingType
}

export type PositionSide = 'BOTH' | 'SHORT' | 'LONG'


export type WorkingType = 'MARK_PRICE' | 'CONTRACT_PRICE'

// export type symbol = string;

export type Callback = (...args: any) => any;


export interface IConstructorArgs {
    recvWindow: number;
    useServerTime: boolean;
    reconnect: boolean;
    test: boolean;
    hedgeMode: boolean;
    log: (...args: any[]) => void;
    verbose: boolean;
    keepAlive: boolean;
    localAddress: boolean;
    family: boolean;
    urls: Partial<{
        base: string;
        wapi: string;
        sapi: string;
        fapi: string;
        fapiTest: string;
        stream: string;
        combineStream: string;
        fstream: string;
        fstreamSingle: string;
        fstreamTest: string;
        fstreamSingleTest: string;
        dstream: string;
        dstreamSingle: string;
        dstreamTest: string;
        dstreamSingleTest: string;
    }>;
    timeOffset: number;
}

export interface FundingRate {
    symbol: string
    fundingRate: string
    fundingTime: number
    time: number
  }


export interface PositionRisk {
    entryPrice: string
    marginType: 'isolated' | 'cross'
    isAutoAddMargin: string
    isolatedMargin: string
    leverage: string
    liquidationPrice: string
    markPrice: string
    maxNotionalValue: string
    positionAmt: string
    symbol: string
    unRealizedProfit: string
    positionSide: PositionSide
    notional: string
    isolatedWallet: string
    updateTime: number
}


export interface CancelOrder{
    symbol: string
    origClientOrderId: string
    orderId: number
    orderListId: number
    clientOrderId: string
    price: string
    origQty: string
    executedQty: string
    cummulativeQuoteQty: string
    status: string
    timeInForce: string
    type: OrderType
    side: OrderSide
}


export interface AggregatedTrade {
    aggId: number
    symbol: string
    price: string
    quantity: string
    firstId: number
    lastId: number
    timestamp: number
    isBuyerMaker: boolean
    wasBestPrice: boolean
}


export interface Trade {
    id: number
    price: string
    qty: string
    quoteQty: string
    time: number
    isBuyerMaker: boolean
    isBestMatch: boolean
  }

  export interface MyTrade {
    id: number
    symbol: string
    orderId: number
    orderListId: number
    price: string
    qty: string
    quoteQty: string
    commission: string
    commissionAsset: string
    time: number
    isBuyer: boolean
    isMaker: boolean
    isBestMatch: boolean
}

export type WithdrawStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6


export interface WithdrawHistoryResponse {
    [index: number]: {
      id: string
      amount: string
      transactionFee: string
      address: string
      coin: string
      txId: string
      applyTime: number
      status: WithdrawStatus
      network: string
      transferType?: number
      withdrawOrderId?: string
    }
}


export interface DepositHistoryResponse {
    [index: number]: {
      insertTime: number
      amount: string
      coin: string
      network: string
      address: string
      txId: string
      status: DepositStatus
      addressTag?: string
      transferType?: number
      confirmTimes?: string
    }
}

export interface CancelOrder {
    symbol: string
    origClientOrderId: string
    orderId: number
    orderListId: number
    clientOrderId: string
    price: string
    origQty: string
    executedQty: string
    cummulativeQuoteQty: string
    status: string
    timeInForce: string
    type: OrderType
    side: OrderSide
}


export interface DepositAddress {
    address: string
    tag: string
    coin: string
    url: string
  }

  export interface WithdrawResponse {
    id: string
  }


export type DepositStatus = 0 | 1


export interface FuturesCancelAllOpenOrder {
    code: number
    msg: string
}


export interface OrderBook {
    lastUpdateId: number
    asks: Bid[]
    bids: Bid[]
}

export interface Bid {
    price: string
    quantity: string
}

export interface Ticker {
    eventType: string
    eventTime: number
    symbol: string
    priceChange: string
    priceChangePercent: string
    weightedAvg: string
    prevDayClose: string
    curDayClose: string
    closeTradeQuantity: string
    bestBid: string
    bestBidQnt: string
    bestAsk: string
    bestAskQnt: string
    open: string
    high: string
    low: string
    volume: string
    volumeQuote: string
    openTime: number
    closeTime: number
    firstTradeId: number
    lastTradeId: number
    totalTrades: number
  }


// export {
//     _interval as interval,
//     _symbol as symbol,
//     _callback as callback,
//     IConstructorArgs
// }