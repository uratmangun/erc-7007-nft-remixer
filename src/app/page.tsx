'use client';
import { useState } from 'react';

function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Create New NFT</h2>
        <div className="space-y-4">
          {/* Modal content will go here */}
          <p className="text-gray-600">Modal content coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex flex-col items-center pt-20 px-4">
      <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight text-center leading-tight font-sans">
        NFT AI remixer
      </h1>
      <p className="text-lg md:text-xl text-white/90 text-center max-w-2xl font-normal mb-8">
        Create an entirely new NFT based on a trait of a certain NFT using ORA AI erc 7007 compatible onchain AI
      </p>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg mb-6"
      >
        Create
      </button>
      <div className="relative w-full max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search NFT collections..."
          className="w-full px-4 py-3 pl-12 bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
