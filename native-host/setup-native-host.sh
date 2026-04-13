#!/bin/bash
# setup-native-host.sh
# Configures the local Native Messaging manifest for Chrome and Chromium.

HOST_NAME="com.gnuton.chrome2console"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOST_PATH="$SCRIPT_DIR/host.js"
MANIFEST_NAME="$HOST_NAME.json"

# Default Extension ID - can be overridden by first argument
EXT_ID="${1:-ihjbgfndpkaadhhnbofmbbnkfkmolofk}"

echo "Configuring Native Messaging Host: $HOST_NAME"
echo "Host script path: $HOST_PATH"
echo "Extension ID: $EXT_ID"

# Potential manifest directories for Chrome and Chromium on Linux
TARGET_DIRS=(
    "$HOME/.config/google-chrome/NativeMessagingHosts"
    "$HOME/.config/chromium/NativeMessagingHosts"
)

for TARGET_DIR in "${TARGET_DIRS[@]}"; do
    # Only create/update if the parent browser config directory exists
    CONFIG_BASE=$(dirname "$TARGET_DIR")
    if [ -d "$CONFIG_BASE" ]; then
        mkdir -p "$TARGET_DIR"
        
        # Create the manifest file
        cat <<EOF > "$TARGET_DIR/$MANIFEST_NAME"
{
  "name": "$HOST_NAME",
  "description": "Chrome2Console Native Host",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXT_ID/"
  ]
}
EOF
        echo "Manifest created at: $TARGET_DIR/$MANIFEST_NAME"
    fi
done

# Ensure scripts are executable
chmod +x "$HOST_PATH"
chmod +x "$SCRIPT_DIR/mock-app.sh"

echo "Setup complete. Please reload your the extension in chrome://extensions."

