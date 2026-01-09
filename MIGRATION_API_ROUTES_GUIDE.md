# 🚀 Guide de Migration des API Routes vers TypeScript

**Date :** 8 janvier 2026  
**Objectif :** Migrer les 26 API routes de JavaScript vers TypeScript

---

## 📋 **PATTERN DE MIGRATION**

### **Étape 1 : Renommer le fichier**
```bash
# Renommer .js en .ts
mv app/api/[route]/route.js app/api/[route]/route.ts
```

### **Étape 2 : Ajouter les imports TypeScript**
```typescript
// AVANT (JavaScript)
export async function GET(request) {
  // ...
}

// APRÈS (TypeScript)
import { NextRequest } from 'next/server';
import type { /* Types nécessaires */ } from '@/types';

export async function GET(request: NextRequest) {
  // ...
}
```

### **Étape 3 : Typer les données JSON**
```typescript
// AVANT
const { email, password } = await request.json();

// APRÈS
const { email, password } = await request.json() as LoginDTO;
```

### **Étape 4 : Corriger les appels aux fonctions error-handler**

**IMPORTANT :** Les signatures ont changé !

```typescript
// ❌ ANCIEN (ne fonctionne plus)
return handleApiError(new Error('message'), 'Context', 404, { meta });
return createSuccessResponse(data, 'message', 200, { meta });

// ✅ NOUVEAU (correct)
const error: any = new Error('message');
error.statusCode = 404;
return handleApiError(error, 'Context', { meta });

return createSuccessResponse(data, { message: 'message', ...meta }, 200);
```

---

## 🎯 **TYPES DISPONIBLES**

### **Types Database (database.types.ts)**
```typescript
User, Product, Order, Delivery, Deliverer, Address, DeliveryStock
CreateUserData, UpdateUserData, CreateProductData, etc.
```

### **Types Backend (backend.types.ts)**
```typescript
ApiResponse, ApiError, AuthResult, RateLimitResult
StockServiceResult, QueryOptions, etc.
```

### **Types Shared (shared.types.ts)**
```typescript
LoginDTO, RegisterDTO, PasswordChangeDTO
CreateProductDTO, UpdateProductDTO
CreateOrderDTO, UpdateOrderDTO
CreateDeliveryDTO, UpdateDeliveryDTO
CreateDelivererDTO, UpdateDelivererDTO
CreateAddressDTO, UpdateAddressDTO
CreateStockDTO, UpdateStockDTO
UserRole, OrderStatus, DeliveryStatus, etc.
```

---

## 📝 **EXEMPLES DE MIGRATION**

### **Exemple 1 : Route Auth (Login)**

```typescript
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getUserByEmail } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validateLoginData } from '@/lib/validation';
import { NextRequest } from 'next/server';
import type { LoginDTO } from '@/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResult = await checkRateLimit(request, authRateLimiter);
    if (!rateLimitResult.success) {
      const error: any = new Error('Too many requests');
      error.statusCode = 429;
      return handleApiError(error, 'Login', {
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      });
    }

    // Typer les données
    const { email, password } = await request.json() as LoginDTO;

    // Validation
    const validation = validateLoginData({ email, password });
    if (validation.error) {
      return handleApiError(validation.error, 'Login');
    }

    // Logique métier...
    const user = await getUserByEmail(email);
    if (!user) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      return handleApiError(error, 'Login');
    }

    // Retour succès
    return createSuccessResponse(
      { user, token },
      { message: 'Login successful' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Login');
  }
}
```

### **Exemple 2 : Route CRUD (Products GET)**

```typescript
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getProducts } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const category = searchParams.get('category');

    const products = await getProducts(activeOnly, category);

    return createSuccessResponse(
      products,
      { count: products.length },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Products');
  }
}
```

### **Exemple 3 : Route CRUD (Products POST)**

```typescript
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { createProduct } from '@/lib/db';
import { validateProductData } from '@/lib/validation';
import type { CreateProductDTO } from '@/types';

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json() as CreateProductDTO;

    // Validation
    const validation = validateProductData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Product');
    }

    const product = await createProduct(data);

    return createSuccessResponse(
      product,
      { message: 'Product created successfully' },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Product');
  }
}, ['admin', 'dispatcher']);
```

### **Exemple 4 : Route avec paramètre dynamique**

```typescript
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { NextRequest } from 'next/server';
import type { UpdateProductDTO } from '@/types';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const product = await getProductById(id);

    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      return handleApiError(error, 'Get Product');
    }

    return createSuccessResponse(product, null, 200);
  } catch (error) {
    return handleApiError(error, 'Get Product');
  }
}, ['admin', 'dispatcher']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const data = await request.json() as UpdateProductDTO;

    const product = await updateProduct(id, data);

    return createSuccessResponse(
      product,
      { message: 'Product updated successfully' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Product');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    await deleteProduct(id);

    return createSuccessResponse(
      { id },
      { message: 'Product deleted successfully' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Product');
  }
}, ['admin']);
```

