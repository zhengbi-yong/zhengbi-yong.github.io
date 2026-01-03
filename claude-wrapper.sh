#!/bin/bash
# Wrapper script to invoke ccw with pwsh
MODULE_PATH="$1"
STRATEGY="$2"
TOOL="${3:-gemini}"

cd "$MODULE_PATH" || exit 1

# Try to use ccw with explicit shell path
export SHELL="/c/Program Files/PowerShell/7/pwsh.exe"

ccw tool exec update_module_claude "{\"strategy\":\"$STRATEGY\",\"path\":\".\",\"tool\":\"$TOOL\"}"
