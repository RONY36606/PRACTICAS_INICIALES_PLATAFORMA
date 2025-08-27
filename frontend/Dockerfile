# 1️⃣ Etapa de build: Node 22.18.0
FROM node:22.18.0-alpine AS build

# Carpeta de trabajo
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código
COPY . .

# Construimos la aplicación Angular en modo producción
RUN npm run build --configuration frontend

# 2️⃣ Etapa de producción: Nginx
FROM nginx:alpine

# Copiamos los archivos generados al directorio de Nginx
# ⚠️ Cambia 'frontend-app' por el nombre exacto de la carpeta que genera tu build en dist
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# Iniciamos Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
