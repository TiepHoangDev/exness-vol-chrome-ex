// popup.js - Extension popup script
document.addEventListener('DOMContentLoaded', async () => {
  const errorHeader = document.getElementById('error-header');
  const errorCount = document.getElementById('error-count');
  const errorArrow = document.getElementById('error-arrow');
  const errorList = document.getElementById('error-list');
  const clearBtn = document.getElementById('clear-btn');
  
  // Settings elements
  const fontDecrease = document.getElementById('font-decrease');
  const fontIncrease = document.getElementById('font-increase');
  const fontValue = document.getElementById('font-value');
  const confirmToggle = document.getElementById('confirm-toggle');
  
  let isExpanded = false;
  
  // Load settings from active tab's localStorage
  async function loadSettings() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('my.exness.com/webtrading')) {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            fontSize: localStorage.getItem('exness.extention.fontSize') || '14',
            confirmEnabled: localStorage.getItem('exness.extention.confirmEnabled') !== 'false'
          })
        });
        if (result && result[0] && result[0].result) {
          fontValue.textContent = result[0].result.fontSize;
          confirmToggle.checked = result[0].result.confirmEnabled;
        }
      }
    } catch (e) {
      console.log('Could not load settings from tab');
    }
  }
  
  // Save setting to active tab's localStorage
  async function saveSetting(key, value) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('my.exness.com/webtrading')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (k, v) => localStorage.setItem(k, v),
          args: [key, String(value)]
        });
      }
    } catch (e) {
      console.log('Could not save setting to tab');
    }
  }
  
  // Font size controls
  fontDecrease.addEventListener('click', async () => {
    let size = parseInt(fontValue.textContent) || 14;
    if (size > 10) {
      size--;
      fontValue.textContent = size;
      await saveSetting('exness.extention.fontSize', size);
    }
  });
  
  fontIncrease.addEventListener('click', async () => {
    let size = parseInt(fontValue.textContent) || 14;
    if (size < 24) {
      size++;
      fontValue.textContent = size;
      await saveSetting('exness.extention.fontSize', size);
    }
  });
  
  // Confirm toggle
  confirmToggle.addEventListener('change', async () => {
    await saveSetting('exness.extention.confirmEnabled', confirmToggle.checked);
  });
  
  // Load errors from storage
  async function loadErrors() {
    const result = await chrome.storage.local.get(['exness_errors']);
    const errors = result.exness_errors || [];
    updateUI(errors);
  }
  
  // Load settings on popup open
  loadSettings();
  
  function updateUI(errors) {
    if (errors.length === 0) {
      errorHeader.classList.add('no-errors');
      errorHeader.classList.remove('has-errors');
      errorCount.textContent = '✓ No errors';
      errorCount.classList.add('no-errors');
      errorCount.classList.remove('has-errors');
      errorArrow.style.display = 'none';
      clearBtn.style.display = 'none';
      errorList.innerHTML = '';
    } else {
      errorHeader.classList.remove('no-errors');
      errorHeader.classList.add('has-errors');
      errorCount.textContent = `⚠ ${errors.length} error(s)`;
      errorCount.classList.remove('no-errors');
      errorCount.classList.add('has-errors');
      errorArrow.style.display = 'inline';
      clearBtn.style.display = 'block';
      
      // Render error list
      errorList.innerHTML = errors.map(err => `
        <div class="error-item">
          <div class="error-time">${formatTime(err.timestamp)}</div>
          <div class="error-message">${escapeHtml(err.message)}</div>
        </div>
      `).join('');
    }
  }
  
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Toggle error list
  errorHeader.addEventListener('click', () => {
    const result = chrome.storage.local.get(['exness_errors']);
    result.then(data => {
      const errors = data.exness_errors || [];
      if (errors.length === 0) return;
      
      isExpanded = !isExpanded;
      errorList.classList.toggle('expanded', isExpanded);
      errorArrow.classList.toggle('expanded', isExpanded);
    });
  });
  
  // Clear errors
  clearBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ exness_errors: [] });
    isExpanded = false;
    errorList.classList.remove('expanded');
    errorArrow.classList.remove('expanded');
    loadErrors();
  });
  
  // Initial load
  loadErrors();
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.exness_errors) {
      updateUI(changes.exness_errors.newValue || []);
    }
  });
});
