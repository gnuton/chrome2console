#!/bin/bash
# gemini.sh
# Sends stdin to the gemini CLI and outputs the result.

# Read all input from stdin
input=$(cat)

# Call gemini CLI with the input
# Note: You can add more complex prompts here if needed.
/usr/local/bin/gemini "$input"
