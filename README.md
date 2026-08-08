# 🏠 ImmoManager — Plateforme de Gestion Locative SaaS

**ImmoManager** est une application web complète de gestion locative destinée aux propriétaires, agences immobilières et gestionnaires d'immeubles. Elle permet de gérer plusieurs maisons, logements, locataires et tous les paiements de loyers depuis une seule plateforme, avec un tableau de bord professionnel, des documents PDF générés automatiquement et des statistiques en temps réel.

---

## ✨ Fonctionnalités

### 🔐 Authentification & Rôles
- Inscription, connexion, déconnexion
- Mot de passe oublié (email avec lien de réinitialisation)
- Vérification de l'email par code à 6 chiffres
- 3 rôles avec permissions granulaires :
  - **Super Admin** : accès total (utilisateurs, audit, paramètres)
  - **Gestionnaire** : CRUD complet (maisons, logements, locataires, contrats, loyers)
  - **Comptable** : gestion des paiements et dépenses, consultation

### 📊 Tableau de bord
- Maisons, logements, locataires, loyers encaissés/impayés
- Revenus mensuels et annuels
- Logements libres / occupés, taux d'occupation
- Graphiques : revenus mensuels, paiements par mois

### 🏢 Gestion des maisons & logements
- CRUD complet avec photos
- Logements : numéro, type, chambres, surface, loyer, caution
- Statuts : **Libre · Occupé · En rénovation**
- Un logement = un seul locataire actif

### 👥 Locataires & Contrats
- Fiche complète : photo, CNI, contact d'urgence, profession, nationalité…
- **Contrat de bail PDF généré automatiquement** à la création
- Téléchargement, impression, renouvellement (historique conservé)

### 💰 Loyers, Factures & Reçus
- Échéances mensuelles **générées automatiquement** (commande + cron)
- Paiement complet ou partiel, solde restant, historique
- Statuts : Payé · Partiel · En retard · Non payé
- **Facture PDF** et **Reçu PDF avec QR code** de vérification

### 📣 Notifications
- Rappels avant échéance et alertes de retard (canal in-app actif)
- Architecture prête pour **Email, WhatsApp, SMS et Push** (stubs à brancher)

### 📈 Analytics & Recherche
- Revenus, dépenses, bénéfices, taux de remplissage, locataires en retard
- **Export PDF** et **Excel (CSV)**
- Recherche instantanée sur maisons, locataires, logements, paiements

### 🛠️ Divers
- Journal d'audit (traçabilité des actions)
- Paramètres : logo, nom, adresse, devise, langue
- Mode clair/sombre, responsive, animations Framer Motion
- Multi-utilisateurs et multi-propriétaires (architecture SaaS)
- API 100 % compatible React Native (même endpoints, tokens Bearer)

---

## 🧱 Stack Technique

| Couche | Technologies |
|---|---|
| **Frontend** | React 19 · Vite 8 · Tailwind CSS 3 · React Router 7 · Axios · Recharts · Framer Motion |
| **Backend** | Laravel 12 · API REST · Sanctum (auth) · Policies · Form Requests |
| **Base de données** | MySQL 8 (Eloquent ORM, migrations, factories, seeders) |
| **PDF** | DomPDF + QR codes (endroid/qr-code) |
| **Déploiement** | Docker Compose · Nginx · PHP-FPM |

---

## 🚀 Démarrage rapide (Docker)

### Prérequis
- Docker + Docker Compose

### Installation

```bash
# 1. Cloner / copier le projet
cd immomanager

# 2. Configurer l'environnement
cp .env.example .env
# Éditez .env : générez APP_KEY avec la commande ci-dessous
php -r "echo base64_encode(random_bytes(32));"   # ou utilisez une valeur aléatoire

# 3. Lancer la stack
docker compose up -d --build

# 4. Attendre que MySQL soit prêt (le backend fait les migrations + seeders automatiquement)
docker compose logs -f backend
```

L'application est alors disponible sur **http://localhost**.

### Comptes de démonstration (seedés automatiquement)

| Rôle | Email | Mot de passe |
|---|---|---|
| **Super Admin** | `admin@immomanager.app` | `password` |
| **Gestionnaire** | `gestionnaire@immomanager.app` | `password` |
| **Comptable** | `comptable@immomanager.app` | `password` |

### Commandes utiles

```bash
docker compose logs -f backend     # logs API
docker compose logs -f frontend    # logs Nginx
docker compose exec backend php artisan tinker
docker compose exec backend php artisan rents:generate --notify   # générer les loyers
docker compose exec mysql mysql -u immomanager -psecret immomanager
```

---

## 🖥️ Développement local (sans Docker)

### Prérequis
- PHP ≥ 8.2 + Composer
- MySQL ≥ 8
- Node.js ≥ 20

### Backend

```bash
cd backend
cp .env.example .env
# Configurez DB_DATABASE, DB_USERNAME, DB_PASSWORD dans .env
php artisan key:generate
composer install
php artisan migrate --seed
php artisan serve --port=8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend tourne sur **http://localhost:5173** et proxie `/api` vers `http://127.0.0.1:8000` (Vite).

---

## 🧪 Tests

```bash
cd backend
php artisan test
```

> 29 tests fonctionnels : authentification, CRUD maisons, paiements (complet/partiel/solde), génération d'échéances, dashboard, exports.

---

## ⚙️ Génération automatique des loyers

La génération des échéances se fait automatiquement via le planificateur Laravel :

```bash
# Ajouter au cron du serveur :
* * * * * cd /chemin/backend && php artisan schedule:run >> /dev/null 2>&1
```

