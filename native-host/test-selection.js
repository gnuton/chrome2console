/**
 * test-selection.js
 * Verifies that the native host correctly handles different applications.
 */

const { spawn } = require('child_process');
const path = require('path');

const HOST_SCRIPT = path.join(__dirname, 'host.js');

function testHost(payload, label) {
    return new Promise((resolve) => {
        console.log(`\n--- Testing: ${label} ---`);
        const host = spawn('node', [HOST_SCRIPT]);

        const message = JSON.stringify(payload);
        const messageBuffer = Buffer.from(message, 'utf8');
        const header = Buffer.alloc(4);
        header.writeUInt32LE(messageBuffer.length, 0);

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
                    console.log('Response:', JSON.stringify(response, null, 2));
                    resolve();
                }
            }
        });

        host.stderr.on('data', (data) => {
            console.error('stderr:', data.toString());
        });
    });
}

async function runTests() {
    await testHost({ text: 'hello default', app: 'default' }, 'Default App');
    await testHost({ text: 'make me big', app: 'uppercase' }, 'Uppercase App');
    await testHost({ text: 'How Many Words Are Here', app: 'wordcount' }, 'Word Count App');
    await testHost({ text: 'custom test', app: 'custom', customCommand: 'rev' }, 'Custom Command (rev)');
}

runTests();
