"""Dynamic zone allocation using spatial clustering for optimal drone coverage."""
import logging
from typing import List, Dict, Set, Tuple, Optional
import numpy as np
from sklearn.cluster import KMeans
from scipy.spatial import Voronoi
from collections import defaultdict

logger = logging.getLogger(__name__)


class ZoneAllocator:
    """Handles dynamic zone assignment for drone swarm using spatial algorithms."""
    
    def __init__(self, grid_width: int, grid_height: int):
        self.grid_width = grid_width
        self.grid_height = grid_height
        self.total_tiles = grid_width * grid_height
        
    def allocate_zones_voronoi(
        self,
        drone_positions: Dict[str, Tuple[int, int]],
        unvisited_tiles: Set[Tuple[int, int]],
        drone_batteries: Dict[str, float]
    ) -> Dict[str, List[Tuple[int, int]]]:
        """
        Allocate zones using Voronoi diagram based on current drone positions.
        This creates optimal zones where each tile is assigned to the nearest drone.
        
        Args:
            drone_positions: {drone_id: (x, y)}
            unvisited_tiles: Set of (x, y) tiles not yet visited
            drone_batteries: {drone_id: battery_level}
            
        Returns:
            {drone_id: [list of tiles]}
        """
        if not drone_positions or not unvisited_tiles:
            return {drone_id: [] for drone_id in drone_positions}
        
        # Filter out dead drones (battery <= 5)
        active_drones = {
            drone_id: pos 
            for drone_id, pos in drone_positions.items() 
            if drone_batteries.get(drone_id, 0) > 5.0
        }
        
        if not active_drones:
            return {drone_id: [] for drone_id in drone_positions}
        
        # Simple Voronoi: assign each tile to nearest drone
        allocation = defaultdict(list)
        
        for tile in unvisited_tiles:
            nearest_drone = None
            min_distance = float('inf')
            
            for drone_id, drone_pos in active_drones.items():
                # Manhattan distance
                distance = abs(tile[0] - drone_pos[0]) + abs(tile[1] - drone_pos[1])
                
                # Adjust for battery - drones with low battery get tiles closer to them
                battery_factor = max(0.5, drone_batteries.get(drone_id, 100) / 100.0)
                adjusted_distance = distance / battery_factor
                
                if adjusted_distance < min_distance:
                    min_distance = adjusted_distance
                    nearest_drone = drone_id
            
            if nearest_drone:
                allocation[nearest_drone].append(tile)
        
        # Ensure all drones in original list are in result
        result = {drone_id: allocation.get(drone_id, []) for drone_id in drone_positions}
        
        logger.info(
            "Voronoi allocation: %s",
            {drone_id: len(tiles) for drone_id, tiles in result.items()}
        )
        
        return result
    
    def allocate_zones_kmeans(
        self,
        drone_positions: Dict[str, Tuple[int, int]],
        unvisited_tiles: Set[Tuple[int, int]],
        drone_batteries: Dict[str, float]
    ) -> Dict[str, List[Tuple[int, int]]]:
        """
        Allocate zones using K-means clustering centered on drone positions.
        
        Args:
            drone_positions: {drone_id: (x, y)}
            unvisited_tiles: Set of (x, y) tiles not yet visited
            drone_batteries: {drone_id: battery_level}
            
        Returns:
            {drone_id: [list of tiles]}
        """
        if not drone_positions or not unvisited_tiles:
            return {drone_id: [] for drone_id in drone_positions}
        
        active_drones = {
            drone_id: pos 
            for drone_id, pos in drone_positions.items() 
            if drone_batteries.get(drone_id, 0) > 5.0
        }
        
        if not active_drones:
            return {drone_id: [] for drone_id in drone_positions}
        
        # Convert to numpy arrays
        drone_ids = list(active_drones.keys())
        drone_coords = np.array([active_drones[did] for did in drone_ids])
        tile_coords = np.array(list(unvisited_tiles))
        
        if len(tile_coords) == 0:
            return {drone_id: [] for drone_id in drone_positions}
        
        # Use K-means with drone positions as initial centroids
        n_clusters = min(len(active_drones), len(unvisited_tiles))
        
        try:
            kmeans = KMeans(
                n_clusters=n_clusters,
                init=drone_coords[:n_clusters] if len(drone_coords) >= n_clusters else 'k-means++',
                n_init=1,
                max_iter=10,
                random_state=42
            )
            labels = kmeans.fit_predict(tile_coords)
            
            # Assign tiles to drones based on cluster labels
            allocation = defaultdict(list)
            
            for idx, label in enumerate(labels):
                if label < len(drone_ids):
                    tile = tuple(tile_coords[idx])
                    allocation[drone_ids[label]].append(tile)
            
            # Ensure all drones in original list are in result
            result = {drone_id: allocation.get(drone_id, []) for drone_id in drone_positions}
            
            logger.info(
                "K-means allocation: %s",
                {drone_id: len(tiles) for drone_id, tiles in result.items()}
            )
            
            return result
            
        except Exception as e:
            logger.error("K-means clustering failed: %s. Falling back to Voronoi.", e)
            return self.allocate_zones_voronoi(drone_positions, unvisited_tiles, drone_batteries)
    
    def should_reallocate(
        self,
        current_allocation: Dict[str, List[Tuple[int, int]]],
        drone_positions: Dict[str, Tuple[int, int]],
        drone_batteries: Dict[str, float],
        ticks_since_last_realloc: int,
        min_realloc_interval: int = 20
    ) -> bool:
        """
        Determine if zones should be reallocated based on current state.
        
        Returns True if:
        - Enough time has passed since last reallocation
        - Significant imbalance in workload
        - A drone's battery is critically low and it has many tiles
        """
        if ticks_since_last_realloc < min_realloc_interval:
            return False
        
        # Check for workload imbalance
        tile_counts = [len(tiles) for tiles in current_allocation.values()]
        if not tile_counts:
            return False
        
        max_tiles = max(tile_counts)
        min_tiles = min(tile_counts)
        
        # If imbalance > 30% of average, reallocate
        avg_tiles = sum(tile_counts) / len(tile_counts)
        if max_tiles - min_tiles > 0.3 * avg_tiles and avg_tiles > 10:
            logger.info("Reallocation triggered: workload imbalance detected")
            return True
        
        # Check for low-battery drones with too many tiles
        for drone_id, tiles in current_allocation.items():
            battery = drone_batteries.get(drone_id, 100)
            if battery < 30 and len(tiles) > 5:
                logger.info("Reallocation triggered: low-battery drone %s has %d tiles", 
                          drone_id, len(tiles))
                return True
        
        # Periodic reallocation for optimization
        if ticks_since_last_realloc >= 50:
            logger.info("Reallocation triggered: periodic optimization")
            return True
        
        return False
    
    def generate_boustrophedon_order(
        self,
        tiles: List[Tuple[int, int]],
        start_position: Tuple[int, int]
    ) -> List[Tuple[int, int]]:
        """
        Order tiles in a boustrophedon (lawn-mower) pattern for efficient coverage.
        
        Args:
            tiles: List of tiles to order
            start_position: Current drone position
            
        Returns:
            Ordered list of tiles following sweep pattern
        """
        if not tiles:
            return []
        
        # Group tiles by rows (or columns based on which is longer)
        tiles_by_row = defaultdict(list)
        
        for tile in tiles:
            tiles_by_row[tile[1]].append(tile)  # Group by y-coordinate (row)
        
        # Sort tiles within each row
        for row in tiles_by_row:
            tiles_by_row[row].sort(key=lambda t: t[0])
        
        # Order rows by proximity to start position
        sorted_rows = sorted(tiles_by_row.keys(), key=lambda r: abs(r - start_position[1]))
        
        # Create sweep pattern: alternate direction for each row
        ordered_tiles = []
        reverse = False
        
        for row in sorted_rows:
            row_tiles = tiles_by_row[row]
            if reverse:
                row_tiles.reverse()
            ordered_tiles.extend(row_tiles)
            reverse = not reverse
        
        logger.debug(
            "Boustrophedon order generated for %d tiles from position %s",
            len(ordered_tiles), start_position
        )
        
        return ordered_tiles
    
    def optimize_for_speed(
        self,
        allocation: Dict[str, List[Tuple[int, int]]],
        drone_positions: Dict[str, Tuple[int, int]]
    ) -> Dict[str, List[Tuple[int, int]]]:
        """
        Optimize tile order within each zone for maximum speed coverage.
        Uses boustrophedon pattern for each drone's zone.
        
        Args:
            allocation: Current zone allocation
            drone_positions: Current drone positions
            
        Returns:
            Allocation with optimized tile ordering
        """
        optimized = {}
        
        for drone_id, tiles in allocation.items():
            drone_pos = drone_positions.get(drone_id, (0, 0))
            optimized[drone_id] = self.generate_boustrophedon_order(tiles, drone_pos)
        
        return optimized
