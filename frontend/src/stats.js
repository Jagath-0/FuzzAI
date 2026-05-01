// stats.js — Stats bar updater (thin wrapper, logic lives in main.js updateDashboard)
export function updateStats({ total, passes, crashes, rate }) {
  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-passes').textContent  = passes;
  document.getElementById('stat-crashes').textContent = crashes;
  document.getElementById('stat-rate').textContent    = `${rate}%`;
}
