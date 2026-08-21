import { AnalysisWorkspace } from "./components/AnalysisWorkspace";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DFU Explain home">
          <span className="brand-mark">D</span>
          <span>DFU <strong>EXPLAIN</strong></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#screening">Screening</a>
          <a href="#method">Method</a>
          <a href="#evidence">Evidence</a>
          <span className="research-pill">Research prototype</span>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Explainable deep learning · ResNet50</p>
          <h1>See the prediction.<br /><em>Understand the focus.</em></h1>
          <p className="lede">
            An explainable AI screening prototype for diabetic foot images, combining a
            binary classification result with a visual account of the model&apos;s attention.
          </p>
          <div className="model-facts" aria-label="Model facts">
            <div><strong>98.1%</strong><span>Test accuracy</span></div>
            <div><strong>224²</strong><span>Image input</span></div>
            <div><strong>Grad-CAM</strong><span>Visual explanation</span></div>
          </div>
        </div>
        <AnalysisWorkspace />
      </section>

      <section className="method-strip" aria-label="Analysis sequence">
        <p><span>01</span> Image quality check</p>
        <p><span>02</span> ResNet50 classification</p>
        <p><span>03</span> Grad-CAM explanation</p>
      </section>

      <section className="content-section method-section" id="method">
        <div className="section-intro">
          <p className="eyebrow">Method</p>
          <h2>One result,<br /><em>three transparent stages.</em></h2>
        </div>
        <div className="method-grid">
          <article><span>01</span><h3>Prepare</h3><p>The uploaded image is validated, converted to RGB, resized to 224 × 224 pixels, and transformed using ResNet50 preprocessing.</p></article>
          <article><span>02</span><h3>Classify</h3><p>A fine-tuned ResNet50 evaluates the image and returns complementary Normal and Abnormal probabilities.</p></article>
          <article><span>03</span><h3>Explain</h3><p>Grad-CAM traces the predicted class back to the final convolutional layer and overlays the influential regions.</p></article>
        </div>
      </section>

      <section className="evidence-section" id="evidence">
        <div className="evidence-number"><strong>159</strong><span>held-out test images</span></div>
        <div className="evidence-copy">
          <p className="eyebrow">Model evidence</p>
          <h2>Performance, with context.</h2>
          <p>The saved model reported 98.11% accuracy on its test set: 77 Abnormal and 82 Normal images. Results should be interpreted in the context of dataset size, sampling, and external validation.</p>
          <div className="metric-row"><span>Abnormal recall</span><strong>96.1%</strong></div>
          <div className="metric-row"><span>Normal recall</span><strong>100%</strong></div>
        </div>
      </section>

      <section className="limitations-section">
        <p className="eyebrow">Responsible use</p>
        <h2>Built to support research,<br />not replace clinical judgement.</h2>
        <div className="limitations-grid">
          <p><strong>Not a diagnosis.</strong> The output must not be used as the sole basis for treatment, triage, or other medical decisions.</p>
          <p><strong>Explanations have limits.</strong> A Grad-CAM focus region shows model influence, not confirmed pathology or causality.</p>
          <p><strong>Generalisation is unproven.</strong> Performance may change across cameras, skin tones, clinics, and patient populations.</p>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">D</span><span>DFU <strong>EXPLAIN</strong></span></a>
        <p>Explainable Deep Learning for Diabetic Foot Ulcer Detection</p>
        <p>Research prototype · 2026</p>
      </footer>
    </main>
  );
}
