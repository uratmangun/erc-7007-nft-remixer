'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';
import ky from 'ky';
import addresses from '../../../contract-abi/addresses.json';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: any[];
}

export default function CreateNFT() {
 
  const { isConnected, address } = useAccount();
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
  const [success, setSuccess] = useState<string | null>(null);
  const [mintData, setMintData] = useState<{
    prompt: `0x${string}`;
    aigcData: `0x${string}`;
    proof: `0x${string}`;
  } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Setup contract write hook
  const { writeContract, data: hash, isPending, isError, error: writeError } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash
  });

  useEffect(() => {
    if (isConfirmed && receipt) {
      setSuccess(`NFT minted successfully! Transaction: ${receipt.transactionHash}`);
      setLoading(false);
      setMintData(null);
    }
  }, [isConfirmed, receipt]);

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

                      let tokenUri: string | null = null;

                      // Try ERC-721 tokenURI first
                      try {
                        tokenUri = await client.readContract({
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
                      } catch (err) {
                        console.log('Not an ERC-721 token, trying ERC-1155...');
                        // Try ERC-1155 uri
                        try {
                          tokenUri = await client.readContract({
                            address: formData.baseNftAddress as `0x${string}`,
                            abi: [{
                              name: 'uri',
                              type: 'function',
                              stateMutability: 'view',
                              inputs: [{ name: '_id', type: 'uint256' }],
                              outputs: [{ name: '', type: 'string' }],
                            }],
                            functionName: 'uri',
                            args: [BigInt(formData.tokenId)],
                          });
                          
                          // ERC-1155 uri might contain {id} placeholder that needs to be replaced
                          if (tokenUri) {
                            const hexTokenId = BigInt(formData.tokenId).toString(16).padStart(64, '0');
                            tokenUri = tokenUri.replace('{id}', hexTokenId);
                          }
                        } catch (err2) {
                          throw new Error('NFT contract does not implement ERC-721 or ERC-1155 standard');
                        }
                      }

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
                  Get NFT
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
                    const response = await ky.post('/api/generate-text', {
                      json: {
                        messages: [{ role: "user", content: `make an image prompt based on this data: \`\`\`${JSON.stringify(nftData)}\`\`\` make it one liner no need to explain anything` }],
                        temperature: 0.7,
                        max_tokens: 1000
                      },
                      timeout: 60000
                    }).json<{ choices: [{ message: { content: string } }] }>();
                    
                    // Clean up response by removing <think> tag and its contents
                    const content = response.choices[0].message.content.replace(/<think>.*?<\/think>\s*/s, '').trim();
                    setGeneratedPrompt(content);
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
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const response = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: generatedPrompt })
                      });
                      if (!response.ok) throw new Error('Failed to generate image');
                      const data = await response.json();
                      setGeneratedImage(data.image);
                    } catch (error) {
                      console.error('Error generating image:', error);
                      setError('Failed to generate image');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full mt-6 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </button>
                {generatedImage && (
                  <div className="mt-6 p-4 bg-white/10 rounded-lg">
                    <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-lg" />
                  </div>
                )}
              </>
            )}

            {generatedPrompt && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError(null);

                      if (!generatedPrompt) {
                        throw new Error('Please generate a prompt first');
                      }

                      if (!isConnected || !address) {
                        throw new Error('Please connect your wallet');
                      }

                      // 1. Generate image using the API
                      const imageResponse = await fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: generatedPrompt })
                      });

                      if (!imageResponse.ok) {
                        throw new Error('Failed to generate image');
                      }

                      const imageData = await imageResponse.json();
                      const base64Image = imageData.image;

                      // 2. Generate random requestId
                      const requestId = crypto.randomUUID();

                      // 3. Generate proof
                      const proofResponse = await fetch('/api/generate-proof', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt: generatedPrompt,
                          image: base64Image,
                          author: address,
                          requestId
                        })
                      });

                      if (!proofResponse.ok) {
                        throw new Error('Failed to generate proof');
                      }

                      const proofData = await proofResponse.json();
                      
                      // Call mint function
                      await writeContract({
                        address: addresses.aigcnft as `0x${string}`,
                        abi: [{
                          name: 'mint',
                          type: 'function',
                          stateMutability: 'nonpayable',
                          inputs: [
                            { name: 'prompt', type: 'bytes' },
                            { name: 'aigcData', type: 'bytes' },
                            { name: 'proof', type: 'bytes' }
                          ],
                          outputs: [{ name: 'tokenId', type: 'uint256' }],
                        }],
                        functionName: 'mint',
                        args: [
                          proofData.prompt as `0x${string}`,
                          proofData.aigcData as `0x${string}`,
                          proofData.proof as `0x${string}`
                        ]
                      });

                    } catch (error: any) {
                      console.error('Minting error:', error);
                      setError(error.message || 'Failed to mint NFT');
                      setLoading(false);
                    }
                  }}
                  className="w-full mt-6 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                  disabled={loading || !generatedPrompt || !isConnected || isPending || isConfirming}
                >
                  {isPending ? 'Confirm in Wallet...' : 
                   isConfirming ? 'Minting...' : 
                   'Create Image and Mint'}
                </button>

                {success && (
                  <div className="mt-6 p-4 bg-white/10 rounded-lg text-white">
                    <p className="text-white/80 italic">
                      {success}
                    </p>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
