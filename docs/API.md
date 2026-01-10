# API Documentation - Complex Functions and Modules

## Overview

This document provides detailed documentation for complex functions and modules in the Fresh Dessert App codebase.

---

## Database Service (`lib/db.ts`)

### Connection Pool Configuration

The database connection pool is configured with:
- `connectionLimit: 10` - Maximum concurrent connections
- `waitForConnections: true` - Queue requests when limit is reached
- `queueLimit: 0` - Unlimited queue size

### Complex Functions

#### `createOrder(orderData: any)`

**Purpose:** Creates a new order with stock management and transaction handling.

**Process:**
1. Begins a database transaction
2. Calculates total price from product prices
3. Inserts order record
4. Inserts order items
5. Decrements stock via `StockService.decrementStock()`
6. Commits transaction

**Transaction Safety:** All operations are atomic - if any step fails, the entire transaction is rolled back.

**Usage:**
```typescript
const order = await createOrder({
  user_id: 1,
  items: [{ product_id: 1, quantity: 2 }],
  delivery_address: '123 Main St',
  delivery_id: 1
});
```

#### `getOrderById(orderId, userId, role)`

**Purpose:** Retrieves a single order with items and user information.

**Security:**
- If `role === 'client'`, only returns orders belonging to `userId`
- Prevents unauthorized access to other users' orders

**Returns:** Order object with nested items array containing product details.

#### `getDeliveryById(deliveryId, delivererId, role)`

**Purpose:** Retrieves a delivery with associated orders and deliverer details.

**Security:**
- If `role === 'deliverer'`, only returns deliveries assigned to `delivererId`

**Returns:** Delivery object with nested orders array.

---

## Stock Service (`lib/stock-service.ts`)

### Overview

The `StockService` class handles all stock-related business logic with atomic operations to prevent race conditions.

### Key Methods

#### `decrementStock(deliveryId, productId, quantity)`

**Purpose:** Atomically decrements stock and increments sold quantity.

**Process:**
1. Validates parameters
2. Checks stock availability
3. Performs atomic UPDATE with condition `current_quantity >= quantity`
4. Verifies update succeeded (prevents concurrent modification)
5. Returns updated stock values

**Atomic Safety:** Uses SQL condition to ensure decrement only happens if sufficient stock exists.

**Error Cases:**
- Invalid parameters → Error
- Insufficient stock → Error with current stock level
- Concurrent modification → Error

#### `checkStockAvailability(deliveryId, productId, quantity)`

**Purpose:** Checks if sufficient stock exists without modifying it.

**Returns:** `{ available: boolean, currentStock: number }`

#### `processOrderStocks(deliveryId, items)`

**Purpose:** Processes stock decrements for multiple items in a single order.

**Process:** Iterates through items and calls `decrementStock()` for each.

**Returns:** Array of results with decremented quantities and remaining stock.

---

## Validation Service (`lib/validation.ts`)

### Overview

All validation is handled using Zod schemas for type-safe input validation.

### Validation Pattern

```typescript
// 1. Define schema
export const orderSchema = z.object({
  user_id: z.number().positive(),
  items: z.array(orderItemSchema).min(1),
  // ...
});

// 2. Validation function
export function validateOrderData(data: unknown): ValidationResult {
  const result = orderSchema.safeParse(data);
  return result.success
    ? { valid: true, data: result.data }
    : { error: new ValidationError(result.error.message) };
}

// 3. Use in API route
const validation = validateOrderData(payload);
if (validation.error) {
  return handleApiError(validation.error, 'Create Order');
}
const data = validation.data as z.infer<typeof orderSchema>;
```

### Available Schemas

- `loginSchema` - User login
- `registerSchema` - User registration
- `passwordChangeSchema` - Password change
- `delivererSchema` - Deliverer creation
- `delivererUpdateSchema` - Deliverer update
- `stockSchema` - Stock creation
- `stockUpdateSchema` - Stock update
- `bulkStockSchema` - Bulk stock creation
- `productSchema` - Product creation
- `orderSchema` - Order creation
- `orderUpdateSchema` - Order update
- `deliverySchema` - Delivery creation
- `deliveryUpdateSchema` - Delivery update
- `addressSchema` - Address creation
- `addressUpdateSchema` - Address update

