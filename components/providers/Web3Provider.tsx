'use client'

import { ReactNode, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

import { wagmiConfig, SOLANA_NETWORK } from '@/lib/web3/config'

import '@rainbow-me/rainbowkit/styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'

const queryClient = new QueryClient()

interface Web3ProviderProps {
  children: ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  // Solana wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  // Solana RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(SOLANA_NETWORK), [])

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#8b5cf6',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
