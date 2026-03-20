# Abstract Roofing — Landing Page Deployment

## Structure
```
/
├── api/
│   └── webhook.js        ← Vercel Serverless Function (POST /api/webhook)
├── public/
│   └── landing.html      ← Landing page, served at /landing
├── vercel.json           ← Routing config
└── package.json
```

## Deploy to Vercel (existing project)

1. **Copy these files into your existing Vercel project repo** (the one at abstractcontruction-henna.vercel.app)

2. **Add environment variable in Vercel dashboard:**
   - Go to: Project Settings → Environment Variables
   - Add: `JOBNIMBUS_API_KEY` = your API key
   - Apply to: Production + Preview

3. **Push to GitHub** → Vercel auto-deploys

## URLs after deploy
- Landing page: `https://abstractcontruction-henna.vercel.app/landing`
- Webhook (internal): `https://abstractcontruction-henna.vercel.app/api/webhook`
- Main site: `https://abstractcontruction-henna.vercel.app/` (unchanged)

## Test the webhook
```bash
curl -X POST https://abstractcontruction-henna.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","phone":"(201) 555-1234","email":"test@test.com","service":"residential","board":"Retail","source":"test","submittedAt":"2026-03-20T12:00:00Z"}'
```
