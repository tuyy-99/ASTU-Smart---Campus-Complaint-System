# ASTU Smart Campus Complaint System

> **Full‑stack platform for submitting, tracking and managing university campus complaints**

---

## 🚀 Overview

The **ASTU Smart Campus Complaint System** is a modern, full‑stack web application
built for Adama Science and Technology University (ASTU). It enables
students, staff and administrators to file, review and resolve campus complaints
and service requests with real‑time updates, analytics and AI‑assisted tools.

Designed with scalability and security in mind, the project utilises a
JavaScript/TypeScript stack:

- **Backend:** Node.js + Express, MongoDB (Mongoose), Socket.io
- **Frontend:** React (Vite + TypeScript) with TailwindCSS, React Router,
  React Query and Leaflet for maps
- **AI & Services:** Google Gemini for chatbot, Nodemailer for email
- **Dev tooling:** Nodemon, ESLint/TypeScript, Vite build system

This repository contains everything needed to run the system locally or in a
production environment.

---

## 📋 Key Features

1. **Role‑based access** – three user types: _student_, _staff_ and _admin_.
   Students file complaints, staff handle departmental issues and admins manage
   users and system-wide settings.
2. **Complaint workflow** – create complaints with attachments, anonymity
   option, automated category moderation, status transitions, rejection
   reasons and student resolution verification.
3. **Real‑time notifications** via WebSockets and optional email alerts.
4. **AI‑enabled chatbot** powered by Google Gemini for automatic responses and
   category moderation.
5. **Interactive map & analytics** – view complaint locations and generate
   charts for decision‑making.
6. **Secure API** – JWT authentication, rate limiting, input validation,
   sanitisation, HTTPS support and CORS configuration.
7. **Utilities & scripts** – user seeding, department updates and data sanity
   checks.
8. **Responsive modern UI** built with React and TailwindCSS.

---

## 🗂 Repository Structure

```text
ASTU Smart Complaint System/
├── backend/                # Express API server
│   ├── src/
│   │   ├── config/         # database & upload config
│   │   ├── controllers/    # route handlers (auth, complaints, staff, ...)
│   │   ├── middleware/     # auth, validator, rateLimiter, etc.
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── services/       # email, socket, notification, analytics
│   │   ├── utils/          # helpers (JWT, file parsing, moderation)
│   │   ├── app.js          # Express app
│   │   ├── server.js       # entry point
│   │   ├── seedUsers.js    # create initial admin/staff
│   │   ├── updateStaffDepartment.js  # maintenance script
│   │   └── checkComplaints.js       # sanity checker
│   └── package.json
├── frontend/               # React TypeScript client (Vite)
│   ├── public/             # static assets
│   ├── src/
│   │   ├── api/            # HTTP client & mappers
│   │   ├── components/     # reusable UI pieces
│   │   ├── context/        # React contexts (Auth, Socket, Theme)
│   │   ├── hooks/          # custom hooks (useComplaints)
│   │   ├── layouts/        # layout components
│   │   ├── pages/          # route pages
│   │   ├── routes/         # React Router setup
│   │   └── types/          # shared types/interfaces
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── HOW_TO_GET_PASSWORD.md  # project documents
├── GIT_PUSH_PLAN.md        # commit checklist
└── README.md               # this file
```

---

## ⚙️ Getting Started

Follow the steps below to run the project on your local machine.

### 1. Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or cloud URI)
- Git
- (Optional) Google Gemini API key for chatbot
- (Optional) SMTP credentials for email notifications

### 2. Clone the repository

```bash
git clone https://github.com/<your‑org>/astu-smart-complaint-system.git
cd "ASTU Smart Complaint System"
```

### 3. Backend Setup

```bash
cd backend
npm install

# create environment file
cp .env.example .env
# edit .env and supply values (see section below)

# seed default admin & staff users
npm run seed

# start development server
npm run dev       # uses nodemon
# or
npm start         # production mode
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install

# create front‑end environment file
cp .env.example .env
# set VITE_API_BASE_URL and VITE_GEMINI_API_KEY if available

npm run dev       # starts Vite server at http://localhost:3000
```

### 5. Access the App

- Backend API: `http://localhost:5000/api`
- Frontend UI: `http://localhost:3000`

> ⚠️ Ensure the `CORS_ORIGIN` environment variable includes the frontend
> address (e.g. `http://localhost:3000`).

---

## 🛠️ Environment Variables

