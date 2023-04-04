#!/bin/bash

pnpm --filter "invoice-client" build
node packages/backend/build/index.js --name "Keagate" --time