---

## 🔧 **CORRECTIONS COMMUNES**

### **1. Erreurs avec handleApiError**

```typescript
// ❌ ERREUR
return handleApiError(new Error('message'), 'Context', 404);

// ✅ CORRECT
const error: any = new Error('message');
error.statusCode = 404;
return handleApiError(error, 'Context');
```

### **2. Erreurs avec createSuccessResponse**

```typescript
// ❌ ERREUR
return createSuccessResponse(data, 'message', 200, { meta });

// ✅ CORRECT
return createSuccessResponse(data, { message: 'message', ...meta }, 200);
```

### **3. Typage des paramètres de route**

```typescript
// Pour les routes dynamiques [id]
export const GET = withAuth(async (request, user, { params }) => {
  const id = parseInt(params.id); // params.id est string
  // ...
}, ['admin']);
```

---

## 📊 **LISTE DES 26 ROUTES À MIGRER**

### **✅ Migrées (2/26)**
- [x] `app/api/auth/login/route.ts`
- [x] `app/api/auth/register/route.ts`

### **⚠️ À Migrer (24/26)**

**Auth (1)**
- [ ] `app/api/auth/change-password/route.js`

**Products (3)**
- [ ] `app/api/products/route.js` (GET, POST)
- [ ] `app/api/products/[id]/route.js` (GET, PUT, DELETE)

**Orders (2)**
- [ ] `app/api/orders/route.js` (GET, POST)
- [ ] `app/api/orders/[id]/route.js` (GET, PUT, DELETE)

**Deliveries (2)**
- [ ] `app/api/deliveries/route.js` (GET, POST)
- [ ] `app/api/deliveries/[id]/route.js` (GET, PUT, DELETE)

**Deliverers (2)**
- [ ] `app/api/deliverers/route.js` (GET, POST)
- [ ] `app/api/deliverers/[id]/route.js` (GET, PUT, DELETE)

**Addresses (2)**
- [ ] `app/api/addresses/route.js` (GET, POST)
- [ ] `app/api/addresses/[id]/route.js` (GET, PUT, DELETE)

**Stocks (3)**
- [ ] `app/api/stocks/route.js` (GET, POST)
- [ ] `app/api/stocks/[id]/route.js` (GET, PUT, DELETE)
- [ ] `app/api/stocks/delivery/[id]/route.js` (GET)

**Stats (8)**
- [ ] `app/api/stats/route.js`
- [ ] `app/api/stats/dashboard/route.js`
- [ ] `app/api/stats/deliverers/route.js`
- [ ] `app/api/stats/geography/route.js`
- [ ] `app/api/stats/products/route.js`
- [ ] `app/api/stats/revenue/route.js`
- [ ] `app/api/stats/stocks/route.js`
- [ ] `app/api/stats/timeline/route.js`
- [ ] `app/api/stats/tours/route.js`

**Health (1)**
- [ ] `app/api/health/route.js`

---

## 🚀 **STRATÉGIE DE MIGRATION**

### **Option 1 : Migration Progressive (Recommandé)**
1. Migrer par catégorie (auth → products → orders → etc.)
2. Tester après chaque catégorie
3. Commit après chaque succès

### **Option 2 : Migration Complète**
1. Migrer toutes les routes d'un coup
2. Corriger toutes les erreurs TypeScript
3. Tester l'ensemble

### **Option 3 : Migration Automatisée**
1. Créer un script de migration
2. Appliquer le pattern automatiquement
3. Corriger manuellement les cas spéciaux

---

## ✅ **CHECKLIST PAR ROUTE**

Pour chaque route à migrer :

- [ ] Renommer `.js` → `.ts`
- [ ] Ajouter `import { NextRequest } from 'next/server'`
- [ ] Typer le paramètre `request: NextRequest`
- [ ] Ajouter les imports de types depuis `@/types`
- [ ] Typer les données `await request.json() as TypeDTO`
- [ ] Corriger les appels à `handleApiError`
- [ ] Corriger les appels à `createSuccessResponse`
- [ ] Vérifier la compilation `npx tsc --noEmit`
- [ ] Tester la route

---

## 🎯 **PROCHAINES ÉTAPES**

1. **Décider de la stratégie** (progressive, complète, ou automatisée)
2. **Migrer les routes** selon le pattern ci-dessus
3. **Tester** chaque route après migration
4. **Vérifier** la compilation TypeScript
5. **Commit** les changements

---

**Temps estimé par route :** 5-10 minutes  
**Temps total estimé :** 2-4 heures pour les 24 routes restantes

**Bon courage ! 🚀**
