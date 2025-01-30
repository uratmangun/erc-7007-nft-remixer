import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { optimismSepolia } from 'wagmi/chains';

const chains = [optimismSepolia];

export const config = getDefaultConfig({
  appName: 'NFT AI Remixer',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains,
  ssr: true,
});

export const CHAIN_ID = optimismSepolia.id;
