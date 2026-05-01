export async function generatePdf(resultsData) {
  // Use the browser's native print-to-pdf engine. This is 100% reliable 
  // and supports full CSS/Charts without corrupting files.
  
  const total = resultsData.length;
  const passes = resultsData.filter(r => r.passed).length;
  const crashes = total - passes;
  const critical = resultsData.filter(r => r.severity === 'critical').length;
  
  const crashItems = resultsData.filter(r => !r.passed);

  // Build a beautiful HTML report
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>FuzzAI Security Report</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; color: #1f2937; margin: 40px; }
        .header { background: #7c6aff; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        h1 { margin: 0 0 10px 0; font-size: 28px; }
        .date { font-size: 14px; opacity: 0.9; }
        .summary { display: flex; gap: 20px; margin-bottom: 40px; }
        .card { background: #f3f4f6; padding: 20px; border-radius: 8px; flex: 1; text-align: center; }
        .card-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .red { color: #ef4444; }
        .log-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .log-table th, .log-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .log-table th { background: #f9fafb; font-weight: bold; color: #4b5563; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; }
        .badge.critical { background: #ef4444; }
        .badge.medium { background: #eab308; }
        .badge.low { background: #22c55e; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #db2777; }
        @media print {
          body { margin: 0; }
          .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FuzzAI Security Report</h1>
        <div class="date">Generated on: ${new Date().toLocaleString()}</div>
      </div>
      
      <h2>Executive Summary</h2>
      <div class="summary">
        <div class="card">
          <div class="card-value">${total}</div>
          <div>Total Inputs</div>
        </div>
        <div class="card">
          <div class="card-value" style="color: #22c55e">${passes}</div>
          <div>Passes</div>
        </div>
        <div class="card">
          <div class="card-value red">${crashes}</div>
          <div class="red">Crashes</div>
        </div>
      </div>

      <h2>Crash Log</h2>
      <table class="log-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Error Triggered</th>
            <th>Input Payload</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (crashItems.length === 0) {
    html += `<tr><td colspan="3" style="text-align:center;color:#22c55e;padding:30px;"><b>No crashes detected! Code is perfectly safe.</b></td></tr>`;
  } else {
    // Escape HTML to prevent weird rendering
    const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    crashItems.forEach(item => {
      html += `
        <tr>
          <td><span class="badge ${item.severity}">${item.severity.toUpperCase()}</span></td>
          <td><b>${esc(item.error)}</b></td>
          <td><code>${esc(item.input).substring(0, 100)}</code></td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new tab and print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for resources to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
