from __future__ import annotations

import base64
import io
import threading
from dataclasses import dataclass

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image, ImageFile, UnidentifiedImageError
from tensorflow.keras.applications.resnet50 import preprocess_input

from app.config import settings

ImageFile.LOAD_TRUNCATED_IMAGES = False
Image.MAX_IMAGE_PIXELS = settings.max_image_pixels


class InvalidImageError(ValueError):
    """Raised when an upload cannot be safely decoded as a supported image."""


@dataclass(frozen=True)
class InferenceResult:
    prediction: str
    confidence: float
    abnormal_probability: float
    normal_probability: float
    explanation_image: str | None


class ModelService:
    target_size = (224, 224)

    def __init__(self) -> None:
        self.model: tf.keras.Model | None = None
        self._lock = threading.Lock()

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        if not settings.model_path.is_file():
            raise FileNotFoundError(f"Model artifact not found: {settings.model_path}")
        self.model = tf.keras.models.load_model(settings.model_path, compile=False)

    @staticmethod
    def decode_image(payload: bytes) -> tuple[Image.Image, np.ndarray]:
        try:
            with Image.open(io.BytesIO(payload)) as opened:
                opened.verify()
            with Image.open(io.BytesIO(payload)) as opened:
                if opened.format not in {"JPEG", "PNG", "WEBP"}:
                    raise InvalidImageError("Only JPEG, PNG, and WebP images are supported.")
                image = opened.convert("RGB")
                original = np.asarray(image, dtype=np.uint8)
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise InvalidImageError("The uploaded file is not a valid, safe image.") from exc

        if min(original.shape[:2]) < 64:
            raise InvalidImageError("Image dimensions must be at least 64 by 64 pixels.")
        return image, original

    def _gradcam(self, model_input: np.ndarray, predicted_class: str) -> np.ndarray:
        assert self.model is not None
        grad_model = tf.keras.Model(
            self.model.inputs,
            [self.model.get_layer(settings.gradcam_layer).output, self.model.output],
        )
        with tf.GradientTape() as tape:
            conv_output, prediction = grad_model([model_input], training=False)
            class_score = prediction[:, 0] if predicted_class == "Normal" else 1.0 - prediction[:, 0]

        gradients = tape.gradient(class_score, conv_output)
        pooled_gradients = tf.reduce_mean(gradients, axis=(0, 1, 2))
        activation = conv_output[0]
        heatmap = tf.squeeze(activation @ pooled_gradients[..., tf.newaxis])
        heatmap = tf.maximum(heatmap, 0)
        maximum = tf.reduce_max(heatmap)
        heatmap = tf.where(maximum > 0, heatmap / maximum, heatmap)
        return heatmap.numpy()

    @staticmethod
    def _overlay(original: np.ndarray, heatmap: np.ndarray) -> str:
        height, width = original.shape[:2]
        resized = cv2.resize(heatmap, (width, height), interpolation=cv2.INTER_CUBIC)
        coloured_bgr = cv2.applyColorMap(np.uint8(np.clip(resized, 0, 1) * 255), cv2.COLORMAP_JET)
        coloured_rgb = cv2.cvtColor(coloured_bgr, cv2.COLOR_BGR2RGB)
        overlay = np.uint8(np.clip(original * 0.58 + coloured_rgb * 0.42, 0, 255))
        output = io.BytesIO()
        Image.fromarray(overlay).save(output, format="JPEG", quality=90, optimize=True)
        return "data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode("ascii")

    def predict(self, payload: bytes, include_explanation: bool = True) -> InferenceResult:
        if self.model is None:
            raise RuntimeError("The inference model is not available.")

        image, original = self.decode_image(payload)
        resized = image.resize(self.target_size, Image.Resampling.LANCZOS)
        array = np.asarray(resized, dtype=np.float32)
        model_input = preprocess_input(np.expand_dims(array, axis=0))

        with self._lock:
            normal_probability = float(self.model.predict(model_input, verbose=0)[0][0])
            normal_probability = float(np.clip(normal_probability, 0.0, 1.0))
            abnormal_probability = 1.0 - normal_probability
            prediction = "Normal" if normal_probability >= settings.decision_threshold else "Abnormal"
            confidence = normal_probability if prediction == "Normal" else abnormal_probability
            explanation = None
            if include_explanation:
                explanation = self._overlay(original, self._gradcam(model_input, prediction))

        return InferenceResult(
            prediction=prediction,
            confidence=confidence,
            abnormal_probability=abnormal_probability,
            normal_probability=normal_probability,
            explanation_image=explanation,
        )


model_service = ModelService()
