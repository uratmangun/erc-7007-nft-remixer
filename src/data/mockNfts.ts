export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  traits: {
    type: string;
    value: string;
  }[];
}

export const mockNfts: NFT[] = [
  {
    id: '1',
    name: 'Cosmic Dreamer #001',
    description: 'A unique digital art piece featuring ethereal cosmic elements',
    image: 'https://picsum.photos/400/400',
    traits: [
      { type: 'Background', value: 'Deep Space' },
      { type: 'Style', value: 'Ethereal' },
      { type: 'Color Scheme', value: 'Cosmic Purple' }
    ]
  },
  {
    id: '2',
    name: 'Digital Warrior #042',
    description: 'A fierce digital warrior from the cyber realm',
    image: 'https://picsum.photos/400/400',
    traits: [
      { type: 'Background', value: 'Cyber Grid' },
      { type: 'Style', value: 'Futuristic' },
      { type: 'Color Scheme', value: 'Neon Blue' }
    ]
  },
  {
    id: '3',
    name: 'Abstract Dreams #103',
    description: 'An abstract interpretation of digital consciousness',
    image: 'https://picsum.photos/400/400',
    traits: [
      { type: 'Background', value: 'Neural Network' },
      { type: 'Style', value: 'Abstract' },
      { type: 'Color Scheme', value: 'Rainbow' }
    ]
  }
];
