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
});

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
