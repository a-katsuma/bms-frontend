# ---- ビルド：npm run build（.env.production の値で /api を使う） ----
FROM node:24-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 配信：nginx でビルド済みのファイルを返す ----
FROM nginx:stable-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
