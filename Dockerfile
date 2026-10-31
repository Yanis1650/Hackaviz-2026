# Étape build : Vite + Svelte
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape runtime : fichiers statiques
FROM nginx:alpine

# Paquets Alpine à jour : failles corrigées après la sortie de l'image (brotli-libs, CVE-2026-111497, le 31/10/2026).
RUN apk upgrade --no-cache
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
