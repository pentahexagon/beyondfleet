import { http, createConfig } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// RainbowKit + Wagmi config for Ethereum
export const wagmiConfig = getDefaultConfig({
  appName: 'BeyondFleet',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [mainnet, polygon, arbitrum, optimism],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})

// Solana network configuration
export const SOLANA_NETWORK = 'mainnet-beta' as const
export const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
