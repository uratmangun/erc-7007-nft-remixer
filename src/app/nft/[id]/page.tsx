'use client';

import { mockNfts } from '@/data/mockNfts';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

export default function NftDetail() {
  const params = useParams();
  const router = useRouter();
  const nft = mockNfts.find((n) => n.id === params.id);

  if (!nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">NFT not found</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <div className="relative h-96 w-full">
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="p-8 md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{nft.name}</h1>
            <p className="text-gray-600 mb-6">{nft.description}</p>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Traits</h2>
              <div className="grid grid-cols-2 gap-4">
                {nft.traits.map((trait, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 p-3 rounded-lg"
                  >
                    <p className="text-sm text-purple-600 font-medium">{trait.type}</p>
                    <p className="text-gray-800 font-semibold">{trait.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="mt-8 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
