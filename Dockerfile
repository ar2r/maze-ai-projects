FROM node:22-alpine AS build

WORKDIR /app

COPY . .

RUN node ./scripts/install-all.mjs
RUN node ./scripts/build-site.mjs

FROM nginx:1.27-alpine

EXPOSE 3000

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/site-dist /usr/share/nginx/html
