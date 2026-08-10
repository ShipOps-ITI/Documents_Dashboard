# 🚢 ShipOps Backend — Documents & Dashboard Service

A standalone **Node.js/Express** backend service for the **Documents** and **Dashboard** modules of the ShipOps platform.

This service provides REST APIs for managing shipment documents and displaying dashboard statistics. It uses **PostgreSQL** as the database, **Prisma ORM** for database access, and **Docker Compose** to simplify local development.

---

# ✨ Features

- 📄 Upload shipment documents
- 📂 Retrieve uploaded documents
- ⬇ Download documents
- 🗑 Delete documents
- 📊 Dashboard statistics API
- 🐘 PostgreSQL database
- 🔥 Prisma ORM
- 🐳 Docker Compose support
- 🌐 RESTful API
- 📦 File upload using Multer

---

# 🛠 Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Docker & Docker Compose
- Multer
- JavaScript

---

# 📁 Project Structure

```
shipops-backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── dashboard.controller.js
│   └── documents.controller.js
│
├── middleware/
│   └── upload.js
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── routes/
│   ├── dashboard.routes.js
│   └── documents.routes.js
│
├── uploads/
│
├── postman/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── prisma.config.ts
├── server.js
└── README.md
```

---

# 📋 Prerequisites

Before running the project, install:

- Node.js (v18 or later recommended)
- Docker Desktop
- Git

Verify your installation:

```bash
node -v
npm -v
docker --version
docker compose version
git --version
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone <repository-url>

cd shipops-backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file from the example.

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/shipment_db"

PORT=5000
```

> If you're using PowerShell:

```powershell
Copy-Item .env.example .env
```

---

## 4. Start PostgreSQL

Run PostgreSQL using Docker Compose.

```bash
docker compose up -d
```

Verify it is running:

```bash
docker ps
```

You should see something similar to:

```
shipment-postgres
```

---

## 5. Generate Prisma Client

```bash
npx prisma generate
```

---

## 6. Initialize the Database

### If the database is empty

Run migrations:

```bash
npx prisma migrate dev
```

---

### If the database already exists

Pull the schema:

```bash
npx prisma db pull
```

---

## 7. Start the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will be available at

```
http://localhost:5000
```

---

# 🗄 Useful Prisma Commands

Generate Prisma Client

```bash
npx prisma generate
```

Create a migration

```bash
npx prisma migrate dev --name migration_name
```

Deploy migrations

```bash
npx prisma migrate deploy
```

Pull schema from database

```bash
npx prisma db pull
```

Push schema to database

```bash
npx prisma db push
```

Open Prisma Studio

```bash
npx prisma studio
```

Reset the database

```bash
npx prisma migrate reset
```

---

# 📮 API Endpoints

## Health

| Method | Endpoint |
|---------|----------|
| GET | `/health` |

---

## Documents

| Method | Endpoint |
|---------|----------|
| POST | `/documents/upload` |
| GET | `/documents` |
| GET | `/documents/:id` |
| GET | `/documents/:id/download` |
| DELETE | `/documents/:id` |

---

## Dashboard

| Method | Endpoint |
|---------|----------|
| GET | `/dashboard/statistics` |

---

# 📂 File Upload

The upload endpoint accepts:

- PDF
- DOC
- DOCX
- JPG
- JPEG
- PNG
- XLSX
- CSV

Uploaded files are stored inside

```
uploads/
```

---

# 🧪 Testing

Import the provided Postman collection located in

```
postman/
```

Recommended order:

1. Health Check
2. Upload Document
3. List Documents
4. Get Document
5. Download Document
6. Dashboard Statistics
7. Delete Document

---

# 🐳 Docker Commands

Start containers

```bash
docker compose up -d
```

Stop containers

```bash
docker compose stop
```

Restart containers

```bash
docker compose restart
```

View logs

```bash
docker compose logs -f
```

Remove containers

```bash
docker compose down
```

Remove containers and volumes

```bash
docker compose down -v
```

---

# 🔧 Troubleshooting

## Cannot connect to PostgreSQL

Check that Docker is running.

```bash
docker ps
```

---

## Port already in use

If port **5432** is occupied, change the host port inside `docker-compose.yml`.

Example:

```yaml
ports:
  - "5433:5432"
```

Then update your `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/shipment_db"
```

---

## Prisma Client is outdated

Regenerate it.

```bash
npx prisma generate
```

---

## Migration issues

Reset the database.

```bash
npx prisma migrate reset
```

---

## Database schema changed manually

Update Prisma schema.

```bash
npx prisma db pull
```

---

# 📌 Development Workflow

Whenever the Prisma schema changes:

```bash
npx prisma migrate dev --name <migration_name>

npx prisma generate
```

If another developer updates the database:

```bash
git pull

npx prisma migrate deploy

npx prisma generate
```

---

# 👨‍💻 Contributors

Member 4 — Documents & Dashboard Module

---

# 📄 License

This project was developed as part of the **ITI Cloud Platform Development** graduation project.