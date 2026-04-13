/**
 * popup.js
 * Logic for the status popup.
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const connectedView = document.getElementById('connected-view');
  const disconnectedView = document.getElementById('disconnected-view');
  const checkBtn = document.getElementById('check-btn');
  const copyBtn = document.getElementById('copy-btn');
  const setupCommand = document.getElementById('setup-command');

  /**
   * Updates the UI based on the host status.
   */
  function updateUI(status) {
    if (status === 'connected') {
      statusBadge.className = 'badge connected';
      statusText.textContent = 'Connected';
      connectedView.classList.remove('hidden');
      disconnectedView.classList.add('hidden');
    } else {
      statusBadge.className = 'badge disconnected';
      statusText.textContent = 'Disconnected';
      connectedView.classList.add('hidden');
      disconnectedView.classList.remove('hidden');
    }
  }

  /**
   * Requests a connectivity check from the background script.
   */
  async function checkConnectivity() {
    statusText.textContent = 'Checking...';
    
    // We send a message to background to trigger a check
    chrome.runtime.sendMessage({ action: 'checkHost' }, (response) => {
        // Background will update storage, so we just wait a bit or listen for changes
        // Alternatively, background can return the status directly in response
    });
    
    // Wait for storage update
    setTimeout(async () => {
        const data = await chrome.storage.local.get('hostStatus');
        updateUI(data.hostStatus || 'disconnected');
    }, 500);
  }

  /**
   * Copies setup command to clipboard.
   */
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(setupCommand.textContent);
    copyBtn.textContent = '✅';
    setTimeout(() => { copyBtn.textContent = '📋'; }, 2000);
  });

  checkBtn.addEventListener('click', checkConnectivity);

  // Initialize UI from storage
  chrome.storage.local.get('hostStatus', (data) => {
    updateUI(data.hostStatus || 'disconnected');
  });

  // Listen for storage changes to update UI in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.hostStatus) {
      updateUI(changes.hostStatus.newValue);
    }
  });

  // Initial check on open
  checkConnectivity();
});

// Since background needs to listen for 'checkHost' action
// I should ensure background script handles this message.
