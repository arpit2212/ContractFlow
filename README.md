# OnboardFlow

This project is a production-level integration for Panda Doc, consisting of a separate frontend and backend.

## Project Structure

- `frontend/`: React + TypeScript project initialized with Vite and Tailwind CSS.
- `backend/`: Go project for handling API requests and business logic.

## Getting Started

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run the server:
   ```bash
   go run main.go
   ```

## Environment Variables

Both frontend and backend have their own `.env` files for configuration.
