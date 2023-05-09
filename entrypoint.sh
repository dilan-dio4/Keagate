#!/bin/bash

# Start/enable nginx in docker
service nginx start

pnpm --filter "invoice-client" build
node packages/backend/build/index.js --name "Keagate" --time