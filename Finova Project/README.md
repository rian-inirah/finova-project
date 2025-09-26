# Finova - POS Billing System

A complete Point of Sale (POS) billing system built with React, Node.js, Express, and MySQL. Designed for small businesses to manage their sales, inventory, and generate professional bills with GST calculation.

## 🚀 Features

### Core Features
- **User Authentication**: Secure login system with JWT tokens
- **Professional Black & White Theme**: Elegant monochrome design for business environments
- **Business Details Management**: Store and manage business information
- **Item Management**: Add, edit, delete items with images
- **Order Management**: Create, edit, and manage orders
- **Draft Bills**: Save incomplete orders for later completion
- **Professional Billing**: Generate bills with GST calculation
- **Thermal Printer Support**: Optimized for mobile thermal printers (58mm/80mm)
- **PDF Generation**: Export bills as PDF for sharing

### Advanced Features
- **Comprehensive Reports**: Order-wise, item-wise, and daily reports
- **PSG (Product Sales Group)**: Special reporting for marked orders (Modern user only)
- **PIN Protection**: Secure access to reports and analytics
- **Payment Tracking**: Cash and online payment methods
- **Customer Management**: Optional customer phone number tracking
- **Search & Filter**: Advanced search across items and orders
- **Export Functionality**: CSV export for reports
- **Mobile Responsive**: Works seamlessly on mobile devices

### Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Rate limiting on login attempts
- Input validation and sanitization
- PIN-protected sensitive operations
- CORS protection

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Sequelize** - ORM for database operations
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Puppeteer** - PDF generation
- **Nodemailer** - Email functionality

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling with professional black & white theme
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📋 Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd finova-project
```

### 2. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE finova_db;
```

### 3. Environment Configuration

Copy the environment example file:
```bash
cd server
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finova_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# File Upload Configuration
UPLOAD_DIR=./uploads

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Install Dependencies

Install server dependencies:
```bash
cd server
npm install
```

Install client dependencies:
```bash
cd ../client
npm install
```

### 5. Database Migration

Run database migrations:
```bash
cd ../server
npm run migrate
```

### 6. Seed Database

Populate the database with sample data:
```bash
npm run seed
```

### 7. Start the Application

Start the server (in one terminal):
```bash
cd server
npm run dev
```

Start the client (in another terminal):
```bash
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🔐 Default Login Credentials

After seeding the database, you can login with:

### Admin User
- **Username**: `admin`
- **Password**: `Admin@123`
- **Role**: Admin (full access)

### Modern User (PSG Features)
- **Username**: `Modern`
- **Password**: `Admin@123`
- **Role**: Operator (with PSG access)

### Default PINs
- **Admin Reports PIN**: `1234`
- **Modern Reports PIN**: `5678`

## 📊 Database Schema

### Tables Structure

#### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | VARCHAR(50) | Unique username |
| password | VARCHAR(255) | Hashed password |
| role | ENUM | 'admin' or 'operator' |
| isActive | BOOLEAN | Account status |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |
| deletedAt | DATETIME | Soft delete timestamp |

#### Business Details Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| userId | INTEGER | Foreign key to users |
| businessCategory | VARCHAR(100) | Business type |
| fssaiNumber | VARCHAR(20) | FSSAI registration |
| businessName | VARCHAR(200) | Business name |
| phoneNumber | VARCHAR(15) | Contact number |
| businessAddress | TEXT | Business address |
| gstinNumber | VARCHAR(15) | GST registration |
| gstSlab | INTEGER | GST slab (0,5,12,18,28) |
| gstPercentage | DECIMAL(5,2) | Custom GST percentage |
| businessLogo | VARCHAR(500) | Logo file path |
| reportsPinHash | VARCHAR(255) | Hashed PIN for reports |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |

#### Items Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| userId | INTEGER | Foreign key to users |
| name | VARCHAR(200) | Item name |
| price | DECIMAL(10,2) | Item price |
| image | VARCHAR(500) | Image file path |
| isActive | BOOLEAN | Item status |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |
| deletedAt | DATETIME | Soft delete timestamp |

