# ProductSync - Vue Frontend

A modern product management application built with Vue 3, TypeScript, and Tailwind CSS.

## Features

- **Authentication** - User registration and login with JWT tokens
- **Product Management** - Full CRUD operations for products
- **Form Validation** - Client-side validation with Zod
- **Toast Notifications** - User feedback via vue3-toastify
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS

## Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **TypeScript** - Type-safe development
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Zod** - Schema validation
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast development server and bundler

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0`
- **npm** or **pnpm**
- **Backend API** running (NestJS backend required)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd vue-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set the API base URL:

```dotenv
VITE_API_BASE_URL=http://localhost:3001
```

> **Note:** The backend API must be running on the specified URL. You may edit the endpoint but I used 3001 instead of 3000 due to some conflicts with my other project

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Backend Setup

This frontend requires the NestJS backend API to be running. Follow these steps:

### 1. Navigate to the backend directory

```bash
cd ../nestjs-backend  # or wherever your backend is located
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure backend environment

Copy and configure the backend `.env` file with your database credentials.

### 4. Run database migrations

```bash
npm run migration:run
```

### 5. Seed the database (optional)

To populate the database with sample data:

```bash
npm run seed
```

This will create sample products in the database.

### 6. Start the backend server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Usage

### Creating an Account

1. Navigate to `/register`
2. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password
   - Confirm Password
3. Click **Register**
4. You'll be redirected to the login page

### Signing In

1. Navigate to `/login`
2. Enter your email and password
3. Click **Sign In**
4. You'll be redirected to the products page

### Managing Products

Once signed in, you can:

- **View products** - See all products with pagination
- **Create product** - Click "Add Product" button
- **Edit product** - Click the edit icon on any product
- **Delete product** - Click the delete icon on any product

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test:unit` | Run unit tests with Vitest |
| `npm run lint` | Lint and fix code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |

## Project Structure

```
src/
├── api/            # Axios instance and interceptors
├── assets/         # Static assets and global CSS
├── components/     # Reusable Vue components
├── composables/    # Vue composables (hooks)
├── lib/            # Utility functions
├── router/         # Vue Router configuration
├── stores/         # Pinia stores
├── types/          # TypeScript type definitions
└── views/          # Page components
```


