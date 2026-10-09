# Review of SOL-ExecBench and ideas to build LlamaSOL

Prepared by: Abhijit Ramesh

October 7, 2026

Notes:
Source: Paper/2603.19173v1.pdf, title page.
Companion notes: SOL-Exec Bench.md.

---

## Introduction

- **KernelBench** showed how AI agents can optimize GPU kernels. It measures speedup against PyTorch, and its model-level tasks use older architectures that miss newer workloads.
- **SOL-ExecBench collects relevant tasks** from modern PyTorch models, covering both training and inference.
- **It measures remaining hardware headroom** using estimated hardware limits, alongside a scoring baseline.
- **Our LlamaSOL direction:** Apply these ideas to **existing kernels in llama.cpp**, an open-source repository, and build a metric focused entirely on AI inference.

Notes:
Paper: Paper/2603.19173v1.pdf, Sections 1, 2.1, 3.2, and 4.2–4.4.
KernelBench measures speedup against eager PyTorch. The paper critiques its model-level coverage, citing older models such as ResNet, BERT, and VGG. This does not mean all KernelBench operators are obsolete or that every prior benchmark uses only software baselines. CUDABench also uses a roofline-based metric.
SOL-ExecBench extracts computational subgraphs from real models. An LLM produces standalone PyTorch implementations, which undergo validation. These are functional references, distinct from optimized kernel solutions and the scoring baseline.
SOLAR estimates lower bounds on runtime from hardware capabilities. The SOL Score uses both those bounds and a scoring baseline, so it is not a baseline-free measure.
In this paper version, Section 4.4 says the scoring baseline is held internal and may be released later. The paper also describes agent-generated optimized solutions. Keep those separate from the public reference implementations when discussing transparency.
Companion notes: SOL-Exec Bench.md, “Related Work”, “Extraction pipeline”, “SOL Bound Derivation”, and “Evaluation framework”.
LlamaSOL is our proposed direction: optimize existing kernels in llama.cpp and design evaluation specifically for AI inference. SOL-ExecBench already includes real model workloads and inference tasks. Our distinction is the repository context and inference-only focus, not a claim that its workloads are artificial.

---

## Related Work

<div class="work-timeline compact-timeline" role="list" aria-label="GPU kernel benchmarks from 2025 to 2026">
  <article class="timeline-entry timeline-active" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2025</p>
      <h3>KernelBench</h3>
      <p class="timeline-placeholder">Correct + fast</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Apr 2025</p>
      <h3>ComputeEval</h3>
      <p class="timeline-placeholder">CUDA correctness</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">2025</p>
      <h3>BackendBench</h3>
      <p class="timeline-placeholder">PyTorch operators</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Jan 2026</p>
      <h3>FlashInfer-Bench</h3>
      <p class="timeline-placeholder">Inference workloads</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2026</p>
      <h3>CUDABench</h3>
      <p class="timeline-placeholder">Roofline scoring</p>
    </div>
  </article>
</div>
<div class="related-detail-stack">
<div class="kernelbench-detail">
  <img class="kernelbench-mascot plain" src="assets/logos/kernelbench-mascot.png" alt="KernelBench mascot: a smiling bench with an ear of corn">
  <div class="kernelbench-explanation">
    <h3>KernelBench: a widely used Stanford benchmark</h3>
    <p><strong>fast<sub>p</sub></strong> = fraction of tasks where generated kernels are <strong>correct</strong> and achieve <strong>more than p× speedup</strong> over eager PyTorch.</p>
    <p class="metric-example">Example: fast<sub>2</sub> counts correct solutions that are more than 2× as fast.</p>
    <div class="lab-credits">
      <div><img class="plain" src="assets/logos/hazy-research.png" alt="Hazy Research logo"><span>Hazy Research<br>Chris Ré</span></div>
      <div><img class="plain" src="assets/logos/scaling-intelligence.png" alt="Scaling Intelligence Lab logo"><span>Scaling Intelligence<br>Azalia Mirhoseini</span></div>
    </div>
  </div>
</div>
</div>
<p class="timeline-caption">Publication / announcement dates · spacing not to scale</p>

Notes:
Scope: the five benchmarks listed in the Related Work section of SOL-Exec Bench.md, including its FlashInfer-Bench TODO. Each benchmark has its own vertical slide beneath the introduction.
KernelBench: first arXiv submission, February 14, 2025. https://arxiv.org/abs/2502.10517
ComputeEval: NVIDIA announcement, April 16, 2025. https://developer.nvidia.com/blog/announcing-computeeval-an-open-source-framework-for-evaluating-llms-on-cuda/
BackendBench: repository citation gives 2025. Only the year is specified here; its placement within 2025 is schematic, not an assertion of an exact release month. https://github.com/meta-pytorch/BackendBench
FlashInfer-Bench: first arXiv submission, January 1, 2026. https://arxiv.org/abs/2601.00227
CUDABench: first submission listed by arXiv is February 13, 2026, despite the 2603 identifier. https://arxiv.org/abs/2603.02236

KernelBench metric: https://github.com/ScalingIntelligence/KernelBench (Overall Benchmark Metric). Strict threshold: speedup > p, not ≥ p.
KernelBench is described as widely adopted in SOL-ExecBench Section 2.1. Author credit includes Christopher Ré and Azalia Mirhoseini: https://arxiv.org/abs/2502.10517
Project and Scaling Intelligence attribution: https://scalingintelligence.stanford.edu/blogs/kernelbench/
Hazy Research: https://hazyresearch.stanford.edu/
Original visual assets, used unchanged for attribution: https://scalingintelligence.stanford.edu/imgs/blog/kernelbench/kernelbench_mascot.png ; https://hazyresearch.stanford.edu/hazy-logo.png ; https://scalingintelligence.stanford.edu/imgs/logo.png

--

## Related Work

<div class="work-timeline compact-timeline" role="list" aria-label="GPU kernel benchmarks from 2025 to 2026">
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2025</p>
      <h3>KernelBench</h3>
      <p class="timeline-placeholder">Correct + fast</p>
    </div>
  </article>
  <article class="timeline-entry timeline-active" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Apr 2025</p>
      <h3>ComputeEval</h3>
      <p class="timeline-placeholder">CUDA correctness</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">2025</p>
      <h3>BackendBench</h3>
      <p class="timeline-placeholder">PyTorch operators</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Jan 2026</p>
      <h3>FlashInfer-Bench</h3>
      <p class="timeline-placeholder">Inference workloads</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2026</p>
      <h3>CUDABench</h3>
      <p class="timeline-placeholder">Roofline scoring</p>
    </div>
  </article>
</div>
<div class="related-detail-stack">
<div class="computeeval-detail">
  <div class="computeeval-brand">
    <img class="plain nvidia-logo" src="assets/logos/nvidia.svg" alt="NVIDIA logo">
    <p class="cuda-caption">CUDA know-how</p>
  </div>
  <div class="computeeval-copy">
  <h3>ComputeEval by NVIDIA</h3>
  <p>Tests LLMs across a broad range of CUDA tasks: <strong>Tensor Cores, CUDA Graphs, streams, warp primitives, and shared memory.</strong></p>
  <p><span class="correctness-check" aria-hidden="true">✓</span> Measures <strong>functional correctness</strong> and breadth of CUDA programming knowledge.</p>
  <p><strong>Complements SOL-ExecBench:</strong> broad CUDA knowledge alongside deep-learning kernel performance.</p>
  </div>
</div>
</div>
<p class="timeline-caption">Publication / announcement dates · spacing not to scale</p>

Notes:
Scope: the five benchmarks listed in the Related Work section of SOL-Exec Bench.md, including its FlashInfer-Bench TODO. Each benchmark has its own vertical slide beneath the introduction.
KernelBench: first arXiv submission, February 14, 2025. https://arxiv.org/abs/2502.10517
ComputeEval: NVIDIA announcement, April 16, 2025. https://developer.nvidia.com/blog/announcing-computeeval-an-open-source-framework-for-evaluating-llms-on-cuda/
BackendBench: repository citation gives 2025. Only the year is specified here; its placement within 2025 is schematic, not an assertion of an exact release month. https://github.com/meta-pytorch/BackendBench
FlashInfer-Bench: first arXiv submission, January 1, 2026. https://arxiv.org/abs/2601.00227
CUDABench: first submission listed by arXiv is February 13, 2026, despite the 2603 identifier. https://arxiv.org/abs/2603.02236

