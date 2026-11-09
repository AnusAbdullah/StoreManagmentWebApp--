FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 4001

CMD ["npm", "run", "dev"]
