'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';
import ky from 'ky';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: any[];
}

export default function CreateNFT() {
 
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Map of chain clients
  const chainClients = {
    '1': createPublicClient({
      chain: mainnet,
      transport: http()
    }),
    '137': createPublicClient({
      chain: polygon,
      transport: http()
    }),
    '42161': createPublicClient({
      chain: arbitrum,
      transport: http()
    }),
    '10': createPublicClient({
      chain: optimism,
      transport: http()
    }),
    '8453': createPublicClient({
      chain: base,
      transport: http()
    })
  };

  // Get the appropriate client based on current chain
  const client = chainClients[chainId.toString() as keyof typeof chainClients];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    baseNftAddress: '',
    chainId: '',
    tokenId: ''
  });

  const [nftMetadata, setNftMetadata] = useState<any>(null);
  const [nftData, setNftData] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement NFT creation logic
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const convertIpfsUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      return `https://alchemy.mypinata.cloud/ipfs/${ipfsHash}`;
    }
    return url;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-12">
      <div className="absolute top-4 right-4">
        <ConnectButton />
      </div>
      
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-purple-500/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Create New NFT</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="chainId" className="block text-white font-medium mb-2">
                  Chain
                </label>
                <select
                  id="chainId"
                  name="chainId"
                  value={formData.chainId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="" className="text-black">Select a chain</option>
                  <option value="1" className="text-black">Ethereum</option>
                  <option value="137" className="text-black">Polygon</option>
                  <option value="42161" className="text-black">Arbitrum</option>
                  <option value="10" className="text-black">Optimism</option>
                  <option value="8453" className="text-black">Base</option>
                </select>
              </div>

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
                  placeholder="Enter NFT contract address..."
                />
              </div>

              <div>
                <label htmlFor="tokenId" className="block text-white font-medium mb-2">
                  Token ID
                </label>
                <input
                  type="text"
                  id="tokenId"
                  name="tokenId"
                  value={formData.tokenId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Enter token ID..."
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setNftData(null);

                    try {
                      if (!formData.chainId || !formData.baseNftAddress || !formData.tokenId) {
                        throw new Error('Please fill in all fields');
                      }

                      // Get the appropriate client based on selected chain
                      const client = chainClients[formData.chainId as keyof typeof chainClients];
                      if (!client) {
                        throw new Error('Selected chain is not supported');
                      }

                      // Read tokenURI from the contract
                      const tokenUri = await client.readContract({
                        address: formData.baseNftAddress as `0x${string}`,
                        abi: [{
                          name: 'tokenURI',
                          type: 'function',
                          stateMutability: 'view',
                          inputs: [{ name: 'tokenId', type: 'uint256' }],
                          outputs: [{ name: '', type: 'string' }],
                        }],
                        functionName: 'tokenURI',
                        args: [BigInt(formData.tokenId)],
                      });

                      if (!tokenUri) {
                        throw new Error('NFT not found');
                      }

                      // Fetch metadata from tokenURI
                      const metadata: NFTMetadata = await ky.get(`/api/metadata?uri=${encodeURIComponent(tokenUri)}`).json();
                      
                      // Convert IPFS image URL if present
                      if (metadata.image && metadata.image.startsWith('ipfs://')) {
                        metadata.image = convertIpfsUrl(metadata.image);
                      }
                      
                      setNftData(metadata);
                    } catch (error: any) {
                      console.error('Error fetching NFT:', error);
                      setError(error.message || 'Failed to fetch NFT data');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
                >
                  Get NFT Traits
                </button>
              </div>

              {loading && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg">
                  <p className="text-white text-center">Loading NFT data...</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg">
                  <p className="text-white text-center">{error}</p>
                </div>
              )}

              {nftData && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg text-white">
                  <h3 className="font-semibold text-lg mb-2">{nftData.name}</h3>
                  {nftData.description && (
                    <p className="text-white/70 mb-4">{nftData.description}</p>
                  )}
                  {nftData.image && (
                    <img 
                      src={nftData.image} 
                      alt={nftData.name} 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  {nftData.attributes && nftData.attributes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Traits:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {nftData.attributes.map((attr: any, index: number) => (
                          <div key={index} className="bg-white/10 p-2 rounded">
                            <div className="font-medium">{attr.trait_type}</div>
                            <div className="text-white/70">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {nftData && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const response = await ky.post('/api/gaianet', {
                      json: {
                        model: "qwen72b",
                        messages: [{ role: "user", content: `make an image prompt based on this data: \`\`\`${JSON.stringify(nftData)}\`\`\` make it one liner no need to explain anything` }]
                      },
                      timeout: 60000
                    }).json<{ choices: { message: { content: string } }[] }>();
                    setGeneratedPrompt(response.choices[0].message.content);
                  } catch (error) {
                    console.error('Error generating prompt:', error);
                    setError('Failed to generate prompt');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full mt-6 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Create image prompt'}
              </button>
            )}

            {generatedPrompt && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg text-white">
                <h3 className="font-semibold text-lg mb-2">Generated Image Prompt</h3>
                <p className="text-white/80 italic">
                  {generatedPrompt}
                </p>
              </div>
            )}

            {generatedPrompt && (
              <>
                <button
                  type="button"
                  className="w-full mt-6 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  Create Image and Mint
                </button>

                <div className="mt-6 p-4 bg-white/10 rounded-lg">
                  <img
                    src={`https://picsum.photos/400/300?random=${Math.random()}`}
                    alt="Generated AI Image"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </>
            )}

         
          </form>
        </div>
      </div>
    </div>
  );
}
