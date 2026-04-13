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
  }
});


/**
 * Sends text to the native host and handles the response.
 */
function processSelection(text, tabId) {
  console.log('Sending text to native host:', text);

  chrome.runtime.sendNativeMessage(
    NATIVE_HOST_NAME,
    { text: text },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Native Messaging Error:', chrome.runtime.lastError.message);
        notifyContentScript(tabId, { error: chrome.runtime.lastError.message });
        checkNativeHost(); // Update status on error
        return;
      }

      if (response && response.result) {
        console.log('Received response from native host:', response.result);
        notifyContentScript(tabId, { result: response.result });
      } else if (response && response.error) {
        console.error('Host Error:', response.error);
        notifyContentScript(tabId, { error: response.error });
      }
    }
  );
}

/**
 * Sends a message to the content script in a specific tab.
 */
function notifyContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message);
}

