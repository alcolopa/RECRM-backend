# Frontend-Backend Integration Guide

## Authentication API

The backend uses JWT (JSON Web Token) for authentication. All protected routes require the `Authorization` header with a Bearer token.

### 1. Register a New User
Create a new user and an associated organization.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword123",
  "name": "John Doe",
  "organizationName": "Acme Corp",
  "organizationSlug": "acme-corp"
}
```
- **Response (201 Created):**
Returns the created user object (excluding the password).

### 2. Login
Authenticate a user and receive a JWT.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get User Profile (Protected)
Retrieve the current authenticated user's profile information.

- **URL:** `/auth/profile`
- **Method:** `Get`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK):**
```json
{
  "userId": "uuid-of-user",
  "email": "user@example.com",
  "role": "AGENT"
}
```

## How to Integrate in Frontend

### Setting Up Axios/Fetch
It's recommended to create an API client that automatically attaches the token if it exists in storage.

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Example Usage (React)

```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    // Redirect or update state
  } catch (error) {
    console.error('Login failed', error);
  }
};
```

## Environment Variables
Ensure your backend `.env` has:
- `DATABASE_URL`: Your database connection string.
- `JWT_SECRET`: A secure key for signing tokens.

## CORS Configuration
If your frontend is on a different port (e.g., `5173`), ensure CORS is enabled in `src/main.ts`:

```typescript
// src/main.ts
app.enableCors({
  origin: 'http://localhost:5173', // or your frontend URL
  credentials: true,
});
```
