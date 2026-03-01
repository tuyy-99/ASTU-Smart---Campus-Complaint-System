# ASTU Smart Campus Complaint System

A comprehensive full-stack web application for managing campus complaints at Adama Science and Technology University (ASTU). The system enables students to submit complaints, staff to manage and resolve them, and administrators to oversee the entire complaint resolution process.

## 🎯 Project Overview

### Problem Statement
Traditional complaint management systems in universities are often manual, paper-based, and lack transparency. This leads to:
- Lost or forgotten complaints
- No accountability or tracking
- Delayed responses
- Poor communication between students and administration

### Solution
A digital complaint management system that provides:
- Centralized complaint submission and tracking
- Real-time status updates and notifications
- Role-based access control
- Anonymous complaint submission option
- Comprehensive audit logging
- AI-powered chatbot assistance
- Data analytics and reporting

---

## 🏗️ System Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS (styling with glassmorphism effects)
- React Query (data fetching and caching)
- React Router v6 (navigation)
- Framer Motion (animations)
- Axios (HTTP client)
- React Hook Form + Zod (form validation)

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT (JSON Web Tokens for authentication)
- Bcrypt (password hashing)
- Cloudinary (cloud file storage)
- Multer (file upload handling)
- Nodemailer (email notifications)
- Google Gemini AI (intelligent chatbot)
- Helmet (security headers)
- Express Rate Limit (API rate limiting)

**Deployment:**
- Frontend: Vercel (serverless deployment)
- Backend: Render (cloud hosting)
- Database: MongoDB Atlas (cloud database)
- File Storage: Cloudinary CDN

---

## 👥 User Roles & Features

### 1. Students
**Authentication:**
- Register with student ID (UGR/XXXXX/XX format) and ID photo verification
- Login with student ID and password
- Password reset via email

**Features:**
- Submit complaints with attachments (images/PDFs)
- Submit anonymous complaints (identity hidden from staff/admin)
- Edit their own complaints
- Track complaint status in real-time
- Verify complaint resolution (confirm fixed or reopen)
- View complaint history
- AI chatbot assistance
- Email notifications for status updates

### 2. Staff
**Authentication:**
- Login with email and password
- Assigned to specific departments

**Features:**
- View ALL complaints across departments
- Update complaint status (pending → open → in-progress → resolved)
- Add remarks/comments to complaints
- Approve/reject student registration requests
- Manage students in their department
- Suspend/reactivate student accounts
- Email notifications for new complaints

**Status Workflow:**
- Pending Review → Open → In Progress → Resolved
- Can move status forward or backward (flexible workflow)
- Cannot return to "Pending Review" from "Resolved"

### 3. Administrators
**Authentication:**
- Login with email and password
- Full system access

**Features:**
- View all complaints and users
- Create staff accounts
- Deactivate staff accounts
- View system analytics and statistics
- Export complaint data (CSV/Excel)
- View comprehensive audit logs
- Monitor system activity
- Manage registration requests

---

## 🔑 Key Features

### 1. Anonymous Complaints
- Students can submit complaints anonymously
- Identity is hidden from staff and administrators
- System maintains internal tracking for authorization
- Encourages reporting of sensitive issues

### 2. Complaint Management
- Multi-file attachments (up to 5 files, 5MB each)
- Support for images (JPG, PNG) and PDFs
- Automatic category moderation using AI
- Priority levels (Low, Medium, High)
- Department-based routing
- SLA (Service Level Agreement) tracking

### 3. Real-time Notifications
- Email notifications for:
  - New complaint submissions
  - Status updates
  - Registration approvals/rejections
  - Account creation
  - Password resets
- In-app notification system

### 4. AI Chatbot
- Powered by Google Gemini AI
- Context-aware responses
- Helps students with:
  - How to submit complaints
  - Understanding complaint status
  - General campus information
  - FAQ responses

### 5. Audit Logging
- Comprehensive activity tracking
- Logs all major actions:
  - User logins
  - Complaint creation/updates
  - Status changes
  - Registration approvals
  - User management actions
