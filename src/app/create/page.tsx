'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type TabType = 'search' | 'contract';

export default function CreateNFT() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    baseNftAddress: '',
    baseNftId: '',
    searchQuery: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement NFT creation logic
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex flex-col items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Connect Wallet</h2>
          <p className="text-white/80 mb-6 text-center">Please connect your wallet to create an NFT</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex flex-col items-center p-4">
      <div className="absolute top-4 right-4">
        <ConnectButton />
      </div>
      
      <div className="max-w-2xl w-full mt-20">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Create New NFT</h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === 'search'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Search NFT
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === 'contract'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Contract Address
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search or Contract Input based on active tab */}
            {activeTab === 'search' ? (
              <div>
                <label htmlFor="searchQuery" className="block text-white font-medium mb-2">
                  Search NFTs
                </label>
                <input
                  type="text"
                  id="searchQuery"
                  name="searchQuery"
                  value={formData.searchQuery}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Search for NFTs..."
                />
                {/* TODO: Add search results display */}
                <div className="mt-4 space-y-2">
                  {/* Placeholder for search results */}
                  <div className="p-4 bg-white/5 rounded-lg text-white/70">
                    No NFTs found. Try searching for a collection name or NFT ID.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="baseNftAddress" className="block text-white font-medium mb-2">
                    NFT Contract Address
                  </label>
                  <input
                    type="text"
                    id="baseNftAddress"
                    name="baseNftAddress"
                    value={formData.baseNftAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Enter NFT contract address"
                  />
                </div>
                <div>
                  <label htmlFor="baseNftId" className="block text-white font-medium mb-2">
                    Token ID
                  </label>
                  <input
                    type="text"
                    id="baseNftId"
                    name="baseNftId"
                    value={formData.baseNftId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Enter token ID"
                  />
                </div>
              </div>
            )}

            {/* Common form fields */}
            <div>
              <label htmlFor="name" className="block text-white font-medium mb-2">
                New NFT Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="Enter NFT name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-white font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 h-32"
                placeholder="Enter NFT description"
                required
              />
            </div>

            <div>
              <label htmlFor="prompt" className="block text-white font-medium mb-2">
                AI Prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                value={formData.prompt}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 h-32"
                placeholder="Describe how you want to transform the NFT into 8-bit pixel style..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              Create NFT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
