# legalfit

MVP workspace for the Anden-first legalfit intake and Lead Inbox.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`

4. Apply Supabase migrations from `supabase/migrations/`.

5. Seed local/demo data from `supabase/seed.sql`, or manually seed at least one active operator in `public.anden_operators` with the email used for Supabase Auth magic links.

6. Run the app:

   ```bash
   npm run dev
   ```

## Verification

```bash
npm test
npm run typecheck
npm run build
```
