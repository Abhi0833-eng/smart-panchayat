# Smart Panchayat

Smart Panchayat is a full-stack digital grievance management platform for villages. Citizens can report local issues, follow their progress, and provide feedback. Administrators can coordinate work across departments, manage deadlines, and review service trends.

## Live Project

- **Website:** https://smart-panchayat-six.vercel.app
- **Backend API:** https://smart-panchayat-r33v.onrender.com
- **Health check:** https://smart-panchayat-r33v.onrender.com/api/health

## Main Features

### Citizen

- Register and log in
- Sign in with Google using a verified Google account
- Submit complaints with a title, description, category, and village
- Optionally attach a JPEG, PNG, or WebP photo (up to 2 MB) and share a map location
- Filter and search personal complaints using clickable status summaries
- Follow a timestamped status history and in-app notifications
- Receive email notices for complaint updates when SMTP is configured
- Rate a resolution or reopen an issue that is still unresolved
- Switch accounts without leaving the portal

### Administrator

- View and search all complaints, including citizen and location details
- Assign a responsible department, priority, and target resolution date
- Add status updates that are visible to the citizen
- Review overdue work, average resolution time, and complaint breakdowns by category and village
- Receive in-app notifications when a citizen submits or reopens a complaint, or leaves resolution feedback
- Send privacy-minimized email alerts to citizens and administrators when SMTP settings are configured

The login flow routes administrators to `/admin` and citizens to `/dashboard`. Google sign-in is citizen-only; administrators continue to use email and password. Both the frontend routes and administrator API actions enforce the account role.

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
| Authentication | bcryptjs, Google ID token verification, JSON Web Tokens |
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
Administrator assigns a department, priority, and target date
        |
        v
pending -> in-progress -> resolved -> citizen feedback
        |
        v
Citizen can reopen an issue that is not actually resolved
```

## Project Structure

```text
smart-panchayat/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── config/api.js
│   │   ├── components/PortalHeader.js
│   │   ├── utils/session.js
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
│   │   ├── Complaint.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   └── notifications.js
│   ├── middleware/auth.js
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
  "priority": "medium",
  "assignedDepartment": "Water & Sanitation",
  "dueAt": "timestamp",
  "statusHistory": [
    {
      "status": "pending",
      "note": "Complaint submitted",
      "changedBy": "MongoDB-user-object-id",
      "changedAt": "timestamp"
    }
  ],
  "feedbackHistory": [],
  "location": { "latitude": 23.0, "longitude": 85.0 },
  "photo": { "mimeType": "image/jpeg", "data": "base64-image-data" },
  "citizen": "MongoDB-user-object-id",
  "village": "Village Name",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

Photos are size-limited and stored with the complaint for this project. For a larger production service, move image data to object storage and store only its URL in MongoDB.

### `notifications` Collection

Stores per-user in-app updates for complaint submissions, assignments, status changes, reopen requests, and feedback. A notification includes its recipient, related complaint, message, creation time, and read time.

Email messages contain a generic alert and portal sign-in link rather than complaint details. Configure SMTP to enable email delivery; in-app notifications work without it.

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
| POST | `/api/auth/google` | Verify a Google ID token and authenticate a citizen |

### Complaints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/complaints` | Submit a complaint |
| GET | `/api/complaints/my` | Get the logged-in citizen's complaints |
| GET | `/api/complaints` | Get all complaints for administrators |
| PUT | `/api/complaints/:id/status` | Update a complaint status |
| PUT | `/api/complaints/:id/assignment` | Assign department, priority, and target date |
| POST | `/api/complaints/:id/feedback` | Save citizen feedback for a resolution |
| POST | `/api/complaints/:id/reopen` | Reopen a resolved complaint as its citizen |

### Notifications

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/notifications/my` | Get the current user's in-app notifications |
| PUT | `/api/notifications/:id/read` | Mark one notification as read |
| PUT | `/api/notifications/read-all` | Mark all current-user notifications as read |

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
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

SMTP values are optional for local development. Set the same values in the deployed backend environment to enable email notices; in-app notifications continue to work without SMTP.

To enable Google sign-in, create an OAuth 2.0 Client ID of type **Web application** in Google Cloud Console. Add `http://localhost:3000` and your deployed frontend origin to its **Authorized JavaScript origins**. Use the same client ID for `GOOGLE_CLIENT_ID` in `backend/.env` and `REACT_APP_GOOGLE_CLIENT_ID` in `frontend/.env`. The client ID is public; do not put a client secret in the frontend. Restart both development servers after changing the environment files. In Google Auth Platform, configure the consent screen and add test users if the app remains in testing mode.

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
REACT_APP_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Frontend: http://localhost:3000

## Demo Guide

1. Register a citizen account.
2. Log in and open the citizen dashboard.
3. Submit a complaint from the `New Complaint` form.
4. Log out.
5. Log in with an account whose MongoDB role is `admin`.
6. Open `/admin`.
7. Assign a department, priority, and target date, then add a status update.
8. Sign in as the citizen, check the notification and timeline, then leave feedback or reopen the issue.

## Deployment

- **Frontend:** Vercel builds the React application from `frontend/`.
- **Backend:** Render runs `npm start` from `backend/`.
- **Database:** MongoDB Atlas stores the `panchayatDB` database.

### Deploy the frontend to Vercel

1. Push this repository to GitHub and import it into Vercel. Once connected, pushes to `main` trigger a new deployment.
2. Set the project **Root Directory** to `frontend`.
3. Use the Create React App build settings: build command `npm run build` and output directory `build`.
4. Add the environment variables below in Vercel's project settings, then deploy.

```text
REACT_APP_API_URL=https://smart-panchayat-r33v.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### Configure the backend on Render

Configure the Render web service to use `backend` as its root directory, `npm install` as its build command, and `npm start` as its start command.

Required Render environment variables:

```text
MONGO_URI
JWT_SECRET
FRONTEND_URLS
GOOGLE_CLIENT_ID
```

Optional Render email environment variables:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
EMAIL_FROM
```

After Vercel assigns the production domain, add it to `FRONTEND_URLS` in Render and to the OAuth client's **Authorized JavaScript origins** in Google Cloud Console. Use the same Google Web Client ID in Render and Vercel; do not place a client secret in frontend settings.

## Security Notes

- Never commit real database credentials or JWT secrets.
- Keep `backend/.env` and frontend local `.env` files out of Git.
- Passwords are hashed with bcrypt.
- JWTs expire after seven days.
- Atlas database users and network access should be restricted where possible.
- Administrator-only complaint operations are checked on the backend as well as in the frontend.
- Photo uploads are restricted to JPEG, PNG, or WebP and limited to 2 MB; use object storage for production-scale uploads.

## Future Improvements

- Configure an email/SMS provider for notifications outside the portal.
- Add staff accounts and individual officer assignment in addition to department assignment.
- Move complaint photos from MongoDB to dedicated object storage.
- Add multilingual labels and assisted complaint classification after defining privacy and provider requirements.
- Add password recovery and a mobile application.

## Author

Smart Panchayat project developed by Abhishek Gupta.
