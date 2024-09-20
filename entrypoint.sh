#!/bin/sh
NODE_ENV=${NODE_ENV:-production}
printenv > /app/.env

echo "Entrypoint: Starting App Server"
node --env-file .env /app/dist/index.js
