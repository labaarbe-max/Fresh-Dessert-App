# 👥 Rôles Utilisateurs

## 🔧 Admin
- Accès dashboard complet
- Gestion produits, livreurs, commandes
- Analytics et reporting
- Configuration système
- Permissions : Accès CRUD complet sur tous les endpoints

## 📋 Dispatcher
- Assignation des livraisons
- Création des tournées
- Suivi en temps réel
- Gestion des stocks
- Permissions : Accès CRUD sur orders, deliveries, stocks, products (lecture seule sur deliverers)

## 🚚 Livreur
- Application mobile dédiée
- GPS tracking en temps réel
- Gestion des livraisons du jour
- Notifications push
- Permissions : Accès lecture sur ses propres deliveries, mise à jour du statut uniquement

## 🛒 Client
- Création de commandes
- Suivi des livraisons
- Historique des commandes
- Permissions : Accès CRUD sur ses propres commandes uniquement

## 📊 Tableau des Permissions
| Rôle | Commandes | Tournées | Livreurs | Produits | Stocks | Stats |
|------|----------|----------|----------|----------|--------|-------|
| Admin | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ All |
| Dispatcher | ✅ CRUD | ✅ CRUD | ✅ R | ✅ CRUD | ✅ CRUD | ✅ All |
| Livreur | ✅ R | ✅ R (own) | ❌ | ✅ R | ✅ R | ❌ |
| Client | ✅ CRUD (own) | ❌ | ❌ | ✅ R | ❌ | ❌ |

**Légende :**
- **CRUD** : Create, Read, Update, Delete
- **R** : Read only (lecture seule)
- **(own)** : Accès limité à ses propres ressources uniquement