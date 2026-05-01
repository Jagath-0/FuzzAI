// toast.js — Toast notification system
/**
 * Show a toast message.
 * @param {string} msg   - message text
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - ms before auto-dismiss
 */
export function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
