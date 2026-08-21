# DFU Explain model card

## Model

- Architecture: ImageNet-pretrained ResNet50 with a fine-tuned classification head
- Task: Binary image classification (`Abnormal = 0`, `Normal = 1`)
- Input: 224 × 224 RGB image
- Output: Sigmoid probability of the `Normal` class
- Explanation: Grad-CAM at `conv5_block3_out`
- Deployment threshold: 0.5 for the Normal-class probability

## Reported evaluation

The supplied artifact reports 98.11% accuracy on 159 held-out images. The class report contains 77 Abnormal and 82 Normal images. Abnormal recall is 96.10%; Normal recall is 100%.

These figures describe the supplied test set only. They do not establish clinical effectiveness or performance across hospitals, cameras, skin tones, disease severity, or patient populations.

## Intended use

Educational and research demonstration of explainable deep learning for diabetic-foot image screening. The application is a decision-support prototype and must not be used as an autonomous diagnostic device.

## Important implementation semantics

The sigmoid output is the probability of `Normal`, because the training class indices were `Abnormal = 0` and `Normal = 1`. The application therefore computes:

```text
normal_probability = model_output
abnormal_probability = 1 - model_output
```

## Limitations and risks

- External clinical validation has not been supplied.
- The test set is small and may not represent real-world prevalence.
- Patient-level separation across splits must be verified to rule out leakage.
- Grad-CAM indicates model influence, not causal pathology.
- Performance can degrade with blur, poor lighting, occlusion, framing differences, and out-of-distribution inputs.
- The classifier distinguishes Normal from Abnormal; it does not grade ulcer severity, localise wound boundaries, or recommend treatment.

## Privacy

The API processes uploads in memory and does not persist them. Production operators remain responsible for HTTPS, access control, log redaction, retention policy, and applicable health-data governance.
