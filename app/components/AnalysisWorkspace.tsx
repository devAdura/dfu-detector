"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

type Prediction = {
  prediction: "Abnormal" | "Normal";
  confidence: number;
  abnormal_probability: number;
  normal_probability: number;
  decision_threshold: number;
  model_version: string;
  explanation_method: string | null;
  explanation_image: string | null;
  disclaimer: string;
};

const API_URL = process.env.NEXT_PUBLIC_DFU_API_URL || "http://localhost:8000";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function asPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function AnalysisWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selectFile(candidate: File | undefined) {
    setError(null);
    setResult(null);
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("The image must be smaller than 10 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function analyse() {
    if (!file) return;
    setLoading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_URL}/api/v1/predict?include_explanation=true`, {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.detail || "The analysis service could not process this image.");
      }
      setResult(payload as Prediction);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Analysis failed.";
      setError(
        message === "Failed to fetch"
          ? "The analysis service is not reachable. Start the model API and try again."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (result && preview) {
    const abnormal = result.prediction === "Abnormal";
    return (
      <section className="result-panel" aria-live="polite">
        <div className="result-header">
          <div>
            <p className="section-kicker">Analysis complete · Model {result.model_version}</p>
            <h2>{abnormal ? "Potential abnormality detected" : "No abnormality detected"}</h2>
          </div>
          <span className={`result-badge ${abnormal ? "alert" : "clear"}`}>
            {result.prediction}
          </span>
        </div>

        <div className="visual-comparison">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Uploaded diabetic foot" />
            <figcaption>Original image</figcaption>
          </figure>
          <figure>
            {result.explanation_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.explanation_image} alt="Grad-CAM heatmap over the upload" />
            ) : (
              <div className="explanation-unavailable">Explanation unavailable</div>
            )}
            <figcaption>Grad-CAM focus map</figcaption>
          </figure>
        </div>

        <div className="result-details">
          <div className="confidence-block">
            <p>Prediction confidence</p>
            <strong>{asPercent(result.confidence)}</strong>
            <span>Confidence in the predicted class—not diagnostic certainty.</span>
          </div>
          <div className="probability-block">
            <div className="probability-row">
              <div><span>Abnormal</span><strong>{asPercent(result.abnormal_probability)}</strong></div>
              <div className="probability-track"><span className="abnormal-fill" style={{ width: asPercent(result.abnormal_probability) }} /></div>
            </div>
            <div className="probability-row">
              <div><span>Normal</span><strong>{asPercent(result.normal_probability)}</strong></div>
              <div className="probability-track"><span className="normal-fill" style={{ width: asPercent(result.normal_probability) }} /></div>
            </div>
          </div>
        </div>

        <div className="explanation-note">
          <strong>How to read the heatmap</strong>
          Warmer colours indicate areas that had more influence on this prediction. Grad-CAM is an
          explanation of model attention; it is not proof of a clinical lesion.
        </div>
        <div className="result-actions">
          <button className="secondary-button" type="button" onClick={reset}>Analyse another image</button>
          <p>{result.disclaimer}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="screening-card" id="screening" aria-labelledby="upload-title">
      <div className="card-heading">
        <span>01</span>
        <div>
          <p>New analysis</p>
          <h2 id="upload-title">Upload a foot image</h2>
        </div>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onInput}
      />

      {preview ? (
        <div className="selected-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected diabetic foot preview" />
          <div className="file-meta">
            <div>
              <strong>{file?.name}</strong>
              <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</span>
            </div>
            <button type="button" onClick={reset} aria-label="Remove selected image">Remove</button>
          </div>
        </div>
      ) : (
        <div
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="upload-symbol" aria-hidden="true">＋</span>
          <h3>Drop an image here</h3>
          <p>or select a JPEG, PNG, or WebP from your device</p>
          <button type="button" onClick={() => inputRef.current?.click()}>Choose image</button>
          <small>Maximum file size: 10 MB</small>
        </div>
      )}

      {error && <div className="form-error" role="alert">{error}</div>}
      {file && (
        <button className="analyse-button" type="button" onClick={analyse} disabled={loading}>
          {loading ? <><span className="spinner" /> Analysing image…</> : "Run explainable analysis"}
        </button>
      )}
      <div className="privacy-note">
        <span>Private by design</span>
        Images are processed in memory for this analysis and are not retained by the application.
      </div>
    </section>
  );
}
