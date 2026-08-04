# Production Payment Wall Application for Cloudflare Pages & HitPay

A full-stack, production-ready payment wall designed for deployment to **Cloudflare Pages with Cloudflare Pages Functions**. The app presents invoice details to customers, supports rail-specific discount codes (such as incentives for low-cost rails like DuitNow & FPX), and securely redirects customers to a dynamically generated HitPay checkout page.

---

## 🏗️ Repository Architecture

```text
/
├── public/
│   ├── index.html       # Primary Payment Wall UI (Tailwind CSS, Glassmorphism design)
│   ├── success.html     # Payment Completion / Redirect Destination Page
│   └── app.js           # Client-side state management & discount rail logic
├── functions/
│   └── api/
│       └── checkout.js  # Serverless Cloudflare Pages Function (HitPay API Handler)
├── package.json         # NPM configuration & Wrangler local dev scripts
└── README.md            # Setup, Environment Variables & Cloudflare Deployment guide
```

---

## ⚡ Features & Capabilities

1. **Invoice Total & Rail Discount Engine**
   - Live calculations for invoice items, subtotal, and dynamic discounts.
   - Built-in rail discount promo codes (`DUITNOW10`, `FPX5`, `SAVE20`) to incentivize low-fee payment methods.
2. **Cloudflare Pages Functions Integration**
   - Serverless handler (`/functions/api/checkout.js`) executing on Cloudflare Edge Runtime.
   - Formats request parameters for HitPay API and secures API credentials.
   - Automatic dev mock mode fallback if API credentials are not set yet in environment.
3. **HitPay API Integration**
   - Supports HitPay REST API for MYR currency.
   - Channels supported: DuitNow QR (`duitnow_online`), FPX (`fpx`), and Credit/Debit Cards (`card`).
4. **Modern Design System**
   - Tailwind CSS with custom dark mode glassmorphism UI.
   - Fully responsive, accessible inputs, and real-time visual feedback.

---

## ⚙️ Environment Variables Setup

Configure the following environment variables in your Cloudflare Pages Dashboard under **Settings > Environment variables** (or in `.dev.vars` for local Wrangler development):

| Variable Name | Description | Default / Example Value |
|---|---|---|
| `HITPAY_API_KEY` | Your HitPay Business API Key | `sec_xxxxxxxxxxxx` |
| `HITPAY_MODE` | Gateway environment (`sandbox` or `production`) | `sandbox` |

---

## 🚀 Local Development

You can run and test the application locally using Cloudflare's `wrangler` CLI:

```bash
# 1. Install Wrangler CLI (if not already installed)
npm install

# 2. Launch Cloudflare Pages local development server with Pages Functions support
npm run dev
```

The application will be served at `http://localhost:8788`.

---

## 🌐 Deploying to Cloudflare Pages

### Option 1: Direct Git Integration (Recommended)
1. Push this repository to GitHub or GitLab.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages > Create application > Pages**.
3. Connect your repository.
4. Set the build settings:
   - **Framework preset**: None / Static HTML
   - **Build output directory**: `public`
5. Go to **Settings > Environment variables** and add `HITPAY_API_KEY` and `HITPAY_MODE`.
6. Click **Save and Deploy**.

### Option 2: Deploying via Wrangler CLI
```bash
npx wrangler pages deploy public --project-name=my-payment-wall
```

---

## 🧪 Testing Rail Discount Codes

You can test the built-in promo code incentives on the payment wall:
- `DUITNOW10`: 10% discount (Requires **DuitNow** channel selected).
- `FPX5`: 5% discount (Requires **FPX Bank** channel selected).
- `SAVE20`: MYR 20 flat discount.
