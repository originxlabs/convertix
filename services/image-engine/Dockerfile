FROM node:20-slim

WORKDIR /app

COPY services/image-engine/package*.json ./
RUN npm ci --omit=dev

COPY services/image-engine/ ./

# Playwright needs extra deps + browser install
RUN npx playwright install --with-deps chromium

ENV PORT=7071
EXPOSE 7071

CMD ["node", "index.js"]
