#!/bin/sh
set -e

# Attend que MySQL soit prêt
echo "⏳ Attente de MySQL..."
until php artisan db:show >/dev/null 2>&1; do
  sleep 2
done
echo "✅ MySQL prêt."

# Génère la clé si absente
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

# Migrations (et seeders au premier lancement)
php artisan migrate --force --no-interaction

if [ ! -f /var/www/html/storage/.seeded ]; then
  echo "🌱 Premier lancement : seed des données de démonstration…"
  php artisan db:seed --force --no-interaction || true
  touch /var/www/html/storage/.seeded
fi

# Optimisation production
if [ "$APP_ENV" = "production" ]; then
  php artisan config:cache --no-interaction || true
  php artisan route:cache --no-interaction || true
fi

# Lien public/storage pour les fichiers uploadés
php artisan storage:link --no-interaction || true

exec "$@"
