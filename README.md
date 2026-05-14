# MehediHub

**Bangladesh's first NID-verified Mehedi (Henna) artist marketplace.**

MehediHub connects customers with professional Mehedi artists across Bangladesh. Every artist is verified through NID (National Identity Document) OCR — ensuring trust and safety for all users.

---

## Features

### Core
- **NID OCR Registration** — Mandatory NID upload with Tesseract.js OCR extraction for identity verification
- **2-Step Registration Flow** — Upload NID → Review OCR data → Complete profile
- **Admin NID Review** — Admin approves or rejects registrations with rejection reasons
- **Role-based Access Control** — Admin, Artist, Customer roles with dedicated dashboards

### Customers
- Browse and filter artists by district, specialization, rating, price
- Book artist services with date/time/location
- Shop Mehedi supplies (products) with cart and checkout
- Track bookings and orders
- Leave verified reviews (only after completed bookings/delivered orders)

### Artists
- Manage services (bridal, party, Arabic, Indian, simple, custom)
- List products for sale
- Portfolio gallery
- Manage incoming bookings (accept/reject/complete)
- Track product orders and earnings

### Admin
- Dashboard with platform statistics
- NID verification queue — view NID images, OCR data, approve/reject
- Full user management (suspend/activate/delete)
- Product moderation, booking and order overview
- Review moderation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MySQL 8+ with mysql2 |
| Templating | EJS + express-ejs-layouts |
| Frontend | Bootstrap 5 (CDN), Vanilla JS |
| Authentication | express-session + bcrypt |
| OCR | Tesseract.js |
| File Uploads | Multer |
| Validation | express-validator |

---

## Prerequisites

- **Node.js** 18+
- **MySQL** 8+
- npm 9+

---

## Installation

### 1. Clone / Download
```bash
git clone <repo-url> mehedihub
cd mehedihub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mehedihub
SESSION_SECRET=generate-a-long-random-string-here
```

### 4. Create MySQL Database
```sql
mysql -u root -p -e "CREATE DATABASE mehedihub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Run Database Setup
```bash
npm run setup-db
```
This creates all tables and inserts seed data with hashed passwords.

### 6. Start Development Server
```bash
npm run dev
```

### 7. Visit the Application
Open **http://localhost:3000**

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mehedihub.com | admin123 |
| Artist | subaita@gmail.com | subaita123 |
| Customer | rahela@mehedihub.com | customer123 |

---

## Project Structure

```
mehedihub/
├── app.js                    # Express app entry point
├── config/db.js              # MySQL connection pool
├── database/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Seed data
├── scripts/setup-db.js       # DB setup script
├── middleware/
│   ├── auth.js               # requireAuth middleware
│   ├── role.js               # requireRole middleware
│   └── upload.js             # Multer upload configs
├── routes/                   # Express route definitions
├── controllers/              # Route handler logic
├── models/                   # Database query methods
├── services/ocrService.js    # Tesseract.js OCR service
├── views/                    # EJS templates
│   ├── layouts/              # Page layouts
│   ├── partials/             # Reusable partials
│   ├── public/               # Public-facing pages
│   ├── auth/                 # Registration/login views
│   ├── admin/                # Admin dashboard views
│   ├── artist/               # Artist dashboard views
│   └── customer/             # Customer dashboard views
└── public/
    ├── css/style.css         # Custom theme
    ├── js/main.js            # Client JS
    └── uploads/              # User-uploaded files
```

---

## NID Registration Flow

1. User visits `/register` → Selects role (Artist/Customer)
2. Uploads NID front (required) and back (optional) images
3. Server runs Tesseract.js OCR on images with `eng` language
4. Extracted fields (NID number, name, DOB, father, mother, address) pre-fill Step 2 form
5. User reviews OCR output, corrects errors, completes profile (email, phone, password)
6. Account created with `status='pending'`
7. Admin reviews in `/admin/pending-verifications` — views NID images and OCR data
8. On approval: `status='active'`, user can log in

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server |
| `npm run setup-db` | Initialize database schema + seed |

---

## Screenshots

*Coming soon*

---

## License

MIT
