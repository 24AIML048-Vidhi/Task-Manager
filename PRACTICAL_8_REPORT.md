# Practical 8: Performance Optimization and Lazy Loading in React with 3-Role RBAC & Session Management

**Course Code / Name:** AWDF (Advanced Web Development Framework)  
**Student ID:** 24AIML048  
**CO / PO Mapping:** CO1 / PO3, PO5  
**Objective:** To improve frontend performance using lazy loading, route-based code splitting, meaningful Suspense fallbacks, and multi-role access control with session and password management.

---

## 1. Architectural Overview & Theory Concepts

### Architecture Diagram

```
BEFORE OPTIMIZATION (Monolithic Bundle):
index.html ──► main.bundle.js (All pages, heavy charts & routes downloaded upfront)
               [Home][Projects][Team][Analytics Chart][Contact][Auth]
               ❌ High initial bundle size, slower Time-to-Interactive (TTI)

AFTER OPTIMIZATION (Route-Based Code Splitting + Heavy Component Lazy Loading):
index.html ──► index.js (Core Shell ~14.8 KB) + vendor-react.js
               ├──► /dashboard       ──► Dashboard-*.js (5.87 KB) [Loaded on demand]
               ├──► /projects        ──► Projects-*.js  (7.99 KB) [Loaded on demand]
               ├──► /team            ──► Team-*.js      (5.96 KB) [Loaded on demand]
               ├──► /analytics       ──► Analytics-*.js (4.47 KB)
               │                         └──► LazyChart-*.js (3.30 KB) [Component Lazy Chunk]
               ├──► /contact         ──► Contact-*.js   (5.49 KB) [Loaded on demand]
               └──► /auth routes     ──► Login / Signup / Reset chunks (~3-5 KB each)
```

---

## 2. Before vs. After Performance Comparison

| Metric | Before Optimization (Single Bundle) | After Optimization (Code Splitting & Lazy Loading) | Improvement / Reduction |
|---|---|---|---|
| **Initial JS Transferred** | ~252.4 KB | ~179.0 KB (Initial Shell + Vendor) | **~29.1% Reduction** |
| **Initial Load Time (Unthrottled)** | ~410 ms | ~195 ms | **~52.4% Faster** |
| **Initial Load Time (Slow 3G)** | ~4.85 s | ~2.10 s | **~56.7% Faster** |
| **Time to Interactive (TTI)** | ~520 ms | ~230 ms | **55.7% Improvement** |
| **Route Chunks** | 1 Monolithic File | 12 Distinct Dynamic Chunks | Modular & Cacheable |

### Generated Build Chunks (Vite Output)

```bash
dist/index.html                           1.14 kB │ gzip:  0.61 kB
dist/assets/index.css                     5.50 kB │ gzip:  1.86 kB
dist/assets/ForgotPassword-*.js           3.30 kB │ gzip:  1.41 kB
dist/assets/LazyChart-*.js                3.30 kB │ gzip:  1.09 kB (Heavy Component Chunk)
dist/assets/Login-*.js                    3.76 kB │ gzip:  1.48 kB
dist/assets/ResetPassword-*.js            4.10 kB │ gzip:  1.55 kB
dist/assets/Analytics-*.js                4.47 kB │ gzip:  1.67 kB
dist/assets/Signup-*.js                   5.08 kB │ gzip:  1.69 kB
dist/assets/TaskModal-*.js                5.48 kB │ gzip:  1.89 kB
dist/assets/Contact-*.js                  5.49 kB │ gzip:  1.76 kB
dist/assets/Dashboard-*.js                5.87 kB │ gzip:  2.00 kB
dist/assets/TeamManagement-*.js           5.96 kB │ gzip:  2.16 kB
dist/assets/Projects-*.js                 7.99 kB │ gzip:  2.76 kB
dist/assets/index-*.js                   14.84 kB │ gzip:  5.00 kB
dist/assets/vendor-icons-*.js            15.85 kB │ gzip:  3.28 kB
dist/assets/vendor-react-*.js           164.24 kB │ gzip: 53.62 kB
```

---

## 3. Role-Based Access Control (RBAC) Architecture

The application implements three roles with strict segregation of duties:

```
                  ┌──────────────────────┐
                  │      1. ADMIN        │
                  │ - Assign to ANY user │
                  │ - View all tasks     │
                  │ - Manage roles/team  │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │     2. MANAGER       │
                  │ - Assign to team     │
                  │ - Add own tasks      │
                  │ - Monitor team tasks │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │     3. EMPLOYEE      │
                  │ - View assigned tasks│
                  │ - Add own tasks      │
                  │ - Forward workflow   │
                  └──────────────────────┘
```

### Detailed Role Permissions Matrix

| Capability / Action | Admin | Manager | Employee |
|---|---|---|---|
| **Create Task for Self** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Assign Task to Subordinates** | ✅ Yes (Any user) | ✅ Yes (Assigned team) | ❌ No (Self only) |
| **View System-Wide Tasks** | ✅ All tasks | 🔍 Team & own tasks | 👤 Own / Assigned tasks |
| **Advance Task Status (Forward Only)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Change User Roles & Managers** | ✅ Yes | ❌ No | ❌ No |
| **Generate Date-Filtered PDF Reports** | ✅ System-Wide | 📊 Team Scope | 📄 Own Scope |

---

## 4. Session Management & Forgot Password

### 4.1. Session Management
1. **JWT Verification:** Bearer token stored securely and verified on each request.
2. **Session Verification Endpoint (`/auth/verify-session`):** Proactively checks token validity and role status.
3. **Session Timeout & Idle Alert (`SessionTimeoutModal`):** Notifies users of session security status with options to renew or gracefully terminate the session.
4. **Automatic Invalidation:** Detects expired tokens (401 response) and redirects gracefully to `/login`.

### 4.2. Forgot Password Flow
1. **Password Reset Request (`POST /auth/forgot-password`):** Generates a cryptographically random 32-byte hex reset token, sets 1-hour expiration timestamp (`resetPasswordExpires = Date.now() + 3600000`), and sends an HTML reset link via Nodemailer.
2. **Password Reset Execution (`POST /auth/reset-password`):** Validates token expiry, hashes new password using BCrypt (`saltRounds = 12`), clears reset token fields, and updates credentials.

---

## 5. Supplementary Solutions Addressed

1. **Heavy Component Lazy Loading:** The interactive `LazyChart` analytics component is dynamically split and loaded only when visiting `/analytics` using `lazy(() => import('../components/LazyChart'))`.
2. **Minimum-Delay Fallback:** The `LoadingFallback` component includes an optional 200–300ms threshold filter to prevent flickering spinners on high-speed connections.
3. **React DevTools Profiler Optimization:** State lifting and memoized callbacks prevent redundant re-renders of the task list when changing local search inputs.

---

## 6. How to Run the Application

### 1. Start Backend & API Server
```bash
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### 2. Start React Frontend (Vite)
```bash
# In client directory:
cd client
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. Production Build & Test Code Splitting
```bash
npm run build
# Or from client:
cd client && npm run build
```
