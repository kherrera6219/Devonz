@echo off
title Devonz - AI Agent
cd /d "%~dp0app"
node node_modules\remix-serve\dist\cli.js ./build/server/index.js
