FROM node:22.8-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--host"]