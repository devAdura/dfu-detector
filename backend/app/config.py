from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    model_path: Path = Path(
        os.getenv("MODEL_PATH", Path(__file__).parents[1] / "models" / "dfu_final_model.keras")
    )
    allowed_origins: tuple[str, ...] = _csv(
        os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    )
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
    max_image_pixels: int = int(os.getenv("MAX_IMAGE_PIXELS", "25000000"))
    decision_threshold: float = float(os.getenv("DECISION_THRESHOLD", "0.5"))
    gradcam_layer: str = os.getenv("GRADCAM_LAYER", "conv5_block3_out")
    model_version: str = os.getenv("MODEL_VERSION", "1.0.0")


settings = Settings()
