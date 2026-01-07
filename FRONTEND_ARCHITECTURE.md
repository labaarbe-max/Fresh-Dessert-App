# Frontend Architecture

Architecture frontend pour Fresh Dessert App - Web (Dispatcher/Admin) et Mobile (Livreurs/Clients).

---

## 📱 **Vue d'ensemble de l'architecture**

### **🌐 Applications cibles**
- **Frontend Web** - Interface dispatcher + admin (Next.js 16)
- **App Mobile Livreurs** - Application native (React Native)
- **App Mobile Clients** - Application native (React Native)

### **🔧 Stack technique**
- **Framework** - Next.js 16.1.1 avec App Router
- **Language** - TypeScript strict
- **Styling** - Tailwind CSS v4
- **State Management** - Context API + React Query
- **UI Components** - Headless UI + Lucide React
- **Animations** - Framer Motion
- **Forms** - React Hook Form + Zod

---

## 🏗️ **Structure des dossiers**

```
app/
├── (auth)/                    # Routes d'authentification
│   ├── login/
│   └── register/
├── (dashboard)/              # Dashboard principal
│   ├── dispatcher/           # Interface dispatcher
│   └── admin/               # Interface admin
├── (orders)/                 # Gestion des commandes
├── (deliveries)/             # Gestion des livraisons
├── (deliverers)/             # Gestion des livreurs
├── (products)/               # Gestion des produits
├── (stocks)/                 # Gestion des stocks
├── (stats)/                  # Statistiques et analytics
├── (profile)/                # Profil utilisateur
├── layout.tsx               # Layout racine
├── page.tsx                 # Page d'accueil/redirection
└── globals.css              # Styles globaux

components/
├── ui/                      # Composants UI réutilisables
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   └── index.ts
├── forms/                   # Composants de formulaire
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── OrderForm.tsx
│   └── DelivererForm.tsx
├── layout/                  # Composants de layout
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Navigation.tsx
│   └── Footer.tsx
├── charts/                  # Composants de graphiques
│   ├── RevenueChart.tsx
│   ├── DeliveryChart.tsx
│   └── PerformanceChart.tsx
└── common/                  # Composants communs
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── Notification.tsx

lib/
├── api/                     # Services API
│   ├── auth.ts
│   ├── orders.ts
│   ├── deliveries.ts
│   ├── deliverers.ts
│   ├── products.ts
│   ├── stocks.ts
│   └── stats.ts
├── hooks/                   # Hooks personnalisés
│   ├── useAuth.ts
│   ├── useOrders.ts
│   ├── useDeliveries.ts
│   └── useStats.ts
├── context/                 # Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── utils/                   # Utilitaires
│   ├── api.ts
│   ├── auth.ts
│   ├── validation.ts
│   └── formatting.ts
└── types/                   # Types TypeScript
    ├── auth.ts
    ├── order.ts
    ├── delivery.ts
    ├── deliverer.ts
    └── stats.ts

hooks/
├── useAuth.ts              # Hook authentification
├── useLocalStorage.ts      # Hook localStorage
├── useDebounce.ts         # Hook debounce
└── useWebSocket.ts        # Hook WebSocket

public/
├── icons/                 # Icônes et images
├── images/                # Images produits
└── favicon.ico
```

---

## 🔄 **State Management**

### **📦 Context API Structure**
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// NotificationContext.tsx
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### **🔄 React Query Configuration**
```typescript
// lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 🎨 **UI Components Architecture**

### **🧩 Design System**
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}
```

### **🎯 Composants métier**
```typescript
// components/orders/OrderCard.tsx
interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (status: OrderStatus) => void;
  onAssignDelivery?: (deliveryId: string) => void;
  showActions?: boolean;
}

// components/deliveries/DeliveryMap.tsx
interface DeliveryMapProps {
  deliveries: Delivery[];
  selectedDelivery?: Delivery;
  onSelectDelivery?: (delivery: Delivery) => void;
  realTime?: boolean;
}
```

---

## 🛣️ **Routing Strategy**

### **📱 Route Groups Next.js 13+**
```typescript
// app/(auth)/login/page.tsx - Login page
// app/(auth)/register/page.tsx - Register page

// app/(dashboard)/dispatcher/page.tsx - Dispatcher dashboard
// app/(dashboard)/admin/page.tsx - Admin dashboard

// app/(orders)/page.tsx - Orders list
// app/(orders)/[id]/page.tsx - Order details

// app/(deliveries)/page.tsx - Deliveries list
// app/(deliveries)/[id]/page.tsx - Delivery details
```

### **🔐 Protected Routes**
```typescript
// middleware.ts
import { withAuth } from '@/lib/auth';

export default withAuth((req) => {
  // Redirection selon le rôle
  const { user } = req.auth;
  
  if (user.role === 'dispatcher') {
    return NextResponse.redirect(new URL('/dashboard/dispatcher', req.url));
  }
  
  if (user.role === 'admin') {
    return NextResponse.redirect(new URL('/dashboard/admin', req.url));
  }
  
  return NextResponse.next();
}, ['dispatcher', 'admin']);
```

