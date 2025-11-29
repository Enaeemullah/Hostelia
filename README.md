# Hostelia – Multi-Hostel Management Suite

Hostelia is a full-stack Hostel Management System built with NestJS, MySQL, and React that offers authentication, multi-hostel dashboards, fee tracking, reporting, and automated reminders.

## Tech Stack
- **Backend:** NestJS, TypeScript, TypeORM, MySQL, JWT, Nodemailer, Nest Schedule
- **Frontend:** React (Vite + TypeScript), React Hook Form, Tailwind CSS, Axios
- **Tooling:** ExcelJS, PDFKit, csv-stringify for reports; bcrypt for hashing

## Project Structure
```
/workspace
├── backend              # NestJS API
│   ├── src
│   │   ├── auth         # Signup/signin, JWT strategy
│   │   ├── common       # Guards, decorators, enums, DTOs
│   │   ├── config       # TypeORM + env config
│   │   ├── dashboard    # Summary & room stats API
│   │   ├── fees         # Fee CRUD + receipts
│   │   ├── hostels      # Hostel CRUD scoped per user
│   │   ├── notifications# Email + cron jobs
│   │   ├── reports      # CSV/Excel/PDF exports
│   │   ├── rooms        # Room CRUD per hostel
│   │   ├── students     # Student CRUD + assignments
│   │   ├── users        # User repository service
│   │   └── database/entities
│   └── .env.example     # Required configuration values
└── frontend             # React dashboard
    ├── src
    │   ├── api          # Axios wrappers per resource
    │   ├── context      # HosteliaProvider (auth + cache)
    │   ├── pages        # Sign in, Sign up, Dashboard
    │   ├── components   # Icons, modal primitives
    │   └── types        # Shared front-end contracts
```

## Database Schema
| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | `id (uuid)`, `email (unique)`, `password`, timestamps | Owns one or many hostels |
| `hostels` | `id`, `name`, `address`, `description`, `ownerId` | Scoped per authenticated user |
| `rooms` | `id`, `roomNumber`, `capacity`, `hostelId` | Students join via `roomId` (nullable) |
| `students` | `id`, `name`, `rollNumber (unique)`, `hostelId`, `roomId` | Acts as the root for fee tracking |
| `fees` | `id`, `studentId`, `amount (decimal)`, `dueDate`, `status`, `paidAt`, `lastReminderSentAt` | Status enum: `PENDING`, `PAID`, `OVERDUE` |
| `receipts` | `id`, `feeId` (1:1), `receiptNumber`, `amount`, `issuedAt` | PDF receipts generated on demand |

All relations are enforced via TypeORM with cascading deletes from owners → hostels → rooms/students/fees.

## Backend Modules & Key Endpoints
- **AuthModule** – `/api/auth/signup`, `/api/auth/signin`; hashes passwords, issues JWT.
- **HostelsModule** – `/api/hostels` CRUD scoped to owner.
- **RoomsModule** – `/api/rooms` for room management under a hostel.
- **StudentsModule** – `/api/students` for CRUD + room assignments.
- **FeesModule** – `/api/fees` CRUD, `/fees/:id/mark-paid`, `/fees/:id/receipt` returning receipt metadata + Base64 PDF.
- **DashboardModule** – `/api/dashboard/hostel/:hostelId` summary totals, room stats, and student table data.
- **ReportsModule** – `/api/reports/:hostelId/:format` streaming CSV, Excel, or PDF exports.
- **NotificationsModule** – wires a cron job & email service for unpaid fee reminders.

### Scheduled Fee Reminder
`FeeReminderCron` runs every day at 01:00 server time (`CronExpression.EVERY_DAY_AT_1AM`). It:
1. Fetches fees due in exactly 5 days with `PENDING` status.
2. Emails hostel owners (via SMTP or console log fallback) using `NotificationsService`.
3. Marks each fee as reminded via `FeesService.flagReminderSent`.

## Frontend Overview
- **Authentication Pages** – Responsive signup/signin built with React Hook Form and inline styles inspired by the provided design snippet.
- **DashboardPage** – Multi-panel admin workspace featuring:
  - Hostel selector + logout.
  - Summary cards and per-room occupancy tiles.
  - Forms for hostels, rooms, students, and fee assignments.
  - Student table with fee chips, search, and export buttons (CSV/Excel/PDF) that hit the backend endpoints.
- **HosteliaProvider Context** – Persists JWT/user/hostel selections to `localStorage`, wraps API calls, caches dashboard data, and exposes helpers for exports and refreshes.

## Running the Stack
1. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run start:dev
   ```
   Ensure MySQL is reachable with the credentials defined in `.env` (defaults: `host=localhost`, `database=hostelia`).

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Set `VITE_API_URL` (default `http://localhost:3000/api`) if the backend runs elsewhere.

3. **Build commands**
   - `npm run build` (backend) emits Nest dist.
   - `npm run build` (frontend) bundles the Vite app to `frontend/dist`.

## Security & Operational Notes
- Passwords hashed with bcrypt (salt rounds = 10).
- JWT guard protects every management endpoint, with helper decorator `@CurrentUser` for scoped queries.
- TypeORM runs with `synchronize: true` for developer velocity—switch to migrations before production.
- Notification emails degrade gracefully to console logs when SMTP credentials are absent.
- Report downloads stream binary responses with proper `Content-Disposition` headers for browser compatibility.

This README doubles as the requested architecture + schema handoff for Hostelia.
