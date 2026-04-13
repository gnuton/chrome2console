/**
 * popup.js
 * Logic for the status popup and application selection.
 */

document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const connectedView = document.getElementById('connected-view');
  const disconnectedView = document.getElementById('disconnected-view');
  const checkBtn = document.getElementById('check-btn');
  const copyBtn = document.getElementById('copy-btn');
  const setupCommand = document.getElementById('setup-command');
  
  const appSelect = document.getElementById('app-select');
  const customCommandContainer = document.getElementById('custom-command-container');
  const customCommandInput = document.getElementById('custom-command');
  
  const selectionActions = document.getElementById('selection-actions');
  const selectionPreview = document.getElementById('selection-text-preview');
  const runBtn = document.getElementById('run-btn');
  const btnLoader = document.getElementById('btn-loader');
  const btnText = document.getElementById('btn-text');

  const resultView = document.getElementById('result-view');
  const resultText = document.getElementById('result-text');
  const copyResultBtn = document.getElementById('copy-result-btn');
  const closeBtn = document.getElementById('close-btn');

  const fabToggle = document.getElementById('fab-toggle');

  let currentSelection = '';

  /**
   * Detects selection in the active tab and updates UI if found.
   */
  async function detectSelectionAndProcess() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.url.startsWith('chrome://')) return;

    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let text = '';
          const activeElement = document.activeElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            text = activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
          } else {
            text = window.getSelection().toString();
          }
          return text.trim();
        }
      });

      if (result && result.length > 0) {
        currentSelection = result;
        selectionPreview.textContent = result.length > 100 ? `${result.substring(0, 100)}...` : result;
        selectionActions.classList.remove('hidden');
        connectedView.classList.add('hidden');
        resultView.classList.add('hidden');
        
        // Auto-focus the run button for accessibility and speed
        setTimeout(() => runBtn.focus(), 100);
      } else {
        selectionActions.classList.add('hidden');
        if (chrome.storage.local.get('hostStatus', (data) => {
          if (data.hostStatus === 'connected') {
            connectedView.classList.remove('hidden');
          }
        }));
      }
    } catch (err) {
      console.warn('Could not detect selection:', err);
    }
  }

  /**
   * Triggers the process action.
   */
  async function triggerProcess() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !currentSelection) return;

    // Show loading state
    btnLoader.classList.remove('hidden');
    btnText.textContent = 'Processing...';
    runBtn.disabled = true;

    chrome.runtime.sendMessage({ 
      action: 'processText', 
      text: currentSelection,
      tabId: tab.id 
    });
  }

  /**
   * Displays the result in the popup.
   */
  function showResult(result, error) {
    btnLoader.classList.add('hidden');
    btnText.textContent = 'Send to Console';
    runBtn.disabled = false;
    
    selectionActions.classList.add('hidden');
    resultView.classList.remove('hidden');
    
    if (error) {
      resultText.textContent = `Error: ${error}`;
      resultText.style.color = '#ef4444';
    } else {
      resultText.textContent = result;
      resultText.style.color = '#6ee7b7';
    }
  }

  // Listen for results from background
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'processResult') {
      showResult(request.result, request.error);
    }
  });

  runBtn.addEventListener('click', triggerProcess);

  copyResultBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultText.textContent);
    copyResultBtn.textContent = 'Copied! ✅';
    setTimeout(() => { copyResultBtn.textContent = 'Copy Output'; }, 2000);
  });

  closeBtn.addEventListener('click', () => window.close());

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
    
    chrome.runtime.sendMessage({ action: 'checkHost' }, (response) => {
        // Background will update storage
    });
    
    // Wait for storage update
    setTimeout(async () => {
        const data = await chrome.storage.local.get('hostStatus');
        updateUI(data.hostStatus || 'disconnected');
    }, 800);
  }

  /**
   * Saves the selection to storage.
   */
  function saveSelection() {
    const selectedApp = appSelect.value;
    const customCommand = customCommandInput.value;
    
    chrome.storage.local.set({ 
      selectedApp: selectedApp,
      customCommand: customCommand
    });

    customCommandContainer.classList.toggle('hidden', selectedApp !== 'custom');
  }

  /**
   * Saves settings to storage.
   */
  function saveSettings() {
    chrome.storage.local.set({ 
      fabEnabled: fabToggle.checked
    });
  }

  /**
   * Loads the selection from storage.
   */
  function loadSelection() {
    chrome.storage.local.get(['selectedApp', 'customCommand'], (data) => {
      if (data.selectedApp) {
        appSelect.value = data.selectedApp;
      }
      if (data.customCommand) {
        customCommandInput.value = data.customCommand;
      }
      customCommandContainer.classList.toggle('hidden', appSelect.value !== 'custom');
      
      // Load FAB enabled status (defaults to true)
      fabToggle.checked = data.fabEnabled !== false;
    });
  }

  // Event Listeners
  appSelect.addEventListener('change', saveSelection);
  customCommandInput.addEventListener('input', saveSelection);
  fabToggle.addEventListener('change', saveSettings);

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(setupCommand.textContent);
    copyBtn.textContent = '✅';
    setTimeout(() => { copyBtn.textContent = '📋'; }, 2000);
  });

  checkBtn.addEventListener('click', checkConnectivity);

  // Initialize
  loadSelection();
  chrome.storage.local.get('hostStatus', (data) => {
    updateUI(data.hostStatus || 'disconnected');
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.hostStatus) {
      updateUI(changes.hostStatus.newValue);
    }
  });

  // Initial check on open
  checkConnectivity();
  detectSelectionAndProcess();
});
