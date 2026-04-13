/**
 * content.js
 * Content script for Chrome2Console.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.error) {
    alert(`Chrome2Console Error: ${request.error}`);
    return;
  }

  if (request.result) {
    replaceSelectedText(request.result);
  }

  if (request.action === 'getSelectionText') {
    const text = getSelectionText();
    sendResponse({ text: text });
  }
});

/**
 * Gets the currently selected text.
 */
function getSelectionText() {
  let text = '';
  const activeElement = document.activeElement;

  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    text = activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
  } else {
    text = window.getSelection().toString();
  }

  // Fallback for Google Docs or other canvas-based editors
  if (!text && (window.location.hostname.includes('docs.google.com'))) {
    // Note: This is an advanced fallback. For now, we'll just return what we have.
    // A better way would be to prompt the user or use a hidden clipboard trick.
  }

  return text.trim();
}

/**
 * Replaces the currently selected text in the DOM with newText.
 */
function replaceSelectedText(newText) {
  const activeElement = document.activeElement;

  // Check if we are in an input or textarea
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const text = activeElement.value;
    
    activeElement.value = text.slice(0, start) + newText + text.slice(end);
    
    // Restore cursor position/selection
    activeElement.selectionStart = activeElement.selectionEnd = start + newText.length;
    return;
  }

  // Standard DOM selection
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  
  const textNode = document.createTextNode(newText);
  range.insertNode(textNode);
  
  // Clean up selection
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(textNode);
  selection.addRange(newRange);
}

// --- Floating Action Button Implementation ---

let fabElement = null;

function createFAB() {
  if (fabElement) return;

  fabElement = document.createElement('div');
  fabElement.id = 'chrome2console-fab';
  fabElement.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/icon-green.png')}" alt="C2C" />
  `;

  // Styles
  Object.assign(fabElement.style, {
    position: 'absolute',
    width: '32px',
    height: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: '2147483647',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s',
    border: '2px solid #4caf50'
  });

  const img = fabElement.querySelector('img');
  Object.assign(img.style, {
    width: '20px',
    height: '20px'
  });

  fabElement.addEventListener('mouseover', () => {
    fabElement.style.transform = 'scale(1.1)';
  });

  fabElement.addEventListener('mouseout', () => {
    fabElement.style.transform = 'scale(1.0)';
  });

  fabElement.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent losing selection
    e.stopPropagation();
    const text = getSelectionText();
    if (text) {
      chrome.runtime.sendMessage({ action: 'processText', text: text });
      hideFAB();
    }
  });

  document.body.appendChild(fabElement);
}

function showFAB(rect) {
  if (!fabElement) createFAB();
  
  chrome.storage.local.get(['fabEnabled'], (data) => {
    if (data.fabEnabled === false) return; // Default to true if undefined

    fabElement.style.top = `${rect.top + window.scrollY - 40}px`;
    fabElement.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 16}px`;
    fabElement.style.display = 'flex';
    fabElement.style.opacity = '1';
  });
}

function hideFAB() {
  if (fabElement) {
    fabElement.style.display = 'none';
    fabElement.style.opacity = '0';
  }
}

// Listener for selection changes
document.addEventListener('mouseup', () => {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && !selection.isCollapsed) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          showFAB(rect);
        } else {
          hideFAB();
        }
      } catch (e) {
         hideFAB();
      }
    } else {
      hideFAB();
    }
  }, 10);
});

// Hide FAB on mouse down to prevent ghosting
document.addEventListener('mousedown', (e) => {
  if (fabElement && !fabElement.contains(e.target)) {
    hideFAB();
  }
});
