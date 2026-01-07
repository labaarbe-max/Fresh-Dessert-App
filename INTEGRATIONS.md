# Integrations & External Services

Documentation des intégrations tierces et services externes pour Fresh Dessert App.

---

## 🔗 **Vue d'ensemble des intégrations**

### **📊 Catégories de services**
- **💰 Paiements** - Stripe, Apple Pay, Google Pay
- **📱 Notifications** - Firebase, Email, SMS
- **🗺️ Cartes & GPS** - Google Maps, OpenStreetMap
- **📦 Livraison** - API routing, tracking
- **📈 Analytics** - Google Analytics, Mixpanel
- **☁️ Cloud** - AWS/Google Cloud, Storage
- **🔐 Sécurité** - Auth0, OAuth providers

### **🎯 Objectifs d'intégration**
- **Expérience utilisateur** - Fluidité et rapidité
- **Automatisation** - Réduction actions manuelles
- **Scalabilité** - Support croissance
- **Fiabilité** - Services redondants
- **Sécurité** - Protection données

---

## 💳 **Intégrations Paiements**

### **🎯 Stripe (Principal)**
```typescript
// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Payment Intent Creation
export async function createPaymentIntent(amount: number, currency: string) {
  return await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: currency || 'eur',
    payment_method_types: ['card', 'apple_pay', 'google_pay'],
    automatic_payment_methods: { enabled: true },
  });
}
```

**Fonctionnalités :**
- ✅ **Cartes bancaires** - Visa, Mastercard, etc.
- ✅ **Apple Pay** - iOS natif
- ✅ **Google Pay** - Android natif
- ✅ **3D Secure** - Validation forte
- ✅ **Webhooks** - Notifications statut
- ✅ **Refunds** - Remboursements automatiques

**Webhooks configurés :**
- `payment_intent.succeeded` - Paiement réussi
- `payment_intent.payment_failed` - Échec paiement
- `charge.dispute.created` - Litige client

### **📱 Apple Pay / Google Pay**
```typescript
// Apple Pay Integration
const applePayRequest = {
  countryCode: 'FR',
  currencyCode: 'EUR',
  supportedNetworks: ['visa', 'masterCard', 'amex'],
  merchantCapabilities: ['supports3DS'],
  total: {
    label: 'Fresh Dessert App',
    amount: '25.50',
  },
};

// Google Pay Configuration
const googlePayConfiguration = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD'],
  tokenizationSpecification: {
    type: 'PAYMENT_GATEWAY',
    parameters: {
      gateway: 'stripe',
      'stripe:version': '2024-06-20',
    },
  },
};
```

---

## 📱 **Intégrations Notifications**

### **🔥 Firebase Cloud Messaging (FCM)**
```typescript
// Firebase Admin SDK
import admin from 'firebase-admin';

// Service Account Configuration
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Push Notification
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    token,
    notification: { title, body },
    data,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  return await admin.messaging().send(message);
}
```

**Types de notifications :**
- **Nouvelle commande** - Dispatcher
- **Assignation livraison** - Livreur
- **Statut commande** - Client
- **Promotions** - Tous utilisateurs
- **Alertes système** - Admin

### **📧 Email (SendGrid)**
```typescript
// SendGrid Integration
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Order Confirmation Email
export async function sendOrderConfirmation(email: string, order: Order) {
  const msg = {
    to: email,
    from: 'noreply@freshdessert.app',
    subject: `Commande #${order.id} confirmée`,
    templateId: process.env.SENDGRID_ORDER_TEMPLATE,
    dynamicTemplateData: {
      orderNumber: order.id,
      customerName: order.customer_name,
      items: order.items,
      total: order.total,
      deliveryTime: order.estimated_delivery,
    },
  };

  return await sgMail.send(msg);
}
```

### **📲 SMS (Twilio)**
```typescript
// Twilio SMS Integration
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Delivery Status SMS
export async function sendDeliverySMS(phoneNumber: string, message: string) {
  return await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
}
```

---

## 🗺️ **Intégrations Cartes & GPS**

### **🌍 Google Maps API**
```typescript
// Google Maps Configuration
const googleMapsClient = require('@googlemaps/google-maps-services-js');

const client = new Client({});

