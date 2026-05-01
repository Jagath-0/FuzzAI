// feed.js — Live Feed Module
import { openModal } from './modal.js';

export function clearFeed() {
  const container = document.getElementById('feed-container');
  container.innerHTML = `
    <div class="feed-empty">
      <div class="feed-empty-icon">⏳</div>
      <p>Fuzzing in progress…</p>
    </div>`;
}

export function initFeed() {
  const container = document.getElementById('feed-container');
  container.innerHTML = `
    <div class="feed-empty">
      <div class="feed-empty-icon">📭</div>
      <p>Run the fuzzer to see live results here</p>
    </div>`;
}

/**
 * Add a single result item to the live feed.
 * @param {object} item - { input, passed, error, severity, explanation }
 */
export function addFeedItem(item) {
  const container = document.getElementById('feed-container');
  const empty = container.querySelector('.feed-empty');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.className = `feed-item ${item.passed ? 'pass' : 'crash'}`;
  div.title = item.passed ? 'Passed' : 'Click to see crash details';

  const inputStr  = String(item.input);
  const truncated = inputStr.length > 48 ? inputStr.slice(0, 48) + '…' : inputStr;

  div.innerHTML = `
    <span class="feed-icon">${item.passed ? '✅' : '💥'}</span>
    <div class="feed-input">
      <strong>${item.passed ? 'PASS' : 'CRASH'}</strong>
      <span>${escHtml(truncated)}</span>
    </div>
    ${!item.passed && item.severity
      ? `<span class="feed-badge ${item.severity}">${
            item.severity === 'critical' ? '🔴 Critical'
          : item.severity === 'medium'   ? '🟡 Medium'
          :                                '🟢 Low'}</span>`
      : ''}
  `;

  if (!item.passed) {
    div.addEventListener('click', () => openModal(item));
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
