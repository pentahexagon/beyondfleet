import React from 'react'

export const PhantomIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
        className={className}
        fill="none"
    >
        <path fill="#534BA9" d="M128 0v128H0V0h128z" />
        <path fill="#FFF" d="M34.6 60.5c0-23.7 18.2-43.7 41.5-45.7 16-1.4 31.4 8 38.3 22.8 3.3 7 4.7 14.9 3.9 22.7-.8 7.3-3.0 14.3-6.5 20.7-3.2 5.8-3.0 13 .2 18.7 1.8 3.2 3.8 6.2 6.0 9.1-8.9 4.3-19.4 4.3-29.4-.9-3.3-1.7-7-2.7-10.7-2.9-6.3-.3-12.7 1.4-18.2 4.6-5.8 3.5-12.4 5.3-19.1 5.3-4.5 0-8.9-.8-13.1-2.4-7.5-2.8-12.5-9.9-12.9-18-.3-5.2 1.9-10.2 5.8-13.6 3.1-2.8 5.7-6.2 7.7-9.9 4.2-7.5 6.5-16 6.5-24.5zM85 58c3.6 0 6.6-2.9 6.6-6.6s-2.9-6.6-6.6-6.6-6.6 2.9-6.6 6.6 2.9 6.6 6.6 6.6zm-26.4 0c3.6 0 6.6-2.9 6.6-6.6s-2.9-6.6-6.6-6.6-6.6 2.9-6.6 6.6 2.9 6.6 6.6 6.6z" />
    </svg>
)

export const MetaMaskIcon = ({ className }: { className?: string }) => (
    <img
        src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
        alt="MetaMask"
        className={className}
    />
)