// Geocoding API
export async function geocodeAddress(address: string) {
  const response = await client.geocode({
    params: {
      address,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  return response.data.results[0].geometry.location;
}

// Directions API
export async function getDirections(origin: string, destination: string) {
  const response = await client.directions({
    params: {
      origin,
      destination,
      mode: 'driving',
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  return response.data.routes[0];
}
```

**Services utilisés :**
- **Geocoding API** - Adresses → Coordonnées
- **Directions API** - Itinéraires optimisés
- **Places API** - Recherche points d'intérêt
- **Static Maps** - Images cartes pour notifications
- **Distance Matrix** - Calcul distances multiples

### **📍 GPS Tracking**
```typescript
// Real-time Location Tracking
export class LocationTracker {
  private watchId: number | null = null;
  
  startTracking(callback: (position: GeolocationPosition) => void) {
    this.watchId = navigator.geolocation.watchPosition(
      callback,
      (error) => console.error('GPS Error:', error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }
  
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
```

---

## 📦 **Intégrations Livraison**

### **🚗 Route Optimization (ORS)**
```typescript
// OpenRouteService API
export async function optimizeRoute(deliveries: Delivery[]) {
  const coordinates = deliveries.map(d => [d.longitude, d.latitude]);
  
  const response = await fetch('https://api.openrouteservice.org/optimization', {
    method: 'POST',
    headers: {
      'Authorization': process.env.ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobs: deliveries.map((d, i) => ({
        id: i,
        location: [d.longitude, d.latitude],
        service: d.service_time || 300, // 5 minutes default
      })),
      vehicles: [{
        id: 1,
        start: [deliverer.start_lon, deliverer.start_lat],
        end: [deliverer.end_lon, deliverer.end_lat],
        capacity: [10], // Max deliveries
      }],
      geometry: true,
    }),
  });
  
  return await response.json();
}
```

### **📊 Delivery Tracking**
```typescript
// Real-time Delivery Updates
export class DeliveryTracker {
  async updateLocation(deliveryId: string, location: Location) {
    // Update in database
    await updateDeliveryLocation(deliveryId, location);
    
    // Notify client
    await sendPushNotification(
      delivery.customer_token,
      'Mise à jour livraison',
      `Votre livreur est à ${Math.round(distance)} minutes`,
      { type: 'location_update', location }
    );
    
    // Update dispatcher dashboard
    await broadcastToDispatchers({
      type: 'delivery_update',
      deliveryId,
      location,
      estimatedArrival: calculateETA(location, delivery.destination),
    });
  }
}
```

---

## 📈 **Intégrations Analytics**

### **📊 Google Analytics 4**
```typescript
// GA4 Event Tracking
export function trackEvent(eventName: string, parameters?: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      custom_parameter_1: parameters?.value,
      custom_parameter_2: parameters?.category,
    });
  }
}

// E-commerce Events
export function trackPurchase(order: Order) {
  trackEvent('purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: 'EUR',
    items: order.items.map(item => ({
      item_id: item.product_id,
      item_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}
```

### **📈 Mixpanel (Advanced Analytics)**
```typescript
// Mixpanel Integration
import mixpanel from 'mixpanel-browser';

mixpanel.init(process.env.MIXPANEL_TOKEN);

// User Properties
export function setUserProperties(user: User) {
  mixpanel.people.set({
    $email: user.email,
    $name: `${user.first_name} ${user.last_name}`,
    role: user.role,
    registration_date: user.created_at,
  });
}

// Funnel Tracking
export function trackFunnel(step: string, properties?: any) {
  mixpanel.track('delivery_funnel', {
    step,
    ...properties,
  });
}
```

---

## ☁️ **Intégrations Cloud Storage**

### **📁 AWS S3 (Product Images)**
```typescript
// AWS SDK v3
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload Product Image
export async function uploadProductImage(
  file: Buffer,
  filename: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `products/${filename}`,
    Body: file,
    ContentType: contentType,
  });

  return await s3Client.send(command);
}

// Get Signed URL for Display
export async function getImageUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

### **🗄️ Database Backups**
```typescript
// Automated Database Backups
export async function createDatabaseBackup() {
  const timestamp = new Date().toISOString();
  const filename = `backup-${timestamp}.sql`;
  
  // Export database
  const mysqldump = spawn('mysqldump', [
    `-h${process.env.DB_HOST}`,
    `-u${process.env.DB_USER}`,
    `-p${process.env.DB_PASSWORD}`,
    process.env.DB_NAME,
  ]);
  
  // Upload to S3
  const backupStream = mysqldump.stdout.pipe(
    new PassThrough()
  );
  
  await uploadToS3(backupStream, `backups/${filename}`);
  
  return { filename, timestamp };
}
```

---

## 🔐 **Intégrations Sécurité**

### **🛡️ reCAPTCHA v3**
```typescript
// Google reCAPTCHA v3
export async function verifyRecaptcha(token: string) {
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    }
  );
  
  const data = await response.json();
  
  return data.success && data.score > 0.5;
}
```

### **🔑 OAuth Providers**
```typescript
// Google OAuth Integration
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getGoogleAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return data;
}
```

---

## 🔄 **Webhooks & Event-Driven Architecture**

### **📡 Webhook Management**
```typescript
// Webhook Handler
export class WebhookManager {
  private static webhooks = new Map<string, string[]>();
  
  static register(event: string, url: string) {
    if (!this.webhooks.has(event)) {
      this.webhooks.set(event, []);
    }
    this.webhooks.get(event)!.push(url);
  }
  
  static async trigger(event: string, data: any) {
    const urls = this.webhooks.get(event) || [];
    
    const promises = urls.map(url =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
      }).catch(error => console.error(`Webhook failed for ${url}:`, error))
    );
    
    await Promise.allSettled(promises);
  }
}

// Event Examples
WebhookManager.register('order.created', 'https://api.analytics.com/events');
WebhookManager.register('delivery.completed', 'https://api.accounting.com/payments');
WebhookManager.register('user.registered', 'https://api.crm.com/contacts');
```

---

## 📊 **Monitoring & Logging**

### **📈 Sentry (Error Tracking)**
```typescript
// Sentry Integration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Custom Error Tracking
export function trackError(error: Error, context?: any) {
  Sentry.captureException(error, {
    tags: { feature: context?.feature },
    extra: context,
  });
}
```

### **📝 Logging (LogRocket)**
```typescript
// LogRocket Session Recording
import LogRocket from 'logrocket';

LogRocket.init(process.env.LOGROCKET_APP_ID);

// User Identification
export function identifyUser(user: User) {
  LogRocket.identify(user.id, {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role,
  });
}
```

---

## 🚀 **Performance Optimizations**

### **⚡ CDN Integration (Cloudflare)**
```typescript
// CDN Cache Headers
export function setCacheHeaders(response: Response, ttl: number) {
  response.headers.set('Cache-Control', `public, max-age=${ttl}`);
  response.headers.set('CDN-Cache-Control', `public, max-age=${ttl}`);
  response.headers.set('Edge-Cache-Control', `public, max-age=${ttl}`);
}

// Image Optimization
export function getOptimizedImageUrl(
  originalUrl: string,
  width: number,
  height: number,
  format: 'webp' | 'jpg' | 'png' = 'webp'
) {
  return `https://cdn.freshdessert.app/cdn-cgi/image/${format},w=${width},h=${height}/${originalUrl}`;
}
```

---

## 📋 **Configuration Environment Variables**

```bash
# .env.local
# Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_PROJECT_ID=fresh-dessert-app
FIREBASE_CLIENT_EMAIL=firebase@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSy...

# Email Service
SENDGRID_API_KEY=SG.xyz...

# SMS Service
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-3
AWS_S3_BUCKET=fresh-dessert-assets

# Analytics
GOOGLE_ANALYTICS_ID=G-...
MIXPANEL_TOKEN=xyz...

# Security
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIE...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOGROCKET_APP_ID=fresh-dessert/app
```

---

## 🔄 **Architecture d'Intégration**

### **📊 Schéma global**
```
Frontend Apps
    ↓
API Gateway (Next.js)
    ↓
┌─────────────────────────────────────────────────┐
│  Core Services (Node.js/MySQL)                 │
│  ├── Orders & Deliveries                        │
│  ├── User Management                           │
│  ├── Payment Processing                        │
│  └── Real-time Tracking                         │
└─────────────────────────────────────────────────┘
    ↓
External Integrations
├── 💳 Stripe (Payments)
├── 📱 Firebase (Notifications)
├── 🗺️ Google Maps (GPS)
├── 📧 SendGrid (Email)
├── 📲 Twilio (SMS)
├── 📈 Google Analytics
├── ☁️ AWS S3 (Storage)
└── 🛡️ Sentry (Monitoring)
```

---

## 🎯 **Best Practices**

### **🔒 Sécurité**
- **API Keys** - Stockées dans environment variables
- **Webhooks** - Validation signature secrète
- **Rate Limiting** - Protection contre abus
- **Data Encryption** - Chiffrement sensible

### **⚡ Performance**
- **Caching** - Stratégies multi-niveaux
- **CDN** - Distribution globale
- **Lazy Loading** - Optimisation ressources
- **Connection Pooling** - Base de données

### **🔄 Fiabilité**
- **Retry Logic** - Tentatives automatiques
- **Circuit Breaker** - Isolation services
- **Health Checks** - Monitoring continu
- **Fallbacks** - Alternatives automatiques

---

*Cette documentation servira de référence pour l'implémentation et la maintenance des intégrations tierces.*
