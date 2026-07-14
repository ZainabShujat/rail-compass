# Rail Compass (Railway Recommendation System)

**Live Website:** [https://railcompass.vercel.app/](https://railcompass.vercel.app/)

**Rail Compass** is a smart and personalized railway recommendation system designed to help you find the perfect train for your journey. It analyzes duration, daytime efficiency, budget, and reliability to recommend the best options tailored specifically to your needs.

## Features

- **Smart Search**: Enter your journey details to instantly scan thousands of routes across India.
- **Smart Analysis**: Our algorithm weighs multiple factors including duration, budget, comfort, and reliability based on your unique preferences.
- **Top Recommendations**: Get clear, ranked train options so you always book the perfect ticket.
- **Responsive UI**: A modern, glassmorphism-inspired UI designed for an optimal user experience across devices.

## Tech Stack

### Frontend
- **React 19**
- **Vite**
- **React Router** (for navigation)
- **Lucide React** (for icons)
- **Vanilla CSS** (for styling)

### Backend
- **Node.js** & **Express**
- **MongoDB** with **Mongoose**
- Data ingestion and seeding scripts (for Kaggle dataset)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd "Railway Recommendation System"
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with your configuration (e.g., `PORT=5000`, `MONGODB_URI=mongodb://127.0.0.1:27017/railwise`).
4. Seed the database with initial train/station data:
   ```bash
   npm run seed
   ```
   *Alternatively, you can run `npm run ingest` to ingest data from the Kaggle dataset.*
5. Start the backend server:
   ```bash
   npm run start
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the project root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Project Structure

```text
Railway Recommendation System/
├── backend/                  # Express server, MongoDB models, routes, and controllers
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── scripts/              # Data ingestion scripts
│   ├── seed/                 # Database seeding scripts
│   └── server.js             # Backend entry point
├── public/                   # Static assets (images, logos, etc.)
├── src/                      # Frontend React application
│   ├── components/           # Reusable UI components
│   ├── pages/                # Application pages (Home, Results, Login, etc.)
│   ├── App.jsx               # Main React component and routing
│   └── index.css             # Global styles
├── package.json              # Frontend dependencies and scripts
└── vite.config.js            # Vite configuration
```

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## License

This project is licensed under the ISC License.
