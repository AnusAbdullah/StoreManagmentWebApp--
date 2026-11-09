FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Enable hot reload inside Docker
ENV WATCHPACK_POLLING=true

EXPOSE 3001

CMD ["npm", "start"]
