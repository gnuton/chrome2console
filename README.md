# Chrome2Console

Chrome2Console is a Chrome extension that allows you to send selected text from any webpage to a local console command and replace the selection with the command's output.

## Features
- **Context Menu Integration**: Right-click any text and select "Send to Console".
- **Dynamic Replacement**: The output from your script replaces the highligted text in the browser.
- **Local Control**: Run any shell script, AI agent, or bash command locally.

## Architecture
1. **Chrome Extension**: Captured via `contextMenus` API.
2. **Native Messaging Host**: A Node.js bridge (`host.js`) that pipes text to local commands.
3. **Local Command**: Any executable (defaults to `mock-app.sh` for testing).

## Installation & Setup

### 1. Install the Native Host
Run the setup script to register the application with Chrome:
```bash
bash native-host/setup-native-host.sh
```

### 2. Load the Extension
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `extension/` directory in this repository.
5. **Note your Extension ID** (e.g., `ihjbgfndpkaadhhnbofmbbnkfkmolofk`).

### 3. Sync Extension ID
If your extension ID differs from the default in the setup script:
1. Open `~/.config/google-chrome/NativeMessagingHosts/com.gnuton.chrome2console.json`.
2. Update the `allowed_origins` field to match your ID: `chrome-extension://YOUR_ID_HERE/`.

## Local Testing
You can test the native host logic without the extension:
```bash
node native-host/test-local.js
```

## Customization
To change which command is executed, edit the `COMMAND_PATH` variable in `native-host/host.js`.
