#!/bin/bash
# A mock console application that reads from stdin and outputs to stdout.
# It simulates an AI or a script processing the text.

# Read all input from stdin
input=$(cat)

# Process the input (here we just uppercase it and prepend a prefix)
echo "PROCESSED BY CONSOLE: ${input^^}"