| Variable            | Description                                              | Required |
|---------------------|----------------------------------------------------------|----------|
| `MONGODB_URI`       | MongoDB connection string                                | ✅       |
| `PORT`              | Backend port (default `5000`)                            |          |
| `JWT_SECRET`        | Secret key for signing JWT tokens                        | ✅       |
| `JWT_EXPIRE`        | JWT expiration (e.g. `7d`)                               | ✅       |
| `CORS_ORIGIN`       | Comma‑separated list of allowed origins                  |          |
| `GEMINI_API_KEY`    | Google Gemini key for chatbot & moderation               | optional |
| `SMTP_SERVICE`      | Nodemailer service name (e.g. `gmail`)                   | optional |
| `SMTP_HOST`         | SMTP host (alternative to service)                       | optional |
| `SMTP_PORT`         | SMTP port                                                | optional |
| `SMTP_USER`         | Email / username for SMTP                                | optional |
| `SMTP_PASS`         | Password for SMTP user                                   | optional |

Frontend variables (in `frontend/.env`):

| Variable             | Description                                |
|----------------------|--------------------------------------------|
| `VITE_API_BASE_URL`  | Base URL of backend API (default port 5000)|
| `VITE_GEMINI_API_KEY`| Same Gemini key used by backend            |

---

## 📡 API Endpoints (overview)

Most routes are prefixed with `/api`.

### Authentication
- `POST /api/auth/register` – student sign‑up (admin/staff managed via UI)
- `POST /api/auth/login` – login returns JWT
- `POST /api/auth/forgot-password` – request reset email
- `POST /api/auth/reset-password` – perform reset

### Complaints
- `POST /api/complaints` – create complaint (students)
- `GET /api/complaints` – list complaints (filtered by role)
- `GET /api/complaints/:id` – retrieve details
- `PATCH /api/complaints/:id/status` – staff update status
- `PATCH /api/complaints/:id/verify` – student verify resolution

### Staff & Admin
- `GET /api/staff` – list staff users (admin)
- `PATCH /api/staff/:id` – update department/status
- `GET /api/admin/users` – manage users
- `GET /api/admin/analytics` – aggregated stats, charts

### Chatbot & Notifications
- `POST /api/chatbot` – send message to AI chatbot
- `GET /api/notifications` – retrieve user notifications

### Public
- `GET /api/public/departments` – list department names
- `POST /api/public/register` – registration requests

> Refer to the source code under `backend/src/routes` for full
> documentation and expected request/response shapes.

---

## 🧩 Scripts & Utilities

| Command                                 | Purpose                                  |
|-----------------------------------------|------------------------------------------|
| `npm run seed`                          | create default admin & staff accounts    |
| `node src/updateStaffDepartment.js`     | migrate/normalize staff department field |
| `node src/checkComplaints.js`           | sanity check for outdated complaints     |

---

## 🔒 Security & Best Practices

- Input validation using `express-validator`
- Rate limiting via `express-rate-limit`
- Sanitisation with `express-mongo-sanitize`
- HTTP headers hardened by `helmet`
- JWT authentication middleware with role checks
- File uploads secured via Multer and stored outside of public path

---

## 💡 Development Tips

- Use Chrome/Firefox dev tools + React Query Devtools
- Run backend with `npm run dev` and frontend simultaneously
- Seed users after changing `.env` to quickly access admin/staff
- Inspect WebSocket events in `backend/src/services/socketService.js`

---

## 🏁 Deployment

The app can be deployed using any Node‑capable hosting (Heroku, AWS, Digital
Ocean, etc.). Build steps:

1. Build frontend: `cd frontend && npm run build`
2. Serve `frontend/dist` with any static server or integrate into backend via
   `express.static`.
3. Set environment variables in your hosting provider.
4. Ensure MongoDB and optional SMTP/Gemini credentials are available.

Continuous integration workflows are left as an exercise for the reader.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository and create a feature branch.
2. Write clear commit messages (see `GIT_PUSH_PLAN.md` for structure).
3. Run linting/TypeScript checks (`npm run lint` in frontend).
4. Open a pull request with a detailed description of your changes.

> Feel free to open issues for feature requests or bug reports.

---

## 📄 License

This project is licensed under the **ISC License** – see the
[`LICENSE`](LICENSE) file for details.

---

## 📞 Contact & Support

For questions or support, contact the original author(s) or maintainers via
email or the project repository.

---

Thank you for using the ASTU Smart Campus Complaint System. Happy coding! 🚀