- Filterable by action, resource, date
- Pagination support
- Admin-only access

### 6. File Storage
- Cloudinary integration for permanent storage
- Automatic image optimization
- CDN delivery for fast loading
- Supports both local and cloud storage
- Migration script for existing files

### 7. Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- MongoDB sanitization
- Helmet security headers
- Input validation with Zod
- Role-based access control

---

## 📊 Database Schema

### Collections

**Users:**
- Student ID, name, email, password (hashed)
- Role (student, staff, admin)
- Department
- Profile photo
- Account status (Active, Suspended)

**Complaints:**
- Title, description, category, department
- Priority (low, medium, high)
- Status (pending_review, open, in_progress, resolved, rejected)
- Anonymous flag
- Attachments (files with extracted text)
- Remarks (comments from staff)
- Resolution verification
- SLA tracking
- Created by (student reference)

**RegistrationRequests:**
- Student information
- Profile photo and ID photo
- Status (pending, approved, rejected)
- Reviewed by (staff reference)
- Rejection reason

**AuditLogs:**
- User reference
- Action type
- Resource type
- Details and metadata
- IP address and user agent
- Timestamp

**Notifications:**
- Recipient (user reference)
- Type, title, message
- Read status
- Related complaint

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for email notifications)
- Google Gemini API key

### Backend Setup

1. **Clone the repository:**
```bash
git clone https://github.com/tuyy-99/ASTU-Smart---Campus-Complaint-System.git
cd "ASTU Smart Complaint System/backend"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173

# Email Configuration
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@astu.edu.et
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp
```

4. **Seed initial admin user:**
```bash
node src/seedUsers.js
```

5. **Start the server:**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install --legacy-peer-deps
```

3. **Create `.env` file:**
```env
VITE_API_BASE_URL=http://localhost:5000
```

4. **Start development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📦 Deployment

### Backend (Render)

1. **Create new Web Service on Render**
2. **Connect GitHub repository**
3. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`

4. **Add Environment Variables:**
   - All variables from `.env` file
   - Set `NODE_ENV=production`
   - Add `CORS_ORIGIN` with your Vercel URL

5. **Deploy** - Render will auto-deploy on git push

### Frontend (Vercel)

1. **Import project from GitHub**
2. **Configure:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`

3. **Add Environment Variable:**
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy** - Vercel will auto-deploy on git push

### Cloudinary Migration

After deployment, migrate existing files to Cloudinary:

```bash
cd backend
node migrateToCloudinary.js
```

This uploads all local files to Cloudinary and updates database records.

---

## 🎨 UI/UX Features

### Design System
- **Glassmorphism** - Modern frosted glass effects
- **Dark Mode** - Full dark theme support
- **Responsive** - Mobile-first design
- **Animations** - Smooth transitions with Framer Motion
- **Role-based Theming:**
  - Admin: Purple accent
  - Staff: Blue accent
  - Student: Emerald/Green accent

### Key Pages
- Landing page with campus showcase carousel
- Separate login pages for students and staff
- Dashboard with statistics and charts
- Complaint submission with drag-drop file upload
- Complaint details with status timeline
- User management with search and filters
- Registration approval workflow
- Audit log viewer with filters
- Profile management
- AI chatbot interface

---

## 🔐 Security Considerations

1. **Authentication:**
   - JWT tokens with 7-day expiration
   - Secure password hashing (bcrypt, 10 rounds)
   - Password reset with time-limited tokens

2. **Authorization:**
   - Role-based access control (RBAC)
   - Route-level protection
   - Resource-level permissions

3. **Data Protection:**
   - MongoDB sanitization (prevents NoSQL injection)
   - Input validation with Zod schemas
   - XSS protection with Helmet
   - CORS configuration

4. **Rate Limiting:**
   - General API: 100 requests/15 minutes
   - Complaint submission: 10 requests/hour
   - Login attempts: 5 requests/15 minutes

5. **File Upload:**
   - File type validation
   - File size limits (5MB per file)
   - Secure storage on Cloudinary
   - Virus scanning (recommended for production)

---

## 📈 Analytics & Reporting

### Dashboard Statistics
- Total complaints by status
- Complaints by category
- Complaints by department
- Resolution time metrics
- SLA compliance rates
- User activity trends

### Export Features
- CSV export of all complaints
- Excel export with formatting
- Filterable data exports
- Date range selection

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Student registration and approval
- [ ] Student login with student ID
- [ ] Staff/Admin login with email
- [ ] Complaint submission (normal and anonymous)
- [ ] File upload and display
- [ ] Status updates and notifications
- [ ] Email delivery
- [ ] Chatbot responses
- [ ] Audit log recording
- [ ] Dark mode toggle
- [ ] Responsive design on mobile

### Test Accounts
After running seed script:
- **Admin:** admin@test.com / Admin@123
- **Staff:** Create via admin panel
- **Student:** Register and get approved by staff

---

## 🛠️ Maintenance Scripts

### Seed Users
```bash
node src/seedUsers.js
```
Creates initial admin account.

### Seed Audit Logs
```bash
node seedAuditLogs.js
```
Creates sample audit log entries for testing.

### Migrate to Cloudinary
```bash
node migrateToCloudinary.js
```
Uploads local files to Cloudinary and updates database.

### Update Staff Departments
```bash
node src/updateStaffDepartment.js
```
Bulk update staff department assignments.

---

## 📝 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend.onrender.com/api`

