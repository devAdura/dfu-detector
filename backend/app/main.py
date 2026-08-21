from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import HealthResponse, ModelInfoResponse, PredictionResponse
from app.services.model_service import InvalidImageError, model_service

logger = logging.getLogger("dfu-explain")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        if not model_service.is_loaded:
            await run_in_threadpool(model_service.load)
        logger.info("DFU model loaded successfully")
    except Exception:
        logger.exception("DFU model failed to load")
    yield


app = FastAPI(
    title="DFU Explain API",
    version=settings.model_version,
    description="Explainable ResNet50 inference for diabetic foot ulcer research.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {"service": "DFU Explain API", "documentation": "/docs"}


@app.get("/api/v1/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ready" if model_service.is_loaded else "degraded",
        model_loaded=model_service.is_loaded,
        model_version=settings.model_version,
    )


@app.get("/api/v1/model-info", response_model=ModelInfoResponse)
async def model_info() -> ModelInfoResponse:
    return ModelInfoResponse(version=settings.model_version, decision_threshold=settings.decision_threshold)


@app.post("/api/v1/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(..., description="A JPEG, PNG, or WebP foot image"),
    include_explanation: bool = Query(True),
) -> PredictionResponse:
    if not model_service.is_loaded:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model is not ready.")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")

    payload = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(payload) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB upload limit.")

    try:
        result = await run_in_threadpool(model_service.predict, payload, include_explanation)
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Inference request failed")
        raise HTTPException(status_code=500, detail="The analysis could not be completed.") from exc

    return PredictionResponse(
        prediction=result.prediction,
        confidence=result.confidence,
        abnormal_probability=result.abnormal_probability,
        normal_probability=result.normal_probability,
        decision_threshold=settings.decision_threshold,
        model_version=settings.model_version,
        explanation_method="Grad-CAM" if result.explanation_image else None,
        explanation_image=result.explanation_image,
        disclaimer="Research prototype only. This result is not a medical diagnosis.",
    )
