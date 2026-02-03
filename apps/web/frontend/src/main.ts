import { appState } from "./stores/appState";
import { tauriApi } from "./api/tauri";
import { getTier } from "./license/hooks";

appState.init();

const el = document.getElementById("app");
if (el) {
  el.innerHTML = `
    <style>
      :root {
        --bg: #0b0f1a;
        --card: #121827;
        --muted: #8b93a7;
        --text: #e6e9f2;
        --accent: #4cc9f0;
        --accent-2: #7ae582;
        --danger: #ff6b6b;
        --border: #232a3d;
      }
      body {
        margin: 0;
        background: radial-gradient(1200px 600px at 20% -10%, #1b2340 0%, #0b0f1a 55%, #080b14 100%);
        color: var(--text);
        font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
      }
      .container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        position: sticky;
        top: 18px;
        z-index: 10;
        padding: 10px 14px;
        border-radius: 14px;
        background: rgba(12, 16, 26, 0.55);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,0.06);
        box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      }
      .brand {
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .nav {
        display: flex;
        gap: 18px;
        align-items: center;
      }
      .nav a, .nav button {
        color: var(--text);
        text-decoration: none;
        background: none;
        border: 1px solid transparent;
        padding: 8px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.16s ease-out, color 0.16s ease-out, border-color 0.16s ease-out;
      }
      .nav .primary {
        background: var(--accent);
        color: #0b0f1a;
        font-weight: 600;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .status-trigger {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(18,24,39,0.6);
        color: var(--text);
        cursor: pointer;
      }
      .status-trigger .dot {
        width: 8px;
        height: 8px;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 28px;
        margin-top: 28px;
        align-items: center;
      }
      .hero-card {
        background: linear-gradient(160deg, #131b2f, #0f1526);
        border: 1px solid var(--border);
        padding: 28px;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        animation: fadeUp 0.5s ease-out both;
      }
      .hero h1 {
        font-size: 44px;
        margin: 0 0 12px 0;
        letter-spacing: -0.5px;
      }
      .hero p {
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }
      .hero-actions {
        margin-top: 20px;
        display: flex;
        gap: 12px;
      }
      .hero-actions .btn {
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: #0f1526;
        color: var(--text);
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .hero-actions .btn.primary {
        background: var(--accent);
        color: #0b0f1a;
        font-weight: 600;
      }
      .pricing {
        margin-top: 48px;
      }
      .download-section {
        margin-top: 40px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .download-card {
        background: var(--card);
        border: 1px solid var(--border);
        padding: 18px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .download-card h3 {
        margin: 0 0 6px 0;
      }
      .download-card .btn {
        background: var(--accent);
        color: #0b0f1a;
        border: none;
        padding: 10px 14px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
      }
      .pricing h2 {
        margin: 0 0 6px 0;
      }
      .pricing p {
        color: var(--muted);
        margin: 0 0 20px 0;
      }
      .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .plan-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #1b2440;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        color: var(--accent);
        font-weight: 700;
      }
      .plan {
        background: var(--card);
        border: 1px solid var(--border);
        padding: 18px;
        border-radius: 14px;
        min-height: 260px;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }
      .plan:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        border-color: #2e3650;
      }
      .plan h3 {
        margin: 0 0 8px 0;
      }
      .plan ul {
        padding-left: 18px;
        margin: 10px 0 0 0;
        color: var(--muted);
      }
      .plan .tag {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        border: 1px solid var(--border);
        color: var(--muted);
      }
      .plan .badge {
        position: absolute;
        top: 14px;
        right: 14px;
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 11px;
        background: #1b2440;
        color: var(--accent);
      }
      .studio {
        margin-top: 44px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .studio-card {
        background: var(--card);
        border: 1px solid var(--border);
        padding: 18px;
        border-radius: 14px;
      }
      .studio-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .studio-actions button {
        background: #0f1526;
        border: 1px solid var(--border);
        color: var(--text);
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .studio-actions button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      }
      .status-panel {
        position: fixed;
        right: 18px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(18,24,39,0.72);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 14px 12px;
        width: 62px;
        transition: width 0.25s ease, box-shadow 0.25s ease;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        backdrop-filter: blur(16px);
      }
      .status-panel:hover {
        width: 260px;
      }
      .status-panel.open {
        width: 260px;
      }
      .status-panel .status-row {
        opacity: 0.9;
        transition: opacity 0.2s ease;
      }
      .status-panel:hover .status-row {
        opacity: 1;
      }
      .status-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 18px;
        background: linear-gradient(120deg, rgba(76,201,240,0.08), rgba(122,229,130,0.06));
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .status-panel:hover::after {
        opacity: 1;
      }
      .status-title {
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .status-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--danger);
        flex-shrink: 0;
      }
      .dot.ok {
        background: var(--accent-2);
      }
      .dot.pulse {
        animation: pulse 1.8s ease-in-out infinite;
      }
      .status-label {
        white-space: nowrap;
        color: var(--text);
        font-size: 14px;
      }
      .status-sub {
        color: var(--muted);
        font-size: 12px;
        margin-left: 20px;
      }
      .status-link {
        display: inline-block;
        margin-left: 20px;
        color: var(--accent);
        text-decoration: none;
        font-size: 12px;
      }
      .upgrade-banner {
        margin-top: 18px;
        padding: 12px 14px;
        border-radius: 12px;
        background: #141c2f;
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .upgrade-banner button {
        background: var(--accent);
        color: #0b0f1a;
        border: none;
        border-radius: 10px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: 600;
      }
      .billing {
        margin-top: 44px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 20px;
      }
      .billing form {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .billing input, .billing select {
        background: #0f1526;
        border: 1px solid var(--border);
        color: var(--text);
        padding: 10px 12px;
        border-radius: 10px;
      }
      .billing button {
        grid-column: 1 / -1;
        background: var(--accent);
        color: #0b0f1a;
        border: none;
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.15); opacity: 0.6; }
        100% { transform: scale(1); opacity: 0.9; }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 900px) {
        .hero {
          grid-template-columns: 1fr;
        }
        .pricing-grid {
          grid-template-columns: 1fr;
        }
        .download-section {
          grid-template-columns: 1fr;
        }
        .status-panel {
          display: none;
        }
        .billing form {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <div class="container">
      <header>
        <div class="brand">CONVERTIX</div>
        <nav class="nav">
          <a href="#studio">PDF Studio</a>
          <a href="#image-labs">Image Labs</a>
          <a href="#noteflow">NoteFlowLM</a>
          <a href="#pricing">Pricing</a>
          <a href="#docs">Docs</a>
        </nav>
        <div class="header-actions">
          <button id="clear-cache-btn">Clear Cache</button>
          <button class="status-trigger" id="status-trigger"><span class="dot ok"></span>Status</button>
          <button>Sign in</button>
          <button class="primary">Get started →</button>
        </div>
      </header>

      <section class="hero" id="download">
        <div class="hero-card">
          <h1>CONVERTIX Desktop</h1>
          <p>Professional, offline-first PDF and AI studios. Your documents never leave your machine.</p>
          <div class="hero-actions">
            <a class="btn primary" href="https://convertix.app/download/convertix-desktop.dmg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h10l2 4H5l2-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M6 8v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M12 11v5m0 0 2-2m-2 2-2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Download for macOS (Apple Silicon)
            </a>
            <a class="btn" href="https://convertix.app/download/convertix-desktop.msi">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16v6H4z" stroke="currentColor" stroke-width="1.6"/>
                <path d="M6 11v8h12v-8" stroke="currentColor" stroke-width="1.6"/>
                <path d="M12 13v4m0 0 2-2m-2 2-2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Download for Windows
            </a>
            <button class="btn">View Release Notes</button>
          </div>
        </div>
        <div class="hero-card">
          <h2>Start free. Upgrade when you need power.</h2>
          <p>Free for essentials, Pro for unlimited work, Premium for enterprise security and team scale.</p>
          <div class="studio-actions">
            <button class="btn">See Pricing</button>
            <button class="btn">Compare Plans</button>
          </div>
        </div>
      </section>

      <section class="download-section" aria-label="Desktop downloads">
        <div class="download-card">
          <div>
            <h3>Convertix Desktop Studio for macOS</h3>
            <p class="status-sub">Signed DMG installer for Apple Silicon & Intel.</p>
          </div>
          <a class="btn" href="https://convertix.app/download/convertix-desktop.dmg">Download .dmg</a>
        </div>
        <div class="download-card">
          <div>
            <h3>Convertix Desktop Studio for Windows</h3>
            <p class="status-sub">MSI installer for Windows 10/11.</p>
          </div>
          <a class="btn" href="https://convertix.app/download/convertix-desktop.msi">Download .msi</a>
        </div>
      </section>

      <section class="pricing" id="pricing">
        <h2>Pricing</h2>
        <p>Start free. Upgrade when you need power.</p>
        <div class="pricing-grid">
          <div class="plan">
            <div class="badge">Starter</div>
            <div class="plan-icon">F</div>
            <span class="tag">Free</span>
            <h3>Essentials</h3>
            <ul>
              <li>PDF Studio basic operations</li>
              <li>Image Labs deterministic offline features</li>
              <li>NoteFlowLM limited notebooks</li>
              <li>Monthly limits: Images 10, Videos 5, Slides 5, Mind maps 5, Other 5</li>
            </ul>
          </div>
          <div class="plan">
            <div class="badge">Most Popular</div>
            <div class="plan-icon">P</div>
            <span class="tag">Pro</span>
            <h3>Unlimited + Metered AI</h3>
            <ul>
              <li>Advanced PDF Studio (Adobe-like workflows)</li>
              <li>Full Image Labs + AI features</li>
              <li>NoteFlowLM Pro with higher context limits</li>
              <li>Unlimited generations with metered usage</li>
            </ul>
          </div>
          <div class="plan">
            <div class="badge">Enterprise</div>
            <div class="plan-icon">E</div>
            <span class="tag">Premium</span>
            <h3>Enterprise</h3>
            <ul>
              <li>Everything in Pro</li>
              <li>Enterprise security & compliance</li>
              <li>Team licensing & org-bound keys</li>
              <li>Priority AI routing + optional private LLM endpoints</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="billing" id="billing">
        <h3>Activate or Upgrade</h3>
        <p class="status-sub">Use your activation key after payment to unlock Pro or Premium.</p>
        <form id="activation-form">
          <input name="userId" placeholder="User ID" required />
          <input name="deviceId" placeholder="Device ID" required />
          <input name="activationKey" placeholder="Activation Key" required />
          <input name="authToken" placeholder="Auth Token (JWT)" required />
          <select name="plan">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <button type="submit">Activate License</button>
        </form>
        <div id="activation-status" class="status-sub"></div>
      </section>

      <section class="studio" id="studio">
        <div class="studio-card">
          <h3>PDF Studio Quick Actions</h3>
          <p class="status-sub">These actions call the local PDF Engine via Tauri IPC.</p>
          <p class="status-sub">PDF to Pages: <strong>macOS only</strong></p>
          <div class="status-sub" id="usage-indicator"></div>
          <div class="upgrade-banner" id="upgrade-banner">
            <div>
              <strong>Upgrade ready</strong>
              <div class="status-sub">Unlock advanced PDF, AI features, and unlimited generations.</div>
            </div>
            <button id="upgrade-btn">Upgrade</button>
          </div>
          <div class="studio-actions">
            <button id="merge-btn">Merge two PDFs</button>
            <button id="compress-btn">Compress PDF</button>
            <button id="split-btn">Split PDF (span)</button>
            <button id="rotate-btn">Rotate 90°</button>
            <button id="encrypt-btn">Encrypt PDF</button>
            <button id="metadata-btn">Read Metadata</button>
          </div>
          <div id="studio-status" class="status-sub"></div>
        </div>
      </section>
    </div>

    <aside class="status-panel" id="status-panel">
      <div class="status-title">System Health</div>
      <div class="status-row">
        <span class="dot pulse" id="api-dot"></span>
        <div>
          <div class="status-label">API Status</div>
          <div class="status-sub" id="api-text">Checking...</div>
        </div>
      </div>
      <div class="status-row">
        <span class="dot pulse" id="img-dot"></span>
        <div>
          <div class="status-label">Image Engine</div>
          <div class="status-sub" id="img-text">Checking...</div>
        </div>
      </div>
      <div class="status-row">
        <span class="dot ok" id="pdf-dot"></span>
        <div>
          <div class="status-label">PDF Engine</div>
          <div class="status-sub" id="pdf-text">Local</div>
        </div>
      </div>
      <div class="status-row">
        <span class="dot ok" id="tier-dot"></span>
        <div>
          <div class="status-label">Tier</div>
          <div class="status-sub" id="tier-text">Checking...</div>
        </div>
      </div>
      <div class="status-row">
        <span class="dot ok" id="usage-dot"></span>
        <div>
          <div class="status-label">Usage</div>
          <div class="status-sub" id="usage-text">Checking...</div>
          <a class="status-link" href="#studio">View usage</a>
        </div>
      </div>
    </aside>
  `;
}

