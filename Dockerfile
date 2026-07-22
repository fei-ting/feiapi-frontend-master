# 构建阶段：使用 Node.js 编译 Vue3 + Vite 前端项目
FROM node:20 AS builder

WORKDIR /build/feiapi-frontend-master

# 声明 npm/yarn 镜像源构建参数，默认使用国内镜像源以提升 Docker 构建稳定性
ARG NPM_REGISTRY=https://registry.npmmirror.com
# 禁用 husky，避免在容器内执行 git hooks
ENV HUSKY=0

# 复制依赖声明文件（利用 Docker 缓存层）
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock

# 安装依赖（不使用 --frozen-lockfile，允许更新 lockfile）
RUN yarn config set registry ${NPM_REGISTRY} && yarn install --network-timeout 600000

# 复制项目源码和配置文件
COPY index.html ./index.html
COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY public ./public
COPY src ./src

# 构建前端项目
RUN yarn build

# 运行阶段：使用 Nginx 托管静态文件
FROM nginx:1.27-alpine

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 复制公共安全响应头片段，由各个 location 显式引用，避免 add_header 继承丢失
COPY nginx/security-headers.conf /etc/nginx/conf.d/security-headers.inc
# 复制构建产物
COPY --from=builder /build/feiapi-frontend-master/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
