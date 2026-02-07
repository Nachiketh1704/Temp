// Tile images for the SAR simulation grid
// 5 people images (used once each) + 25 scenery images (each repeated 10 times) = 255 tiles

export const PEOPLE_IMAGES = [
  'https://images.unsplash.com/photo-1581382575646-a4d90bb53a4a',
  'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8',
  'https://images.pexels.com/photos/3097290/pexels-photo-3097290.jpeg',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
  'https://images.unsplash.com/photo-1652184513381-9755426e7fd2',
];

export const SCENERY_IMAGES = [
  // Nature Landscapes
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  'https://images.unsplash.com/photo-1665523456902-4e74bb7318c3',
  'https://images.unsplash.com/photo-1665019828910-33735d860571',
  'https://images.unsplash.com/photo-1614482324605-453351684189',
  // Mountains
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
  'https://images.pexels.com/photos/35673647/pexels-photo-35673647.jpeg',
  // Desert
  'https://images.unsplash.com/photo-1542401886-65d6c61db217',
  'https://images.unsplash.com/photo-1547235001-d703406d3f17',
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35',
  'https://images.unsplash.com/photo-1616272963049-da2d8efc0c57',
  'https://images.pexels.com/photos/712392/pexels-photo-712392.jpeg',
  // Forest
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d',
  'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50',
  'https://images.unsplash.com/photo-1507041957456-9c397ce39c97',
  // Urban/Buildings
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
  'https://images.unsplash.com/photo-1460472178825-e5240623afd5',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
  'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a',
  // Ocean
  'https://images.unsplash.com/photo-1559825481-12a05cc00344',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b',
  'https://images.unsplash.com/photo-1565214975484-3cfa9e56f914',
];

/**
 * Generate tile image assignments for 17x15 grid (255 tiles)
 * 5 people images (once each) + 25 scenery images (10 times each) = 255 tiles
 */
export function generateTileImageMap(gridWidth = 17, gridHeight = 15) {
  const totalTiles = gridWidth * gridHeight; // 255
  const tileImageMap = {};
  
  // Create array of all image URLs
  const allImages = [
    ...PEOPLE_IMAGES, // 5 images used once
    ...Array(10).fill(SCENERY_IMAGES).flat() // 25 images × 10 repetitions = 250
  ];
  
  // Shuffle the images for random distribution
  const shuffledImages = shuffleArray([...allImages]);
  
  // Assign images to tile coordinates
  let imageIndex = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const key = `${x},${y}`;
      tileImageMap[key] = {
        imageUrl: shuffledImages[imageIndex % shuffledImages.length],
        isPerson: imageIndex < 5 ? PEOPLE_IMAGES.includes(shuffledImages[imageIndex]) : false
      };
      imageIndex++;
    }
  }
  
  return tileImageMap;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if a tile has a person image
 */
export function hasPerson(imageUrl) {
  return PEOPLE_IMAGES.includes(imageUrl);
}
