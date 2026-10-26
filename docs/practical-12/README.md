# Practical 12: CI/CD Pipeline Documentation & Screenshots

This directory is designated for saving proof of continuous integration execution from the GitHub Actions dashboard for **Practical 12: CI/CD Pipeline with GitHub Actions**.

---

## Required Screenshot Deliverables

1. **`ci-failed.png`**  
   - **Description:** Screenshot of the GitHub Actions dashboard displaying a failed workflow run (Red ❌).  
   - **Cause:** Triggered by the deliberate test failure assertion demonstration in `tests/tasks.test.js`.  
   - **Key Visual Elements:**
     - Workflow name: `CI Pipeline`
     - Commit message (e.g., `test: demonstrate deliberate CI pipeline failure`)
     - Red ❌ indicator on `test-backend` job
     - Failed assertion logs showing `Expected: 201, Received: 200` (or similar status mismatch).

2. **`ci-passed.png`**  
   - **Description:** Screenshot of the GitHub Actions dashboard displaying a successful workflow run (Green ✔️).  
   - **Cause:** Triggered after restoring the correct test assertion and pushing the fix.  
   - **Key Visual Elements:**
     - Workflow name: `CI Pipeline`
     - Commit message (e.g., `fix: restore passing test assertion for CI verification`)
     - Green ✔️ checkmarks across both `test-backend` and `build-frontend` jobs
     - Total duration and successful completion status.

---

## How to Capture the Screenshots from GitHub Actions

1. Open your repository on GitHub:  
   `https://github.com/24AIML048-Vidhi/Task-Manager`
2. Navigate to the **Actions** tab at the top.
3. Select **CI Pipeline** from the left-hand workflows sidebar.
4. Click on the respective workflow run:
   - For `ci-failed.png`: Click on the failed run, expand the `test-backend` step, and take a screenshot showing the failure logs and red icon.
   - For `ci-passed.png`: Click on the successful run showing green checkmarks for both `test-backend` and `build-frontend`.
5. Save the image files inside this directory:
   - `docs/practical-12/ci-failed.png`
   - `docs/practical-12/ci-passed.png`
