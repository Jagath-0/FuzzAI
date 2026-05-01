// FuzzAI — Main Application
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import { clearFeed, addFeedItem } from './feed.js';
import { showToast } from './toast.js';
import { openModal, initModal } from './modal.js';
import { generatePdf } from './pdf.js';

Chart.register(ArcElement, Tooltip, Legend, PieController);

export const API_BASE = 'http://localhost:8000';

// ─── State ────────────────────────────────────────
export let currentMode = 'code';
export let isRunning   = false;
export let resultsData = [];
let severityChart = null;

// ─── App Shell ────────────────────────────────────
document.querySelector('#app').innerHTML = `
  <div class="cyber-grid"></div>
  <div class="scanner-line"></div>
  <div class="bg-orb bg-orb-1"></div>
  <div class="bg-orb bg-orb-2"></div>
  
  <header class="header">
    <div class="header-left">
      <a class="logo" href="#">
        <div class="logo-icon">🔬</div>
        <span class="logo-text">FuzzAI</span>
      </a>
      <div class="mode-tabs">
        <button class="tab-btn active" id="tab-code" data-mode="code">⚡ Code Fuzzer</button>
        <button class="tab-btn" id="tab-api"  data-mode="api">🌐 API Fuzzer</button>
      </div>
    </div>
    <div class="header-right">
      <div class="status-pill" id="backend-status">
        <span class="dot dot--red"></span> Connecting…
      </div>
      <a class="header-link" href="http://localhost:8000/docs" target="_blank">API Docs ↗</a>
    </div>
  </header>

  <div class="app-layout">
    <!-- PAGE 1: CONFIG -->
    <div id="page-config" class="page-view active">
      <div class="panel-left">
        <div class="panel-header">
          <span class="panel-title" id="input-panel-title"><span>⚡</span> Python Function</span>
          <button id="btn-clear" style="cursor:pointer;border:none;background:transparent;font-size:0.78rem;color:var(--text-muted);">Clear</button>
        </div>
        <div class="url-input-wrap" id="url-input-wrap">
          <div class="url-label">Target API Endpoint</div>
          <input class="url-input" id="api-url-input" type="url"
            placeholder="https://api.example.com/endpoint"
            autocomplete="off" spellcheck="false" />
        </div>
        <div class="code-editor-wrap" id="code-editor-section">
          <div class="line-numbers" id="line-numbers"></div>
          <textarea class="code-editor" id="code-input"
            placeholder="# Paste your Python function here...&#10;# Example:&#10;def divide(a, b):&#10;    return a / b"
            spellcheck="false" autocomplete="off" autocorrect="off"></textarea>
        </div>
        <div class="options-row">
          <label class="fuzz-count-label" for="fuzz-count">Inputs:</label>
          <select class="fuzz-count-select" id="fuzz-count">
            <option value="25">25</option>
            <option value="50" selected>50</option>
            <option value="100">100</option>
          </select>
          <label class="fuzz-count-label" style="margin-left:0.5rem" for="ai-toggle">AI Explain:</label>
          <input type="checkbox" id="ai-toggle" checked style="accent-color:var(--accent);cursor:pointer;" />
          <button class="btn-run" id="btn-run" disabled>
            <span class="btn-run-label">▶ Run Fuzzer</span>
            <span class="spinner"><div class="spinner-ring"></div></span>
          </button>
        </div>
      </div>
    </div>

    <!-- PAGE 2: RESULTS -->
    <div id="page-results" class="page-view" style="display:none;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:-0.5rem; flex-shrink:0;">
        <h2 style="font-size:1.25rem;font-weight:600;"><span style="color:var(--accent-light);">⚡</span> Scan Results</h2>
        <button id="btn-back" style="padding:0.5rem 1rem;font-size:0.85rem;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-muted);border-radius:4px;cursor:pointer;transition:all 0.2s;">⬅ New Scan</button>
      </div>
      
      <div style="display:grid; grid-template-columns: 320px 280px 1fr; gap:1.5rem; flex:1; min-height:0;">
        
        <!-- COLUMN 1: Chart -->
        <div class="chart-panel" style="display:flex; flex-direction:column; overflow:hidden;">
          <div class="chart-panel-header">
            <span class="chart-panel-title">🎯 Severity Breakdown</span>
            <div class="severity-legend">
              <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div>Critical</div>
              <div class="legend-item"><div class="legend-dot" style="background:#eab308"></div>Medium</div>
              <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div>Low</div>
            </div>
          </div>
          <div style="flex:1; display:flex; align-items:center; justify-content:center; padding: 1rem;">
            <div style="position:relative; width:220px; height:220px; min-height:220px; min-width:220px;">
              <canvas id="severity-chart"></canvas>
            </div>
          </div>
        </div>
          
        <!-- COLUMN 2: Summary & Export -->
        <div class="action-panel" style="display:flex; flex-direction:column; justify-content:flex-start;">
          <div class="action-panel-title">📊 Summary</div>
          <div class="summary-box">
            <div class="summary-row"><span class="summary-key">Total Inputs</span><span class="summary-val" id="sum-total">—</span></div>
            <div class="summary-row"><span class="summary-key">Crashes</span><span class="summary-val" id="sum-crashes" style="color:var(--red)">—</span></div>
            <div class="summary-row"><span class="summary-key">Critical 🔴</span><span class="summary-val" id="sum-critical" style="color:var(--red)">—</span></div>
            <div class="summary-row"><span class="summary-key">Medium 🟡</span><span class="summary-val" id="sum-medium" style="color:var(--yellow)">—</span></div>
            <div class="summary-row"><span class="summary-key">Low 🟢</span><span class="summary-val" id="sum-low" style="color:var(--green)">—</span></div>
          </div>
          <div style="flex:1;"></div>
          <button class="btn-export primary" id="btn-pdf" disabled style="margin-top:1rem;">📄 Export PDF Report</button>
          <button class="btn-export" id="btn-json" disabled>⬇ Download JSON</button>
        </div>

        <!-- RIGHT COLUMN: Live Feed -->
        <div class="panel-right" style="width:100%; min-height:0;">
          <div class="panel-header">
            <span class="panel-title"><span>📡</span> Live Feed</span>
            <span style="font-size:0.72rem;color:var(--text-muted)" id="feed-label">Waiting for run…</span>
          </div>
          <div class="stats-bar">
            <div class="stat-chip total">
              <span class="stat-value" id="stat-total">0</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-chip passes">
              <span class="stat-value" id="stat-passes">0</span>
              <span class="stat-label">Passes ✅</span>
            </div>
            <div class="stat-chip crashes">
              <span class="stat-value" id="stat-crashes">0</span>
              <span class="stat-label">Crashes 💥</span>
            </div>
            <div class="stat-chip rate">
              <span class="stat-value" id="stat-rate">0%</span>
              <span class="stat-label">Crash Rate</span>
            </div>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
          </div>
          <div class="feed-container" id="feed-container">
            <div class="feed-empty">
              <div class="feed-empty-icon">📭</div>
              <p>Run the fuzzer to see live results here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">💥 Crash Details</div>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
    </div>
  </div>

  <!-- TOASTS -->
  <div class="toast-container" id="toast-container"></div>
`;

