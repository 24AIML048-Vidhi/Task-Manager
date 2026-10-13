# Task Manager Pro — AWDF Practicals Repository

A full-stack Role-Based Task Management Application built with **Node.js, Express, MongoDB (Mongoose), React 18, and Vite**.

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

Full Practical 8 documentation and before/after metrics table are available in [PRACTICAL_8_REPORT.md](./PRACTICAL_8_REPORT.md).
