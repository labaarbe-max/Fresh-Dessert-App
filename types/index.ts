/**
 * Index des Types - Point d'entrée centralisé
 * Facilite les imports depuis n'importe où dans l'application
 */

// Database Types (Entités DB)
export * from './database.types';

// Backend Types (API, Services, Middlewares)
// Note: JWTPayload, ValidationResult, StatsParams sont déjà exportés par database.types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  AuthResult,
  RoleCheckResult,
  AuthenticatedRequest,
  MiddlewareOptions,
  RouteHandler,
  PublicHandler,
  StockServiceResult,
  StockValidationResult,
  RateLimitResult,
  OrderValidationResult,
  QueryOptions,
  CreateResult,
  UpdateResult,
  DeleteResult,
  RevenueStatsResult,
  TopProductsResult,
  DelivererPerformanceResult,
  // DashboardStatsResult, // Conflit avec DashboardStats de database.types
  ErrorContext,
  LoggedError
} from './backend.types';

// Frontend Types (React, Composants, Props)
// Note: DashboardStats est déjà exporté par database.types
export type {
  ProductCardProps,
  ProductListProps,
  OrderCardProps,
  OrderListProps,
  CartItemProps,
  CartSummaryProps,
  DelivererCardProps,
  DeliveryMapProps,
  AuthState,
  CartItem,
  CartState,
  OrderState,
  DeliveryState,
  UIState,
  Notification,
  LoginFormData,
  LoginFormErrors,
  RegisterFormData,
  RegisterFormErrors,
  ProductFormData,
  OrderFormData,
  AddressFormData,
  UseAuthReturn,
  UseCartReturn,
  UseOrdersReturn,
  UseProductsReturn,
  UseDeliveriesReturn,
  TableColumn,
  TableProps,
  PaginationProps,
  ProductFilters,
  OrderFilters,
  SearchState,
  // DashboardStats, // Conflit avec database.types
  ChartData,
  StatCardProps,
  ModalProps,
  ConfirmDialogProps,
  NavItem,
  BreadcrumbItem,
  LayoutProps
} from './frontend.types';

// Shared Types (DTOs, Enums, Constantes)
// Note: ValidationResult est déjà exporté par database.types
export type {
  UserRole,
  OrderStatus,
  DeliveryStatus,
  VehicleType,
  ProductCategory,
  PaymentStatus,
  StatsTimePeriod,
  LoginDTO,
  RegisterDTO,
  PasswordChangeDTO,
  CreateProductDTO,
  UpdateProductDTO,
  OrderItemDTO,
  CreateOrderDTO,
  UpdateOrderDTO,
  CreateDeliveryDTO,
  UpdateDeliveryDTO,
  CreateDelivererDTO,
  UpdateDelivererDTO,
  CreateAddressDTO,
  UpdateAddressDTO,
  CreateStockDTO,
  UpdateStockDTO,
  BulkStockDTO,
  PaginationParams,
  SortParams,
  FilterParams,
  QueryParams,
  ApiRequest,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponseType,
  ValidationRule,
  ValidationSchema,
  ValidationError,
  Coordinates,
  Location,
  Distance,
  NotificationPayload,
  PushNotificationConfig,
  FileUploadConfig,
  UploadedFile,
  AppSettings,
  UserPreferences,
  Nullable,
  Optional,
  Maybe,
  DeepPartial,
  RequireAtLeastOne,
  Timestamp,
  ID
} from './shared.types';

/**
 * USAGE EXAMPLES:
 * 
 * // Import depuis un fichier backend
 * import { User, ApiResponse, JWTPayload } from '@/types';
 * 
 * // Import depuis un composant React
 * import { Product, ProductCardProps, CartState } from '@/types';
 * 
 * // Import depuis n'importe où
 * import { OrderDTO, UserRole, ValidationResult } from '@/types';
 */
