# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

RUN npm install --workspace=frontend

COPY frontend ./frontend

RUN npm run build --workspace=frontend

# Production Stage (Nginx)
FROM nginx:stable-alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Custom Nginx config to handle SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
