FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY tests ./tests
COPY scripts ./scripts
COPY fixtures ./fixtures

ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
