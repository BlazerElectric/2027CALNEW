# 2027 Calendar Sponsorship App

A lightweight **Next.js 16 + Tailwind CSS** web app that allows vendors to claim
sponsorship spots on the 2027 Blazer Electric calendar — first come, first served.

## Features

- **Contact Form** — Company Name, Contact Person, Email (required), Phone (optional)
- **Package selection** — 5 sponsorship tiers with price labels
- **Real-time availability** — Claimed spots are shown in red and disabled on page load
- **Race-condition-safe** — SQLite atomic `INSERT OR IGNORE` prevents double-booking
- **Email notification** — Sends a full recap to `dferguson@buyblazer.com` on every valid claim
- **Embeddable** — Designed to be loaded inside an `<iframe>` on any landing page

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill in SMTP credentials
cp .env.example .env.local

# 3. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Embedding via iframe

```html
<iframe
  src="https://your-deployment-url.vercel.app"
  width="100%"
  height="800"
  style="border:none;"
  title="2027 Calendar Sponsorship"
></iframe>
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | Use implicit TLS (`true` for port 465) |
| `SMTP_USER` | — | SMTP login (required to send email) |
| `SMTP_PASS` | — | SMTP password / app password |
| `SMTP_FROM` | `SMTP_USER` | "From" address |
| `NOTIFICATION_EMAIL` | `dferguson@buyblazer.com` | Recipient for new-claim emails |
| `DB_DIR` | `./data` (dev) / `/tmp` (prod) | Directory for the SQLite database file |

> **Note:** If `SMTP_USER` / `SMTP_PASS` are not set, email sending is skipped (a warning is logged).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| Styling | Tailwind CSS v4 |
| Database | SQLite via `better-sqlite3` |
| Email | Nodemailer |

## Deployment

Deploy to **Vercel** with zero configuration.  
Set the environment variables listed above in your project's Vercel settings.

> The SQLite database is written to `/tmp` on Vercel (ephemeral). For production
> persistence across function invocations and restarts, replace the `lib/db.ts`
> storage layer with a hosted database such as **Turso**, **PlanetScale**, or
> **Supabase**.