- `rents:generate` : crée les échéances manquantes (3 mois à l'avance) et actualise les statuts
- Rappels d'échéance et alertes de retard envoyés chaque matin à 8h

---

## 📚 Documentation API

Base : `GET /api` — Authentification : `Authorization: Bearer <token>`

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion (retourne le token) |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/forgot-password` | Email de réinitialisation |
| POST | `/api/auth/reset-password` | Réinitialisation |
| GET | `/api/auth/me` | Profil + paramètres |
| POST | `/api/auth/email/verify` | Vérifier l'email (code 6 chiffres) |
| GET | `/api/dashboard` | Statistiques du tableau de bord |
| CRUD | `/api/houses` | Maisons (avec photo) |
| GET | `/api/houses/{id}/units` | Logements d'une maison |
| CRUD | `/api/units` | Logements |
| CRUD | `/api/tenants` | Locataires (avec photo + CNI) |
| CRUD | `/api/contracts` | Contrats (PDF auto) |
| GET | `/api/contracts/{id}/download` | Télécharger le contrat PDF |
| POST | `/api/contracts/{id}/renew` | Renouveler le contrat |
| GET | `/api/rent-dues` | Échéances (filtres : période, statut) |
| POST | `/api/rent-dues/generate` | Générer les échéances |
| POST | `/api/payments` | Enregistrer un paiement |
| GET | `/api/invoices/{id}` | Facture PDF |
| GET | `/api/receipts/{id}` | Reçu PDF (QR code) |
| CRUD | `/api/expenses` | Dépenses |
| GET | `/api/analytics` | Statistiques complètes |
| GET | `/api/analytics/export/pdf` | Rapport PDF |
| GET | `/api/analytics/export/excel` | Rapport Excel (CSV) |
| GET | `/api/search?q=` | Recherche instantanée |
| GET/PUT | `/api/settings` | Paramètres (logo, devise…) |
| GET | `/api/notifications` | Notifications |
| CRUD | `/api/users` | Utilisateurs (super-admin) |
| GET | `/api/audit-logs` | Journal d'audit (super-admin) |

Toutes les réponses sont paginées (`?per_page=15&page=2`) et formatées en JSON avec des **API Resources**.

---

## 📁 Structure du projet

```
immomanager/
├── backend/                  # API Laravel 12
│   ├── app/
│   │   ├── Console/Commands/ # rents:generate
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # 16 contrôleurs REST
│   │   │   ├── Middleware/       # RoleMiddleware
│   │   │   └── Resources/        # API Resources
│   │   ├── Models/           # 10 modèles Eloquent
│   │   ├── Policies/         # Politiques d'autorisation
│   │   └── Services/         # RentDue, Pdf, Notification, Stats, Audit, Upload
│   ├── database/
│   │   ├── factories/        # 8 factories
│   │   ├── migrations/       # 14 migrations
│   │   └── seeders/          # Rôles + données démo
│   ├── resources/views/pdf/  # Templates PDF (contrat, facture, reçu, analytics)
│   ├── routes/api.php        # Toutes les routes REST
│   └── tests/Feature/        # Tests PHPUnit
├── frontend/                 # Application React
│   ├── src/
│   │   ├── api/              # Client Axios + services par ressource
│   │   ├── components/       # UI (cards, modals…) + layout (sidebar, topbar)
│   │   ├── context/          # Auth, Thème, Toasts
│   │   ├── hooks/            # useApi, useDebounce
│   │   ├── pages/            # 25 pages (auth, CRUD, analytics…)
│   │   └── utils/            # Formatage (devise, dates, statuts)
│   └── Dockerfile + nginx.conf
├── docker-compose.yml        # Nginx + PHP-FPM + MySQL
└── README.md
```

---

## 📱 Application Mobile (React Native)

L'API est 100 % consommable par une application React Native :

- **Authentification** : `POST /api/auth/login` → token Bearer stocké dans AsyncStorage
- **Mêmes endpoints** que le web, mêmes formats JSON
- **PDF** : téléchargement via les endpoints `download` / `invoices` / `receipts`
- **Fichiers** : upload multipart (`photo`, `id_photo`, `logo`, `receipt`)

Exemple de configuration Axios :

```js
const api = axios.create({
  baseURL: 'https://votre-domaine.com/api',
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 🔒 Sécurité

- **Sanctum** : tokens Bearer + mode stateful (cookies) pour la SPA
- **CSRF** : protections Sanctum activées
- **Validation** : règles Laravel sur toutes les entrées (mots de passe, emails, fichiers)
- **Politiques d'autorisation** (Policies) + middleware de rôle
- **Protection SQL** : requêtes Eloquent paramétrées uniquement
- Mots de passe hachés (bcrypt), tokens révoqués à la déconnexion
- Uploads validés (types MIME, taille max 5 Mo)

---

## 🚢 Déploiement en production

1. Construisez les images : `docker compose build`
2. Configurez `.env` avec `APP_ENV=production`, `APP_DEBUG=false`, un vrai `APP_KEY`
3. Configurez le **SMTP** (`MAIL_MAILER=smtp`, hôtes, identifiants) pour les emails
4. Activez HTTPS (reverse proxy Traefik/Caddy/Nginx devant le conteneur frontend)
5. Mettez en place le **cron** pour la génération des loyers (voir plus haut)
6. Sauvegardez le volume `mysql_data` régulièrement

---

## 📄 Licence

Projet pédagogique et professionnel — libre d'utilisation.
Développé avec ❤️ pour les gestionnaires immobiliers.
