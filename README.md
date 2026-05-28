# AI Pulse

AI Pulse is a minimal AI news aggregation SaaS MVP built with Next.js 15, Supabase Postgres, Prisma, Vercel Cron, RSS feeds, and OpenAI `gpt-4o-mini`.

## 1. Overall Architecture

- Frontend: Next.js App Router, TypeScript, TailwindCSS, shadcn/ui-style primitives.
- Backend: Next.js Route Handlers and Server Actions.
- Database: Supabase Postgres.
- ORM: Prisma.
- AI: OpenAI Chat Completions with `gpt-4o-mini`.
- Ingestion: Vercel Cron calls `/api/cron/ingest` every 3 hours.
- SEO: Dynamic metadata, sitemap, robots.txt, and `NewsArticle` JSON-LD.
- Extensibility: Articles and sources are separated so ads, auth, favorites, chat search, newsletters, and paid APIs can be added without rewriting ingestion.

## 2. Folder Structure

```txt
app/
  actions/refresh-news.ts
  api/articles/route.ts
  api/cron/ingest/route.ts
  api/sources/route.ts
  articles/[slug]/page.tsx
  globals.css
  layout.tsx
  loading.tsx
  page.tsx
  robots.ts
  sitemap.ts
components/
  news/
  ui/
lib/
  ai.ts
  articles.ts
  dedupe.ts
  ingest.ts
  prisma.ts
  rss.ts
  sources.ts
  utils.ts
prisma/
  schema.prisma
  seed.ts
scripts/
  ingest.ts
vercel.json
```

## 3. Implementation Code

The MVP code is included in this repository. Main entry points:

- RSS ingestion: `lib/ingest.ts`
- RSS parsing: `lib/rss.ts`
- AI summarization: `lib/ai.ts`
- Duplicate detection: `lib/dedupe.ts`
- Article queries: `lib/articles.ts`
- Dashboard UI: `components/news/news-dashboard.tsx`
- Cron route: `app/api/cron/ingest/route.ts`

## 4. Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

3. Add Supabase connection strings and OpenAI API key.

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="change-me"
```

4. Run Prisma migration and seed sources.

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Run the app.

```bash
npm run dev
```

6. Ingest initial articles.

```bash
npm run ingest
```

## 5. Deploy

1. Create a Supabase project.
2. Set Vercel environment variables from `.env.example`.
3. Deploy to Vercel.
4. Run production migration.

```bash
npm run prisma:deploy
```

5. Vercel Cron is configured in `vercel.json`.

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "0 */3 * * *"
    }
  ]
}
```

## 6. Improvement Ideas

- Add embeddings for semantic dedupe and related articles.
- Add a normalized `Tag` table once tag analytics become important.
- Add `User`, `Favorite`, and `SavedSearch` models for login features.
- Add newsletter digests with Resend or another email provider.
- Add article full-text extraction for feeds that only provide excerpts.
- Add moderation rules to suppress low-signal syndicated articles.
- Add analytics events for source quality and ranking feedback.

## 7. Monetization Ideas

- Newsletter sponsorship slots.
- Native ad cards between article groups.
- Paid API access for summarized AI news.
- Pro filters for investors, founders, engineers, or policy teams.
- Team workspaces with saved searches and Slack/email alerts.
- Affiliate links for AI tools, events, and courses.
