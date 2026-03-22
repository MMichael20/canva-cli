FROM node:20-slim

# Install system deps for Chromium (Puppeteer)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto \
    fonts-noto-cjk \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
