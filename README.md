# Task Manager Pro — AWDF Practicals Repository

[![CI Pipeline](https://github.com/24AIML048-Vidhi/Task-Manager/actions/workflows/ci.yml/badge.svg)](https://github.com/24AIML048-Vidhi/Task-Manager/actions/workflows/ci.yml)

A full-stack Role-Based Task Management Application built with **Node.js, Express, MongoDB (Mongoose), React 18, and Vite**.

---

## Practical 12: CI/CD Pipeline with GitHub Actions

### Overview
Automated Continuous Integration (CI) pipeline using **GitHub Actions** to guarantee automated test validation, code quality, and build integrity across pushes and pull requests.

### Key Implementations:
1. **GitHub Actions Workflow (`.github/workflows/ci.yml`):**
   - Automatically triggers on every `push` and `pull_request` targeting `main` and `master`.
   - Uses `ubuntu-latest` with official actions `actions/checkout@v4` and `actions/setup-node@v4` (Node.js 20.x LTS).
   - Executes two parallel verification jobs:
     - **`test-backend`**: Installs backend dependencies and executes automated Jest + Supertest API integration tests.
     - **`build-frontend`**: Installs client dependencies and compiles the React 18/Vite production build.
2. **Automated Backend Testing (Jest & Supertest):**
   - Dedicated API integration test suite (`tests/tasks.test.js`) verifying JWT authentication guards, task querying, task creation, route validations, and public endpoints.
   - Fully decoupled from live database instances using Mongoose model mocks, enabling instantaneous execution in isolated CI environments.
3. **Deliberate Failure & Recovery Demonstration:**
   - Demonstrates red-to-green CI pipeline progression by inducing a deliberate assertion failure, catching the failure on GitHub Actions, and restoring passing status.
4. **Pipeline Screenshots:**
   - Stored in [`docs/practical-12/`](./docs/practical-12/):
     - `ci-failed.png`: Demonstrates the deliberate test failure caught in GitHub Actions.
     - `ci-passed.png`: Demonstrates the successful pipeline run with all tests passing.

---

## Practical 8: Performance Optimization & Lazy Loading

### Key Implementations:
1. **Route-Based Code Splitting:** Implemented using `React.lazy()` and `<Suspense fallback={<LoadingFallback />}>` for all application routes (`/dashboard`, `/projects`, `/team`, `/analytics`, `/contact`, `/login`, `/signup`, `/forgot-password`, `/reset-password`).
2. **Heavy Component Lazy Loading:** The interactive `LazyChart` data visualizer is loaded on demand only when visiting the Analytics view.
3. **Role-Based Access Control (RBAC):**
   - **Admin:** Can assign tasks to any employee/user, view all tasks, modify user roles, and generate system-wide reports.
   - **Manager:** Can assign tasks to employees under their supervision, add their own tasks, and monitor team progress.
   - **Employee:** Can view tasks assigned to them, create personal tasks, and advance status in forward-only sequence.
4. **Session Management:** Secure JWT session tracking, `/auth/verify-session` endpoint, idle detection, and session timeout alerts.
5. **Forgot Password Flow:** Secure 1-hour expiration reset token generation, Nodemailer email dispatch, and token-based password reset.

---

## Quick Start

### 1. Backend Server
```bash
npm install
npm run dev
```

### 2. React Client
```bash
cd client
npm install
npm run dev
```

### 3. Production Build & Code Splitting Verification
```bash
npm run build
```

### 4. Run Automated CI Test Suite
```bash
npm test
```

Full Practical 8 documentation and before/after metrics table are available in [PRACTICAL_8_REPORT.md](./PRACTICAL_8_REPORT.md).
