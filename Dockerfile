FROM node:16.15.1 as base

# Add package file
COPY package.json ./
COPY config ./

# Copy source
COPY packages ./packages
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY tsconfig.project.json ./

# Install deps
RUN npm i

# Build
RUN npm run build

# Start production image build
FROM node:16.15.1

# Copy node modules and build directory
COPY --from=base ./node_modules ./node_modules
COPY --from=base /dist /dist

# Copy static files
COPY src/public dist/src/public

# Expose port 8081
EXPOSE 8081
CMD ["node", "packages/backend/build/server.js"]