# SkillConnect

SkillConnect is an internal employee skill directory built with React/Vite, FastAPI, and MongoDB. It reuses the existing `skillconnect` database configured through `backend/.env`.

## Run locally on Windows

Keep the backend and frontend running in separate VS Code terminals.

Backend terminal:

```powershell
cd D:\Skill-Connect\backend
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Frontend terminal:

```powershell
cd D:\Skill-Connect\frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173/`. The API health endpoint is `http://127.0.0.1:8000/api/health`.

The backend reads `MONGODB_URI` and `DATABASE_NAME` from `backend/.env`. Copy `backend/.env.example` to `backend/.env` only if you need to create local configuration; preserve your current database URI. Never commit `.env` or employee evidence files.

## Roles and dashboards

- `/employee/dashboard` is the employee workspace; `/employee/my-tasks` shows tasks assigned to the signed-in employee; `/employee/certifications` stores that employee's submitted certifications and private proof.
- `/admin/dashboard`, `/admin/tasks`, `/admin/certifications`, and `/admin/matches` are protected Admin/Scrum Master pages. Admins can manage employees, assign tasks, review submitted evidence, and calculate transparent skill coverage.
- `/profile`, skills, projects, directory, and insight pages continue to use the existing SkillConnect features. New signups receive the `employee` role. Admin access must be assigned by an existing administrator or via the configured admin group.
- Local username/password sign-in is for development while `SSO_REQUIRED=false`. Set `SSO_REQUIRED=true` only after CirrusLabs IT has completed and tested the Microsoft configuration below.

Sessions are stored server-side in MongoDB. The browser receives an HttpOnly session cookie. Passwords are hashed. Employee profile, skill, project, task, and certification APIs verify the signed-in user and apply ownership/role checks on the backend.

## Microsoft Entra ID setup

Microsoft sign-in is implemented with MSAL Python using a tenant-specific authorization-code flow. It remains disabled until the following values are set in `backend/.env` by CirrusLabs IT:

- `MS_TENANT_ID`: CirrusLabs tenant GUID.
- `MS_CLIENT_ID`: web app registration client ID.
- `MS_CLIENT_SECRET`: server-side secret; keep it private and rotate it per IT policy.
- `MS_REDIRECT_URI`: register exactly `http://127.0.0.1:8000/api/auth/microsoft/callback` for local development (use the approved HTTPS production callback for deployment).
- `MS_ALLOWED_GROUP_ID`: Entra security group whose members may use SkillConnect. Configure the app to emit group claims; missing group claims are rejected.
- `MS_ADMIN_GROUP_ID`: optional dedicated security group whose members should be admins. If omitted, existing server-side Admin assignments remain authoritative.
- `SSO_FRONTEND_URL`: local callback destination `http://127.0.0.1:5173`.
- `SSO_REQUIRED`: leave `false` during local development; set to `true` only after tenant sign-in and group membership have been tested.
- `COOKIE_SECURE`: `false` for local HTTP; `true` for HTTPS deployment.

Never use `common` or `organizations` authority for this single-tenant company app. The API rejects tokens for another tenant, a different audience, or users outside the configured group. Real CirrusLabs SSO has not been tested because tenant registration details and IT consent are not available in this workspace. Microsoft documents that a web API must validate tokens for its own audience and validate signature/issuer against the tenant discovery metadata: [Microsoft identity platform token validation](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens).

## Database additions

No database was created or replaced. The existing `skillconnect` database now has application collections for tasks, certifications, and short-lived OAuth states when those features are first used. Existing users, profiles, skills, and projects are preserved. Non-unique lookup indexes are created without removing records. Certification proof files are stored under `backend/private_uploads/`, outside the frontend's public directory, and are served only after owner/Admin authorization. JPEG, PNG, and PDF are accepted up to 10 MiB.

## Skill matching

Admin skill matching compares required skill names with employee-entered skill records. The returned percentage is matched required skills divided by total required skills; it is only a coverage indicator, not a suitability guarantee. Teams links are accepted only from HTTPS `teams.microsoft.com` or `teams.live.com` URLs. Contact links open Teams without sending a message.

## Current limitations

- Entra SSO requires the tenant app registration, secret, callback URI, group claim setup, and CirrusLabs IT approval described above.
- Microsoft Teams contact links depend on employees saving a valid link supported by their tenant.
- Certification proof is local development storage. Production needs a private, access-controlled file store and retention policy.
- Existing company skill/profile directory pages remain available to authenticated users for internal discovery; record-changing APIs enforce ownership or Admin privileges.
