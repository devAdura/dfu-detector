from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str


class ModelInfoResponse(BaseModel):
    name: str = "DFU ResNet50"
    version: str
    architecture: str = "ResNet50 transfer-learning binary classifier"
    input_shape: list[int] = [224, 224, 3]
    classes: dict[str, int] = {"Abnormal": 0, "Normal": 1}
    explainability: str = "Grad-CAM"
    decision_threshold: float
    test_accuracy: float = 0.9811320900917053
    test_sample_size: int = 159
    intended_use: str = "Research and educational decision-support prototype"


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float = Field(ge=0, le=1)
    abnormal_probability: float = Field(ge=0, le=1)
    normal_probability: float = Field(ge=0, le=1)
    decision_threshold: float
    model_version: str
    explanation_method: str | None = None
    explanation_image: str | None = None
    disclaimer: str
