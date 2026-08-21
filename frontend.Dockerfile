FROM node:22-slim AS builder
WORKDIR /site
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_DFU_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_DFU_API_URL=$NEXT_PUBLIC_DFU_API_URL
RUN pnpm run build

FROM node:22-slim
WORKDIR /site
RUN corepack enable
COPY --from=builder /site ./
EXPOSE 3000
CMD ["pnpm", "run", "start"]
