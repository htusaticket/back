# 🚀 Guía de Deployment a Producción

Esta guía describe el proceso completo para deployar la aplicación a producción de manera segura y eficiente.

## 📋 Pre-requisitos

### Infraestructura Mínima

- **Servidor**: 2 vCPUs, 4GB RAM, 20GB SSD
- **Base de datos**: PostgreSQL 16+ con backups automáticos
- **Dominio**: SSL/TLS configurado
- **Monitoreo**: Sistema de logs y métricas
- **Backup**: Estrategia de respaldo automatizada

### Herramientas Necesarias

- Docker & Docker Compose
- Nginx (como reverse proxy)
- Certbot (para SSL con Let's Encrypt)
- Sistema de CI/CD (GitHub Actions configurado)

## 🔧 Configuración del Servidor

### 1. Preparación del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
```

### 2. Configuración de Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### 3. Configuración de Nginx

```nginx
# /etc/nginx/sites-available/zazcreditos
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Configuración SSL (se configurará con Certbot)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de seguridad
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configuración de proxy
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }

    # Logs
    access_log /var/log/nginx/zazcreditos_access.log;
    error_log /var/log/nginx/zazcreditos_error.log;
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/zazcreditos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configuración SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

## 📦 Preparación de la Aplicación

### 1. Variables de Entorno de Producción

Crear `/opt/zazcreditos/.env.production`:

```bash
# Aplicación
NODE_ENV=production
PORT=5000
LOG_LEVEL=warn

# Base de datos
DATABASE_URL=postgresql://usuario:password_seguro@localhost:5432/zazcreditos_prod
DIRECT_URL=postgresql://usuario:password_seguro@localhost:5432/zazcreditos_prod

# Seguridad
JWT_SECRET=tu_jwt_secret_super_seguro_de_al_menos_64_caracteres_para_produccion
BCRYPT_SALT_ROUNDS=12

# CORS
HOSTS_WHITE_LIST=https://tu-dominio.com,https://www.tu-dominio.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=10
```

### 2. Configuración de Docker para Producción

```yaml
# /opt/zazcreditos/docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: ghcr.io/tu-usuario/zazcreditos-back:latest
    container_name: zazcreditos-app
    restart: unless-stopped
    ports:
      - '127.0.0.1:5000:5000'
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
      - /etc/localtime:/etc/localtime:ro
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - zazcreditos-network
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  db:
    image: postgres:16-alpine
    container_name: zazcreditos-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: zazcreditos_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
      - /etc/localtime:/etc/localtime:ro
    ports:
      - '127.0.0.1:5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER} -d zazcreditos_prod']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - zazcreditos-network
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  redis:
    image: redis:7-alpine
    container_name: zazcreditos-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
      - /etc/localtime:/etc/localtime:ro
    ports:
      - '127.0.0.1:6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', '--pass', '${REDIS_PASSWORD}', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - zazcreditos-network
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  zazcreditos-network:
    driver: bridge
```

## 🚀 Proceso de Deployment

### 1. Deployment Inicial

```bash
# Crear directorio de la aplicación
sudo mkdir -p /opt/zazcreditos
cd /opt/zazcreditos

# Clonar repositorio (o usar CI/CD)
git clone https://github.com/tu-usuario/zazcreditos-back.git .

# Configurar variables de entorno
sudo cp .env.example .env.production
sudo nano .env.production  # Editar con valores de producción

# Generar secretos seguros
openssl rand -hex 32  # Para JWT_SECRET
openssl rand -hex 16  # Para DB_PASSWORD
openssl rand -hex 16  # Para REDIS_PASSWORD

# Ejecutar primera migración
docker-compose -f docker-compose.prod.yml up -d db
sleep 30  # Esperar que la DB esté lista
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE zazcreditos_prod;"

# Desplegar aplicación completa
docker-compose -f docker-compose.prod.yml up -d

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Ejecutar seeds (opcional)
docker-compose -f docker-compose.prod.yml exec app npm run db:seed
```

### 2. Verificación del Deployment

```bash
# Verificar que todos los contenedores están corriendo
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f app

# Verificar conectividad
curl -f http://localhost:5000/health
curl -f https://tu-dominio.com/health

# Verificar base de datos
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d zazcreditos_prod -c "\dt"
```

### 3. Script de Deployment Automatizado

```bash
#!/bin/bash
# /opt/zazcreditos/deploy.sh

set -e

echo "🚀 Iniciando deployment..."

# Backup de la base de datos
echo "📦 Creando backup de la base de datos..."
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres zazcreditos_prod > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Pull de la nueva imagen
echo "⬇️ Descargando nueva imagen..."
docker-compose -f docker-compose.prod.yml pull app

# Detener aplicación (mantener DB y Redis)
echo "⏹️ Deteniendo aplicación..."
docker-compose -f docker-compose.prod.yml stop app

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Iniciar aplicación
echo "▶️ Iniciando aplicación..."
docker-compose -f docker-compose.prod.yml up -d app

# Verificar que la aplicación está funcionando
echo "🔍 Verificando deployment..."
sleep 10
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Deployment exitoso!"
else
    echo "❌ Error en deployment. Revisar logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50 app
    exit 1
fi

# Limpiar imágenes antiguas
echo "🧹 Limpiando imágenes antiguas..."
docker image prune -f

echo "🎉 Deployment completado exitosamente!"
```

