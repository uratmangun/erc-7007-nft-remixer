'use client';

import { useState, useEffect } from 'react';
import { mockNfts } from '@/data/mockNfts';
import NftCard from '@/components/NftCard';
import { useAccount, useSwitchChain, useDisconnect } from 'wagmi';
import { CHAIN_ID } from '@/config/web3';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';

export default function HomeContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = () => {
    router.push('/create');
  };

  const filteredNfts = mockNfts.filter(nft =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCorrectChain = chainId === CHAIN_ID;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex flex-col items-center pt-20 px-4">
      <div className="absolute top-4 right-4">
        {mounted && (
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openChainModal,
              openConnectModal,
              openAccountModal,
              mounted: mountedButton,
            }) => {
              return (
                <div
                  {...(!mountedButton && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!mounted) return null;
                    if (!account) {
                      return (
                        <button onClick={openConnectModal} type="button" className="px-4 py-2 rounded-lg bg-white text-purple-600 font-medium">
                          Connect Wallet
                        </button>
                      );
                    }
                    if (chain) {
                      return (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={openChainModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20"
                          >
                            {chain.hasIcon && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 24, height: 24 }}
                              />
                            )}
                            {chain.name}
                          </button>
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-purple-600 font-medium"
                          >
                            {account.displayName}
                            {account.displayBalance && (
                              <span className="text-purple-600/70">
                                {account.displayBalance}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => disconnect()}
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-purple-600 font-medium"
                          >
                            Disconnect
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        )}
      </div>

      <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight text-center leading-tight font-sans">
        NFT AI remixer
      </h1>
      <p className="text-lg md:text-xl text-white/90 text-center max-w-2xl font-normal mb-8">
        Create an entirely new NFT based on a trait of a certain NFT using erc 7007 compatible onchain AI with zk proof for validity
      </p>
      
      {mounted && isConnected && (
        isCorrectChain ? (
          <button
            onClick={handleCreate}
            className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg mb-6"
          >
            Create
          </button>
        ) : (
          <button
            onClick={() => switchChain?.({ chainId: CHAIN_ID })}
            className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg mb-6"
          >
            Switch to Optimism Sepolia
          </button>
        )
      )}

      <div className="relative w-full max-w-md mb-12">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search NFT collections..."
          className="w-full px-4 py-3 pl-12 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-3 top-3.5 h-5 w-5 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full pb-20">
        {filteredNfts.map((nft) => (
          <NftCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
}
