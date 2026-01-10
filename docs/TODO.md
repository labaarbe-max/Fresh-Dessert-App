# TODO - Améliorations Post-Audit

> **Statut actuel :** TypeScript strict mode activé | Vulnérabilités SQL éliminées

Ce document liste les tâches restantes identifiées lors de l'audit complet du projet Fresh Dessert App.

---

## **PRIORITÉ HAUTE**

### 1. Remplacer `console.log` en production

**Problème :** Utilisation de `console.log` dans le code de production (2 occurrences dans `lib/error-handler.ts`)

**Objectif :** Implémenter un système de logging professionnel

**Fichiers concernés :**
- `lib/error-handler.ts` (lignes 248, 250)

**Solution recommandée :**
- [ ] Installer un package de logging professionnel (ex: `pino`, `winston`, ou `bunyan`)
- [ ] Créer un module `lib/logger.ts` avec différents niveaux de log
- [ ] Remplacer tous les `console.log` par le nouveau logger
- [ ] Configurer les logs pour production (JSON format, rotation, etc.)
- [ ] Intégrer avec un service de monitoring (optionnel : Sentry, LogRocket, DataDog)

**Exemple d'implémentation :**
```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined
});

// Utilisation
logger.info({ method: 'GET', url: '/api/orders' }, 'API Request');
logger.error({ error: err }, 'Database error');
```

**Estimation :** 2-3 heures

---

### 2. Ajouter des tests unitaires

**Problème :** Aucun test unitaire ou d'intégration dans le projet

**Objectif :** Couvrir au minimum 70% du code critique avec des tests

**Fichiers critiques à tester :**
- `lib/db.ts` - Toutes les fonctions de base de données
- `lib/stock-service.ts` - Logique métier des stocks
- `lib/validation.ts` - Validations des DTOs
- `lib/auth-middleware.ts` - Authentification et autorisation
- `lib/error-handler.ts` - Gestion des erreurs

**Solution recommandée :**
- [ ] Installer Jest + Testing Library (`npm install -D jest @types/jest ts-jest`)
- [ ] Configurer Jest pour TypeScript (`jest.config.js`)
- [ ] Créer des mocks pour MySQL2 et Redis
- [ ] Écrire des tests unitaires pour les fonctions critiques
- [ ] Écrire des tests d'intégration pour les routes API
- [ ] Configurer le coverage reporting
- [ ] Ajouter les tests au CI/CD pipeline

**Structure suggérée :**
```
__tests__/
├── unit/
│   ├── db.test.ts
│   ├── stock-service.test.ts
│   ├── validation.test.ts
│   └── auth-middleware.test.ts
├── integration/
│   ├── api/
│   │   ├── orders.test.ts
│   │   ├── products.test.ts
│   │   └── stats.test.ts
└── mocks/
    ├── mysql.ts
    └── redis.ts
```

**Exemples de tests prioritaires :**
```typescript
// __tests__/unit/db.test.ts
describe('getRevenueStats', () => {
  it('should return revenue data for valid period', async () => {
    // Test avec paramètres valides
  });
  
  it('should prevent SQL injection', async () => {
    // Test de sécurité
  });
});

// __tests__/unit/stock-service.test.ts
describe('StockService.validateStock', () => {
  it('should throw error when stock insufficient', async () => {
    // Test de validation
  });
});
```

**Estimation :** 1-2 semaines

---

## **PRIORITÉ MOYENNE**

### 3. Implémenter la validation des entrées côté API

**Problème :** Validation incomplète des données entrantes sur certaines routes

**Objectif :** Valider toutes les entrées utilisateur avant traitement

**Fichiers concernés :**
- Toutes les routes dans `app/api/`
- `lib/validation.ts` (à étendre)

**Solution recommandée :**
- [ ] Auditer toutes les routes API pour identifier les validations manquantes
- [ ] Étendre `lib/validation.ts` avec des validateurs supplémentaires
- [ ] Ajouter la validation Zod ou Joi pour les schémas complexes
- [ ] Valider les query params, body, et path params
- [ ] Ajouter des messages d'erreur explicites
- [ ] Documenter les schémas de validation

**Routes à auditer en priorité :**
- `app/api/orders/route.ts` - Validation des commandes
- `app/api/deliveries/route.ts` - Validation des livraisons
- `app/api/stocks/route.ts` - Validation des stocks
- `app/api/stats/*` - Validation des paramètres de stats

**Exemple avec Zod :**
```typescript
import { z } from 'zod';

const CreateOrderSchema = z.object({
  user_id: z.number().positive(),
  delivery_id: z.number().positive().optional(),
  items: z.array(z.object({
    product_id: z.number().positive(),
    quantity: z.number().min(1).max(1000),
    unit_price: z.number().positive()
  })).min(1),
  total_price: z.number().positive(),
  delivery_address: z.string().min(10).max(500)
});

// Utilisation dans la route
const validatedData = CreateOrderSchema.parse(await request.json());
```

