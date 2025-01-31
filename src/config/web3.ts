import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { optimismSepolia } from 'wagmi/chains';
import { Chain } from '@rainbow-me/rainbowkit';

const chains: [Chain, ...Chain[]] = [optimismSepolia];

export const config = getDefaultConfig({
  appName: 'NFT AI Remixer',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains,
  ssr: true,
});

export const CHAIN_ID = optimismSepolia.id;