ComputeEval content: SOL-ExecBench, Paper/2603.19173v1.pdf, Section 2.1 (Related Benchmarks), and SOL-Exec Bench.md, Related Work. The paper describes functional correctness and breadth of CUDA knowledge as complementary to hardware-limit-based performance evaluation.

NVIDIA logo: original two-color vertical SVG from NVIDIA’s official brand assets, preserved without alteration. Source: https://www.nvidia.com/content/nvidiaGDC/us/en_US/about-nvidia/legal-info/logo-brand-usage/_jcr_content/root/responsivegrid/nv_container_392921705/nv_container/nv_image.coreimg.svg/1776076920288/nvidia-logo-vert.svg

--

## Related Work

<div class="work-timeline compact-timeline" role="list" aria-label="GPU kernel benchmarks from 2025 to 2026">
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2025</p>
      <h3>KernelBench</h3>
      <p class="timeline-placeholder">Correct + fast</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Apr 2025</p>
      <h3>ComputeEval</h3>
      <p class="timeline-placeholder">CUDA correctness</p>
    </div>
  </article>
  <article class="timeline-entry timeline-active" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">2025</p>
      <h3>BackendBench</h3>
      <p class="timeline-placeholder">PyTorch operators</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Jan 2026</p>
      <h3>FlashInfer-Bench</h3>
      <p class="timeline-placeholder">Inference workloads</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2026</p>
      <h3>CUDABench</h3>
      <p class="timeline-placeholder">Roofline scoring</p>
    </div>
  </article>
</div>
<div class="related-detail-stack">
<div class="backendbench-detail">
  <div class="backendbench-brand">
    <img class="plain gpu-mode-logo" src="assets/logos/gpu-mode.png" alt="GPU MODE logo">
    <p>Mark Saroufim<br><span>GPU MODE</span></p>
  </div>
  <div class="backendbench-copy">
    <h3>BackendBench</h3>
    <p>Tests <strong>LLM-generated Triton kernels</strong> that implement individual <strong>PyTorch operators</strong>.</p>
    <p>Checks <strong>correctness</strong> across 271 operators, with <strong>performance tests</strong> for a subset of 124.</p>
    <p>Uses PyTorch’s own tests and real model shapes, with the goal of <strong>contributing kernels back to PyTorch</strong>.</p>
    <p class="backendbench-credit">By Mark Saroufim and collaborators.</p>
  </div>
</div>
</div>
<p class="timeline-caption">Publication / announcement dates · spacing not to scale</p>

Notes:
Scope: the five benchmarks listed in the Related Work section of SOL-Exec Bench.md, including its FlashInfer-Bench TODO. Each benchmark has its own vertical slide beneath the introduction.
KernelBench: first arXiv submission, February 14, 2025. https://arxiv.org/abs/2502.10517
ComputeEval: NVIDIA announcement, April 16, 2025. https://developer.nvidia.com/blog/announcing-computeeval-an-open-source-framework-for-evaluating-llms-on-cuda/
BackendBench: repository citation gives 2025. Only the year is specified here; its placement within 2025 is schematic, not an assertion of an exact release month. https://github.com/meta-pytorch/BackendBench
FlashInfer-Bench: first arXiv submission, January 1, 2026. https://arxiv.org/abs/2601.00227
CUDABench: first submission listed by arXiv is February 13, 2026, despite the 2603 identifier. https://arxiv.org/abs/2603.02236

BackendBench description and 271 correctness / 124 performance operator counts: SOL-ExecBench paper v1, Section 2.1. Counts describe the version reviewed in the paper.
BackendBench author credits and upstreaming goal: https://github.com/meta-pytorch/BackendBench
Correctness and performance subsets: https://github.com/meta-pytorch/BackendBench/issues/108
Mark Saroufim’s GPU MODE connection: https://github.com/msaroufim
GPU MODE logo: official organization avatar, https://avatars.githubusercontent.com/u/154984337?v=4 (https://github.com/gpu-mode). Logo identifies Saroufim’s community connection, not sole project ownership.

--

## Related Work

<div class="work-timeline compact-timeline" role="list" aria-label="GPU kernel benchmarks from 2025 to 2026">
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2025</p>
      <h3>KernelBench</h3>
      <p class="timeline-placeholder">Correct + fast</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Apr 2025</p>
      <h3>ComputeEval</h3>
      <p class="timeline-placeholder">CUDA correctness</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">2025</p>
      <h3>BackendBench</h3>
      <p class="timeline-placeholder">PyTorch operators</p>
    </div>
  </article>
  <article class="timeline-entry timeline-active" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Jan 2026</p>
      <h3>FlashInfer-Bench</h3>
      <p class="timeline-placeholder">Inference workloads</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2026</p>
      <h3>CUDABench</h3>
      <p class="timeline-placeholder">Roofline scoring</p>
    </div>
  </article>
</div>
<div class="related-detail-stack">
<div class="flashinfer-detail">
  <h3><img class="plain flashinfer-logo" src="assets/logos/flashinfer-bench.png" alt="FlashInfer-Bench"></h3>
  <p>Benchmarks <strong>inference kernels from real LLM serving systems</strong>, including vLLM and SGLang.</p>
  <p><strong>SOL-ExecBench extends its FlashInfer Trace schema:</strong> a <strong>definition</strong> of the operation and tensors, a PyTorch <strong>reference</strong>, and <strong>workloads</strong> with concrete input sizes.</p>
  <p>It also reuses <strong>26 FlashInfer-Bench inference primitives</strong> and adds broader model coverage, training workloads, and quantized operations.</p>
</div>
</div>
<p class="timeline-caption">Publication / announcement dates · spacing not to scale</p>

Notes:
Scope: the five benchmarks listed in the Related Work section of SOL-Exec Bench.md, including its FlashInfer-Bench TODO. Each benchmark has its own vertical slide beneath the introduction.
KernelBench: first arXiv submission, February 14, 2025. https://arxiv.org/abs/2502.10517
ComputeEval: NVIDIA announcement, April 16, 2025. https://developer.nvidia.com/blog/announcing-computeeval-an-open-source-framework-for-evaluating-llms-on-cuda/
BackendBench: repository citation gives 2025. Only the year is specified here; its placement within 2025 is schematic, not an assertion of an exact release month. https://github.com/meta-pytorch/BackendBench
FlashInfer-Bench: first arXiv submission, January 1, 2026. https://arxiv.org/abs/2601.00227
CUDABench: first submission listed by arXiv is February 13, 2026, despite the 2603 identifier. https://arxiv.org/abs/2603.02236

FlashInfer-Bench content and the 26 reused inference primitives: Paper/2603.19173v1.pdf, Section 2.1. Extended FlashInfer Trace schema and the definition / reference / workloads components: Section 3.3. Companion notes: SOL-Exec Bench.md, Problem Specification Format.
FlashInfer-Bench project and original unmodified logo: https://github.com/flashinfer-ai/flashinfer-bench ; https://raw.githubusercontent.com/flashinfer-ai/flashinfer-bench/main/docs/logo/fib-white-bg.png

--

## Related Work

<div class="work-timeline compact-timeline" role="list" aria-label="GPU kernel benchmarks from 2025 to 2026">
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2025</p>
      <h3>KernelBench</h3>
      <p class="timeline-placeholder">Correct + fast</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Apr 2025</p>
      <h3>ComputeEval</h3>
      <p class="timeline-placeholder">CUDA correctness</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">2025</p>
      <h3>BackendBench</h3>
      <p class="timeline-placeholder">PyTorch operators</p>
    </div>
  </article>
  <article class="timeline-entry" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Jan 2026</p>
      <h3>FlashInfer-Bench</h3>
      <p class="timeline-placeholder">Inference workloads</p>
    </div>
  </article>
  <article class="timeline-entry timeline-active" role="listitem">
    <div class="timeline-copy">
      <p class="timeline-date">Feb 2026</p>
      <h3>CUDABench</h3>
      <p class="timeline-placeholder">Roofline scoring</p>
    </div>
  </article>
</div>
<div class="related-detail-stack">
<div class="cudabench-detail">
  <h3>CUDABench</h3>
  <p>Tests whether LLMs can turn <strong>text descriptions into CUDA programs</strong>, across 500 tasks in AI and other computing domains.</p>
  <p>Introduced a <strong>roofline-based Performance-Score before SOL-ExecBench</strong>, evaluating speed against hardware limits.</p>
  <p>The roofline model uses <strong>compute throughput and memory bandwidth</strong> to estimate how fast a kernel could run.</p>
  <p><strong>Connection to SOL-ExecBench:</strong> both use hardware limits to assess performance. SOL-ExecBench focuses on deep-learning workloads extracted from models.</p>
