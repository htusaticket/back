#!/bin/sh
set -e

echo "🚀 Starting JFalcon Backend..."

# Esperar a que la base de datos esté disponible
echo "⏳ Waiting for database to be ready..."
max_retries=30
counter=0
until npx prisma db execute --stdin < /dev/null 2>/dev/null || [ $counter -eq $max_retries ]; do
  counter=$((counter + 1))
  echo "Database not ready yet... retry $counter/$max_retries"
  sleep 2
done

if [ $counter -eq $max_retries ]; then
  echo "❌ Database connection timeout"
  exit 1
fi

echo "✅ Database is ready!"

# Ejecutar migraciones
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generar cliente Prisma (por si acaso)
echo "📦 Generating Prisma Client..."
npx prisma generate

echo "✨ Starting application..."
# Iniciar la aplicación
exec node dist/main
