#!/bin/bash
# setup-native-host.sh
# Configures the local Native Messaging manifest for Chrome.

HOST_NAME="com.gnuton.chrome2console"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOST_PATH="$SCRIPT_DIR/host.js"
MANIFEST_NAME="$HOST_NAME.json"
TARGET_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

echo "Configuring Native Messaging Host: $HOST_NAME"
echo "Host script path: $HOST_PATH"

# Create the manifest file
cat <<EOF > "$TARGET_DIR/$MANIFEST_NAME"
{
  "name": "$HOST_NAME",
  "description": "Chrome2Console Native Host",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://ihjbgfndpkaadhhnbofmbbnkfkmolofk/"
  ]
}
EOF

# Note: The extension ID above is a placeholder or should match the local unpacked ID.
# Users should update it if their local ID differs.

chmod +x "$HOST_PATH"
chmod +x "$SCRIPT_DIR/mock-app.sh"

echo "Manifest created at: $TARGET_DIR/$MANIFEST_NAME"
echo "IMPORTANT: Make sure the 'allowed_origins' in the manifest matches your extension ID."
echo "You can find your extension ID in chrome://extensions after loading the 'extension' directory."
