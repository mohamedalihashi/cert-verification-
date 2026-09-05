# CILAN Certificate Registry API

NestJS API backed by **Supabase Postgres**.

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Go to **Project Settings → Database**.
3. Copy the connection string (URI).
4. Put it in `backend/.env`:

```env
DATABASE_URL="postgresql://postgres.XXXX:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.XXXX:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

If you use the older host `db.PROJECT.supabase.co:5432`, set **both** URLs to that same direct URI and add `?sslmode=require`.

## 2. Push the schema and seed

```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev
```

## 3. Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production administrator and password reset

Copy the variables from `.env.example` into the deployment environment. The
first super administrator is created from `ADMIN_NAME`, `ADMIN_EMAIL`, and
`ADMIN_INITIAL_PASSWORD`. Remove `ADMIN_INITIAL_PASSWORD` after the account is
created. Password-reset OTP delivery requires a Resend API key and a verified
sender in `RESEND_API_KEY` and `EMAIL_FROM`.

Sample verification: `GET /api/public/verify/CILAN-2026-00452`

Tables created in Supabase: `users`, `courses`, `students`, `certificates`, `activity_logs`, `settings`, `password_resets`.

Certificate files stay in local `uploads/` (private). Public verify never returns the original document.
