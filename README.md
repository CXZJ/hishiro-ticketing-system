# Hishiro Ticketing System 

A ticketing and customer support system with real-time chat functionality.

## Requirements

### Node.js
- Node.js 18.x or higher

### MongoDB
- MongoDB 5.0 or higher
- A MongoDB Atlas account or local MongoDB server

## Installation

1. Clone this repository
```bash
git clone <repository-url>
cd hishiro-ticketing-system
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
Create a `.env` file in the root directory with the following variables:
```
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Running the Application

### Development
```bash
# Run frontend dev server
npm run dev

```


## Project Structure

### Frontend (React)
- `src/components/` - Reusable UI components
- `src/pages/` - Page components for each route/view
- `src/layouts/` - Layout components like dashboard layouts
- `src/hooks/` - Custom React hooks
- `src/assets/` - Images, fonts, etc.
- `src/admin/` - Admin-specific components
- `src/contexts/` - React context providers
- `src/utils/` - Utility/helper functions
- `src/services/` - API service calls

### Backend (Express)
- `server/models/` - MongoDB models
- `server/controllers/` - Request handlers
- `server/routes/` - API route definitions
- `server/middleware/` - Express middleware
- `server/config/` - Configuration files (DB connection, etc.)

## Dependencies

### Frontend
- React 19.x
- React Router 7.x
- Tailwind CSS 3.x
- Framer Motion 12.x
- React Icons 5.x
- Socket.io Client 4.x
- Swiper 11.x
- Slick Carousel 1.x

### Backend
- Express 5.x
- Mongoose 8.x
- JWT Authentication
- Socket.io 4.x
- bcryptjs 3.x
- cors
- dotenv

## Development Tools
- Vite 6.x
- ESLint 9.x
- Tailwind CSS
- nodemon
