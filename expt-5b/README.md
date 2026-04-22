# Experiment 5B - MongoDB with Node.js Backend

This project implements a User Management System with MongoDB, Mongoose, and Express.

## Features Covered

- MongoDB integration using Mongoose
- Environment variable based DB configuration
- CRUD REST APIs
- Querying, filtering, sorting, pagination
- MongoDB indexes:
  - Single field index on `name`
  - Compound index on `email` and `age`
  - Multikey index on `hobbies`
  - Text index on `bio`
  - Hashed index on `userId`
  - TTL index on `createdAt`
- Index performance analysis using `.explain("executionStats")`

## Project Structure

- `server.js` - Main app entry
- `config/db.js` - MongoDB connection setup
- `models/User.js` - Schema, validation, and indexes
- `controllers/userController.js` - Business logic
- `routes/userRoutes.js` - REST routes
- `middleware/errorHandler.js` - Centralized error handling
- `index-test.js` - Index test and explain stats

## Setup

1. Install dependencies:
   npm install
   npm --prefix client install

2. Create `.env` file (you can copy from `.env.example`):
   PORT=3000
   MONGO_URI=your_mongodb_connection_string

### MongoDB Atlas Setup

Use Atlas connection string in `.env`:

PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/expt5b?retryWrites=true&w=majority

Checklist:
- Database user created in Atlas
- Network Access allows your IP (or `0.0.0.0/0` for lab/demo)
- Password URL-safe (or encoded)

You can also use `MONGODB_URI` instead of `MONGO_URI`.

3. Run backend + React frontend together:
   npm run dev

4. Optional: run only backend:
   npm start

5. Optional: run only frontend:
   npm run client:dev

Frontend runs on http://localhost:5173 and backend on http://localhost:3000.

## API Endpoints

Base URL: `http://localhost:3000/api`

1. Create User
   - Method: POST
   - URL: `/users`

2. Get Users
   - Method: GET
   - URL: `/users`
   - Query options:
     - `name` (partial, case-insensitive)
     - `email` (exact)
     - `minAge`, `maxAge`
     - `hobby`
     - `text` (text search in bio)
     - `sortBy` (`name`, `email`, `age`, `createdAt`, `userId`)
     - `order` (`asc` or `desc`)
     - `page`, `limit`
     - `explain=true` for execution stats

3. Get User by ID
   - Method: GET
   - URL: `/users/:id`

4. Update User by ID
   - Method: PUT
   - URL: `/users/:id`

5. Delete User by ID
   - Method: DELETE
   - URL: `/users/:id`

## Sample POST Body

{
  "name": "Alice Joseph",
  "email": "alice@example.com",
  "age": 22,
  "hobbies": ["coding", "music"],
  "bio": "I love backend development and MongoDB.",
  "userId": "USER-1001"
}

## Run Index Testing Script

npm run index-test

This script:
- Seeds sample users (if needed)
- Runs index-based queries
- Prints execution stats (`keys examined`, `documents examined`, `execution time`)
- Lists all active indexes

## GitHub Pages (React Frontend Only)

GitHub Pages can host static frontend files, not Node.js backend APIs.

1. Build frontend for GitHub Pages:
   npm run client:build:gh

2. Deploy frontend dist folder to gh-pages branch:
   npm run client:deploy

3. Host backend separately (for example Render, Railway, or any Node host), then set:
   VITE_API_BASE_URL to your hosted backend URL.

You can create client/.env.production from client/.env.production.example.

## Post-lab Question Hints

1. To check index usage in Postman, call:
   GET /api/users?name=alice&explain=true

2. For compound index `{ email: 1, age: -1 }`:
   - `find({ email: "test@gmail.com" })` -> Uses index
   - `find({ age: 25 })` -> Usually does not effectively use this index prefix
   - `find({ email: "test@gmail.com", age: 25 })` -> Uses index

3. Missing email vs duplicate email are different errors:
   - Missing email -> Mongoose validation error (400)
   - Duplicate email -> MongoDB unique index error (409)
