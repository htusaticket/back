#!/bin/sh

echo "🚀 Starting JFalcon Backend..."

# Verificar que DATABASE_URL esté definida
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL not set, starting without migrations..."
  exec node dist/main
fi

echo "⏳ Waiting for database to be ready..."
max_retries=15
counter=0

# Intentar conectar a la base de datos
while [ $counter -lt $max_retries ]; do
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Database migrations completed!"
    break
  fi
  counter=$((counter + 1))
  echo "Database not ready yet... retry $counter/$max_retries"
  sleep 3
done

if [ $counter -eq $max_retries ]; then
  echo "⚠️ Could not run migrations, starting app anyway..."
fi

echo "✨ Starting application..."
exec node dist/src/main