#### Orders Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| userId | INTEGER | Foreign key to users |
| orderNumber | VARCHAR(50) | Unique order number |
| customerPhone | VARCHAR(15) | Customer contact |
| status | ENUM | 'draft' or 'completed' |
| paymentMethod | ENUM | 'cash' or 'online' |
| subtotal | DECIMAL(10,2) | Subtotal amount |
| gstAmount | DECIMAL(10,2) | Total GST |
| cgst | DECIMAL(10,2) | Central GST |
| sgst | DECIMAL(10,2) | State GST |
| grandTotal | DECIMAL(10,2) | Final amount |
| psgMarked | BOOLEAN | PSG reporting flag |
| printed | BOOLEAN | Print status |
| printedAt | DATETIME | Print timestamp |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |

#### Order Items Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| orderId | INTEGER | Foreign key to orders |
| itemId | INTEGER | Foreign key to items |
| quantity | INTEGER | Item quantity |
| unitPrice | DECIMAL(10,2) | Price per unit |
| totalPrice | DECIMAL(10,2) | Total price |

## 🎯 Usage Guide

### 1. Initial Setup
1. Login with admin credentials
2. Go to "Business Details" and fill in your business information
3. Set a 4-digit PIN for reports access
4. Add your business logo (optional)

### 2. Managing Items
1. Navigate to "Items" section
2. Click "Add Item" to create new menu items
3. Add item name, price, and image
4. Use search to find specific items
5. Edit or delete items as needed

### 3. Creating Orders
1. Go to "Add Order" section
2. Select items and adjust quantities
3. Enter customer phone number (optional)
4. Select payment method (Cash/Online)
5. Mark for PSG if needed (Modern user only)
6. Choose action:
   - **Save as Draft**: Save for later editing
   - **Save Bill**: Complete without printing
   - **Print Bill**: Complete and print

### 4. Managing Drafts
1. Go to "Draft Bills" section
2. View all saved drafts
3. Click edit to modify draft
4. Delete drafts you no longer need

### 5. Generating Reports
1. Go to "Order Reports" or "Item Reports"
2. Enter your 4-digit PIN when prompted
3. Set date range and filters
4. View comprehensive analytics
5. Export reports to CSV

### 6. PSG Reports (Modern User Only)
1. Navigate to "PSG" section
2. Enter PIN for access
3. Set time range for analysis
4. View aggregated data for marked orders
5. Export PSG reports

## 🖨️ Thermal Printer Setup

The system is optimized for mobile thermal printers:

### Supported Sizes
- **58mm**: Standard thermal printer width
- **80mm**: Wide thermal printer width

### Print Configuration
1. Ensure printer is connected via USB, Bluetooth, or WiFi
2. Use browser's print function
3. Select thermal printer
4. Adjust settings for optimal print quality

### Print Preview
- Bills are automatically formatted for thermal printing
- Compact layout with essential information
- Professional footer with company details

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Touch devices

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify token

### Business Details
- `GET /api/business` - Get business details
- `POST /api/business` - Update business details
- `POST /api/business/pin` - Set reports PIN

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Billing
- `GET /api/billing/:id/preview` - Bill preview
- `GET /api/billing/:id/pdf` - Generate PDF
- `POST /api/billing/:id/email` - Email bill
- `GET /api/billing/:id/whatsapp` - WhatsApp link

### Reports
- `GET /api/reports/orders` - Order reports
- `GET /api/reports/items` - Item reports
- `GET /api/reports/daily` - Daily reports
- `GET /api/reports/top-items` - Top selling items

### PSG
- `GET /api/psg/reports` - PSG reports
- `GET /api/psg/orders` - PSG order history
- `GET /api/psg/items/:itemId` - PSG item details

## 🧪 Testing

Run the test suite:

```bash
cd server
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📦 Production Deployment

### Environment Variables
Set the following environment variables for production:

```env
NODE_ENV=production
JWT_SECRET=your-production-secret-key
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=your-production-db-name
```

### Build for Production

Build the client:
```bash
cd client
npm run build
```

Start the server:
```bash
cd server
npm start
```

### Security Considerations
- Change default JWT secret
- Use strong database passwords
- Enable HTTPS in production
- Set up proper firewall rules
- Regular security updates
- Monitor application logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- **Email**: support@smartstacktechnologies.com
- **Phone**: +91 8870305577
- **Website**: [SmartStack Technologies](https://smartstacktechnologies.com)

## 🎉 Acknowledgments

- Built with ❤️ by SmartStack Technologies
- Special thanks to the open-source community
- Inspired by modern POS systems

---

**Finova** - Your complete POS billing solution for small businesses.

*@Finova by SmartStack Technologies*  
*+91 8870305577*
