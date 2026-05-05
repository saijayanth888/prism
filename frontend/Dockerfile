# Local/demo runtime for docker-compose: Vite dev server (matches compose override).
# Production nginx image: build with a separate target or Dockerfile once `npm run build` passes.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
