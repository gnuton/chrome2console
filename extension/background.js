/**
 * background.js
 * Service worker for Chrome2Console.
 */

const NATIVE_HOST_NAME = 'com.gnuton.chrome2console';

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'chrome2console-send',
    title: 'Send to Console',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'chrome2console-send' && info.selectionText) {
    processSelection(info.selectionText, tab.id);
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
