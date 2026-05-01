import { API_BASE, currentMode } from './main.js';

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function openModal(item) {
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div>
      <div class="modal-section-title">Input That Caused Crash</div>
      <div class="modal-code">${escHtml(String(item.input))}</div>
    </div>
    <div>
      <div class="modal-section-title">Error</div>
      <div class="modal-code" style="color:#fcd34d">${escHtml(item.error || 'Unknown error')}</div>
    </div>
    <div>
      <div class="modal-section-title">⚡ AI Explanation</div>
      <div class="modal-ai-explanation" id="modal-ai-text">
        <div class="ai-loading"><div class="spinner-ring"></div> Analyzing crash...</div>
      </div>
    </div>
    <div>
      <div class="modal-section-title">Severity</div>
      <span class="feed-badge ${item.severity || 'low'}" style="font-size:0.82rem;padding:0.25rem 0.75rem">
        ${item.severity === 'critical' ? '🔴 Critical'
          : item.severity === 'medium' ? '🟡 Medium'
          : '🟢 Low'}
      </span>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
  
  // Only fetch AI if user kept the toggle enabled
  if (document.getElementById('ai-toggle').checked) {
    fetchExplanation(item);
  } else {
    document.getElementById('modal-ai-text').innerHTML = `<em>AI Explain is disabled.</em>`;
  }
}

async function fetchExplanation(item) {
  const aiContainer = document.getElementById('modal-ai-text');
  const code = currentMode === 'api' 
    ? document.getElementById('api-url-input').value 
    : document.getElementById('code-input').value;
  
  try {
    const res = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        input: String(item.input),
        error_type: item.error_type || "UnknownError",
        error_msg: item.error || "No error message"
      })
    });
    
    const data = await res.json();
    
    // Quick Markdown parser for bold, inline code, and line breaks
    let html = escHtml(data.explanation)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:0.1rem 0.3rem;border-radius:4px;color:#a78bfa">$1</code>')
      .replace(/\n/g, '<br>');
      
    aiContainer.innerHTML = html;
    
  } catch (err) {
    aiContainer.innerHTML = `<span style="color:var(--red)">❌ Failed to fetch AI explanation: ${err.message}</span>`;
  }
}

export function initModal() {
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('open');
  });
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
}
