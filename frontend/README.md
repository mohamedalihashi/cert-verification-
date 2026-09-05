# School Certificate Verification System

Next.js frontend for the CILAN certificate registry. It talks to the NestJS API in `../backend`.

## Run

Start the API first:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev
```

Then the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/api/*` is proxied to `http://localhost:4000`.

## Sample verification

- Valid: [http://localhost:3000/verify/CILAN-2026-00452](http://localhost:3000/verify/CILAN-2026-00452)
- Revoked: [http://localhost:3000/verify/CILAN-2026-00198](http://localhost:3000/verify/CILAN-2026-00198)
