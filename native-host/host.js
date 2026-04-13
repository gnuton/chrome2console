#!/usr/bin/env node

/**
 * host.js
 * Chrome Native Messaging Host for Chrome2Console.
 * 
 * This script bridges Chrome messages to a local console application.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration: The command to execute is now dynamic based on message input.

/**
 * Sends a message back to the Chrome extension.
 * Messages must be prefixed with a 4-byte length header.
 */
function sendResponse(response) {
    const jsonResponse = JSON.stringify(response);
    const messageBuffer = Buffer.from(jsonResponse, 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(messageBuffer.length, 0);

    process.stdout.write(header);
    process.stdout.write(messageBuffer);
}

/**
 * Handles an incoming message from the Chrome extension.
 */
async function handleMessage(message) {
    // Handle ping for connectivity checks
    if (message.type === 'ping') {
        sendResponse({ status: 'ok' });
        return;
    }

    const { text, app, customCommand } = message;
    if (typeof text !== 'string') {
        sendResponse({ error: 'Invalid input: text field missing or not a string.' });
        return;
    }

    // Determine the command to run
    let command;
    let args = [];

    const APP_MAP = {
        'default': path.join(__dirname, 'mock-app.sh'),
        'uppercase': path.join(__dirname, 'uppercase.sh'),
        'lowercase': path.join(__dirname, 'lowercase.sh'),
        'wordcount': path.join(__dirname, 'wordcount.sh'),
        'gemini': path.join(__dirname, 'gemini.sh')
    };

    if (app === 'custom' && customCommand) {
        command = '/bin/bash';
        args = ['-c', customCommand];
    } else if (APP_MAP[app]) {
        command = '/bin/bash';
        args = [APP_MAP[app]];
    } else {
        // Fallback to default
        command = '/bin/bash';
        args = [APP_MAP['default']];
    }

    try {
        // Spawn the console application
        const child = spawn(command, args);

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                sendResponse({ result: output.trim() });
            } else {
                sendResponse({ error: `Process exited with code ${code}: ${errorOutput}` });
            }
        });

        child.on('error', (err) => {
            sendResponse({ error: `Failed to start process: ${err.message}` });
        });

        // Pipe the input text to the child process stdin
        child.stdin.write(text);
        child.stdin.end();

    } catch (err) {
        sendResponse({ error: `Execution error: ${err.message}` });
    }
}

// Main loop to read from stdin
let inputBuffer = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);

    while (inputBuffer.length >= 4) {
        const messageLength = inputBuffer.readUInt32LE(0);
        if (inputBuffer.length >= 4 + messageLength) {
            const messageData = inputBuffer.slice(4, 4 + messageLength);
            inputBuffer = inputBuffer.slice(4 + messageLength);

            try {
                const message = JSON.parse(messageData.toString('utf8'));
                handleMessage(message);
            } catch (err) {
                console.error('Failed to parse JSON message:', err);
            }
        } else {
            // Wait for more data
            break;
        }
    }
});

process.stdin.on('end', () => {
    // We don't exit immediately to allow pending processes to finish and respond
    // In a real native host, Chrome will kill the process eventually or we exit when stdout is closed.
});

process.on('SIGTERM', () => {
    process.exit(0);
});