</div>
</div>
<p class="timeline-caption">Publication / announcement dates · spacing not to scale</p>

Notes:
Scope: the five benchmarks listed in the Related Work section of SOL-Exec Bench.md, including its FlashInfer-Bench TODO. Each benchmark has its own vertical slide beneath the introduction.
KernelBench: first arXiv submission, February 14, 2025. https://arxiv.org/abs/2502.10517
ComputeEval: NVIDIA announcement, April 16, 2025. https://developer.nvidia.com/blog/announcing-computeeval-an-open-source-framework-for-evaluating-llms-on-cuda/
BackendBench: repository citation gives 2025. Only the year is specified here; its placement within 2025 is schematic, not an assertion of an exact release month. https://github.com/meta-pytorch/BackendBench
FlashInfer-Bench: first arXiv submission, January 1, 2026. https://arxiv.org/abs/2601.00227
CUDABench: first submission listed by arXiv is February 13, 2026, despite the 2603 identifier. https://arxiv.org/abs/2603.02236

CUDABench: Paper/2603.19173v1.pdf, Section 2.1, describes 500 tasks across six domains and a roofline-based Performance-Score. Section 2.2 explains the compute-throughput and memory-bandwidth basis of roofline analysis.
Primary CUDABench source: https://arxiv.org/abs/2603.02236 (submitted February 13, 2026). SOL-ExecBench v1 is dated March 19, 2026. This supports “before SOL-ExecBench”; neither source establishes an unrestricted “first ever” priority claim for roofline-based benchmark scoring.

---

## Speed of Light Metric

### Roofline analysis · 2009

- How fast could a kernel run on this hardware?
- Roofline bounds performance using **peak compute throughput** and **memory bandwidth**.
- It tells us whether a kernel is limited by **doing the math** or **moving the data**.

<div class="sol-equation">
$$T_{\mathrm{SOL}} = \max\left(\frac{\text{FLOPs}}{\text{Compute throughput}},\;\frac{\text{Bytes moved}}{\text{Memory bandwidth}}\right)$$
</div>
<p class="sol-takeaway">The slower of compute and data movement sets the ideal runtime bound.</p>

Notes:
Samuel Williams, Andrew Waterman, and David Patterson, “Roofline: An Insightful Visual Performance Model for Multicore Architectures,” Communications of the ACM, 2009. https://doi.org/10.1145/1498765.1498785
Source: Paper/2603.19173v1.pdf, Sections 2.2 and 4.2, Equation 1. Companion notes: SOL-Exec Bench.md, Speed of Light Metric and SOL Analyzer.
The original Roofline formulation is a performance upper bound: P <= min(P_peak, bandwidth × arithmetic intensity), where arithmetic intensity is FLOPs per byte transferred at the modeled memory level. The slide uses the equivalent ideal runtime lower-bound form used by SOL-ExecBench.
This is an analytical lower bound, not a guaranteed achievable runtime. The basic form assumes ideal overlap of compute and memory transfer, and excludes additional execution overheads. Bytes moved must reflect the relevant memory traffic; estimating them too optimistically makes the runtime bound too low.

--

## Speed of Light Metric

### Orojenesis · 2024

- **On-chip memory is limited.** A kernel cannot keep every tensor close to the compute units for reuse.
- Orojenesis estimates the **minimum data movement** needed for a tensor computation at a given **buffer capacity**.
- This tightens the bound when a simple Roofline estimate assumes too much reuse and predicts performance that is too optimistic.

<p class="sol-takeaway">How much data must move depends on how much data can stay on chip.</p>

Notes:
Qijing Huang, Po-An Tsai, Joel S. Emer, and Angshuman Parashar, “Mind the Gap: Attainable Data Movement and Operational Intensity Bounds for Tensor Algorithms,” ISCA 2024.
Primary sources: https://people.csail.mit.edu/emer/media/papers/2024.06.isca.orojenesis.pdf and https://timeloop.csail.mit.edu/orojenesis
Also Paper/2603.19173v1.pdf, Sections 2.2 and 4.2; SOL-Exec Bench.md, Speed of Light Metric and SOL Analyzer.
Orojenesis models reuse subject to buffer capacity and can include fused tensor operations. It relates buffer size to a lower bound on transfers to and from the next memory level.
The limitation concerns overly optimistic data-movement estimates, such as counting only compulsory input and output transfers. Roofline itself can use more accurate traffic estimates. A tighter data-movement lower bound raises the modeled minimum runtime and lowers the corresponding performance ceiling when memory is limiting.

--

## Speed of Light Metric

### SOLAR · 2026

- **SOL Analysis for Runtime** automates bound estimation from PyTorch reference code and target hardware specifications.
- It traces the computation, converts operators into a common tensor representation, and estimates **compute work and memory traffic**.
- It combines Roofline analysis with fusion modeling and supports **Orojenesis** to account for limited on-chip memory.

<p class="sol-takeaway">SOL-ExecBench uses these hardware-based runtime bounds to measure optimization headroom.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Sections 2.2 and 4.2. The March 2026 paper expands SOLAR as “SOL Analysis for Runtime” and describes Graph Extractor, Agentic Einsum Converter, and SOL Analyzer stages. Orojenesis support tightens memory bounds based on on-chip buffer capacity.
Companion notes: SOL-Exec Bench.md, Speed of Light Metric and SOL Bound Derivation.
The separate SOLAR paper linked in the notes was first submitted June 24, 2026: https://arxiv.org/abs/2606.26383v1 . The slide follows the pipeline in the supplied SOL-ExecBench v1, not the later revised SOLAR architecture.
SOLAR's bounds estimate theoretical minimum runtime. SOL-ExecBench then combines the SOL runtime with a defined scoring baseline in its SOL Score. Deriving a bound and defining that score are separate steps.

---

## Benchmark Construction

1. **Application-grounded problems:** Use current and emerging model architectures so **operator types, tensor shapes, and data types** reflect production workloads today and in the near future.
2. **Exercise the latest hardware features:** Choose problems and metric targets that encourage hardware-specific optimizations, such as **NVFP4 on Blackwell’s fifth-generation Tensor Cores**.
3. **Post-training lifecycle:** Cover **fine-tuning, RLHF, and inference serving**, including both forward and backward passes.

Notes:
Source: Paper/2603.19173v1.pdf, Section 3, Benchmark Construction (page 4). Companion notes: SOL-Exec Bench.md, Benchmark construction.
The paper presents these as the three design principles of SOL-ExecBench. It includes reduced-precision workloads (FP8 and NVFP4) as part of its post-training coverage. RLHF means reinforcement learning from human feedback.

---

<!-- .slide: class="extraction-slide" -->
## Extraction Process

<p class="process-intro">From model source code to standalone benchmark problems</p>
<div class="extraction-flow" role="list" aria-label="Four-stage extraction pipeline">
  <div class="extraction-step fragment" role="listitem" data-fragment-index="0">
    <span class="process-number">1</span>
    <h3>Model<br>preparation</h3>
    <p>Load the architecture, source code, and constants.</p>
    <p class="process-example">Hidden size, attention heads, data types</p>
    <p class="process-output">124 source models</p>
  </div>
  <div class="extraction-step fragment" role="listitem" data-fragment-index="1">
    <span class="process-number">2</span>
    <h3>Subgraph<br>extraction</h3>
    <p>An LLM finds important computations and writes standalone PyTorch code.</p>
    <p class="process-example">Constants are included in each implementation.</p>
    <p class="process-output">7,400 subgraphs</p>
  </div>
  <div class="extraction-step fragment" role="listitem" data-fragment-index="2">
    <span class="process-number">3</span>
    <h3>Curation<br>and sampling</h3>
    <p>Group subgraphs by their properties, then select a balanced subset.</p>
    <p class="process-example">Operation, model domain, precision, forward/backward</p>
    <p class="process-output">Candidate problems</p>
  </div>
  <div class="extraction-step fragment" role="listitem" data-fragment-index="3">
    <span class="process-number">4</span>
    <h3>Validation</h3>
    <p>Review the problem, test its outputs, and look for loopholes.</p>
    <p class="process-example">Remove problems that fail any check.</p>
    <p class="process-output">235 public problems</p>
  </div>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 3.2 and Figure 1; SOL-Exec Bench.md, Extraction pipeline.
