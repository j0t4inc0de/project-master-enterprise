# 🖥️ Arquitectura de Servidor y Despliegue — Project Master Enterprise

Este documento consolida la arquitectura de infraestructura, configuración de contenedores, red interna y flujo de despliegue continuo de **Project Master Enterprise** en el servidor de producción, protegiendo credenciales y datos sensibles.

---

## 1. 🏗️ Resumen de Infraestructura

El proyecto se despliega de manera contenerizada y aislada en un servidor Linux (Ubuntu) gestionado por Docker y Docker Compose:

* **Tipo de Aplicación:** SPA (Single Page Application) estática basada en React 19, Vite, Tailwind CSS y Zustand.
* **Estrategia de Build:** Multi-stage build con Docker (`node:22-alpine` para compilación + `nginx:alpine` para entrega de contenido a alta velocidad).
* **Consumo de Recursos:** Mínimo (< 30 MB en disco para la imagen Nginx final, < 20 MB de memoria RAM en ejecución).
* **Ruta de Despliegue en Servidor:**
  ```bash
  ~/projects/project-master-enterprise
  ```
* **Nombre del Contenedor:** `project-master-enterprise`

---

## 2. 🐳 Contenerización (Docker & Nginx)

### A. Dockerfile Multi-Stage (`Dockerfile`)
1. **Etapa 1 (`build-stage`):**
   * Imagen base: `node:22-alpine`.
   * Instala paquetes vía `npm install` de forma limpia.
   * Ejecuta `npm run build`, generando los assets minificados en `/dist`.
2. **Etapa 2 (`production-stage`):**
   * Imagen base: `nginx:alpine`.
   * Copia los binarios generados desde la etapa 1 hacia `/usr/share/nginx/html`.
   * Carga configuración optimizada de `nginx.conf`.
   * Expone el puerto `80` internamente.

### B. Servidor Web (`nginx.conf`)
* **Routing SPA:** Directiva `try_files $uri $uri/ /index.html;` para permitir recargas y navegación fluida sin errores 404.
* **Compresión Gzip:** Activa para `text/html`, `css`, `js`, `json`, `svg`, acelerando la carga inicial en conexiones móviles o de baja latencia.
* **Caché de Assets Estáticos:** Políticas de caché de 30 días (`expires 30d`) para bundles versionados (`.js`, `.css`, fuentes e imágenes).
* **Seguridad HTTP:** Headers preventivos de seguridad:
  * `X-Frame-Options "SAMEORIGIN"`
  * `X-Content-Type-Options "nosniff"`
  * `X-XSS-Protection "1; mode=block"`

### C. Orquestación (`docker-compose.yml`)
```yaml
services:
  project-master-enterprise:
    build: .
    container_name: project-master-enterprise
    restart: always
    expose:
      - "80"
    networks:
      - proxy_network

networks:
  proxy_network:
    external: true
```
* **Red Externa (`proxy_network`):** El contenedor no expone puertos públicos al host directamente, sino que se enlaza a la red compartida donde residen el Reverse Proxy y el Cloudflare Tunnel, garantizando acceso Zero-Trust y SSL/TLS automático.

---

## 3. 🔄 Flujo de Despliegue y Actualización (CI / CD)

### Flujo Automático / Panel de Control
1. Se envían los cambios a la rama principal del repositorio (`master`).
2. Desde el Docker Mini Panel o mediante terminal SSH en el servidor, se dispara la actualización:
   ```bash
   cd ~/projects/project-master-enterprise
   git pull
   docker compose up -d --build
   ```
3. Docker reconstruye la imagen únicamente si detecta cambios en el código fuente, refrescando el contenedor en segundo plano con **Zero-Downtime**.

---

## 4. 🛠️ Comandos de Diagnóstico y Mantenimiento

* **Ver estado del contenedor:**
  ```bash
  docker ps --filter name=project-master-enterprise
  ```
* **Consultar logs de Nginx en tiempo real:**
  ```bash
  docker logs -f project-master-enterprise
  ```
* **Reiniciar servicio:**
  ```bash
  docker restart project-master-enterprise
  ```
* **Verificar respuesta HTTP interna:**
  ```bash
  docker exec project-master-enterprise wget -qO- http://localhost:80 | head -n 15
  ```

---

## 5. 🔒 Políticas de Seguridad y Buenas Prácticas
* Las credenciales de acceso, llaves SSH y tokens de autenticación se mantienen fuera del control de versiones mediante variables de entorno locales y `.gitignore`.
* Ningún archivo de configuración contiene contraseñas o datos de conexión en texto plano.
