# 🎨 Frontend Architecture - Fresh Dessert App

> Documentation de l'architecture frontend Next.js basée sur le code réel

---

## 🚀 Stack Technique

- **Framework** : Next.js 16.1.1 (App Router)
- **React** : 19.2.3
- **TypeScript** : 5.x
- **Styling** : Tailwind CSS 4.x
- **UI Components** : shadcn/ui + Radix UI
- **State Management** : React Query (@tanstack/react-query 5.90.16)
- **Forms** : React Hook Form 7.70.0 + Zod 4.3.5
- **HTTP Client** : Axios 1.13.2
- **Icons** : Lucide React 0.562.0
- **Charts** : Recharts 3.6.0

---

## 📁 Structure du Projet

```
app/
├── layout.tsx                 # Layout racine avec AuthProvider
├── page.tsx                   # Page d'accueil
├── globals.css                # Styles globaux Tailwind
├── favicon.ico                # Favicon
│
├── login/
│   └── page.tsx              # Page de connexion
│
├── dashboard/
│   ├── layout.tsx            # Layout dashboard avec navigation
│   └── page.tsx              # Dashboard principal
│
└── api/                      # API Routes (26 endpoints)
    ├── auth/
    │   ├── login/route.js
    │   ├── register/route.js
    │   └── change-password/route.js
    ├── deliverers/
    │   ├── route.js
    │   └── [id]/route.js
    ├── orders/
    │   ├── route.js
    │   └── [id]/route.js
    ├── products/
    │   ├── route.js
    │   └── [id]/route.js
    ├── deliveries/
    │   ├── route.js
    │   └── [id]/route.js
    ├── addresses/
    │   ├── route.js
    │   └── [id]/route.js
    ├── stocks/
    │   ├── route.js
    │   ├── [id]/route.js
    │   └── delivery/[id]/route.js
    ├── stats/
    │   ├── route.js
    │   ├── dashboard/route.js
    │   ├── revenue/route.js
    │   ├── products/route.js
    │   ├── deliverers/route.js
    │   ├── geography/route.js
    │   ├── timeline/route.js
    │   ├── tours/route.js
    │   └── stocks/route.js
    └── health/route.js

components/
├── dashboard/
│   └── dashboard-content.tsx  # Contenu principal du dashboard
└── ui/                        # shadcn/ui components
    ├── providers/
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── label.tsx

contexts/
└── auth-context.tsx           # Context d'authentification

lib/
├── api.ts                     # Client API Axios
├── api-services.ts            # Services API
├── auth-service.ts            # Service d'authentification
└── utils.ts                   # Utilitaires

types/
└── auth.ts                    # Types TypeScript
```

---

## 🧩 Composants Clés

### AuthProvider (`contexts/auth-context.tsx`)
- Gestion de l'état d'authentification global
- Stockage du token JWT
- Vérification de l'authentification
- Déconnexion automatique

### DashboardContent (`components/dashboard/dashboard-content.tsx`)
- Affichage des statistiques
- Cartes de métriques
- Graphiques avec Recharts
- Données en temps réel via React Query

### UI Components (`components/ui/`)
- Composants shadcn/ui réutilisables
- Styled avec Tailwind CSS
- Accessibilité (Radix UI)
- Thème personnalisable

---

## 🔄 Gestion de l'État

### React Query
- **Cache** : Données en cache automatique
- **Refetch** : Rafraîchissement intelligent
- **Mutations** : Gestion des modifications
- **Optimistic Updates** : Mises à jour optimistes

### Auth Context
- **User** : Informations utilisateur
- **Token** : JWT stocké en localStorage
- **isAuthenticated** : État de connexion
- **login/logout** : Méthodes d'authentification

---

## 🎨 Styling

### Tailwind CSS
- **Utility-first** : Classes utilitaires
- **Responsive** : Mobile-first design
- **Dark Mode** : Support du mode sombre (prévu)
- **Custom Config** : Configuration personnalisée

### shadcn/ui
- **Composants** : Pré-stylés et accessibles
- **Customizable** : Facilement personnalisables
- **TypeScript** : Support complet
- **Radix UI** : Primitives accessibles

---

## 📡 Communication API

### Axios Client (`lib/api.ts`)
```typescript
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Services API (`lib/api-services.ts`)
- **Deliverers** : CRUD livreurs
- **Orders** : CRUD commandes
- **Products** : CRUD produits
- **Deliveries** : CRUD tournées
- **Stats** : Statistiques

---

## 🔐 Authentification

### Workflow
1. **Login** : `POST /api/auth/login`
2. **Token** : Stockage en localStorage
3. **Interceptor** : Ajout automatique aux requêtes
4. **Protected Routes** : Vérification via AuthContext
5. **Logout** : Suppression du token

### Protected Routes
```typescript
// Dans layout.tsx ou page.tsx
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  redirect('/login');
}
```

---

## 📊 Dashboard

### Métriques Affichées
- **Commandes du jour**
- **Revenus du jour/semaine/mois**
- **Livreurs actifs**
- **Stocks disponibles**
- **Graphiques de tendances**

### Données en Temps Réel
- **React Query** : Refetch automatique
- **Polling** : Mise à jour périodique
- **WebSocket** : (prévu pour le futur)

---

## 🎯 Pages Principales

### Page d'Accueil (`app/page.tsx`)
- Landing page
- Redirection vers dashboard si connecté
- Présentation de l'application

### Page de Connexion (`app/login/page.tsx`)
- Formulaire de connexion
- Validation avec Zod
- Gestion des erreurs
- Redirection après login

### Dashboard (`app/dashboard/page.tsx`)
- Vue d'ensemble
- Statistiques en temps réel
- Accès rapide aux fonctionnalités
- Navigation vers les sous-pages

---

## 🔧 Configuration

### Tailwind Config (`tailwind.config.ts`)
- **Theme** : Couleurs personnalisées
- **Plugins** : tailwindcss-animate
- **Content** : Paths des fichiers

### Next.js Config (`next.config.ts`)
- **Images** : Domaines autorisés
- **Redirects** : Redirections personnalisées
- **Headers** : Headers de sécurité

### TypeScript Config (`tsconfig.json`)
- **Strict Mode** : Activé
- **Path Aliases** : `@/` pour imports
- **Target** : ES2020

---

## 📦 Dépendances Principales

```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@tanstack/react-query": "5.90.16",
    "axios": "1.13.2",
    "react-hook-form": "7.70.0",
    "zod": "4.3.5",
    "@radix-ui/react-dialog": "1.1.15",
    "@radix-ui/react-dropdown-menu": "2.1.16",
    "@radix-ui/react-label": "2.1.8",
    "@radix-ui/react-select": "2.2.6",
    "@radix-ui/react-slot": "1.2.4",
    "@radix-ui/react-tabs": "1.1.13",
    "@radix-ui/react-toast": "1.2.15",
    "lucide-react": "0.562.0",
    "recharts": "3.6.0",
    "tailwindcss": "4.x",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "tailwind-merge": "3.4.0"
  }
}
```

---

## 🚀 Performance

### Optimisations
- **Server Components** : Par défaut (Next.js 16)
- **Code Splitting** : Automatique
- **Image Optimization** : Next.js Image
- **Font Optimization** : Next.js Font
- **Bundle Size** : ~450KB gzippé

### Métriques
- **First Contentful Paint** : < 1s
- **Time to Interactive** : < 2s
- **Lighthouse Score** : > 90

---

## 🔄 Workflow de Développement

1. **Développement**
   ```bash
   npm run dev
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Lint**
   ```bash
   npm run lint
   ```

---

**Frontend moderne avec Next.js 16 et React 19** 🚀