The paper extracts 7,400 subgraphs from 124 models. It characterizes them across 11 dimensions, including operation type, model domain, precision, compute intensity, and forward/backward split. Stratified sampling targets balanced coverage, a single-kernel/multi-kernel mix, and dedicated quantization slots.
An LLM-based driver generator turns selected subgraphs into benchmark problems. Curation is separate from extraction, so the pool can be resampled without repeating extraction.
Validation yields 245 problems: 235 publicly released and 10 reserved for a competition. The diagram shows the public output, not the total surviving validation.
Diagram elements and labels are editable HTML and CSS. Arrows indicate processing order, not equal processing time.

--

<!-- .slide: class="validation-slide" -->
## Extraction Process

### Validation: three checks

<div class="validation-flow" role="list" aria-label="Three validation checks">
  <div class="validation-step fragment" role="listitem" data-fragment-index="0">
    <span class="process-number">1</span>
    <div><h3>Human + LLM review</h3><p>Is the problem well-formed? Does it capture the intended subgraph and have a correct reference implementation?</p></div>
  </div>
  <div class="validation-step fragment" role="listitem" data-fragment-index="1">
    <span class="process-number">2</span>
    <div><h3>Execution-based checking</h3><p>Verify numerical correctness across all workloads. Set tolerances using repeated reference runs.</p></div>
  </div>
  <div class="validation-step fragment" role="listitem" data-fragment-index="2">
    <span class="process-number">3</span>
    <div><h3>Agentic kernel optimizer</h3><p>Try optimizing every candidate problem to expose loopholes that let an agent game the evaluation.</p></div>
  </div>
</div>
<div class="validation-outcomes fragment" data-fragment-index="3">
  <p class="validation-reject"><strong>Fail any check</strong><br>Remove the problem</p>
  <p class="validation-accept"><strong>Pass all checks</strong><br>245 validated: 235 public + 10 reserved</p>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 3.2, pages 5–6; SOL-Exec Bench.md, Extraction pipeline, Validation.
The paper describes three validation components; the human/LLM review itself can involve multiple rounds. The diagram presents their logical order, not a claim that each occurs exactly once.
The optimizer can uncover ambiguities in problem specifications that permit apparent speedups without genuine kernel improvements. Problems failing checks or susceptible to this specification gaming are pruned.
Passing these checks is the benchmark's acceptance criterion, not a proof that no loopholes remain. The final validated set is 245, with 235 public and 10 reserved for a forthcoming competition in this paper version.

---

## Problem Specification Format

SOL-ExecBench extends the **machine-readable FlashInfer Trace schema** used by FlashInfer-Bench.

1. **Definition:** Describes the problem name, operation type, input/output shapes and data types, and which dimensions can vary.
2. **Reference:** A self-contained **PyTorch implementation** that defines the expected computation and outputs.
3. **Workloads:** Assign **concrete values** to dynamic dimensions, such as batch size and sequence length, to create test cases.

<div class="spec-example fragment">
  <p><strong>Example workload</strong> <span>(illustrative)</span></p>
  <p>Input shape: <code>[batch, sequence, hidden]</code></p>
  <p>Set batch = 4, sequence = 128, hidden = 4096.</p>
  <p>Concrete shape: <code>[4, 128, 4096]</code></p>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 3.3, Problem Specification Format. Companion notes: SOL-Exec Bench.md, Problem Specification Format.
FlashInfer-Bench: https://arxiv.org/abs/2601.00227 . The schema is called FlashInfer Trace; SOL-ExecBench follows an extended version.
Definition includes typed symbolic axes (const, var, expr), input/output shapes and dtypes, and a reference implementation. The reference exposes a top-level run() function. Problems needing structured inputs can additionally define get_inputs().
Workloads supply concrete axis values for multiple dynamically shaped instances. These dimensions are specified by each workload, rather than left as implicit assumptions.
The displayed shape and numeric values are illustrative, not a specific benchmark problem. Here hidden = 4096 can be a fixed model constant while batch and sequence vary between workloads.

---

<!-- .slide: class="dataset-slide" -->
## Dataset

<p class="dataset-intro">Four categories cover individual operations, fused blocks, and inference workloads.</p>
<table class="dataset-table" aria-label="SOL-ExecBench problem categories, precisions, and examples">
  <colgroup><col class="dataset-category"><col class="dataset-scope"><col class="dataset-precision"><col class="dataset-examples"></colgroup>
  <thead><tr><th>Category</th><th>What it tests</th><th>Precisions</th><th>Examples</th></tr></thead>
  <tbody>
    <tr class="fragment">
      <th scope="row">L1</th>
      <td><strong>Single operations</strong><br>Building blocks from real models</td>
      <td>BF16 / FP32</td>
      <td>GQA, RMSNorm,<br>SwiGLU, RoPE</td>
    </tr>
    <tr class="fragment">
      <th scope="row">L2</th>
      <td><strong>Fused operations</strong><br>Complete computation blocks</td>
      <td>BF16 / FP32</td>
      <td>Decoder layers, MoE dispatch,<br>SSM chunk scan, cross-attention</td>
    </tr>
    <tr class="fragment">
      <th scope="row">Quant</th>
      <td><strong>Low-precision compute</strong><br>Kernels from quantized models</td>
      <td>FP8 / NVFP4</td>
      <td>FP8 MLA projection,<br>NVFP4 MoE expert,<br>FP8 MoE gate</td>
    </tr>
    <tr class="fragment">
      <th scope="row">FIB</th>
      <td><strong>Inference primitives</strong><br>From FlashInfer-Bench</td>
      <td>BF16 / FP8</td>
      <td>Fused attention,<br>FP8 MoE, RMSNorm</td>
    </tr>
  </tbody>
</table>

Notes:
Source: Paper/2603.19173v1.pdf, Table 2, page 6. Companion notes: SOL-Exec Bench.md, Dataset and evaluation.
This slide preserves Table 2's category-level precisions and all listed examples, while simplifying descriptions and omitting problem counts, proportions, complexity ratios, and scaling statistics.
L1 comprises single-operation kernels from real models. L2 comprises multi-operation fused kernels representing complete computational blocks. Quant explicitly uses low-precision compute extracted from quantized models. FIB contains standalone inference primitives from Llama-3.1-8B, Qwen3-30B-A3B, and DeepSeek-V3/R1.
Abbreviations: GQA = grouped-query attention; RMSNorm = root mean square normalization; SwiGLU = Swish-gated linear unit; RoPE = rotary positional embeddings; MoE = mixture of experts; SSM = state-space model; MLA = multi-head latent attention; FIB = FlashInfer-Bench.
Precisions are the category summary in Table 2, not an exhaustive list of every tensor dtype or accumulation precision in the dataset.

---

<!-- .slide: class="sol-derivation-slide" data-auto-animate data-auto-animate-id="sol-derivation" data-auto-animate-duration="0.6" -->
## SOL Bound Derivation

<div class="sol-pipeline" data-id="sol-pipeline" role="group" aria-label="PyTorch reference through Graph Extractor, Agentic Einsum Converter, and SOL Analyzer to SOL runtime bound">
  <div class="sol-endpoint" data-id="sol-input">PyTorch<br>reference</div>
  <div class="sol-block sol-active" data-id="sol-extractor"><strong>Graph Extractor</strong><span>Operator graph</span></div>
  <div class="sol-block" data-id="sol-converter"><strong>Agentic Einsum<br>Converter</strong><span>Einsum graph</span></div>
  <div class="sol-block" data-id="sol-analyzer"><strong>SOL Analyzer</strong><span>Hardware specs + graph</span></div>
  <div class="sol-endpoint" data-id="sol-output">SOL runtime<br>bound</div>
</div>
<div class="sol-stage-content">
  <h3>1. Graph Extractor</h3>
  <p>Trace the PyTorch model to record <strong>data flow, operator types, and intermediate tensor shapes</strong>.</p>
  <p>The result is an operator graph showing what runs and how tensors move between operations.</p>
  <div class="trace-example">
    <p class="trace-label">Illustrative computation: <code>Y = X @ W + R</code></p>
    <div class="trace-flow" aria-label="X and W feed Matmul, then Add combines the result with R to produce Y">
      <span>X, W</span><b aria-hidden="true">→</b><strong>Matmul</strong><b aria-hidden="true">→</b><strong>Add (+ R)</strong><b aria-hidden="true">→</b><span>Y</span>
    </div>
    <p class="trace-shapes">X, R, Y: [B, S, H] &nbsp; &nbsp; W: [H, H]</p>
  </div>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.2 and Figures 3–4; SOL-Exec Bench.md, SOL Bound Derivation.
