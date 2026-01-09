/**
 * Types Frontend - Composants React, Props, States, Hooks
 * Utilisé pour l'interface utilisateur côté client
 */

import { User, Product, Order, Deliverer, Address, Delivery, DeliveryStock } from './database.types';

// ============================================================================
// COMPONENT PROPS
// ============================================================================

// Product Components
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number, quantity: number) => void;
  showActions?: boolean;
}

export interface ProductListProps {
  products: Product[];
  category?: string;
  onProductClick?: (product: Product) => void;
}

// Order Components
export interface OrderCardProps {
  order: Order;
  onViewDetails?: (orderId: number) => void;
  showStatus?: boolean;
}

export interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  onOrderClick?: (order: Order) => void;
}

// Cart Components
export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

export interface CartSummaryProps {
  items: CartItem[];
  total: number;
  onCheckout: () => void;
}

// Deliverer Components
export interface DelivererCardProps {
  deliverer: Deliverer;
  onSelect?: (delivererId: number) => void;
  showPerformance?: boolean;
}

export interface DeliveryMapProps {
  deliveries: Delivery[];
  deliverers: Deliverer[];
  onDeliveryClick?: (delivery: Delivery) => void;
}

// ============================================================================
// STATE TYPES
// ============================================================================

// Auth State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Cart State
export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

// Order State
export interface OrderState {
  currentOrder: Order | null;
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

// Delivery State
export interface DeliveryState {
  currentDelivery: Delivery | null;
  deliveries: Delivery[];
  stocks: DeliveryStock[];
  isLoading: boolean;
  error: string | null;
}

// UI State
export interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  activeTab: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

// Login Form
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Register Form
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'client' | 'deliverer';
}

export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  general?: string;
}

// Product Form
export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  allergens?: string;
  image_url?: string;
  emoji?: string;
  active: boolean;
}

// Order Form
export interface OrderFormData {
  delivery_address: string;
  delivery_date: string;
  notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

// Address Form
export interface AddressFormData {
  label: string;
  street_address: string;
  city: string;
  postal_code: string;
  floor?: string;
  door_number?: string;
  building_code?: string;
  intercom?: string;
  delivery_instructions?: string;
  is_default: boolean;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

// useAuth Hook
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  error: string | null;
}

// useCart Hook
export interface UseCartReturn {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

// useOrders Hook
export interface UseOrdersReturn {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (orderId: number) => Promise<void>;
  createOrder: (data: OrderFormData) => Promise<Order>;
  cancelOrder: (orderId: number) => Promise<void>;
}

// useProducts Hook
export interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: (category?: string) => Promise<void>;
  fetchProductById: (productId: number) => Promise<Product>;
}

// useDeliveries Hook (pour les livreurs)
export interface UseDeliveriesReturn {
  deliveries: Delivery[];
  currentDelivery: Delivery | null;
  stocks: DeliveryStock[];
  isLoading: boolean;
  error: string | null;
  fetchDeliveries: () => Promise<void>;
  fetchDeliveryById: (deliveryId: number) => Promise<void>;
  updateDeliveryStatus: (deliveryId: number, status: string) => Promise<void>;
  updateStock: (stockId: number, quantity: number) => Promise<void>;
}

// ============================================================================
// TABLE/LIST TYPES
// ============================================================================

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// ============================================================================
// FILTER/SEARCH TYPES
// ============================================================================

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  activeOnly?: boolean;
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  delivererId?: number;
}

export interface SearchState {
  query: string;
  filters: Record<string, any>;
  results: any[];
  isSearching: boolean;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeDeliveries: number;
  pendingOrders: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// ============================================================================
// MODAL/DIALOG TYPES
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

// ============================================================================
// LAYOUT TYPES
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: Array<'admin' | 'dispatcher' | 'deliverer' | 'client'>;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}
