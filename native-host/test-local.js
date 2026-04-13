/**
 * test-local.js
 * A testing harness to simulate Chrome's Native Messaging protocol.
 * It sends a message to host.js and prints the response.
 */

const { spawn } = require('child_process');
const path = require('path');

const HOST_SCRIPT = path.join(__dirname, 'host.js');

function testHost(textToProcess) {
    console.log(`Testing host with text: "${textToProcess}"`);

    // Spawn the host script
    const host = spawn('node', [HOST_SCRIPT]);

    // Prepare the message: { text: "..." }
    const message = JSON.stringify({ text: textToProcess });
    const messageBuffer = Buffer.from(message, 'utf8');

    // Create the header (4-byte length, little-endian)
    const header = Buffer.alloc(4);
    header.writeUInt32LE(messageBuffer.length, 0);

    // Send header and message to host's stdin
    host.stdin.write(header);
    host.stdin.write(messageBuffer);
    host.stdin.end();

    let responseBuffer = Buffer.alloc(0);

    host.stdout.on('data', (chunk) => {
        responseBuffer = Buffer.concat([responseBuffer, chunk]);

        if (responseBuffer.length >= 4) {
            const length = responseBuffer.readUInt32LE(0);
            if (responseBuffer.length >= 4 + length) {
                const responseData = responseBuffer.slice(4, 4 + length);
                const response = JSON.parse(responseData.toString('utf8'));
                console.log('--- RESPONSE RECEIVED ---');
                console.log(JSON.stringify(response, null, 2));
                process.exit(0);
            }
        }
    });

    host.stderr.on('data', (data) => {
        console.error('stderr:', data.toString());
    });

    host.on('error', (err) => {
        console.error('Failed to start host:', err);
    });

    host.on('close', (code) => {
        if (code !== 0) {
            console.log(`Host process exited with code ${code}`);
            process.exit(code);
        }
    });
}

// Run test with dummy text
testHost('hello world from chrome2console test');