**Estimation :** 3-5 jours

---

### 4. Optimiser les requêtes SQL

**Problème :** Certaines requêtes peuvent être lentes avec beaucoup de données

**Objectif :** Améliorer les performances des requêtes critiques

**Optimisations recommandées :**

#### A. Ajouter des indexes
- [ ] Analyser les requêtes lentes avec `EXPLAIN`
- [ ] Créer des indexes sur les colonnes fréquemment filtrées
- [ ] Créer des indexes composites pour les jointures

**Indexes suggérés :**
```sql
-- database/indexes.sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_delivery_id ON orders(delivery_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_deliveries_date_status ON deliveries(delivery_date, status);
CREATE INDEX idx_delivery_stocks_delivery_product ON delivery_stocks(delivery_id, product_id);
```

#### B. Implémenter le caching
- [ ] Installer Redis (déjà configuré pour rate limiting)
- [ ] Créer un module `lib/cache.ts`
- [ ] Cacher les résultats des stats (TTL: 5-15 minutes)
- [ ] Cacher les produits (TTL: 1 heure)
- [ ] Invalider le cache lors des mutations

**Exemple de cache :**
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export async function getCached<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return cached as T;
  
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Utilisation
const stats = await getCached(
  'dashboard:stats',
  () => getDashboardStats(),
  300 // 5 minutes
);
```

#### C. Optimiser les requêtes complexes
- [ ] Réduire les `LEFT JOIN` inutiles
- [ ] Utiliser des sous-requêtes optimisées
- [ ] Paginer les résultats volumineux
- [ ] Limiter les `SELECT *` aux colonnes nécessaires

**Estimation :** 1 semaine

---

## **PRIORITÉ BASSE**

### 5. Ajouter de la documentation

**Problème :** Manque de documentation pour les fonctions complexes

**Objectif :** Documenter toutes les fonctions publiques et la logique métier

**Fichiers à documenter en priorité :**
- `lib/db.ts` - Toutes les fonctions de requêtes
- `lib/stock-service.ts` - Logique métier
- `lib/auth-middleware.ts` - Middleware d'authentification
- Routes API complexes

**Solution recommandée :**
- [ ] Ajouter des JSDoc pour toutes les fonctions publiques
- [ ] Documenter les paramètres, types de retour, et exceptions
- [ ] Ajouter des exemples d'utilisation
- [ ] Créer un `API_DOCUMENTATION.md` détaillé
- [ ] Générer la documentation avec TypeDoc (optionnel)

**Exemple de documentation :**
```typescript
/**
 * Récupère les statistiques de revenus pour une période donnée
 * 
 * @param period - Période d'agrégation ('day' | 'week' | 'month' | 'year')
 * @param startDate - Date de début (format: 'YYYY-MM-DD' ou null)
 * @param endDate - Date de fin (format: 'YYYY-MM-DD' ou null)
 * 
 * @returns Objet contenant les périodes et les statistiques globales
 * @throws {DatabaseError} Si la requête échoue
 * 
 * @example
 * ```typescript
 * const stats = await getRevenueStats('month', '2024-01-01', '2024-01-31');
 * console.log(stats.global.total_revenue);
 * ``` 
 * 
 * @security Utilise des requêtes paramétrées pour prévenir les injections SQL
 */
export async function getRevenueStats(
  period = 'month', 
  startDate: string | null = null, 
  endDate: string | null = null
) {
  // ...
}
```

**Estimation :** 3-5 jours

---

## **Récapitulatif des estimations**

| Tâche | Priorité | Estimation | Complexité |
|-------|----------|------------|------------|
| Logging professionnel | | 2-3h | Faible |
| Tests unitaires | | 1-2 semaines | Moyenne |
| Validation des entrées | | 3-5 jours | Moyenne |
| Optimisation SQL | | 1 semaine | Élevée |
| Documentation | | 3-5 jours | Faible |

**Total estimé :** 3-4 semaines de travail

---

## **Ordre d'exécution recommandé**

1. **Semaine 1 :** Logging + Début des tests unitaires
2. **Semaine 2 :** Finaliser les tests + Validation des entrées
3. **Semaine 3 :** Optimisation SQL (indexes + caching)
4. **Semaine 4 :** Documentation + Finalisation

---

## **Tâches déjà complétées**

- [x] Migration complète vers TypeScript
- [x] Activation du mode strict TypeScript
- [x] Élimination des vulnérabilités SQL injection
- [x] Remplacement de `@ts-expect-error` par des types appropriés
- [x] Remplacement de `console.error` par `logError` dans `lib/db.ts`
- [x] Création des helpers MySQL2 pour la sécurité des types

---

**Dernière mise à jour :** 9 janvier 2026  
**Branche actuelle :** `feature/remove-console.log`  
**Prochaine étape :** Implémenter le système de logging professionnel