// ─── Line Numbers ──────────────────────────────────
const codeInput   = document.getElementById('code-input');
const lineNumbers = document.getElementById('line-numbers');

function updateLineNumbers() {
  const lines = codeInput.value.split('\n').length;
  lineNumbers.innerHTML = Array.from({ length: Math.max(lines, 12) }, (_, i) =>
    `<div class="line-num">${i + 1}</div>`
  ).join('');
}
codeInput.addEventListener('input', updateLineNumbers);
codeInput.addEventListener('scroll', () => { lineNumbers.scrollTop = codeInput.scrollTop; });
updateLineNumbers();

// ─── Mode Switching ────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if (mode === currentMode) return;
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isApi = mode === 'api';
    document.getElementById('url-input-wrap').classList.toggle('visible', isApi);
    document.getElementById('code-editor-section').style.display = isApi ? 'none' : 'flex';
    document.getElementById('input-panel-title').innerHTML =
      isApi ? '<span>🌐</span> API Endpoint' : '<span>⚡</span> Python Function';
    validateRunButton();
  });
});

// ─── Page Switching ────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'flex';
}
document.getElementById('btn-back').addEventListener('click', () => {
  setRunning(false); // Make sure fuzzer stops logically if it was running
  showPage('page-config');
});

// ─── Clear ─────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  codeInput.value = '';
  document.getElementById('api-url-input').value = '';
  updateLineNumbers();
  validateRunButton();
});

// ─── Validate → enable run ─────────────────────────
export function validateRunButton() {
  const btn = document.getElementById('btn-run');
  if (isRunning) { btn.disabled = true; return; }
  const hasInput = currentMode === 'code'
    ? codeInput.value.trim().length > 0
    : document.getElementById('api-url-input').value.trim().length > 0;
  btn.disabled = !hasInput;
}
codeInput.addEventListener('input', validateRunButton);
document.getElementById('api-url-input').addEventListener('input', validateRunButton);

// ─── Backend health ────────────────────────────────
async function checkBackend() {
  const pill = document.getElementById('backend-status');
  try {
    const res  = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.status === 'ok') {
      pill.innerHTML = `<span class="dot dot--green"></span> Backend live`;
      pill.classList.remove('offline');
      return true;
    }
  } catch { /* */ }
  pill.innerHTML = `<span class="dot dot--red"></span> Backend offline`;
  pill.classList.add('offline');
  return false;
}

