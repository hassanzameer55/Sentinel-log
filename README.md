# Sentinel Log

Enterprise-grade MERN log aggregation platform with Redis buffering and real-time observability.

## 🚀 Key Features

- **High-Throughput Ingestion**: Sub-50ms ingestion latency using Redis as a FIFO buffer.
- **Scalable Real-Time Engine**: Live log feed powered by Socket.io and Redis Pub/Sub.
- **Distributed Tracing**: Reconstruct request lifecycles across microservices using unique Request IDs.
- **Intelligent Alerting**: Threshold-based monitoring with configurable windows and cooldown periods.
- **Enterprise Security**: JWT authentication with refresh token rotation and Role-Based Access Control (RBAC).
- **NDJSON Bulk Support**: Stream massive log files efficiently using NDJSON.
- **Fault-Tolerant Ingestion**: Automatic local disk fallback buffer in case of Redis downtime.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Redis.
- **Infrastructure**: Docker & Docker Compose.
- **Security**: JWT, bcrypt, Helmet, Express Rate Limit.

## 🏁 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hassanzameer55/Sentinel-log.git
   cd Sentinel-log
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```

4. **Environment Setup**:
   Copy `backend/.env.example` to `backend/.env` and configure your secrets.

5. **Run Development Mode**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `backend/`: Express.js server and background workers.
- `frontend/`: Vite-powered React dashboard.
- `docker-compose.yml`: Local infrastructure orchestration.

---

Built with ❤️ by [Hassan Ali](https://github.com/hassanzameer55)
