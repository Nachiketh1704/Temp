"""YOLO-based person (COCO class 0) detector."""
import logging
from pathlib import Path

from ultralytics import YOLO

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_NAME = "yolov8n.pt"


class HumanDetector:
    """Detects persons in images using YOLOv8 (COCO class 0)."""

    def __init__(self, model_path=None, conf_threshold=0.5):
        if model_path is None:
            candidate = MODELS_DIR / DEFAULT_MODEL_NAME
            self.model_path = candidate if candidate.exists() else DEFAULT_MODEL_NAME
        else:
            p = Path(model_path)
            self.model_path = p if p.exists() else str(model_path)
        self.model = YOLO(str(self.model_path))
        self.conf_threshold = conf_threshold
        self._inference_count = 0
        self._error_count = 0

    def detect(self, image):
        """Run detection. image: path (str/Path) or numpy array. Returns list of {bbox, confidence}."""
        try:
            results = self.model(image, conf=self.conf_threshold)
            detections = []
            for r in results:
                if r.boxes is None:
                    continue
                for box in r.boxes:
                    if int(box.cls[0]) == 0:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        detections.append({
                            "bbox": (x1, y1, x2, y2),
                            "confidence": float(box.conf[0])
                        })
            self._inference_count += 1
            return detections
        except Exception as e:
            self._error_count += 1
            logger.warning("HumanDetector.detect failed: %s", e)
            return []

    def get_stats(self):
        return {
            "inference_count": self._inference_count,
            "error_count": self._error_count,
            "model_path": str(self.model_path),
            "conf_threshold": self.conf_threshold,
        }
