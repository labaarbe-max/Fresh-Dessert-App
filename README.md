# 🍰 Fresh Dessert App - Plateforme Professionnelle

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Security](https://img.shields.io/badge/security-A%2B-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)

> Solution complète pour la gestion sécurisée des livraisons de desserts frais

---

## 🎯 Vue d'ensemble

Application full-stack Next.js pour la gestion de livraisons de desserts avec :
- **26 API Routes** sécurisées
- **8 Tables** MySQL optimisées
- **Dashboard Admin** en temps réel
- **Authentification JWT** robuste
- **Rate Limiting** avec Upstash Redis

---

## 🚀 Stack Technique

### Frontend
- **Next.js 16.1.1** (App Router)
- **React 19.2.3** + TypeScript
- **Tailwind CSS 4.x** + shadcn/ui
- **React Query** pour la gestion d'état
- **Recharts** pour les graphiques

### Backend
- **Next.js API Routes** (Node.js)
- **MySQL 8.0+** (mysql2/promise)
- **JWT Authentication** + bcryptjs
- **Upstash Redis** (Rate Limiting)
- **Zod** pour la validation

---

## 🔒 Sécurité

- ✅ Authentification JWT avec expiration 24h
- ✅ Rate limiting (100 req/min par IP)
- ✅ Protection CSRF, XSS, SQL Injection
- ✅ Validation des entrées avec Zod
- ✅ Permissions par rôle (admin, dispatcher, deliverer, client)
- ✅ Variables d'environnement sécurisées

---

## 📦 Installation

### Prérequis
- Node.js 18+ 
- MySQL 8.0+
- npm ou yarn

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/labaarbe-max/Fresh-Dessert-App.git
cd Fresh-Dessert-App

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos credentials

# 4. Créer la base de données
mysql -u root -p < database/schema.sql

# 5. Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

---

## 🗄️ Base de Données

### 8 Tables (tout en anglais)

1. **users** - Tous les utilisateurs
2. **deliverers** - Informations livreurs
3. **products** - Catalogue produits (25+ produits)
4. **addresses** - Adresses de livraison
5. **deliveries** - Tournées de livraison
6. **orders** - Commandes clients
7. **order_items** - Articles des commandes
8. **delivery_stocks** - Stocks par tournée

Voir `database/schema.sql` pour le schéma complet.

---

## 📚 Documentation Complète

### Architecture & Technique
- **[Architecture Générale](./ARCHITECTURE.md)** - Vue d'ensemble du système
- **[Backend API](./BACKEND_API_DOCUMENTATION.md)** - Documentation des 26 endpoints
- **[Frontend](./FRONTEND_ARCHITECTURE.md)** - Architecture Next.js & React
- **[Base de Données](./database/schema.sql)** - Schéma SQL complet

### Business & Workflows
- **[Flux Métier](./BUSINESS_WORKFLOWS.md)** - Processus de livraison
- **[Rôles Utilisateurs](./USER_ROLES.md)** - Permissions et accès
- **[Applications Mobiles](./MOBILE_APPS.md)** - Apps livreur & client (prévues)

### Projet & Sécurité
- **[Analyse du Projet](./PROJECT_ANALYSIS.md)** - Métriques et statistiques
- **[Sécurité](./SECURITY.md)** - Politique de sécurité
- **[Intégrations](./INTEGRATIONS.md)** - Services externes
- **[Changelog](./CHANGELOG.md)** - Historique des versions

---

## 🔑 Variables d'Environnement

Créer un fichier `.env.local` avec :

```env
# Database
DB_HOST=localhost
DB_USER=fresh_dessert_app
DB_PASSWORD=your_password
DB_NAME=fresh_dessert_app_db

# Authentication
JWT_SECRET=your_jwt_secret_min_32_characters
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

Voir `.env.example` pour la liste complète.

---

## 🎨 Fonctionnalités

### Dashboard Admin
- 📊 Statistiques en temps réel
- 📦 Gestion des commandes
- 🚚 Gestion des tournées
- 👥 Gestion des livreurs
- 🍰 Gestion des produits
- 📍 Gestion des adresses
- 📈 Analytics avancés

### API REST
- 🔐 Authentification JWT
- 👥 CRUD Livreurs
- 🍰 CRUD Produits
- 📦 CRUD Commandes
- 🚚 CRUD Tournées
- 📍 CRUD Adresses
- 📦 Gestion des stocks
- 📊 Statistiques complètes

---

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel

# 3. Configurer les variables d'environnement
# Via le dashboard Vercel
```

### Autres Plateformes
- **Railway** : Support MySQL intégré
- **Render** : Déploiement automatique
- **AWS** : EC2 + RDS

---

## 📊 Statistiques du Projet

- **Fichiers** : 150+ fichiers source
- **Endpoints API** : 26 routes sécurisées
- **Composants UI** : 15+ composants réutilisables
- **Tables DB** : 8 tables optimisées
- **Documentation** : 11 fichiers professionnels

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Labaarbe Max**
- GitHub: [@labaarbe-max](https://github.com/labaarbe-max)

---

## 🙏 Remerciements

- Next.js Team pour le framework
- shadcn pour les composants UI
- Vercel pour l'hébergement
- Upstash pour Redis

---

**Développé avec ❤️ pour Fresh Dessert** 🍰