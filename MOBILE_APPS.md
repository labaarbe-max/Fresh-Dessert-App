# 📱 Mobile Applications - Fresh Dessert App

> Documentation des applications mobiles (prévues pour développement futur)

---

## 🎯 Vue d'ensemble

L'écosystème Fresh Dessert App comprendra deux applications mobiles dédiées :

1. **App Livreur** - Pour les livreurs (priorité haute)
2. **App Client** - Pour les clients (priorité moyenne)

---

## 🚚 Application Livreur

### Stack Technique Recommandée

- **Framework** : React Native (Expo)
- **Navigation** : React Navigation 6.x
- **State Management** : React Query + Zustand
- **API Client** : Axios
- **Maps** : React Native Maps
- **Authentification** : JWT + Biometric Auth
- **Notifications** : Firebase Cloud Messaging
- **Offline Support** : AsyncStorage + React Query Persistence

### Fonctionnalités Principales

#### 1. Authentification
- Connexion avec email/mot de passe
- Authentification biométrique (Touch ID / Face ID)
- Token JWT stocké de manière sécurisée
- Déconnexion automatique après inactivité

#### 2. Dashboard Livreur
- Vue d'ensemble de la journée
- Tournée du jour avec liste des commandes
- Statistiques personnelles (livraisons, revenus, rating)
- Statut de disponibilité (disponible/occupé/pause)

#### 3. Gestion des Tournées
- Liste des commandes assignées
- Détails de chaque commande :
  - Nom du client
  - Adresse complète
  - Téléphone
  - Instructions de livraison
  - Produits commandés
  - Montant total
- Navigation GPS vers l'adresse
- Appel direct au client
- Changement de statut (en cours, livrée, problème)

#### 4. Gestion des Stocks
- Stocks assignés au début de la tournée
- Stocks actuels en temps réel
- Historique des ventes
- Alertes de stock faible
- Décrémentation automatique lors de la livraison

#### 5. GPS & Tracking
- Position en temps réel envoyée au serveur
- Navigation turn-by-turn vers les adresses
- Optimisation de l'itinéraire
- Historique des trajets

#### 6. Notifications Push
- Nouvelle commande assignée
- Modification de commande
- Message du dispatcher
- Rappels de livraison

#### 7. Mode Hors-ligne
- Consultation des commandes en cache
- Synchronisation automatique à la reconnexion
- Indicateur de statut de connexion

### Architecture de l'App

```
app/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── BiometricSetupScreen.tsx
│   ├── dashboard/
│   │   └── DashboardScreen.tsx
│   ├── deliveries/
│   │   ├── DeliveryListScreen.tsx
│   │   ├── DeliveryDetailScreen.tsx
│   │   └── NavigationScreen.tsx
│   ├── stocks/
│   │   └── StocksScreen.tsx
│   └── profile/
│       └── ProfileScreen.tsx
├── components/
│   ├── DeliveryCard.tsx
│   ├── StockItem.tsx
│   ├── MapView.tsx
│   └── StatusBadge.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── location.ts
│   └── notifications.ts
├── hooks/
│   ├── useDeliveries.ts
│   ├── useStocks.ts
│   └── useLocation.ts
└── utils/
    ├── storage.ts
    └── navigation.ts
```

### API Endpoints Utilisés

- `POST /api/auth/login` - Connexion
- `GET /api/deliveries` - Tournées du livreur
- `GET /api/deliveries/:id` - Détails tournée
- `PUT /api/deliveries/:id` - Mise à jour statut
- `GET /api/stocks/delivery/:id` - Stocks de la tournée
- `POST /api/deliverer/gps-update` - Mise à jour GPS
- `GET /api/deliverer/profile` - Profil du livreur

### Workflow Type

1. **Début de journée**
   - Livreur se connecte
   - Consulte sa tournée du jour
   - Vérifie ses stocks assignés
   - Active le mode "disponible"

2. **Pendant la tournée**
   - Navigue vers chaque adresse
   - Marque les livraisons comme "en cours"
   - Livre les produits
   - Marque comme "livrée"
   - Stocks décrémentés automatiquement
   - Passe à la commande suivante

3. **Fin de journée**
   - Marque la tournée comme "terminée"
   - Consulte les statistiques
   - Se déconnecte

---

## 🛒 Application Client (Futur)

### Fonctionnalités Prévues

1. **Catalogue Produits**
   - Navigation par catégories
   - Recherche de produits
   - Détails produits (prix, allergènes, description)

2. **Panier & Commande**
   - Ajout/suppression de produits
   - Gestion des quantités
   - Calcul du total en temps réel
   - Validation de commande

3. **Gestion des Adresses**
   - Ajout d'adresses de livraison
   - Adresse par défaut
   - Instructions de livraison

4. **Suivi de Commande**
   - Statut en temps réel
   - Position du livreur sur carte
   - Estimation de l'heure d'arrivée
   - Notifications de progression

5. **Historique & Profil**
   - Historique des commandes
   - Commandes favorites
   - Gestion du profil
   - Moyens de paiement

---

## 🔧 Configuration Technique

### Variables d'environnement

```env
# API
API_URL=https://api.freshdessert.app
API_TIMEOUT=30000

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=fresh-dessert-app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# App
APP_VERSION=1.0.0
ENVIRONMENT=production
```

### Dépendances Principales

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "expo": "^50.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "react-native-maps": "^1.10.0",
    "react-native-geolocation-service": "^5.3.0",
    "@react-native-firebase/messaging": "^19.0.0",
    "react-native-biometrics": "^3.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "zustand": "^4.5.0"
  }
}
```

---

## 📋 Roadmap de Développement

### Phase 1 : App Livreur MVP (6-8 semaines)
- ✅ Semaine 1-2 : Setup projet + Authentification
- ✅ Semaine 3-4 : Dashboard + Liste des tournées
- ✅ Semaine 5-6 : GPS + Navigation + Stocks
- ✅ Semaine 7-8 : Notifications + Tests + Déploiement

### Phase 2 : App Livreur Avancée (4 semaines)
- Mode hors-ligne complet
- Optimisation de l'itinéraire
- Analytics avancés
- Chat avec dispatcher

### Phase 3 : App Client (8-10 semaines)
- Setup + Authentification
- Catalogue + Panier
- Commande + Paiement
- Suivi en temps réel
- Tests + Déploiement

---

## 🚀 Déploiement

### iOS (App Store)
- **Compte** : Apple Developer Program (99$/an)
- **Certificats** : Distribution Certificate + Provisioning Profile
- **Review** : 1-3 jours en moyenne
- **Version minimale** : iOS 14+

### Android (Google Play)
- **Compte** : Google Play Console (25$ one-time)
- **Signature** : App Signing by Google Play
- **Review** : Quelques heures
- **Version minimale** : Android 8.0+

---

## 📊 Métriques de Succès

### App Livreur
- Taux d'adoption : 100% des livreurs
- Temps moyen de livraison : -20%
- Erreurs de livraison : -50%
- Satisfaction livreurs : >4.5/5

### App Client
- Téléchargements : 1000+ premier mois
- Taux de conversion : >15%
- Commandes via app : >60%
- Satisfaction clients : >4.5/5

---

**Status : En planification - Développement prévu Q1 2026** 🚀
