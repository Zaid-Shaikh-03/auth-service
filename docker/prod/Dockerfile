FROM node:25-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:25-alpine as production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY  --from=builder /app/dist ./

EXPOSE 5501

CMD ["node","src/server.js"]