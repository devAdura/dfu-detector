from __future__ import annotations

import io

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services.model_service import InferenceResult, model_service


def _image_bytes() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (224, 224), color=(172, 118, 93)).save(output, format="JPEG")
    return output.getvalue()


def test_health_reports_version(monkeypatch):
    monkeypatch.setattr(model_service, "model", object())
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["model_version"] == "1.0.0"


def test_predict_returns_explicit_class_probabilities(monkeypatch):
    monkeypatch.setattr(model_service, "model", object())
    monkeypatch.setattr(
        model_service,
        "predict",
        lambda *_: InferenceResult("Abnormal", 0.91, 0.91, 0.09, None),
    )
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/predict?include_explanation=false",
            files={"file": ("foot.jpg", _image_bytes(), "image/jpeg")},
        )
    assert response.status_code == 200
    result = response.json()
    assert result["prediction"] == "Abnormal"
    assert result["abnormal_probability"] == 0.91
    assert result["normal_probability"] == 0.09


def test_predict_rejects_non_image(monkeypatch):
    monkeypatch.setattr(model_service, "model", object())
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/predict",
            files={"file": ("notes.txt", b"not an image", "text/plain")},
        )
    assert response.status_code == 415
