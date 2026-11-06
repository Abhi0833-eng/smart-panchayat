# Smart Panchayat

Smart Panchayat is a full-stack digital grievance management platform for villages. Citizens can register, submit local issues, and track complaint progress. Administrators can review all complaints and update their status.

## Live Project

- **Website:** https://smart-panchayat-six.vercel.app
- **Backend API:** https://smart-panchayat-r33v.onrender.com
- **Health check:** https://smart-panchayat-r33v.onrender.com/api/health

## Main Features

### Citizen

- Register and log in
- Submit complaints with a title, description, category, and village
- View personal complaints and statistics
- Track complaints as `pending`, `in-progress`, or `resolved`
- Log out securely from the browser session

### Administrator

- View all registered complaints
- See citizen, category, village, and submission details
- Change complaint status
- View total, pending, in-progress, and resolved counts

### Complaint Categories

- Water
- Road
- Electricity
- Sanitation
- Other

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Axios, CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Authentication | bcryptjs, JSON Web Tokens |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Environment Configuration | dotenv |
| Security Middleware | CORS |

## System Flow

```text
Citizen registers or logs in
        |
        v
JWT and user role are returned
        |
        v
Citizen submits a complaint
        |
        v
Complaint is stored in MongoDB
        |
        v
Administrator reviews the complaint
        |
        v
pending -> in-progress -> resolved
        |
        v
Citizen can view the updated status
```

## Project Structure

```text
smart-panchayat/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── config/api.js
│   │   └── pages/
│   │       ├── Home.js
│   │       ├── Register.js
│   │       ├── Login.js
│   │       ├── Dashboard.js
│   │       └── AdminPanel.js
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Complaint.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── complaints.js
│   ├── scripts/
│   │   └── set-admin-password.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## MongoDB Data

Database: `panchayatDB`

### `users` Collection

Stores registration and authentication information:

```json
{
  "name": "Citizen Name",
  "email": "citizen@example.com",
  "password": "bcrypt-password-hash",
  "role": "citizen",
  "phone": "9999999999",
  "village": "Village Name",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Supported roles:

- `citizen`
- `admin`

Emails are unique and passwords are stored as bcrypt hashes, not plain text.

### `complaints` Collection

Stores grievance information and links it to the citizen:

```json
{
  "title": "Water supply interruption",
  "description": "Water has not been supplied for several days.",
  "category": "water",
  "status": "pending",
  "citizen": "MongoDB-user-object-id",
  "village": "Village Name",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

The relationship is:

```text
one user -> many complaints
```

## API Routes

### Authentication

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a citizen |
| POST | `/api/auth/login` | Authenticate and receive a JWT |

### Complaints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/complaints` | Submit a complaint |
| GET | `/api/complaints/my` | Get the logged-in citizen's complaints |
| GET | `/api/complaints` | Get all complaints for administrators |
| PUT | `/api/complaints/:id/status` | Update a complaint status |

Protected complaint routes require the JWT in the `Authorization` header.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Abhi0833-eng/smart-panchayat.git
cd smart-panchayat
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

Add real values to `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:ENCODED_PASSWORD@YOUR_CLUSTER/panchayatDB?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URLS=http://localhost:3000,http://localhost:3001
```

Start the backend:

```bash
npm start
```

Backend: http://localhost:5000

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

For local development:

```env
REACT_APP_API_URL=http://localhost:5000
```

Frontend: http://localhost:3000

## Demo Guide

1. Register a citizen account.
2. Log in and open the citizen dashboard.
3. Submit a complaint from the `New Complaint` form.
4. Log out.
5. Log in with an account whose MongoDB role is `admin`.
6. Open `/admin`.
7. Change the complaint status to `in-progress` or `resolved`.
8. Log in again as the citizen and confirm the updated status.

## Deployment

- **Frontend:** Vercel reads the React application from `frontend/`.
- **Backend:** Render runs `npm start` from `backend/`.
- **Database:** MongoDB Atlas stores the `panchayatDB` database.

Required Render environment variables:

```text
MONGO_URI
JWT_SECRET
FRONTEND_URLS
```

Required Vercel environment variable:

```text
REACT_APP_API_URL=https://smart-panchayat-r33v.onrender.com
```

## Security Notes

- Never commit real database credentials or JWT secrets.
- Keep `backend/.env` and frontend local `.env` files out of Git.
- Passwords are hashed with bcrypt.
- JWTs expire after seven days.
- Atlas database users and network access should be restricted where possible.
- Before public launch, enforce admin role checks in backend routes, not only in the frontend.

## Possible Future Improvements

- Complaint images and attachment upload
- GPS-based village and complaint location
- Email or SMS status notifications
- Government scheme discovery
- Admin assignment by department
- Complaint priority and voting
- Analytics dashboard
- AI-assisted complaint classification
- Password recovery
- Mobile application

## Author

Smart Panchayat project developed by Abhishek Gupta.
