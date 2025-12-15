import { useQuery } from '@tanstack/react-query'
import { CoinMarket } from '@/types'

async function fetchMarketData(perPage: number = 5): Promise<{ coins: CoinMarket[] }> {
    const response = await fetch(`/api/prices?per_page=${perPage}`)
    if (!response.ok) {
        throw new Error('Network response was not ok')
    }
    return response.json()
}

export function useMarketData(perPage: number = 5) {
    return useQuery({
        queryKey: ['marketData', perPage],
        queryFn: () => fetchMarketData(perPage),
        staleTime: 1000 * 60, // 1 minute
        refetchInterval: 1000 * 60 * 2, // 2 minutes
    })
}