---

## Error Handling (`lib/error-handler.ts`)

### `handleApiError(error, context)`

**Purpose:** Centralized error handling for API routes.

**Process:**
1. Logs error with context using `logError()`
2. Returns appropriate HTTP response based on error type
3. Includes error details in development mode

**Response Format:**
```typescript
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: any
  }
}
```

---

## Authentication Middleware (`lib/api-middleware.ts`)

### `withAuth(handler, allowedRoles)`

**Purpose:** Wraps API route handlers with authentication and authorization.

**Process:**
1. Extracts JWT token from Authorization header
2. Verifies token and extracts user info
3. Checks if user has required role
4. Calls handler with user context

**Usage:**
```typescript
export const POST = withAuth(async (request, user) => {
  // user.id, user.email, user.role available
}, ['admin', 'dispatcher']);
```

**Allowed Roles:** `admin`, `dispatcher`, `deliverer`, `client`

---

## Security Considerations

### SQL Injection Prevention

All database queries use parameterized statements:
```typescript
await pool.query('SELECT * FROM users WHERE email = ?', [email]);
```

### Transaction Safety

Critical operations use transactions to ensure data consistency:
- `createOrder()` - Order creation with stock management
- Stock decrements are atomic

### Role-Based Access Control

All API routes use `withAuth()` middleware with role restrictions.

---

## Performance Optimization

### Database Indexes

See `database/performance-optimization.sql` for composite indexes optimized for common query patterns.

### Connection Pooling

The connection pool reuses database connections to reduce overhead.

---

## API Response Format

### Success Response
```typescript
{
  success: true,
  data: any,
  metadata?: {
    message?: string,
    [key: string]: any
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    message: string,
    code?: string,
    details?: any
  }
}
```

---

## Common Patterns

### 1. GET Request Pattern
```typescript
export const GET = withAuth(async (request, user) => {
  try {
    const data = await getData(user.id, user.role);
    return createSuccessResponse(data, { count: data.length });
  } catch (error) {
    return handleApiError(error, 'GetData');
  }
}, ['admin', 'dispatcher']);
```

### 2. POST Request Pattern
```typescript
export const POST = withAuth(async (request, user) => {
  try {
    const payload = await request.json();
    const validation = validateData(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Create');
    }
    const data = validation.data as z.infer<typeof schema>;
    const result = await createData(data);
    return createSuccessResponse(result, { message: 'Created' }, 201);
  } catch (error) {
    return handleApiError(error, 'Create');
  }
}, ['admin', 'dispatcher']);
```

### 3. PUT Request Pattern
```typescript
export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const payload = await request.json();
    const validation = validateUpdate(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Update');
    }
    const data = validation.data as z.infer<typeof updateSchema>;
    const result = await updateData(id, data);
    return createSuccessResponse(result, { message: 'Updated' });
  } catch (error) {
    return handleApiError(error, 'Update');
  }
}, ['admin', 'dispatcher']);
```

---

## Testing Recommendations

### Unit Tests
- Test validation functions with valid and invalid inputs
- Test stock service with edge cases (zero stock, concurrent decrements)
- Test error handling for various scenarios

### Integration Tests
- Test order creation with stock management
- Test authentication and authorization
- Test transaction rollback on errors

---

## Maintenance Notes

### Adding New Validation
1. Define Zod schema in `lib/validation.ts`
2. Create validation function using `safeParse()`
3. Update TypeScript types if needed
4. Use in API route with proper error handling

### Adding New API Routes
1. Create route file in `app/api/[resource]/`
2. Use `withAuth()` middleware for protected routes
3. Add validation using Zod schemas
4. Handle errors with `handleApiError()`
5. Return responses using `createSuccessResponse()`

---

## Version History

- v1.0 - Initial documentation
- v1.1 - Added Zod validation patterns
- v1.2 - Added stock service documentation