---

## 📱 **Mobile Apps Architecture**

### **📲 React Native Structure**
```
src/
├── screens/                 # Écrans mobiles
│   ├── auth/
│   ├── orders/
│   ├── deliveries/
│   └── profile/
├── components/              # Composants mobiles
├── navigation/              # Navigation React Navigation
├── services/                # Services API mobiles
├── store/                   # Redux Toolkit ou Zustand
├── utils/                   # Utilitaires mobiles
│   ├── storage.ts           # AsyncStorage
│   ├── location.ts          # GPS/Location
│   └── notifications.ts     # Push notifications
└── types/                   # Types mobiles
```

### **🔧 Services mobiles spécifiques**
```typescript
// services/location.ts
export class LocationService {
  static async getCurrentPosition(): Promise<LocationPosition>;
  static async watchPosition(callback: (position: LocationPosition) => void): Promise<void>;
  static async stopWatching(): Promise<void>;
}

// services/notifications.ts
export class NotificationService {
  static async requestPermission(): Promise<boolean>;
  static async scheduleNotification(notification: NotificationConfig): Promise<void>;
  static async showLocalNotification(notification: NotificationData): Promise<void>;
}
```

---

## 🔄 **Real-time Communication**

### **⚡ WebSocket Integration**
```typescript
// hooks/useWebSocket.ts
export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    setSocket(ws);
    
    return () => ws.close();
  }, [url]);
  
  return { socket, isConnected };
}
```

### **📡 Server-Sent Events**
```typescript
// hooks/useSSE.ts
export function useSSE(url: string, onMessage: (data: any) => void) {
  useEffect(() => {
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    return () => eventSource.close();
  }, [url, onMessage]);
}
```

---

## 🎯 **Performance Optimizations**

### **⚡ Code Splitting**
```typescript
// Dynamic imports for heavy components
const DeliveryMap = dynamic(() => import('@/components/deliveries/DeliveryMap'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const AnalyticsChart = dynamic(() => import('@/components/charts/AnalyticsChart'), {
  loading: () => <LoadingSpinner />,
});
```

### **🗄️ Caching Strategy**
```typescript
// React Query caching
const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

---

## 🛡️ **Security Considerations**

### **🔐 Client-side Security**
```typescript
// Token management
const useTokenManager = () => {
  const [token, setToken] = useState<string | null>(null);
  
  const setSecureToken = (newToken: string) => {
    // Store in httpOnly cookie via server action
    // or in secure localStorage with encryption
    setToken(newToken);
  };
  
  return { token, setSecureToken };
};
```

### **🔒 API Security**
```typescript
// Secure API calls
const apiClient = {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = getAuthToken();
    
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
};
```

---

## 📊 **Analytics & Monitoring**

### **📈 Performance Monitoring**
```typescript
// lib/analytics.ts
export class AnalyticsService {
  static trackPageView(page: string) {
    // Google Analytics or custom tracking
  }
  
  static trackUserAction(action: string, properties?: any) {
    // Track user interactions
  }
  
  static trackError(error: Error, context?: any) {
    // Error tracking (Sentry, etc.)
  }
}
```

### **🔍 Error Boundaries**
```typescript
// components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    AnalyticsService.trackError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

---

## 🚀 **Deployment Strategy**

### **🌐 Web Deployment**
- **Platform** - Vercel (recommended for Next.js)
- **Environment** - Production, Staging, Development
- **CI/CD** - GitHub Actions
- **Monitoring** - Vercel Analytics + Custom monitoring

### **📱 Mobile Deployment**
- **Platform** - App Store / Google Play
- **CI/CD** - GitHub Actions + Fastlane
- **OTA Updates** - CodePush (React Native)
- **Crash Reporting** - Sentry / Firebase Crashlytics

---

## 📋 **Development Workflow**

### **🔄 Git Workflow**
```bash
# Feature branches
git checkout -b feature/frontend-dispatcher
git checkout -b feature/mobile-deliverers
git checkout -b feature/mobile-clients

# Development
npm run dev              # Next.js development
npm run test             # Unit tests
npm run lint             # ESLint
npm run type-check       # TypeScript checking
```

### **🧪 Testing Strategy**
```typescript
// Unit tests with Jest + React Testing Library
// E2E tests with Playwright
// API tests with Supertest
```

---

## 🎯 **Next Steps**

### **📅 Phase 1 - Foundation (2 weeks)**
1. **Setup project structure**
2. **Implement authentication**
3. **Create basic UI components**
4. **Setup API services**

### **📅 Phase 2 - Web App (3 weeks)**
1. **Dispatcher dashboard**
2. **Admin interface**
3. **Order management**
4. **Delivery tracking**

### **📅 Phase 3 - Mobile Apps (4 weeks)**
1. **Deliverers app core features**
2. **Clients app core features**
3. **Real-time features**
4. **Push notifications**

---

*Cette architecture est conçue pour être scalable, maintenable et performante. Elle évoluera avec les besoins du projet.*
