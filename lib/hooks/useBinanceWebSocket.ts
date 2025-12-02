'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface TickerData {
  symbol: string
  price: string
  priceChange: string
  priceChangePercent: string
  volume: string
  quoteVolume: string
  high: string
  low: string
}

interface UseBinanceWebSocketReturn {
  prices: Map<string, TickerData>
  isConnected: boolean
  error: string | null
}

// CoinGecko ID to Binance symbol mapping
const COINGECKO_TO_BINANCE: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  tether: 'USDTUSDT',
  binancecoin: 'BNBUSDT',
  solana: 'SOLUSDT',
  'usd-coin': 'USDCUSDT',
  ripple: 'XRPUSDT',
  cardano: 'ADAUSDT',
  avalanche: 'AVAXUSDT',
  dogecoin: 'DOGEUSDT',
  polkadot: 'DOTUSDT',
  chainlink: 'LINKUSDT',
  'wrapped-bitcoin': 'WBTCUSDT',
  tron: 'TRXUSDT',
  shiba: 'SHIBUSDT',
  'shiba-inu': 'SHIBUSDT',
  polygon: 'MATICUSDT',
  'matic-network': 'MATICUSDT',
  litecoin: 'LTCUSDT',
  uniswap: 'UNIUSDT',
  cosmos: 'ATOMUSDT',
  ethereum_classic: 'ETCUSDT',
  'ethereum-classic': 'ETCUSDT',
  stellar: 'XLMUSDT',
  monero: 'XMRUSDT',
  'bitcoin-cash': 'BCHUSDT',
  okb: 'OKBUSDT',
  'internet-computer': 'ICPUSDT',
  filecoin: 'FILUSDT',
  lido_dao: 'LDOUSDT',
  'lido-dao': 'LDOUSDT',
  aptos: 'APTUSDT',
  arbitrum: 'ARBUSDT',
  hedera: 'HBARUSDT',
  'hedera-hashgraph': 'HBARUSDT',
  near: 'NEARUSDT',
  vechain: 'VETUSDT',
  optimism: 'OPUSDT',
  aave: 'AAVEUSDT',
  maker: 'MKRUSDT',
  fantom: 'FTMUSDT',
  'the-graph': 'GRTUSDT',
  injective: 'INJUSDT',
  'injective-protocol': 'INJUSDT',
  render: 'RENDERUSDT',
  'render-token': 'RENDERUSDT',
  immutable: 'IMXUSDT',
  'immutable-x': 'IMXUSDT',
  stacks: 'STXUSDT',
  sei: 'SEIUSDT',
  'sei-network': 'SEIUSDT',
  sui: 'SUIUSDT',
  celestia: 'TIAUSDT',
  jupiter: 'JUPUSDT',
  'jupiter-exchange-solana': 'JUPUSDT',
  pepe: 'PEPEUSDT',
  bonk: 'BONKUSDT',
  floki: 'FLOKIUSDT',
  'fetch-ai': 'FETUSDT',
  ocean: 'OCEANUSDT',
  'ocean-protocol': 'OCEANUSDT',
  theta: 'THETAUSDT',
  'theta-network': 'THETAUSDT',
  axie: 'AXSUSDT',
  'axie-infinity': 'AXSUSDT',
  sandbox: 'SANDUSDT',
  'the-sandbox': 'SANDUSDT',
  decentraland: 'MANAUSDT',
  gala: 'GALAUSDT',
  enjin: 'ENJUSDT',
  'enjincoin': 'ENJUSDT',
  flow: 'FLOWUSDT',
  'kucoin-shares': 'KCSUSDT',
  algorand: 'ALGOUSDT',
  eos: 'EOSUSDT',
  neo: 'NEOUSDT',
  iota: 'IOTAUSDT',
  zcash: 'ZECUSDT',
  dash: 'DASHUSDT',
  quant: 'QNTUSDT',
  'quant-network': 'QNTUSDT',
  elrond: 'EGLDUSDT',
  'elrond-erd-2': 'EGLDUSDT',
  'multiversx-egld': 'EGLDUSDT',
  kava: 'KAVAUSDT',
  mina: 'MINAUSDT',
  'mina-protocol': 'MINAUSDT',
  chiliz: 'CHZUSDT',
  curve: 'CRVUSDT',
  'curve-dao-token': 'CRVUSDT',
  '1inch': '1INCHUSDT',
  pancakeswap: 'CAKEUSDT',
  'pancakeswap-token': 'CAKEUSDT',
  sushi: 'SUSHIUSDT',
  compound: 'COMPUSDT',
  'compound-governance-token': 'COMPUSDT',
  yearn: 'YFIUSDT',
  'yearn-finance': 'YFIUSDT',
  synthetix: 'SNXUSDT',
  'synthetix-network-token': 'SNXUSDT',
  loopring: 'LRCUSDT',
  ren: 'RENUSDT',
  band: 'BANDUSDT',
  'band-protocol': 'BANDUSDT',
  ankr: 'ANKRUSDT',
  storj: 'STORJUSDT',
  basic_attention_token: 'BATUSDT',
  'basic-attention-token': 'BATUSDT',
  zilliqa: 'ZILUSDT',
  icon: 'ICXUSDT',
  ont: 'ONTUSDT',
  ontology: 'ONTUSDT',
  waves: 'WAVESUSDT',
  kusama: 'KSMUSDT',
  'thorchain': 'RUNEUSDT',
  dydx: 'DYDXUSDT',
  worldcoin: 'WLDUSDT',
  'worldcoin-wld': 'WLDUSDT',
  blur: 'BLURUSDT',
  pyth: 'PYTHUSDT',
  'pyth-network': 'PYTHUSDT',
  jito: 'JITOUSDT',
  'jito-governance-token': 'JITOUSDT',
  wormhole: 'WUSDT',
  kaspa: 'KASUSDT',
}

export function useBinanceWebSocket(coinIds: string[]): UseBinanceWebSocketReturn {
  const [prices, setPrices] = useState<Map<string, TickerData>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    // Convert CoinGecko IDs to Binance symbols
    const symbols = coinIds
      .map(id => COINGECKO_TO_BINANCE[id.toLowerCase()])
      .filter(Boolean)
      .map(s => s.toLowerCase())

    if (symbols.length === 0) return

    // Create streams for each symbol
    const streams = symbols.map(s => `${s}@ticker`).join('/')
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.data) {
            const ticker = data.data
            const tickerData: TickerData = {
              symbol: ticker.s,
              price: ticker.c,
              priceChange: ticker.p,
              priceChangePercent: ticker.P,
              volume: ticker.v,
              quoteVolume: ticker.q,
              high: ticker.h,
              low: ticker.l,
            }

            setPrices(prev => {
              const newMap = new Map(prev)
              newMap.set(ticker.s, tickerData)
              return newMap
            })
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e)
        }
      }

      wsRef.current.onerror = () => {
        setError('WebSocket 연결 오류')
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }
    } catch (e) {
      setError('WebSocket 연결 실패')
    }
  }, [coinIds])

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return { prices, isConnected, error }
}

// Helper function to get Binance symbol from CoinGecko ID
export function getBinanceSymbol(coinGeckoId: string): string | null {
  return COINGECKO_TO_BINANCE[coinGeckoId.toLowerCase()] || null
}
