"""Image Manager: Downloads, caches, and maps images to grid tiles."""
import os
import logging
import hashlib
import requests
from pathlib import Path
from typing import Dict, Set, Tuple, Optional
import json

logger = logging.getLogger(__name__)

IMAGES_DIR = Path(__file__).resolve().parent.parent / "images"
PEOPLE_DIR = IMAGES_DIR / "people"
SCENERY_DIR = IMAGES_DIR / "scenery"
MAPPING_FILE = IMAGES_DIR / "tile_mapping.json"

# Image URLs from frontend
PEOPLE_IMAGES = [
    'https://images.unsplash.com/photo-1581382575646-a4d90bb53a4a',
    'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8',
    'https://images.pexels.com/photos/3097290/pexels-photo-3097290.jpeg',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
    'https://images.unsplash.com/photo-1652184513381-9755426e7fd2',
]

SCENERY_IMAGES = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    'https://images.unsplash.com/photo-1665523456902-4e74bb7318c3',
    'https://images.unsplash.com/photo-1665019828910-33735d860571',
    'https://images.unsplash.com/photo-1614482324605-453351684189',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
    'https://images.pexels.com/photos/35673647/pexels-photo-35673647.jpeg',
    'https://images.unsplash.com/photo-1542401886-65d6c61db217',
    'https://images.unsplash.com/photo-1547235001-d703406d3f17',
    'https://images.unsplash.com/photo-1509316785289-025f5b846b35',
    'https://images.unsplash.com/photo-1616272963049-da2d8efc0c57',
    'https://images.pexels.com/photos/712392/pexels-photo-712392.jpeg',
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d',
    'https://images.unsplash.com/photo-1448375240586-882707db888b',
    'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50',
    'https://images.unsplash.com/photo-1507041957456-9c397ce39c97',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    'https://images.unsplash.com/photo-1460472178825-e5240623afd5',
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
    'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a',
    'https://images.unsplash.com/photo-1559825481-12a05cc00344',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b',
    'https://images.unsplash.com/photo-1565214975484-3cfa9e56f914',
]


class ImageManager:
    """Manages image downloads, caching, and tile mapping."""
    
    def __init__(self):
        self.tile_image_map: Dict[Tuple[int, int], str] = {}
        self.people_image_paths: list = []
        self.scenery_image_paths: list = []
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create image directories if they don't exist."""
        PEOPLE_DIR.mkdir(parents=True, exist_ok=True)
        SCENERY_DIR.mkdir(parents=True, exist_ok=True)
    
    def _get_cached_path(self, url: str, is_person: bool) -> Path:
        """Get local path for cached image."""
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        base_dir = PEOPLE_DIR if is_person else SCENERY_DIR
        return base_dir / f"{url_hash}.jpg"
    
    def _download_image(self, url: str, save_path: Path) -> bool:
        """Download image from URL to local path."""
        if save_path.exists():
            logger.info(f"Image already cached: {save_path.name}")
            return True
        
        try:
            # Add parameters for better quality
            download_url = url
            if 'unsplash.com' in url:
                download_url = f"{url}?w=800&h=600&fit=crop"
            elif 'pexels.com' in url:
                download_url = f"{url}?auto=compress&w=800&h=600"
            
            logger.info(f"Downloading image from {url[:60]}...")
            response = requests.get(download_url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (SAR Drone Simulation)'
            })
            response.raise_for_status()
            
            with open(save_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"✓ Downloaded: {save_path.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download {url}: {e}")
            return False
    
    def download_all_images(self) -> bool:
        """Download all images from URLs."""
        logger.info("Starting image downloads...")
        success_count = 0
        total_count = len(PEOPLE_IMAGES) + len(SCENERY_IMAGES)
        
        # Download people images
        for url in PEOPLE_IMAGES:
            path = self._get_cached_path(url, is_person=True)
            if self._download_image(url, path):
                self.people_image_paths.append(str(path))
                success_count += 1
        
        # Download scenery images
        for url in SCENERY_IMAGES:
            path = self._get_cached_path(url, is_person=False)
            if self._download_image(url, path):
                self.scenery_image_paths.append(str(path))
                success_count += 1
        
        logger.info(f"Downloaded {success_count}/{total_count} images successfully")
        return success_count > 0
    
    def map_images_to_grid(
        self, 
        target_positions: Set[Tuple[int, int]], 
        all_tiles: Set[Tuple[int, int]],
        rng=None
    ) -> Dict[Tuple[int, int], str]:
        """
        Map images to grid tiles:
        - Target positions get human images
        - Other positions get scenery images
        """
        import random
        if rng is None:
            rng = random.Random(42)
        
        self.tile_image_map.clear()
        
        # Shuffle images for random assignment
        people_paths = self.people_image_paths.copy()
        scenery_paths = self.scenery_image_paths.copy()
        rng.shuffle(people_paths)
        rng.shuffle(scenery_paths)
        
        # Assign human images to target positions
        target_list = list(target_positions)
        for i, target_pos in enumerate(target_list):
            if i < len(people_paths):
                self.tile_image_map[target_pos] = people_paths[i]
            else:
                # If we have more targets than people images, reuse
                self.tile_image_map[target_pos] = people_paths[i % len(people_paths)]
        
        # Assign scenery images to non-target positions
        non_target_tiles = all_tiles - target_positions
        scenery_index = 0
        for tile_pos in non_target_tiles:
            self.tile_image_map[tile_pos] = scenery_paths[scenery_index % len(scenery_paths)]
            scenery_index += 1
        
        logger.info(f"Mapped {len(target_positions)} human images to targets")
        logger.info(f"Mapped {len(non_target_tiles)} scenery images to non-targets")
        
        # Save mapping to file
        self._save_mapping()
        
        return self.tile_image_map
    
    def get_image_for_position(self, position: Tuple[int, int]) -> Optional[str]:
        """Get image path for a grid position."""
        return self.tile_image_map.get(position)
    
    def _save_mapping(self):
        """Save tile mapping to JSON file."""
        try:
            mapping_data = {
                f"{x},{y}": path 
                for (x, y), path in self.tile_image_map.items()
            }
            with open(MAPPING_FILE, 'w') as f:
                json.dump(mapping_data, f, indent=2)
            logger.info(f"Saved mapping to {MAPPING_FILE}")
        except Exception as e:
            logger.warning(f"Failed to save mapping: {e}")
    
    def _load_mapping(self) -> bool:
        """Load tile mapping from JSON file."""
        try:
            if not MAPPING_FILE.exists():
                return False
            
            with open(MAPPING_FILE, 'r') as f:
                mapping_data = json.load(f)
            
            self.tile_image_map = {
                tuple(map(int, key.split(','))): path
                for key, path in mapping_data.items()
            }
            logger.info(f"Loaded mapping from {MAPPING_FILE}")
            return True
        except Exception as e:
            logger.warning(f"Failed to load mapping: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Get statistics about cached images."""
        return {
            "people_images": len(self.people_image_paths),
            "scenery_images": len(self.scenery_image_paths),
            "mapped_tiles": len(self.tile_image_map),
            "people_dir": str(PEOPLE_DIR),
            "scenery_dir": str(SCENERY_DIR)
        }


# Singleton instance
_image_manager: Optional[ImageManager] = None

def get_image_manager() -> ImageManager:
    """Get singleton ImageManager instance."""
    global _image_manager
    if _image_manager is None:
        _image_manager = ImageManager()
    return _image_manager
