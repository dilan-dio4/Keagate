FROM node:16.15.1

# Set environment variables
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"
WORKDIR /app

# Install dependencies
RUN npm install --global pnpm && \
    SHELL=bash pnpm setup && \
    pnpm install -g pm2 && \
    mkdir /app/config

# Install nginx
RUN apt-get update && \
    apt-get install -y nginx && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /etc/nginx/sites-enabled/default && \
    rm -rf /etc/nginx/sites-available/default && \
    rm -rf /etc/nginx/nginx.conf

# Add nginx config
COPY config/nginx.conf /etc/nginx/nginx.conf

# Add src
COPY assets assets
COPY config/default.json config/default.json
COPY packages packages
COPY entrypoint.sh entrypoint.sh
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY tsconfig.base.json tsconfig.base.json
COPY tsconfig.project.json tsconfig.project.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml

# Build
RUN pnpm i
RUN pnpm run build && \
    chmod +x entrypoint.sh

CMD [ "./entrypoint.sh" ]