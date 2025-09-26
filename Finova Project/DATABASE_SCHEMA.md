# Finova Database Schema

This document contains the complete database schema for the Finova POS Billing System.

## Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE finova_db;
```

2. Run migrations:
```bash
cd server
npm run migrate
```

3. Seed with sample data:
```bash
npm run seed
```

## Tables

### 1. users
Stores user authentication and role information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Login username |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| role | ENUM('admin', 'operator') | NOT NULL, DEFAULT 'operator' | User role |
| isActive | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| createdAt | DATETIME | NOT NULL | Account creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| deletedAt | DATETIME | NULL | Soft delete timestamp |

**Indexes:**
- username (UNIQUE)
- isActive

### 2. business_details
Stores business information and settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| userId | INTEGER | NOT NULL, FK to users.id | Associated user |
| businessCategory | VARCHAR(100) | NULL | Business type/category |
| fssaiNumber | VARCHAR(20) | NULL | FSSAI registration number |
| businessName | VARCHAR(200) | NULL | Business name for bills |
| phoneNumber | VARCHAR(15) | NULL | Business phone number |
| businessAddress | TEXT | NULL | Business address |
| gstinNumber | VARCHAR(15) | NULL | GST registration number |
| gstSlab | INTEGER | NULL | GST slab (0, 5, 12, 18, 28) |
| gstPercentage | DECIMAL(5,2) | NULL | Custom GST percentage |
| businessLogo | VARCHAR(500) | NULL | Logo file path |
| reportsPinHash | VARCHAR(255) | NULL | Hashed 4-digit PIN |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Indexes:**
- userId (FK to users.id)

### 3. items
Stores menu items/product information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique item identifier |
| userId | INTEGER | NOT NULL, FK to users.id | Associated user |
| name | VARCHAR(200) | NOT NULL | Item name |
| price | DECIMAL(10,2) | NOT NULL | Item price |
| image | VARCHAR(500) | NULL | Item image file path |
| isActive | BOOLEAN | NOT NULL, DEFAULT true | Item status |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |
| deletedAt | DATETIME | NULL | Soft delete timestamp |

**Indexes:**
- userId (FK to users.id)
- isActive
- name

### 4. orders
Stores order/bill information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique order identifier |
| userId | INTEGER | NOT NULL, FK to users.id | Associated user |
| orderNumber | VARCHAR(50) | NOT NULL, UNIQUE | Unique order number (FN-YYYYMMDD-XXXXXX) |
| customerPhone | VARCHAR(15) | NULL | Customer contact number |
| status | ENUM('draft', 'completed') | NOT NULL, DEFAULT 'draft' | Order status |
| paymentMethod | ENUM('cash', 'online') | NULL | Payment method |
| subtotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Subtotal amount |
| gstAmount | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Total GST amount |
| cgst | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Central GST |
| sgst | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | State GST |
| grandTotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Final amount |
| psgMarked | BOOLEAN | NOT NULL, DEFAULT false | PSG reporting flag |
| printed | BOOLEAN | NOT NULL, DEFAULT false | Print status |
| printedAt | DATETIME | NULL | Print timestamp |
| createdAt | DATETIME | NOT NULL | Creation timestamp |
| updatedAt | DATETIME | NOT NULL | Last update timestamp |

**Indexes:**
- userId (FK to users.id)
- orderNumber (UNIQUE)
- status
- paymentMethod
- psgMarked
- createdAt

### 5. order_items
Stores individual items within orders (many-to-many relationship).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| orderId | INTEGER | NOT NULL, FK to orders.id | Associated order |
| itemId | INTEGER | NOT NULL, FK to items.id | Associated item |
| quantity | INTEGER | NOT NULL | Item quantity |
| unitPrice | DECIMAL(10,2) | NOT NULL | Price per unit at time of order |
| totalPrice | DECIMAL(10,2) | NOT NULL | Total price (quantity × unitPrice) |

**Indexes:**
- orderId (FK to orders.id)
- itemId (FK to items.id)

## Relationships

### Foreign Key Relationships
- `business_details.userId` → `users.id` (CASCADE)
- `items.userId` → `users.id` (CASCADE)
- `orders.userId` → `users.id` (CASCADE)
- `order_items.orderId` → `orders.id` (CASCADE)
- `order_items.itemId` → `items.id` (CASCADE)

### Business Logic Relationships
- One user can have one business details record
- One user can have many items
- One user can have many orders
- One order can have many order items
- One item can be in many orders (through order items)

## Sample Data

After running the seed script, you'll have:

### Users
- **admin** (password: Admin@123, role: admin)
- **Modern** (password: Admin@123, role: operator)

### Business Details
- Sample business details for both users
- Reports PIN: 1234 (admin), 5678 (Modern)

### Items
- 10 sample items for admin user
- 4 sample items for Modern user

### Orders
- 2 completed orders (one PSG marked)
- 1 draft order

## Data Validation

### Business Rules
1. **Order Numbers**: Auto-generated in format `FN-YYYYMMDD-XXXXXX`
2. **GST Calculation**: Only applied if `gstPercentage` is set in business details
3. **PSG Marking**: Only visible to users with username 'Modern'
4. **Soft Deletes**: Users and items use soft deletes (deletedAt column)
5. **Password Security**: All passwords are hashed using bcrypt
6. **PIN Security**: Reports PIN is hashed using bcrypt

### Constraints
- Usernames must be unique and between 3-50 characters
- Passwords must be at least 6 characters (before hashing)
- Item names must be between 1-200 characters
- Prices must be positive numbers
- GST percentage must be between 0-100
- PIN must be exactly 4 digits

## Backup and Maintenance

### Regular Backups
```sql
-- Full database backup
mysqldump -u username -p finova_db > finova_backup_$(date +%Y%m%d).sql

-- Restore from backup
mysql -u username -p finova_db < finova_backup_20241201.sql
```

### Cleanup Queries
```sql
-- Remove soft-deleted users (use with caution)
DELETE FROM users WHERE deletedAt IS NOT NULL AND deletedAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Remove soft-deleted items (use with caution)
DELETE FROM items WHERE deletedAt IS NOT NULL AND deletedAt < DATE_SUB(NOW(), INTERVAL 6 MONTHS);
```

## Performance Considerations

### Recommended Indexes
All necessary indexes are created by the migrations. Additional indexes for specific queries:

```sql
-- For date range queries on orders
CREATE INDEX idx_orders_date_status ON orders(createdAt, status);

-- For item search queries
CREATE INDEX idx_items_name_active ON items(name, isActive);

-- For PSG reports
CREATE INDEX idx_orders_psg_date ON orders(psgMarked, createdAt);
```

### Query Optimization
- Use LIMIT and OFFSET for pagination
- Filter by date ranges for reports
- Use proper WHERE clauses to utilize indexes
- Avoid SELECT * in production queries

## Security Considerations

1. **Data Encryption**: Sensitive data (passwords, PINs) is hashed
2. **SQL Injection**: Use Sequelize ORM to prevent SQL injection
3. **Access Control**: JWT-based authentication with role-based access
4. **Input Validation**: Server-side validation on all inputs
5. **Rate Limiting**: Login attempts are rate-limited
6. **CORS**: Configured for specific origins in production

This schema supports all the features of the Finova POS system while maintaining data integrity and performance.