// ─── Chart ─────────────────────────────────────────
function initChart() {
  const ctx = document.getElementById('severity-chart').getContext('2d');
  severityChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Critical 🔴', 'Medium 🟡', 'Low 🟢'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(234,179,8,0.85)', 'rgba(34,197,94,0.85)'],
        borderColor:     ['rgba(239,68,68,1)',    'rgba(234,179,8,1)',    'rgba(34,197,94,1)'],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      circumference: 360,
      rotation: 0,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2937',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f2ff',
          bodyColor: '#9ca3af',
          padding: 10,
          callbacks: { label: ctx => ` ${ctx.parsed} crashes` },
        },
      },
    },
  });
}

// ─── Dashboard update ──────────────────────────────
export function updateDashboard(results) {
  resultsData = results;
  const crashes  = results.filter(r => !r.passed);
  const passes   = results.filter(r =>  r.passed);
  const critical = crashes.filter(r => r.severity === 'critical').length;
  const medium   = crashes.filter(r => r.severity === 'medium').length;
  const low      = crashes.filter(r => r.severity === 'low').length;
  const rate     = results.length ? ((crashes.length / results.length) * 100).toFixed(1) : 0;

  document.getElementById('stat-total').textContent    = results.length;
  document.getElementById('stat-passes').textContent   = passes.length;
  document.getElementById('stat-crashes').textContent  = crashes.length;
  document.getElementById('stat-rate').textContent     = `${rate}%`;
  document.getElementById('sum-total').textContent     = results.length;
  document.getElementById('sum-crashes').textContent   = crashes.length;
  document.getElementById('sum-critical').textContent  = critical;
  document.getElementById('sum-medium').textContent    = medium;
  document.getElementById('sum-low').textContent       = low;

  severityChart.data.datasets[0].data = [critical, medium, low];
  severityChart.update();

  document.getElementById('btn-pdf').disabled  = crashes.length === 0;
  document.getElementById('btn-json').disabled = results.length === 0;
}

// ─── Progress bar ──────────────────────────────────
export function setProgress(pct) {
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

// ─── Run state ─────────────────────────────────────
export function setRunning(val) {
  isRunning = val;
  const btn = document.getElementById('btn-run');
  const grid = document.querySelector('.cyber-grid');
  btn.classList.toggle('running', val);
  btn.disabled = val;
  grid?.classList.toggle('grid-warp', val);
  if (!val) validateRunButton();
}

// ─── Exports ───────────────────────────────────────
document.getElementById('btn-json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'fuzzai-results.json' });
  a.click(); URL.revokeObjectURL(url);
  showToast('✅ JSON downloaded!', 'success');
});

document.getElementById('btn-pdf').addEventListener('click', async () => {
  const btn = document.getElementById('btn-pdf');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner" style="display:inline-block"><div class="spinner-ring"></div></span> Generating PDF...`;
  btn.disabled = true;
  
  try {
    await generatePdf(resultsData);
    showToast('📄 PDF exported successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to generate PDF', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ─── Fuzzing Logic ─────────────────────────────────
document.getElementById('btn-run').addEventListener('click', async () => {
  const isApi = currentMode === 'api';
  const code = codeInput.value.trim();
  const targetUrl = document.getElementById('api-url-input').value.trim();
  
  if (isApi && !targetUrl) return;
  if (!isApi && !code) return;
  
  const count = parseInt(document.getElementById('fuzz-count').value, 10);
  const aiExplain = document.getElementById('ai-toggle').checked;
  
  setRunning(true);
  clearFeed();
  setProgress(0);
  
  // Transition to results page
  showPage('page-results');
  
  // Clear previous results
  updateDashboard([]);
  const results = [];
  
  try {
    const endpoint = isApi ? '/fuzz-api-stream' : '/fuzz-code-stream';
    const bodyPayload = isApi 
      ? { target_url: targetUrl, inputs_count: count }
      : { code, inputs_count: count, ai_explain: aiExplain };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // keep the last incomplete chunk
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;
          
          try {
            const item = JSON.parse(dataStr);
            results.push(item);
            addFeedItem(item);
            
            // Progress bar
            const pct = ((item.id + 1) / count) * 100;
            setProgress(pct);
            
            // Live stats
            updateDashboard(results);
          } catch (e) {
            console.error("JSON parse error on stream chunk:", e);
          }
        }
      }
    }
    
    setProgress(100);
    showToast(`✅ Fuzzing complete: ${results.length} inputs tested.`, 'success');
    
  } catch (err) {
    showToast(`❌ Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    setRunning(false);
  }
});

// ─── Init ──────────────────────────────────────────
initChart();
initModal();
checkBackend();
setInterval(checkBackend, 10_000);

export { codeInput, openModal };