This follows the three-stage SOLAR pipeline in the supplied March 2026 SOL-ExecBench v1. The same diagram persists across vertical slides and highlights the stage currently being explained.
The extractor uses torchview forward hooks to capture tensor metadata along the executed PyTorch path. The small matmul-plus-residual diagram is an illustrative example, not a reported benchmark result. B is batch size, S is sequence length, and H is hidden size. X @ W and R both have shape [B,S,H].

--

<!-- .slide: class="sol-derivation-slide" data-auto-animate data-auto-animate-id="sol-derivation" data-auto-animate-duration="0.6" -->
## SOL Bound Derivation

<div class="sol-pipeline" data-id="sol-pipeline" role="group" aria-label="PyTorch reference through Graph Extractor, Agentic Einsum Converter, and SOL Analyzer to SOL runtime bound">
  <div class="sol-endpoint" data-id="sol-input">PyTorch<br>reference</div>
  <div class="sol-block" data-id="sol-extractor"><strong>Graph Extractor</strong><span>Operator graph</span></div>
  <div class="sol-block sol-active" data-id="sol-converter"><strong>Agentic Einsum<br>Converter</strong><span>Einsum graph</span></div>
  <div class="sol-block" data-id="sol-analyzer"><strong>SOL Analyzer</strong><span>Hardware specs + graph</span></div>
  <div class="sol-endpoint" data-id="sol-output">SOL runtime<br>bound</div>
</div>
<div class="sol-stage-content">
  <h3>2. Agentic Einsum Converter</h3>
  <p>Translate operators into <strong>extended einsum</strong>: a shared index-based notation that exposes iteration spaces and compute patterns for counting FLOPs and memory traffic.</p>
  <div class="einsum-lookup" role="group" aria-label="Conversion lookup and validation">
    <div><strong>Known operator</strong><p>Reuse its validated conversion from the persistent lookup table.</p></div>
    <div><strong>Unseen operator</strong><p>LLM generates a conversion → emulate it → compare outputs with PyTorch.</p></div>
  </div>
  <p class="conversion-result"><strong>Match:</strong> save the conversion for reuse. <strong>Mismatch:</strong> revise and test again.</p>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.2 and Figures 3–4; SOL-Exec Bench.md, SOL Bound Derivation.
This follows the three-stage SOLAR pipeline in the supplied March 2026 SOL-ExecBench v1. The same diagram persists across vertical slides and highlights the stage currently being explained.
The extended einsum representation unifies tensor algebra, exposing iteration spaces and compute patterns. The persistent lookup table maps PyTorch operators to validated conversion functions. New candidates are emulated and compared against original PyTorch outputs, with self-correction before lookup-table insertion.

--

<!-- .slide: class="sol-derivation-slide" data-auto-animate data-auto-animate-id="sol-derivation" data-auto-animate-duration="0.6" -->
## SOL Bound Derivation

<div class="sol-pipeline" data-id="sol-pipeline" role="group" aria-label="PyTorch reference through Graph Extractor, Agentic Einsum Converter, and SOL Analyzer to SOL runtime bound">
  <div class="sol-endpoint" data-id="sol-input">PyTorch<br>reference</div>
  <div class="sol-block" data-id="sol-extractor"><strong>Graph Extractor</strong><span>Operator graph</span></div>
  <div class="sol-block" data-id="sol-converter"><strong>Agentic Einsum<br>Converter</strong><span>Einsum graph</span></div>
  <div class="sol-block sol-active" data-id="sol-analyzer"><strong>SOL Analyzer</strong><span>Hardware specs + graph</span></div>
  <div class="sol-endpoint" data-id="sol-output">SOL runtime<br>bound</div>
</div>
<div class="sol-stage-content">
  <h3>3. SOL Analyzer</h3>
  <p>Combine the <strong>einsum graph</strong> with <strong>target hardware specifications</strong>, using compute throughput and memory bandwidth at the target frequency.</p>
  <div class="sol-bound-formula">$$T_{\mathrm{SOL}} = \max\left(\frac{\text{Total FLOPs}}{\text{Compute throughput}},\;\frac{\text{Total fused bytes}}{\text{Memory bandwidth}}\right)$$</div>
  <p>Account for <strong>graph-level fusion and prefetch optimizations</strong>.</p>
  <p><strong>Orojenesis support:</strong> tighten the memory bound using on-chip buffer capacity, since not all tensor data can stay on chip for reuse.</p>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.2 and Figures 3–4; SOL-Exec Bench.md, SOL Bound Derivation.
This follows the three-stage SOLAR pipeline in the supplied March 2026 SOL-ExecBench v1. The same diagram persists across vertical slides and highlights the stage currently being explained.
Equation 1 from the supplied paper uses Total Fused Bytes in the roofline runtime bound. The analyzer models graph-level fusion and prefetching and supports Orojenesis capacity-aware bounds. A bound is a theoretical lower bound under modeling assumptions, not a guarantee that a generated kernel can attain it. This slide derives T_SOL, not the final SOL Score, which also depends on a scoring baseline.

---

<!-- .slide: class="score-slide" -->
## SOL Score

### Three runtimes

<table class="score-symbols">
  <tbody>
    <tr><th>$T_b$</th><td>Runtime of the <strong>scoring baseline</strong></td></tr>
    <tr><th>$T_{\mathrm{SOL}}$</th><td>Minimum runtime <strong>estimated by SOLAR</strong></td></tr>
    <tr><th>$T_K$</th><td><strong>Measured runtime</strong> of the candidate kernel</td></tr>
  </tbody>
</table>
<div class="score-assumptions fragment">
  <p><strong>Assumptions:</strong> $T_b > T_{\mathrm{SOL}}$ and $T_K \geq T_{\mathrm{SOL}}$.</p>
  <p>If either fails, flag the result for <strong>bound review and reward-hacking inspection</strong>.</p>
</div>
<p class="score-footnote fragment">As the baseline reaches SOL, the paper treats the problem as solved and stops evaluating new submissions.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.3, pages 9–10. Companion notes: SOL-Exec Bench.md, SOL Score.
The scoring baseline is distinct from the public PyTorch reference. A violated assumption is an audit signal, not proof of cheating.
The paper states that as Tb approaches TSOL it considers the problem solved. It does not provide a numerical closeness threshold here. At exact equality, the baseline-to-SOL gap is zero and the normal scoring formula is undefined. Do not silently score an invalid case.

--

<!-- .slide: class="score-slide" -->
## SOL Score

### The formula

<div class="score-main-equation">
$$S(T_K)=\frac{1}{1+\frac{T_K-T_{\mathrm{SOL}}}{T_b-T_{\mathrm{SOL}}}}$$
</div>
<div class="fragment">
  <p class="score-gap">Baseline headroom: $H=T_b-T_{\mathrm{SOL}}$</p>
  <p class="score-gap">Remaining gap: $R=T_K-T_{\mathrm{SOL}}$</p>
  <div class="score-main-equation">$$S(T_K)=\frac{H}{R+H}=\frac{T_b-T_{\mathrm{SOL}}}{(T_K-T_{\mathrm{SOL}})+(T_b-T_{\mathrm{SOL}})}$$</div>
  <p class="score-footnote">A smaller remaining gap gives a higher score, on a common 0–1 scale.</p>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.3, Equations 2–3.
H and R are explanatory aliases for the paper's baseline headroom and remaining candidate gap. Under the stated assumptions, H > 0 and R >= 0, so finite valid runtime gives 0 < S <= 1. Zero is the limiting value as runtime tends to infinity; incorrect kernels receive zero after correctness weighting.
The score is not literally the percentage of headroom reclaimed. If f = (Tb − TK)/(Tb − TSOL), then S = 1/(2 − f). For example, closing half the gap gives S = 2/3, not 0.5.

--

<!-- .slide: class="score-slide score-graph-slide" -->
## SOL Score

<p class="score-graph-intro">Figure 5 example: $T_{\mathrm{SOL}}=50$, $T_b=100$ <span>(common runtime units)</span></p>
<div id="sol-score-chart" class="sol-score-chart"></div>
<div class="score-controls">
  <label for="candidate-runtime">Candidate runtime $T_K$</label>
  <input id="candidate-runtime" type="range" min="50" max="400" step="1" value="100">
  <output id="candidate-runtime-output" for="candidate-runtime">100</output>
  <button type="button" data-score-runtime="50">At SOL</button>
  <button type="button" data-score-runtime="75">Near SOL</button>
  <button type="button" data-score-runtime="100">Baseline</button>
  <button type="button" data-score-runtime="200">Slower</button>
