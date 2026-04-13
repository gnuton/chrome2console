# Native Messaging Host Setup

This document specifies how the Native Messaging Host will be configured to allow the Chrome Extension to talk to the Node.js backend.

## Prerequisites
- Node.js installed on the target machine (Linux).
- Standard Google Chrome or Chromium installation.

## Components to Provide

The host requires two main files to function:
1. **The Host Executable (`host.js`)**: A Node.js script that parses the stdin bytes and launches the console application.
2. **The App Manifest (`com.gnuton.chrome2console.json`)**: A configuration file used by Chrome to locate and authorize the host on the filesystem.

### Manifest Specifications

A Native Messaging manifest will look like this:

```json
{
  "name": "com.gnuton.chrome2console",
  "description": "Chrome2Console Native Host",
  "path": "/absolute/path/to/host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
```

## Installation Instructions

1.  Place your Node.js script (`host.js`) somewhere accessible. Enable execution permissions:
    ```bash
    chmod +x host.js
    ```
2.  Populate the `"path"` field of the JSON manifest with the absolute path to your `host.js`.
3.  Populate the `"allowed_origins"` field with the Chrome Extension ID generated when you load the extension into Chrome via "Load unpacked".
4.  Copy the JSON manifest into the correct Chrome configuration folder for Linux:
    ```bash
    cp com.gnuton.chrome2console.json ~/.config/google-chrome/NativeMessagingHosts/
    ```
    *If using Chromium, the path is `~/.config/chromium/NativeMessagingHosts/`.*

Once installed, Chrome will automatically launch the `host.js` file whenever `chrome.runtime.sendNativeMessage('com.gnuton.chrome2console', ...)` is called.
