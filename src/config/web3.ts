import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { optimismSepolia } from 'wagmi/chains';
import { Chain } from '@rainbow-me/rainbowkit';

const anvilChain: Chain = {
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  iconUrl: 'https://raw.githubusercontent.com/foundry-rs/foundry/master/.github/logo.png',
  iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

const isLocalDev = process.env.NODE_ENV !== 'production';
const chains: [Chain, ...Chain[]] = isLocalDev ? [anvilChain, optimismSepolia] : [optimismSepolia];

export const config = getDefaultConfig({
  appName: 'NFT AI Remixer',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains,
  ssr: true,
});

export const CHAIN_ID = isLocalDev ? anvilChain.id : optimismSepolia.id;
