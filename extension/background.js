const NATIVE_HOST_NAME = 'com.gnuton.chrome2console';

// Icons
const ICON_CONNECTED = {
  16: 'icons/icon-green.png',
  48: 'icons/icon-green.png',
  128: 'icons/icon-green.png'
};
const ICON_DISCONNECTED = {
  16: 'icons/icon-red.png',
  48: 'icons/icon-red.png',
  128: 'icons/icon-red.png'
};

let blinkInterval = null;

/**
 * Starts the extension icon blinking effect.
 */
function startIconBlink() {
  if (blinkInterval) return;
  let isGreen = true;
  blinkInterval = setInterval(() => {
    const icon = isGreen ? ICON_DISCONNECTED : ICON_CONNECTED;
    chrome.action.setIcon({ path: icon });
    isGreen = !isGreen;
  }, 300);
}

/**
 * Stops the extension icon blinking effect.
 */
function stopIconBlink() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
    checkNativeHost(); // Restore correct icon state
  }
}

// Create context menu on installation

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'chrome2console-send',
    title: 'Send to Console',
    contexts: ['selection']
  });
  
  // Set up periodic check
  chrome.alarms.create('check-host', { periodInMinutes: 1 });
  checkNativeHost();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'chrome2console-send' && info.selectionText) {
    processSelection(info.selectionText, tab.id);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'run-send-to-console') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // We need to ask the content script for the selection because 
        // Chrome doesn't provide it automatically for commands.
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectionText' }, (response) => {
          if (response && response.text) {
            processSelection(response.text, tabs[0].id);
          }
        });
      }
    });
  }
});

/**
 * Checks if the native messaging host is available.
 */
function checkNativeHost() {
  chrome.runtime.sendNativeMessage(
    NATIVE_HOST_NAME,
    { type: 'ping' },
    (response) => {
      let status = 'disconnected';
      if (chrome.runtime.lastError) {
        console.warn('Native Host Check failed:', chrome.runtime.lastError.message);
      } else if (response && response.status === 'ok') {
        status = 'connected';
      }

      const icon = status === 'connected' ? ICON_CONNECTED : ICON_DISCONNECTED;
      chrome.action.setIcon({ path: icon });
      chrome.storage.local.set({ hostStatus: status });
    }
  );
}

// Check on startup and alarms
chrome.runtime.onStartup.addListener(checkNativeHost);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-host') {
    checkNativeHost();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkHost') {
    checkNativeHost();
    sendResponse({ started: true });
  } else if (request.action === 'processText') {
    processSelection(request.text, request.tabId);
    sendResponse({ started: true });
  }
});


/**
 * Sends text to the native host and handles the response.
 */
function processSelection(text, tabId) {
  console.log('Sending text to native host:', text);
  startIconBlink();

  // Get selected application from storage
  chrome.storage.local.get(['selectedApp', 'customCommand'], (data) => {
    const app = data.selectedApp || 'default';
    const customCmd = data.customCommand || '';

    chrome.runtime.sendNativeMessage(
      NATIVE_HOST_NAME,
      { 
        text: text,
        app: app,
        customCommand: app === 'custom' ? customCmd : ''
      },
      (response) => {
        stopIconBlink();
        if (chrome.runtime.lastError) {
          console.error('Native Messaging Error:', chrome.runtime.lastError.message);
          const errMsg = chrome.runtime.lastError.message;
          notifyContentScript(tabId, { error: errMsg });
          chrome.runtime.sendMessage({ action: 'processResult', error: errMsg });
          checkNativeHost();
          return;
        }

        if (response && response.result) {
          console.log('Received response from native host:', response.result);
          notifyContentScript(tabId, { result: response.result });
          // Notify popup if it's open
          chrome.runtime.sendMessage({ action: 'processResult', result: response.result });
        } else if (response && response.error) {
          console.error('Host Error:', response.error);
          notifyContentScript(tabId, { error: response.error });
          chrome.runtime.sendMessage({ action: 'processResult', error: response.error });
        }
      }
    );
  });
}


/**
 * Sends a message to the content script in a specific tab.
 */
function notifyContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message);
}

