import { NFT } from '@/data/mockNfts';
import Link from 'next/link';
import Image from 'next/image';

export default function NftCard({ nft }: { nft: NFT }) {
  return (
    <Link href={`/nft/${nft.id}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
        <div className="relative h-48 w-full">
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{nft.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{nft.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nft.traits.slice(0, 2).map((trait, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium"
              >
                {trait.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