</div>
<div class="score-live-summary" aria-live="polite"><strong id="candidate-score-output">S = 0.500</strong><span id="candidate-score-description">Matches the baseline</span></div>
<div class="score-scale" aria-label="Score ranges: below 0.5 slower than baseline, 0.5 baseline, above 0.5 faster, 1 reaches SOL">
  <span class="score-scale-marker" id="score-scale-marker"></span>
</div>
<div class="score-scale-labels"><span>0 · approaches zero</span><span>0.5 · baseline</span><span>1 · reaches SOL</span></div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.3 and Figure 5. This graph reconstructs the published formula using the same TSOL = 50 and Tb = 100. Units were unspecified in Figure 5, so the chart uses common runtime units rather than inventing measured microseconds.
For these example values, S(TK) = 50/TK on the valid domain TK >= 50. The graph starts at TSOL and extends to 400; the curve continues towards zero for larger runtimes and never becomes zero at any finite valid runtime.
The shaded bands and the scale below the graph show S < 0.5 (slower), 0.5 < S < 1 (faster but short of SOL), and the endpoints S = 0.5 and S = 1. Move the slider or use the presets to demonstrate candidate positions. These are calculated examples, not experimental results.

--

<!-- .slide: class="score-slide" -->
## SOL Score

### Why the curve is nonlinear

<p>With $T_{\mathrm{SOL}}=50$ and $T_b=100$, the same runtime reduction gives a larger score gain closer to SOL.</p>
<table class="score-comparison">
  <thead><tr><th>Runtime improvement</th><th>Score change</th><th>Score gain</th></tr></thead>
  <tbody>
    <tr class="fragment"><td>100 → 75</td><td>0.500 → 0.667</td><td>+0.167</td></tr>
    <tr class="fragment"><td>75 → 50</td><td>0.667 → 1.000</td><td>+0.333</td></tr>
  </tbody>
</table>
<p class="score-takeaway fragment">Both save 25 runtime units. The second closes the final gap to SOL.</p>
<p class="score-footnote fragment">A score is <strong>not a percentage of headroom reclaimed</strong>: closing half the gap gives a score of 0.667.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Figure 5 and Section 4.3. Values here are illustrative calculations from the formula, rounded to three decimals.
At TK=100,75,50 the scores are 1/2,2/3,1. The gains are exactly 1/6 and 1/3. The slope magnitude is H/(R+H)^2, so equal runtime reductions produce larger score gains as the remaining gap R gets smaller.
The half-gap example is TK=75 with baseline100 and SOL50: the candidate removes25 of50 possible runtime units, while the nonlinear score is 2/3.

--

<!-- .slide: class="score-slide" -->
## SOL Score

### Equal speedup, different headroom

<p>Both candidates run in <strong>50</strong> units against a baseline of <strong>100</strong>: the same <strong>2× speedup</strong>.</p>
<table class="score-comparison">
  <thead><tr><th>Illustrative problem</th><th>SOLAR bound</th><th>Gap left</th><th>SOL Score</th></tr></thead>
  <tbody>
    <tr class="fragment"><td>A</td><td>40</td><td>10</td><td><strong>0.857</strong></td></tr>
    <tr class="fragment"><td>B</td><td>10</td><td>40</td><td><strong>0.692</strong></td></tr>
  </tbody>
</table>
<p class="score-takeaway fragment">The SOL Score distinguishes how much of each problem’s baseline-to-hardware gap remains.</p>
<p class="score-footnote">Its usefulness depends on the quality of the SOL bound and the chosen scoring baseline.</p>

Notes:
Conceptual basis: Paper/2603.19173v1.pdf, Sections 4.3 and 5.2. These are invented numerical examples illustrating the formula, not reported benchmark measurements.
Problem A: H=100−40=60, R=50−40=10, S=60/70≈0.857. Problem B: H=100−10=90, R=50−10=40, S=90/130≈0.692. Both have Tb/TK=2.
This explains why hardware-aware evaluation can be more informative than speedup alone for estimating remaining optimization opportunity. It does not claim that the SOL Score replaces correctness or every other performance metric.

--

<!-- .slide: class="score-slide" -->
## SOL Score

### Correctness first, then average

<p>$C_j=1$ if the kernel passes validation. Otherwise, $C_j=0$ and it earns <strong>zero credit</strong>.</p>
<div class="score-main-equation">$$\bar{S}=\frac{1}{N}\sum_{j=1}^{N}C_jS_j$$</div>
<table class="score-comparison">
  <thead><tr><th>Illustrative problem</th><th>Valid?</th><th>Runtime score</th><th>Credit</th></tr></thead>
  <tbody>
    <tr class="fragment"><td>A</td><td>Yes</td><td>0.8</td><td>0.8</td></tr>
    <tr class="fragment"><td>B</td><td>No</td><td>0.9</td><td><strong>0</strong></td></tr>
    <tr class="fragment"><td>C</td><td>Yes</td><td>0.7</td><td>0.7</td></tr>
  </tbody>
</table>
<p class="score-takeaway fragment">Suite score: $(0.8+0+0.7)/3=0.5$. Every problem stays in the denominator.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.3, Equation 4. The benchmark uses the arithmetic mean of correctness-weighted problem scores.
The table is an illustrative calculation, not reported benchmark data. The incorrect kernel's hypothetical runtime score demonstrates that speed does not earn performance credit when validation fails. All N problems count in the denominator, including failed problems.

---

<!-- .slide: class="evaluation-slide" -->
## Evaluation Framework

<div class="evaluation-reference">
  <p><strong>PyTorch reference:</strong> defines the intended behavior and checks correctness. It prioritizes portability, readability, and coverage.</p>
  <p><strong>Scoring baseline $T_b$:</strong> a separate runtime used for scoring, held internally in this paper version.</p>
</div>

- **Timing:** CUDA events, **10 warm-up + 50 timed iterations** per trial, across **3 trials**. Report the mean across trials.
- **Fresh execution:** Clear L2 by zeroing a **256 MB device buffer** and clone tensor arguments to use fresh inputs and addresses.
- **Stable hardware:** Lock the **B200 GPU clock at 1500 MHz (1.5 GHz)** for more reproducible measurements.

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.4, Evaluation Framework; SOL-Exec Bench.md, Evaluation framework.
The PyTorch reference defines intended semantics and supports correctness validation. It is primarily a functional specification, not a strong performance baseline. The scoring baseline is separate and internal in the supplied paper version; this is not a claim about the current public release.
The paper specifies CUDA-event timing with 10 warm-up iterations and 50 timed iterations per trial over three trials, reporting mean runtime across trials. The harness clears L2 by zeroing a 256 MB device buffer and clones tensor arguments to avoid reusing inputs and memory addresses. B200 GPU clock frequency is locked at 1500 MHz.

---

<!-- .slide: class="reward-slide" -->
## Reward Hacking and Mitigation

### Concurrency: hiding work from the timer

<p class="reward-intro">The computation runs, but the timer misses some of the work.</p>
<table class="reward-table">
  <colgroup><col style="width:22%"><col style="width:39%"><col style="width:39%"></colgroup>
  <thead><tr><th>Tactic</th><th>What goes wrong</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr class="fragment"><th scope="row">Thread injection</th><td>Background Python threads do work outside the timed call.</td><td>Monitor thread counts to detect unexpected workers.</td></tr>
    <tr class="fragment"><th scope="row">Stream injection</th><td>Other CUDA streams run work without proper synchronization.</td><td>Restrict stream usage and add synchronization checks.</td></tr>
    <tr class="fragment"><th scope="row">JIT forking</th><td><code>torch.jit.fork</code> creates parallel work the timer misses.</td><td>Use static analysis to flag suspicious execution patterns.</td></tr>
  </tbody>
</table>
<p class="reward-takeaway">Measure all the work needed to produce the answer.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.4.1 and Table 3; SOL-Exec Bench.md, Reward hacking and mitigation.
Concurrency exploits move work outside the evaluator's intended timing scope. The paper pairs thread injection with thread-count monitoring, stream injection with disabling multi-stream usage, and JIT forking with LLM-judge static analysis. It also describes injected torch.cuda.synchronize calls to expose hidden asynchronous work.
These are evaluator defenses, not a claim that legitimate asynchronous execution is inherently incorrect or that any one defense guarantees detection.

--

<!-- .slide: class="reward-slide" -->
## Reward Hacking and Mitigation

### State caching: taking shortcuts across calls

