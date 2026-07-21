FROM node:18-bullseye

WORKDIR /app

# Install canvas dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001
USER botuser

EXPOSE 3000

CMD ["node", "src/index.js"]