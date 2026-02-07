"""Person detector facade: singleton YOLO detector + CNN-based detection."""
from typing import Optional, Set, Tuple
import logging

from .detection import HumanDetector
from .image_manager import get_image_manager

logger = logging.getLogger(__name__)

_detector: Optional[HumanDetector] = None


def get_person_detector() -> HumanDetector:
    global _detector
    if _detector is None:
        _detector = HumanDetector()
    return _detector


def detect_person(
    current_pos: Tuple[int, int],
    simulate: bool = False,
    target_positions: Optional[Set[tuple]] = None,
    use_cnn: bool = True,
):
    """
    CNN-based person detection using YOLOv8 model.
    
    Args:
        current_pos: Current tile position (x, y)
        simulate: If True, use simulated detection (legacy mode)
        target_positions: Target positions (used only in simulate mode)
        use_cnn: If True, use real CNN detection with images
    
    Returns:
        dict with person_detected, confidence, detections
    """
    # Legacy simulated detection mode
    if simulate and target_positions is not None and not use_cnn:
        person_detected = current_pos in target_positions
        confidence = 0.92 if person_detected else 0.0
        detections = (
            [{"bbox": (0, 0, 1, 1), "confidence": confidence}]
            if person_detected
            else []
        )
        return {
            "person_detected": person_detected,
            "confidence": confidence,
            "detections": detections,
            "detection_method": "simulated"
        }
    
    # Real CNN detection with images
    if use_cnn:
        try:
            image_manager = get_image_manager()
            image_path = image_manager.get_image_for_position(current_pos)
            
            if image_path is None:
                logger.warning(f"No image mapped for position {current_pos}")
                return {
                    "person_detected": False,
                    "confidence": 0.0,
                    "detections": [],
                    "detection_method": "cnn",
                    "error": "no_image_mapped"
                }
            
            # Run CNN detection on the image
            detector = get_person_detector()
            detections = detector.detect(image_path)
            
            # Check if any person was detected
            person_detected = len(detections) > 0
            confidence = detections[0]["confidence"] if detections else 0.0
            
            result = {
                "person_detected": person_detected,
                "confidence": confidence,
                "detections": detections,
                "detection_method": "cnn",
                "image_path": image_path
            }
            
            if person_detected:
                logger.info(f"CNN detected person at {current_pos} with confidence {confidence:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"CNN detection error at {current_pos}: {e}")
            return {
                "person_detected": False,
                "confidence": 0.0,
                "detections": [],
                "detection_method": "cnn",
                "error": str(e)
            }
    
    # Default: no detection
    return {
        "person_detected": False,
        "confidence": 0.0,
        "detections": [],
        "detection_method": "none"
    }
