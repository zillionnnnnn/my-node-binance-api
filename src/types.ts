type _interval = keyof {
    '1m': never;
    '3m': never;
    '5m': never;
    '15m': never;
    '30m': never;
    '1h': never;
    '2h': never;
    '4h': never;
    '6h': never;
    '8h': never;
    '12h': never;
    '1d': never;
    '3d': never;
    '1w': never;
    '1M': never;
};

type _symbol = string;

type _callback = (...args: any) => any;


interface IConstructorArgs {
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

export {
    _interval as interval,
    _symbol as symbol,
    _callback as callback,
    IConstructorArgs
}