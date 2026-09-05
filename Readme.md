<div align="center">
  <img src="public/logo.png" alt="Rail Compass Logo" width="120" />
  <h1>Rail Compass</h1>
  <p><strong>A Smart & Personalized Railway Recommendation System</strong></p>
  
  <p>
    <a href="https://railcompass.dev/" target="_blank">
      <img src="https://img.shields.io/badge/Live_Website-railcompass.dev-blue?style=for-the-badge&logo=vercel" alt="Live Website" />
    </a>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs" alt="Node" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/License-ISC-black?style=for-the-badge" alt="License" />
  </p>
</div>

<br />

**Rail Compass** is a next-generation railway recommendation engine tailored for Indian railways. Stop guessing which train to book—our intelligent algorithm analyzes duration, daytime efficiency, budget, and historical reliability to recommend the absolute best options tailored specifically to your personal travel needs.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Smart Search** | Instantly scan thousands of routes across India by entering your journey details. |
| **Intelligent Analysis** | Our custom algorithm weighs multiple factors (duration, budget, comfort, reliability) based on unique user preferences. |
| **Top Recommendations** | Get clear, ranked train options prioritizing the best overall travel experience. |
| **Responsive UI** | A modern, glassmorphism-inspired UI designed for an optimal, app-like user experience across all devices. |
| **Secure Authentication** | Seamless user accounts, profile management, and saved preferences. |

## Tech Stack

We utilize a modern, robust MERN-inspired stack for high performance and scalability.

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router, Lucide React, Vanilla CSS (Glassmorphism UI) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Data Processing** | Custom Python/Node ingestion scripts for Kaggle Indian Railways dataset |
| **Deployment** | Vercel (Frontend), Railway/Render (Backend) |

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Running locally or a MongoDB Atlas URI)
- Git

### 1. Backend Setup

<details>
<summary><b>Click to expand Backend Instructions</b></summary>
<br/>

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/railwise
   JWT_SECRET=your_jwt_secret_here
   ```
4. Seed the database with initial train/station data:
   ```bash
   npm run seed
   ```
   *(Alternatively, run `npm run ingest` to ingest data from the raw Kaggle dataset).*
5. Start the backend development server:
   ```bash
   npm start
   ```

</details>

### 2. Frontend Setup

<details>
<summary><b>Click to expand Frontend Instructions</b></summary>
<br/>

1. Open a new terminal and navigate to the project root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (if needed for API URLs):
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

</details>

---

## Project Structure

```text
Railway Recommendation System/
├── backend/                  # Backend API Server
│   ├── controllers/          # Request handlers
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API endpoints
│   ├── scripts/              # Data ingestion logic
│   ├── seed/                 # Database seeders
│   └── server.js             # Express entry point
├── public/                   # Static assets (images, logos)
├── src/                      # Frontend React application
│   ├── components/           # Reusable UI components
│   ├── context/              # React Context (Auth, Theme)
│   ├── pages/                # Application pages (Home, Results, Auth, etc.)
│   ├── App.jsx               # Main React component & routing
│   └── index.css             # Global UI styles & CSS variables
├── package.json              # Frontend dependencies
└── vite.config.js            # Vite bundler configuration
```

---

## License

This project is licensed under the **ISC License**.

<div align="center">
  <p>Built for Indian Railways travelers.</p>
</div>