<p class="reward-intro">Every timed call should compute the answer for its current inputs.</p>
<table class="reward-table">
  <colgroup><col style="width:22%"><col style="width:39%"><col style="width:39%"></colgroup>
  <thead><tr><th>Tactic</th><th>What goes wrong</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr class="fragment"><th scope="row">Cached outputs</th><td>Return earlier results using <code>data_ptr</code> as a cache key.</td><td>Clone inputs, vary addresses, and inspect caching patterns.</td></tr>
    <tr class="fragment"><th scope="row">Lazy evaluation</th><td>Delay computation until the correctness checker reads the result.</td><td>Require fully materialized, plain PyTorch tensors.</td></tr>
    <tr class="fragment"><th scope="row">One-time correctness</th><td>Compute correctly once, then skip the work on later calls.</td><td>Repeat correctness checks with randomized inputs.</td></tr>
  </tbody>
</table>
<p class="reward-takeaway">A fast call only counts if it still performs the requested computation.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.4.1 and Table 3; SOL-Exec Bench.md, Reward hacking and mitigation.
The paper describes output caches keyed by tensor data_ptr, deferred computation via tensor-like outputs, and submissions that stop computing after an initial correctness check. Defenses include input cloning and address variation, static inspection, strict type(t) is torch.Tensor checks that reject subclasses, fully materialized outputs, and multiple correctness trials with randomized inputs.
This slide summarizes the defenses without asserting a particular allocator implementation.

--

<!-- .slide: class="reward-slide" -->
## Reward Hacking and Mitigation

### Environment manipulation

<p class="reward-intro">Changing the measurement code or quietly relaxing the computation.</p>
<table class="reward-table">
  <colgroup><col style="width:22%"><col style="width:39%"><col style="width:39%"></colgroup>
  <thead><tr><th>Tactic</th><th>What goes wrong</th><th>Mitigation</th></tr></thead>
  <tbody>
    <tr class="fragment"><th scope="row">Monkey patching</th><td>Replace timing functions to report artificially low runtimes.</td><td>Verify critical function addresses before and after execution.</td></tr>
    <tr class="fragment"><th scope="row">Precision downgrade</th><td>Compute in FP16, then cast to FP32 to hide lost accuracy.</td><td>Use tight numerical tolerances to catch inaccurate results.</td></tr>
  </tbody>
</table>
<p class="reward-takeaway">Lower precision is allowed when required input/output types and tight accuracy tolerances are preserved.</p>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.4.1 and Table 3.
Monkey patching includes overriding do_bench or Event.elapsed_time. The evaluator checks the memory addresses of critical timing functions before and after execution to detect replacement.
Precision downgrade refers to computing an FP32 problem in FP16 and upcasting the result. The paper explicitly permits downcasting when input and output data types match the specification and tight numerical tolerances are met. Lower-precision computation itself is therefore not automatically reward hacking; the concern is exploiting loose validation to hide unacceptable accuracy loss.

---

<!-- .slide: class="baseline-slide" -->
## Building the Scoring Baseline

<p class="baseline-intro">Each problem has an <strong>agent-optimized baseline</strong>, separate from its public PyTorch reference. The baseline kernels are <strong>not released</strong> in this paper version.</p>
<div class="baseline-flow">
  <div class="baseline-step fragment"><span class="baseline-number">1</span><div><h3>Optimize independently</h3><p>Multiple agents start from the PyTorch reference, with fixed time and cost budgets.</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">2</span><div><h3>Evaluate every candidate</h3><p>Compile, check correctness, measure runtime, and check for reward hacking.</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">3</span><div><h3>Share and improve</h3><p>Valid candidates pass to the next round of agents as starting points for further optimization.</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">4</span><div><h3>Select the fastest valid kernel</h3><p>After all rounds, choose the best across all agents and rounds. Its runtime becomes $T_b$.</p></div></div>
</div>

Notes:
Source: Paper/2603.19173v1.pdf, Section 4.5, Scoring Baseline.
The unreleased scoring baseline is distinct from the public reference program. Multiple agents independently optimize under fixed time and cost budgets, and valid solutions are exposed to subsequent cohorts. Candidates must compile, pass correctness verification, and satisfy reward-hacking checks; their performance is measured in the evaluation sandbox. The fastest valid candidate across all agents and rounds becomes the problem's baseline.
The statement about release status refers to this supplied paper version. The public reference specifies the computation; the optimized baseline supplies the runtime anchor Tb for scoring.

---

<!-- .slide: class="experiment-slide experiment-setup" -->
## Experiments

### Setup and scope

- **Hardware:** DGX B200 nodes with 8 GPUs; each GPU has 192 GB HBM3e and 8 TB/s memory bandwidth.
- **Execution:** One GPU per run, with SM clocks locked at 1,500 MHz.
- **Coverage:** Agent optimization across all 235 problems in L1, L2, Quant, and FlashInfer-Bench.
- **Questions:** Does speedup capture hardware efficiency? Do safeguards catch exploits? How much headroom remains?

<p class="experiment-takeaway">In these experiment plots, <strong>S = 0.5 means parity with the PyTorch reference</strong>. The resulting optimized solutions become the new scoring baselines.</p>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS1 and Sections 5.2–5.4; SOL-Exec Bench.md, Experiments / Setup.
The paper uses CUDA 13.1.1, cuDNN 9.17.1, PyTorch 2.9.0, and NVIDIA driver 580.95. A run uses one GPU, not all eight jointly. Timing follows the evaluation protocol already described in this deck.
Important distinction: Section 4.5 defines the optimized scoring baseline Tb, but Figures 6–10 assess the agent solutions relative to the PyTorch reference. Figure 10a explicitly labels 0.5 as parity with that reference, and Figure 10 calls the agent solution the new scoring baseline. Interpret this section as analysis of baseline construction, not a score of 0.732 against the optimized solutions themselves.

--

<!-- .slide: class="experiment-slide" -->
## Speedup and Remaining SOL Distance

<div class="experiment-split">
  <img class="plain experiment-plot" src="assets/plots/sol-fig6.svg" alt="Figure 6: workload speedup over PyTorch versus remaining distance from the hardware SOL bound, on logarithmic axes.">
  <div class="experiment-copy">
    <p><strong>Right:</strong> faster than PyTorch.<br><strong>Down:</strong> closer to the SOL bound.</p>
    <p>A kernel can be <strong>10× faster</strong> than PyTorch and still take <strong>over 10× the SOL runtime</strong>.</p>
    <p class="experiment-takeaway">Speedup alone hides remaining hardware headroom.</p>
  </div>
</div>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS2, Figure 6; SOL-Exec Bench.md, Experiments / SOL Score vs. Speedup.
Original figure: assets/plots/sol-fig6.svg, supplied in the repository. Each point is a workload. The x-axis is Tref/Tk; the y-axis is Tk/TSOL. The paper's prose reports log–log correlation r = 0.10, while the supplied figure labels r = 0.13. Both indicate a weak relationship; the visible takeaway avoids choosing between these inconsistent values. Points left of speedup = 1 are slower than the reference.

--

<!-- .slide: class="experiment-slide" -->
## SOL Score Across Both Axes

<div class="experiment-split">
  <img class="plain experiment-plot" src="assets/plots/sol-fig7.svg" alt="Figure 7: the same speedup and SOL-distance scatter, colored by SOL-score band with iso-score contours.">
  <div class="experiment-copy">
    <p>The same workloads are now colored by <strong>SOL score</strong>.</p>
    <p>Contours connect equal scores. At a fixed speedup, approaching SOL increases the score.</p>
    <p class="experiment-takeaway">Read speedup together with SOL distance.</p>
  </div>
</div>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS2, Figure 7; SOL-Exec Bench.md, Experiments / SOL Score vs. Speedup.
Original figure: assets/plots/sol-fig7.svg. The reference is the midpoint anchor for these experiment plots. High score does not by itself mean that Tk is close to TSOL: the supplied plot contains blue points far above SOL as well as near it. The paper's prose describes high scores as clustering lower-right and upper-right scores as intermediate; do not generalize that description to every point. Very large speedups can receive high scores while substantial absolute SOL distance remains.

--

<!-- .slide: class="experiment-slide" -->
## SOL Score and Reclaimed Headroom

