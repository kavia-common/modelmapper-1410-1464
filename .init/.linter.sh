#!/bin/bash
cd /home/kavia/workspace/code-generation/modelmapper-1410-1464/FrontendUI
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

