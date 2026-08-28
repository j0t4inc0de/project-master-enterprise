# Etapa 1: Build de la aplicación con Node.js
FROM node:22-alpine AS build-stage
WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente y compilar bundle de producción
COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx ultra ligero
FROM nginx:alpine AS production-stage

# Copiar bundle compilado y configuración de Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