```bash
# Hacer ejecutable
chmod +x /opt/zazcreditos/deploy.sh
```

## 🔍 Monitoreo y Logs

### 1. Configuración de Logs

```bash
# Crear directorio de logs
sudo mkdir -p /opt/zazcreditos/logs

# Configurar logrotate
sudo nano /etc/logrotate.d/zazcreditos
```

```
/opt/zazcreditos/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f /opt/zazcreditos/docker-compose.prod.yml restart app
    endscript
}
```

### 2. Monitoreo de Salud

```bash
#!/bin/bash
# /opt/zazcreditos/health-check.sh

# Verificar aplicación
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "❌ Aplicación no responde"
    # Reiniciar aplicación
    cd /opt/zazcreditos
    docker-compose -f docker-compose.prod.yml restart app

    # Notificar (configurar según tu sistema de alertas)
    # slack/email/webhook notification
fi

# Verificar espacio en disco
DISK_USAGE=$(df /opt/zazcreditos | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ Espacio en disco bajo: ${DISK_USAGE}%"
    # Limpiar logs antiguos
    find /opt/zazcreditos/logs -name "*.log" -mtime +7 -delete
fi
```

```bash
# Configurar cron para ejecutar cada 5 minutos
echo "*/5 * * * * /opt/zazcreditos/health-check.sh" | sudo crontab -
```

## 🔒 Seguridad en Producción

### 1. Configuración de Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install fail2ban -y

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
```

### 2. Configuración de Backups Automáticos

```bash
#!/bin/bash
# /opt/zazcreditos/backup.sh

BACKUP_DIR="/opt/zazcreditos/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup de base de datos
docker-compose -f /opt/zazcreditos/docker-compose.prod.yml exec -T db pg_dump -U postgres zazcreditos_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Eliminar backups antiguos (mantener 30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Sync a almacenamiento externo (opcional)
# rsync -az $BACKUP_DIR/ user@backup-server:/backups/zazcreditos/
```

```bash
# Configurar cron para backup diario
echo "0 2 * * * /opt/zazcreditos/backup.sh" | sudo crontab -
```

## 📊 Configuración de Métricas

### 1. Configuración de Prometheus (Opcional)

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'zazcreditos'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
```

### 2. Alertas Básicas

```bash
#!/bin/bash
# /opt/zazcreditos/alerts.sh

# Verificar memoria
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "⚠️ Uso de memoria alto: ${MEMORY_USAGE}%"
fi

# Verificar CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "⚠️ Uso de CPU alto: ${CPU_USAGE}%"
fi
```

## 🔄 Rollback y Recuperación

### 1. Script de Rollback

```bash
#!/bin/bash
# /opt/zazcreditos/rollback.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <backup_file>"
    echo "Backups disponibles:"
    ls -la /opt/zazcreditos/backups/
    exit 1
fi

echo "⚠️ Iniciando rollback..."

# Detener aplicación
docker-compose -f docker-compose.prod.yml stop app

# Restaurar base de datos
echo "🗄️ Restaurando base de datos..."
zcat $BACKUP_FILE | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres zazcreditos_prod

# Reiniciar aplicación
echo "▶️ Reiniciando aplicación..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Rollback completado"
```

## 📋 Checklist de Deployment

### Pre-Deployment

- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Certificados SSL válidos
- [ ] ✅ Backup de base de datos actual
- [ ] ✅ Tests de CI/CD pasando
- [ ] ✅ Monitoreo configurado

### Durante Deployment

- [ ] ✅ Aplicación desplegada correctamente
- [ ] ✅ Migraciones ejecutadas
- [ ] ✅ Health checks pasando
- [ ] ✅ Logs sin errores críticos

### Post-Deployment

- [ ] ✅ Funcionalidad principal verificada
- [ ] ✅ Rendimiento dentro de parámetros esperados
- [ ] ✅ Métricas y alertas funcionando
- [ ] ✅ Documentación actualizada

---

## 🆘 Solución de Problemas en Producción

### Aplicación no inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs app

# Verificar variables de entorno
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(NODE_ENV|DATABASE_URL|JWT_SECRET)"

# Verificar conectividad a DB
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
```

### Base de datos no conecta

```bash
# Verificar estado de PostgreSQL
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres

# Verificar logs de DB
docker-compose -f docker-compose.prod.yml logs db

# Verificar conectividad desde la aplicación
docker-compose -f docker-compose.prod.yml exec app nc -zv db 5432
```

### Rendimiento lento

```bash
# Verificar recursos del sistema
htop
iotop
df -h

# Verificar logs de consultas lentas en PostgreSQL
docker-compose -f docker-compose.prod.yml exec db tail -f /var/log/postgresql/postgresql.log

# Verificar métricas de la aplicación
curl http://localhost:5000/metrics
```

---

¡Deployment exitoso! 🎉
