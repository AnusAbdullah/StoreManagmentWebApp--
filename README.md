# Store Management System

A full-stack store management application with a React admin dashboard, Node.js/Express API, Sequelize ORM, and MySQL database, fully containerized with Docker Compose.

---

## 🏗️ Architecture & Stack

- **Frontend**: React 18, Material UI (MUI 5), Redux Toolkit, Axios, Chart.js / Recharts
- **Backend API**: Node.js (ES Modules), Express.js, Sequelize ORM
- **Database**: MySQL 8.0
- **Orchestration**: Docker Compose with volume caching, healthchecks, and live reload

---

## 🚀 Getting Started with Docker

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed and running.

### 2. Environment Setup
The project uses a root `.env` file for centralized configuration (created automatically, ignored from git):

```bash
# MySQL
MYSQL_ROOT_PASSWORD=anas
MYSQL_DATABASE=webApp

# Server (Express API)
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=anas
DB_NAME=webApp
DB_DIALECT=mysql
SERVER_PORT=4001

# Frontend (React)
CLIENT_PORT=3001
REACT_APP_API_URL=http://localhost:4001
```

> **Note**: Port `3001` is mapped for the frontend by default to avoid conflicts if `3000` is already in use on your system. You can customize `CLIENT_PORT` in `.env`.

### 3. Start the Docker Stack

```bash
# Build and start all services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Check container status
docker compose ps

# Stop the stack
docker compose down

# Stop and wipe database volume (clean reset)
docker compose down -v
```

### 4. Access the Applications

- **Admin Dashboard**: [http://localhost:3001](http://localhost:3001) (or your chosen `CLIENT_PORT`)
- **Backend API**: [http://localhost:4001](http://localhost:4001)
- **MySQL Database**: `localhost:3306` (user: `root`, database: `webApp`)

---

## 🛠️ API Modules & Endpoints

| Resource | Base Endpoint | Description |
|---|---|---|
| Users & Auth | `/user` | Signup, signin, password management |
| Companies | `/company` | Supplier & vendor management |
| Customers | `/customer` | Customer database |
| Categories | `/catagory` | Inventory item categories |
| Items | `/item` | Stock items and inventory |
| Parties | `/party` | Business parties |
| Sales | `/sale` | Sales transactions |
| Accounts Receivable | `/accRec` | Receivable ledgers and payments |

---

## 🔄 Development & Hot Reload

Both the `server` and `admin-dashboard` mount their local folders as volumes in Docker:
- Changes in [`server/`](./server) trigger automatic server restarts via `nodemon`.
- Changes in [`admin-dashboard/src/`](./admin-dashboard/src) trigger React hot module replacement (HMR).
