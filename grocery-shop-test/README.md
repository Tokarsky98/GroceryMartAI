# Grocery Shop Testing Application

A comprehensive e-commerce testing platform built with React frontend and Node.js/Express backend, designed specifically for E2E testing, API testing, and frontend automation testing.

## 🚀 Features

### User Features
- **Authentication System**: Login, signup, forgot password with JWT tokens
- **Role-based Access**: Admin and regular user roles
- **Product Management**: 
  - Admin: Full CRUD operations on products
  - Users: Browse, search, filter products with pagination
- **Shopping Cart**: Add items, update quantities, remove items (syncs with backend)
- **Checkout Process**: Multi-step checkout with validation
- **Search & Filter**: Real-time product search with category filters
- **Responsive Design**: Mobile-friendly interface

### Testing Elements
- REST API endpoints with Swagger documentation
- Various button states (hover, disabled, active, loading)
- Complex forms with client-side and server-side validation
- File upload functionality for product images
- Dynamic tables with sorting and pagination
- Modals, alerts, and toast notifications
- Responsive navigation with mobile menu
- CRUD operations with error handling
- JWT authentication flow
- Cart persistence and synchronization

## 🛠 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## 📦 Installation & Setup

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start the backend server (runs on port 5000)
npm run dev
```

**Backend will be available at:** `http://localhost:5000`
**API Documentation:** `http://localhost:5000/api-docs`

### Step 2: Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start the React development server (runs on port 3000)
npm start
```

**Frontend will be available at:** `http://localhost:3000`

## 👤 Default Test Accounts

### Admin User
- **Email:** admin@grocery.com
- **Password:** Admin123!
- **Access:** Full product management, user management

### Regular User
- **Email:** user@grocery.com
- **Password:** User123!
- **Access:** Shopping, cart, checkout

## 📄 License

MIT License - This is a testing/educational project