const setStatus = (dotId: string, textId: string, ok: boolean, label: string) => {
  const dot = document.getElementById(dotId);
  const text = document.getElementById(textId);
  if (dot) {
    dot.classList.toggle("ok", ok);
  }
  if (text) {
    text.textContent = ok ? `${label} online` : `${label} offline`;
  }
};

const API_BASE = "http://localhost:5055";
const checkStatus = async () => {
  try {
    const apiRes = await fetch(`${API_BASE}/health`);
    setStatus("api-dot", "api-text", apiRes.ok, "API");
  } catch {
    setStatus("api-dot", "api-text", false, "API");
  }
  try {
    const imgRes = await fetch("http://localhost:7071/health");
    setStatus("img-dot", "img-text", imgRes.ok, "Image Engine");
  } catch {
    setStatus("img-dot", "img-text", false, "Image Engine");
  }
  const pdfText = document.getElementById("pdf-text");
  if (pdfText) pdfText.textContent = "Local";
};

const pickPdf = async () => tauriApi.openFileDialog();

const pdfActionStatus = (message: string) => {
  const el = document.getElementById("studio-status");
  if (el) el.textContent = message;
};

const pollJob = async (jobId: string) => {
  pdfActionStatus(`Job ${jobId} queued...`);
  for (let i = 0; i < 120; i += 1) {
    const raw = await tauriApi.pdfGetJobStatus(jobId);
    const status = JSON.parse(raw) as { state: string; progress: { percent: number } };
    pdfActionStatus(`Job ${jobId}: ${status.state} (${status.progress.percent}%)`);
    if (status.state === "Completed" || status.state === "Failed" || status.state === "Canceled") {
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
};

const wirePdfActions = () => {
  const mergeBtn = document.getElementById("merge-btn");
  const compressBtn = document.getElementById("compress-btn");
  const splitBtn = document.getElementById("split-btn");
  const rotateBtn = document.getElementById("rotate-btn");
  const encryptBtn = document.getElementById("encrypt-btn");
  const metadataBtn = document.getElementById("metadata-btn");

  mergeBtn?.addEventListener("click", async () => {
    const first = await pickPdf();
    const second = await pickPdf();
    if (!first || !second) return;
    const output = await tauriApi.saveFileDialog("merged.pdf");
    if (!output) return;
    const jobId = await tauriApi.pdfMerge([first, second], output);
    await pollJob(jobId);
  });

  compressBtn?.addEventListener("click", async () => {
    const input = await pickPdf();
    if (!input) return;
    const output = await tauriApi.saveFileDialog("compressed.pdf");
    if (!output) return;
    const jobId = await tauriApi.pdfCompress(input, output, "screen");
    await pollJob(jobId);
  });

  splitBtn?.addEventListener("click", async () => {
    const input = await pickPdf();
    if (!input) return;
    const outputDir = await tauriApi.saveFileDialog("split-output");
    if (!outputDir) return;
    const jobId = await tauriApi.pdfSplit(input, outputDir, "span", 1, undefined);
    await pollJob(jobId);
  });

  rotateBtn?.addEventListener("click", async () => {
    const input = await pickPdf();
    if (!input) return;
    const output = await tauriApi.saveFileDialog("rotated.pdf");
    if (!output) return;
    const jobId = await tauriApi.pdfRotate(input, output, null, 90);
    await pollJob(jobId);
  });

  encryptBtn?.addEventListener("click", async () => {
    const input = await pickPdf();
    if (!input) return;
    const output = await tauriApi.saveFileDialog("encrypted.pdf");
    if (!output) return;
    const jobId = await tauriApi.pdfEncrypt(input, output, null, "owner-password");
    await pollJob(jobId);
  });

  metadataBtn?.addEventListener("click", async () => {
    const input = await pickPdf();
    if (!input) return;
    const jobId = await tauriApi.pdfGetMetadata(input);
    await pollJob(jobId);
  });
};

const updateUsageIndicator = async () => {
  const el = document.getElementById("usage-indicator");
  const statusEl = document.getElementById("usage-text");
  if (!el) return;
  try {
    const usage = await tauriApi.getUsage();
    const data = JSON.parse(usage) as { buckets?: Record<string, { counts: Record<string, number> }> };
    const monthKey = Object.keys(data.buckets ?? {}).sort().pop();
    const counts = monthKey ? data.buckets?.[monthKey]?.counts : undefined;
    if (!counts) {
      el.textContent = "Usage: no data yet.";
      if (statusEl) statusEl.textContent = "No data yet";
      return;
    }
    el.textContent = `Usage this month — Images: ${counts.images ?? 0}, Videos: ${counts.videos ?? 0}, Slides: ${counts.slides ?? 0}, Mind maps: ${counts.mindmaps ?? 0}, Other: ${counts.other_generations ?? 0}`;
    if (statusEl) {
      statusEl.textContent = `Images ${counts.images ?? 0}, Videos ${counts.videos ?? 0}, Slides ${counts.slides ?? 0}`;
    }
  } catch {
    el.textContent = "Usage: unavailable";
    if (statusEl) statusEl.textContent = "Unavailable";
  }
};

const updateTierPrompt = async () => {
  const banner = document.getElementById("upgrade-banner");
  const button = document.getElementById("upgrade-btn");
  const tierEl = document.getElementById("tier-text");
  if (!banner || !button) return;
  try {
    const tier = await getTier();
    if (tierEl) tierEl.textContent = tier.toUpperCase();
    if (tier === "pro" || tier === "premium") {
      banner.style.display = "none";
      return;
    }
    banner.style.display = "flex";
    button.addEventListener("click", () => {
      const billing = document.getElementById("billing");
      billing?.scrollIntoView({ behavior: "smooth" });
    });
  } catch {
    banner.style.display = "flex";
  }
};

const loadPricing = async () => {
  const grid = document.querySelector(".pricing-grid");
  if (!grid) return;
  try {
    const [tiersRes, pricingRes] = await Promise.all([
      fetch(`${API_BASE}/api/billing/tiers`),
      fetch(`${API_BASE}/api/billing/pricing`)
    ]);
    if (!tiersRes.ok || !pricingRes.ok) return;
    const tiers = (await tiersRes.json()) as Array<{ tier: string; name: string; description: string }>;
    const pricing = (await pricingRes.json()) as Array<{ tier: string; priceMonthly: number; priceYearly: number; currency: string }>;
    const pricingMap = new Map(pricing.map((p) => [p.tier.toLowerCase(), p]));

    grid.innerHTML = tiers
      .map((tier) => {
        const price = pricingMap.get(tier.tier.toLowerCase());
        const priceLabel = price
          ? `${price.currency} ${price.priceMonthly}/mo`
          : "Custom pricing";
        const lines = tier.description.split("\\n").filter(Boolean);
        return `
          <div class="plan">
            <div class="badge">${tier.name}</div>
            <div class="plan-icon">${tier.tier[0].toUpperCase()}</div>
            <span class="tag">${tier.tier}</span>
            <h3>${tier.name}</h3>
            <p class="status-sub">${priceLabel}</p>
            <ul>
              ${lines.map((line) => `<li>${line}</li>`).join("")}
            </ul>
          </div>
        `;
      })
      .join("");
  } catch {
    // keep static fallback
  }
};

const wireActivationForm = () => {
  const form = document.getElementById("activation-form") as HTMLFormElement | null;
  const status = document.getElementById("activation-status");
  if (!form || !status) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const userId = String(data.get("userId") || "");
    const deviceId = String(data.get("deviceId") || "");
    const activationKey = String(data.get("activationKey") || "");
    const authToken = String(data.get("authToken") || "");
    const plan = String(data.get("plan") || "free");
    status.textContent = "Activating license...";
    try {
      const result = await tauriApi.activateLicense(userId, activationKey, deviceId, plan, authToken);
      const parsed = JSON.parse(result) as { tier: string };
      status.textContent = `Activated: ${parsed.tier.toUpperCase()}`;
      await updateTierPrompt();
    } catch {
      status.textContent = "Activation failed. Check key and auth token.";
    }
  });
};

const wireHeaderActions = () => {
  const clearBtn = document.getElementById("clear-cache-btn");
  const statusBtn = document.getElementById("status-trigger");
  const statusPanel = document.getElementById("status-panel");
  clearBtn?.addEventListener("click", async () => {
    await tauriApi.clearCache();
    await appState.refreshCache();
  });
  statusBtn?.addEventListener("click", () => {
    statusPanel?.classList.toggle("open");
  });
};

checkStatus();
setInterval(checkStatus, 10000);
wirePdfActions();
updateUsageIndicator();
updateTierPrompt();
loadPricing();
wireActivationForm();
wireHeaderActions();
