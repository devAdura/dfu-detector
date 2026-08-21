# DFU Explain

Full-stack deployment of **Explainable Deep Learning for Diabetic Foot Ulcer Detection**. The application accepts a diabetic-foot image, runs the supplied ResNet50 classifier, and returns explicit Normal/Abnormal probabilities with a Grad-CAM overlay.

> Research prototype only. The application is not a medical device and its output is not a diagnosis.

## Architecture

```text
Browser (vinext/React)
        │ multipart image upload
        ▼
FastAPI validation and inference API
        │
        ├── ResNet50 preprocessing (224 × 224 RGB)
        ├── Keras model inference
        └── Grad-CAM explanation at conv5_block3_out
```

The web application and API are independently deployable. Uploads are processed in memory and are not persisted.

## Repository map

```text
app/                    React web interface
backend/app/            FastAPI, validation, inference, and Grad-CAM
backend/models/         Local model artifact (Git-ignored)
backend/tests/          API contract tests
public/og.png           Social-sharing image
tests/                  Server-rendering and metadata tests
MODEL_CARD.md           Intended use, metrics, semantics, and limitations
docker-compose.yml      Local full-stack deployment
```

## Model artifact

Place the supplied model at:

```text
backend/models/dfu_final_model.keras
```

The file is intentionally Git-ignored because it is approximately 170 MB. For hosted builds, provide it through a private release asset, Git LFS, or object storage and set `MODEL_PATH` to the mounted/downloaded location.

The model output is the probability of **Normal** (`class index 1`). The API correctly derives `abnormal_probability = 1 - model_output`; do not reinterpret the raw sigmoid value as ulcer probability.

## Local development

### Web interface

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run dev
```

The interface runs at `http://localhost:3000` and expects the API at `http://localhost:8000`. Override that address with `NEXT_PUBLIC_DFU_API_URL` before building.

### Inference API

Requirements: Python 3.11 or 3.12.

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

API documentation is available at `http://localhost:8000/docs`.

## One-command container deployment

With Docker Desktop running:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The API health endpoint is `http://localhost:8000/api/v1/health`.

## Configuration

| Variable | Default | Purpose |
|---|---:|---|
| `MODEL_PATH` | `backend/models/dfu_final_model.keras` | Saved Keras model location |
| `MODEL_VERSION` | `1.0.0` | Version returned with predictions |
| `DECISION_THRESHOLD` | `0.5` | Threshold applied to Normal probability |
| `GRADCAM_LAYER` | `conv5_block3_out` | Convolutional layer used for Grad-CAM |
| `MAX_UPLOAD_BYTES` | `10485760` | Maximum upload size |
| `MAX_IMAGE_PIXELS` | `25000000` | Decompression-bomb protection |
| `ALLOWED_ORIGINS` | local web origins | Comma-separated CORS origins |
| `NEXT_PUBLIC_DFU_API_URL` | `http://localhost:8000` | Browser-visible API address |

## API

- `GET /api/v1/health` — service and model readiness
- `GET /api/v1/model-info` — model card summary
- `POST /api/v1/predict` — validated image inference with optional Grad-CAM
- `GET /docs` — interactive OpenAPI documentation

## Quality checks

```bash
pnpm run lint
pnpm run build
pnpm test

cd backend
pytest
```

Before any clinical study, verify patient-level train/validation/test separation, select thresholds using validation data rather than the test set, conduct external validation, and establish the required privacy and medical-device governance.