### Authentication Endpoints
- `POST /auth/register-request` - Submit registration request
- `POST /auth/login` - Login (student ID or email)
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `PUT /auth/reset-password/:token` - Reset password

### Complaint Endpoints
- `GET /complaints` - Get complaints (filtered by role)
- `POST /complaints` - Create complaint
- `GET /complaints/:id` - Get complaint details
- `PUT /complaints/:id` - Update complaint
- `PATCH /complaints/:id/status` - Update status (staff only)
- `POST /complaints/:id/remarks` - Add remark
- `PATCH /complaints/:id/verify` - Verify resolution (student)

### Admin Endpoints
- `GET /admin/users` - Get all users
- `POST /admin/users` - Create staff account
- `DELETE /admin/users/:id` - Deactivate user
- `GET /admin/analytics` - Get system statistics
- `GET /admin/complaints/export` - Export complaints

### Staff Endpoints
- `GET /staff/registration-requests` - Get registration requests
- `PATCH /staff/registration-requests/:id/approve` - Approve request
- `PATCH /staff/registration-requests/:id/reject` - Reject request
- `GET /staff/students` - Get department students
- `PATCH /staff/students/:id/suspend` - Suspend student
- `PATCH /staff/students/:id/reactivate` - Reactivate student

### Audit Endpoints
- `GET /audit/logs` - Get audit logs (admin only)
- `GET /audit/stats` - Get audit statistics

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Tursina Yisehak**
- GitHub: [@tuyy-99](https://github.com/tuyy-99)
- Email: tursinayisehak@gmail.com

---

## 🙏 Acknowledgments

- Adama Science and Technology University and ASTU stem
- React and Node.js communities
- Cloudinary for file storage
- Google Gemini AI for chatbot capabilities
- All contributors and testers

---

## 📞 Support

For issues, questions, or suggestions:
1. Open an issue on GitHub
2. Contact the developer via email
3. Check the documentation in `/DEPLOYMENT_GUIDE.md`

---

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Full complaint management system
- Anonymous complaints
- AI chatbot integration
- Audit logging
- Cloudinary file storage
- Email notifications
- Comprehensive admin panel

---

## 🚧 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Complaint escalation workflow
- [ ] Multi-language support
- [ ] Integration with university ERP
- [ ] Automated complaint categorization
- [ ] Sentiment analysis
- [ ] Video attachment support
