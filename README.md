# Course Management Backend API

A Node.js backend API for the Telegram Mini App Course Management System.

## Features

- 🔐 **Admin Authentication** - JWT-based admin login
- 📚 **Course Management** - CRUD operations for courses
- 🔗 **Token Generation** - Secure access tokens for courses
- 📁 **File Upload** - Image upload for course content
- 🤖 **Telegram Bot Integration** - Channel posting and user verification
- 🗄️ **PostgreSQL Database** - Supabase integration
- 🛡️ **Security** - Rate limiting, CORS, helmet protection

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/change-password` - Change admin password
- `GET /api/auth/me` - Get admin info

### Courses
- `GET /api/courses` - Get all courses (admin)
- `GET /api/courses/:id` - Get course by ID (public with token)
- `POST /api/courses` - Create new course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)
- `POST /api/courses/:id/token` - Generate access token (admin)

### File Upload
- `POST /api/upload/image` - Upload single image (admin)
- `POST /api/upload/images` - Upload multiple images (admin)
- `DELETE /api/upload/image/:filename` - Delete image (admin)

### Telegram Bot
- `POST /api/bot/send-course` - Send course to channel (admin)
- `POST /api/bot/webhook` - Bot webhook endpoint
- `GET /api/bot/info` - Get bot information (admin)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

See `env.example` for all required environment variables.

## Database Schema

The API automatically creates the following tables:
- `courses` - Course information
- `tokens` - Access tokens for courses
- `admin` - Admin user accounts
- `users` - Student user tracking

## Security Features

- JWT authentication for admin routes
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- File upload validation
- SQL injection protection

## Deployment

This backend is designed to be deployed on Render.com:

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service
4. The API will be available at your Render URL

## Frontend Integration

The frontend (vanilla HTML/CSS/JS) can be updated to use these API endpoints instead of localStorage for data persistence.