<div class="experiment-split">
  <img class="plain experiment-plot" src="assets/plots/sol-fig8a.svg" alt="Figure 8a: SOL score closely follows the fraction of reference-to-SOL headroom reclaimed, with Pearson correlation about 0.98.">
  <div class="experiment-copy">
    <p><strong>Headroom reclaimed:</strong> the fraction of the reference-to-SOL runtime gap removed.</p>
    <p>Score tracks this fraction closely: <strong>r ≈ 0.98</strong>.</p>
    <p class="experiment-takeaway">Matching the reference gives S = 0.5; reaching SOL gives S = 1.</p>
  </div>
</div>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS2, Figure 8a; SOL-Exec Bench.md, Experiments / SOL Score vs. Speedup.
Original figure: assets/plots/sol-fig8a.svg. Headroom reclaimed is h = (Tref − Tk)/(Tref − TSOL). With Tref as the score anchor, algebra gives S = 1/(2 − h). This explains the curved relationship: S is a nonlinear transformation of reclaimed headroom, not independent empirical evidence of causation. S is at least 0.5 only when the solution matches or beats the reference; slower solutions can score below 0.5.
The supplied figure labels Pearson r = 0.980, while Section 5.2 states 0.981. The slide uses the consistent rounded value 0.98.

--

<!-- .slide: class="experiment-slide" -->
## The Same Speedup Can Close Different Gaps

<div class="experiment-split">
  <img class="plain experiment-plot" src="assets/plots/sol-fig8b.svg" alt="Figure 8b: speedup versus reclaimed headroom, colored by SOL score; at 3 times speedup, workloads span a broad range of headroom reclaimed.">
  <div class="experiment-copy">
    <p>At about <strong>3× speedup</strong>, reclaimed headroom ranges from <strong>below 20% to above 80%</strong>.</p>
    <p>The difference is how far the reference started from SOL.</p>
    <p class="experiment-takeaway">Equal speedups need not represent equal progress toward hardware limits.</p>
  </div>
</div>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS2, Figure 8b; SOL-Exec Bench.md, Experiments / SOL Score vs. Speedup.
Original figure: assets/plots/sol-fig8b.svg. Unlike Figures 6–7, speedup is on the y-axis; reclaimed headroom is on the x-axis. Read the horizontal spread at 3×. The paper reports correlation with reclaimed headroom of r = 0.81 for speedup versus approximately 0.98 for SOL score. Colors move from low score in red toward high score in green.

--

<!-- .slide: class="experiment-slide experiment-wide" -->
## Reward Hacking in Agent Submissions

<img class="plain experiment-plot" src="assets/plots/sol-fig9.svg" alt="Figure 9: detected exploit counts led by precision downgrade, 259; monkey patching, 134; stream injection, 100; and cached outputs, 67.">
<p class="experiment-takeaway"><strong>589 submissions (14.5%) were flagged and rejected.</strong><br>Runtime checks and static analysis are part of measuring optimization quality.</p>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS3, Figure 9; SOL-Exec Bench.md, Experiments / Mitigating Reward Hacking.
Original figure: assets/plots/sol-fig9.svg. Counts refer to agent submissions, not distinct benchmark problems. Precision downgrade is the most common detected exploit. As discussed earlier, lower precision is permitted when the required types and tight accuracy tolerances are preserved; the exploit is an unacceptable downgrade that evades validation.
The 14.5% figure is the detected and rejected share under the combined checks, not a measured detection recall or proof that every exploit was caught. The paper describes manual review before accepting a new scoring baseline.

--

<!-- .slide: class="experiment-slide experiment-wide" -->
## Agent Results Across Categories

<img class="plain experiment-plot" src="assets/plots/sol-fig10a.svg" alt="Figure 10a: SOL-score histograms and box plots for L1, L2, Quant, and FlashInfer-Bench; every category has a median above reference parity at 0.5.">
<p class="experiment-takeaway">Every category’s median exceeds <strong>reference parity (S = 0.5)</strong>.<br>Scores below 1 show that optimization headroom remains.</p>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS4, Figure 10a; SOL-Exec Bench.md, Experiments / Scoring Baseline.
Original figure: assets/plots/sol-fig10a.svg. These are workload distributions, and n in each panel is a workload count. The text reports an overall median of 0.732. The supplied figure labels category medians as L1 0.690, L2 0.761, Quant 0.757, and FI-Bench 0.812. Section 5.4 prose instead gives L1 0.688 and FI-Bench 0.789. The original figure is retained; the visible takeaway uses only the shared qualitative conclusion, rather than mixing inconsistent category statistics.
Here 0.5 denotes the PyTorch reference, not parity with the newly selected optimized baseline. A median above 0.5 does not mean every workload improves.

--

<!-- .slide: class="experiment-slide experiment-wide" -->
## Agent Solutions Move Closer to SOL

<img class="plain experiment-plot" src="assets/plots/sol-fig10b.svg" alt="Figure 10b: agent versus PyTorch-reference distance from SOL, with most workloads below the no-improvement diagonal and many still well above the SOL line.">
<p class="experiment-takeaway"><strong>Below the diagonal:</strong> closer to SOL than the reference.<br><strong>Above the bottom line:</strong> more optimization is still possible.</p>

Notes:
Sources: https://arxiv.org/html/2603.19173v1#S5.SS4, Figure 10b; SOL-Exec Bench.md, Experiments / Scoring Baseline.
Original figure: assets/plots/sol-fig10b.svg. The x-axis is Tref/TSOL; the y-axis is Tk/TSOL, both logarithmic. Most points below the diagonal indicate improvement over PyTorch; the horizontal line at y = 1 is the hardware SOL target. Some workloads remain far above this line despite substantial relative improvement.
This is evidence about the paper's GPU kernel experiments. It motivates the following LlamaSOL discussion but does not establish end-to-end inference gains in llama.cpp.

---

<!-- .slide: class="closing-slide" -->
<p class="closing-label">LlamaSOL · Open discussion</p>

## How do we extend this<br>to llama.cpp?

Notes:
Invite the audience to discuss how the SOL-ExecBench approach could apply to real kernels in llama.cpp, with evaluation focused on AI inference.

--

<!-- .slide: class="llamasol-direction" -->
## Extending to llama.cpp

### My thoughts

<div class="baseline-flow">
  <div class="baseline-step fragment"><span class="baseline-number">1</span><div><h3>Start from existing kernels and open baselines</h3><p>Use llama.cpp’s kernels and pin an upstream version for reproducibility. Keep the baseline implementation public.</p><p class="direction-extra">Stretch goal: a versioned, moving baseline that tracks upstream improvements.</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">2</span><div><h3>Rethink SOL for end-to-end inference</h3><p>Target the full inference path across backends and the hardware limits it encounters. How do we combine these bounds into one inference-level metric?</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">3</span><div><h3>Work out quantization support</h3><p>How should different quantization formats affect the computation model, hardware bounds, and accuracy requirements?</p></div></div>
</div>

Notes:
These are proposed LlamaSOL directions and open questions, not claims about capabilities already implemented in SOLAR or llama.cpp.
The proposed benchmark starts from existing llama.cpp kernels and publicly inspectable baseline implementations. Pinning the upstream revision makes a fixed baseline reproducible. A moving baseline is a stretch goal and would need explicit versioning so scores from different baseline revisions are not treated as directly comparable.
The metric goal is end-to-end inference rather than separate kernel-level scores, including execution across different backends and relevant hardware limits. How individual bounds, transfers, and execution dependencies should combine remains a design question.
Quantization support is unresolved; format-dependent computation, data movement, and acceptable accuracy need investigation.

--

<!-- .slide: class="llamasol-direction" -->
## Possible Next Steps

<div class="baseline-flow">
  <div class="baseline-step fragment"><span class="baseline-number">1</span><div><h3>Try one model on my GPU</h3><p>Check whether a small reproduction of the paper’s workflow is feasible with the hardware available.</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">2</span><div><h3>Build a small llama.cpp example</h3><p>Generate a problem specification and computation graph following the structure described in SOL-ExecBench.</p></div></div>
  <div class="baseline-step fragment"><span class="baseline-number">3</span><div><h3>Try connecting it to SOLAR</h3><p>Test what can be analyzed, identify missing conversions or hardware support, and inspect the resulting bounds.</p></div></div>
</div>
<p class="reward-takeaway fragment">First goal: understand feasibility on one small case.</p>

Notes:
Proposed exploratory work, not a commitment that the local GPU or llama.cpp graphs are currently supported by SOLAR.
Start with a single model and a narrowly scoped workload. Attempt the paper-style specification and graph extraction, then investigate how to adapt the graph to SOLAR's expected inputs. Record unsupported operators, quantization formats, and hardware assumptions before expanding the experiment.
