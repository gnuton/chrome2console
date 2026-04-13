# Product Backlog: Chrome2Console

This backlog contains pending items for setting up and finalizing the full implementation of the Chrome2Console project.

## Phase 1: Native Host Infrastructure
- [ ] **Task 1.1:** Develop the Node.js script (`host.js`) to parse Chrome's 4-byte Native Messaging length-prefix via Standard I/O.
- [ ] **Task 1.2:** Implement command execution (`child_process.spawn`) inside `host.js` hooking it to a mock console script.
- [ ] **Task 1.3:** Develop a configuration file mechanism so `host.js` knows which real application (like gemini cli) to route data to.
- [ ] **Task 1.4:** Test bidirectional Native Messaging locally using an isolated Node script mimicking Chrome's protocol.

## Phase 2: Chrome Extension Client
- [ ] **Task 2.1:** Scaffold Manifest V3 extension `manifest.json` with permissions (`contextMenus`, `activeTab`, `scripting`, `nativeMessaging`).
- [ ] **Task 2.2:** Setup `background.js` Service Worker to listen to `chrome.contextMenus` creation and click events.
- [ ] **Task 2.3:** Map context menu selections to a function calling `chrome.runtime.sendNativeMessage`.
- [ ] **Task 2.4:** Write DOM manipulation logic in `content.js` to replace the exact current user `<selectionRange>` with the returned text output.

## Phase 3: Project Configuration & Documentation
- [ ] **Task 3.1:** Write the README to explain to general users how to install the native host components on their local machine.
- [ ] **Task 3.2:** Verify CI action correctly builds ZIP files without exposing hidden files or local config.
- [ ] **Task 3.3:** Finalize Chrome Web Store listing metadata and icons.
