FROM node:20 AS builder

WORKDIR /build/feiapi-frontend-master

ARG UMI_APP_API_BASE=/api
ARG UMI_APP_SCHEMA_PATH=http://localhost:9527/api/v3/api-docs
ENV UMI_APP_API_BASE=${UMI_APP_API_BASE}
ENV UMI_APP_SCHEMA_PATH=${UMI_APP_SCHEMA_PATH}
ENV HUSKY=0

COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
COPY .editorconfig ./.editorconfig
COPY .eslintignore ./.eslintignore
COPY .eslintrc.js ./.eslintrc.js
COPY .prettierignore ./.prettierignore
COPY .prettierrc.js ./.prettierrc.js
COPY jsconfig.json ./jsconfig.json
COPY tsconfig.json ./tsconfig.json
COPY config ./config
COPY public ./public
COPY src ./src

RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/feiapi-frontend-master/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
