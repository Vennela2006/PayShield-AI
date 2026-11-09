# 🛡️ PayShield AI

**Protect Every Payment. Investigate Every Threat. Empower Every Recovery.**

PayShield AI is a hackathon prototype for securing agent-initiated payment workflows. It combines deterministic payment-policy checks, PayPal Sandbox checkout, transaction investigation tools, and evidence-assisted reporting workflows in one workspace.

> **PREVENT → INVESTIGATE → RECOVER**

## Problem statement

Autonomous agents can initiate payments with limited human intervention. This creates practical risks: unauthorized recipients, excessive or repeated payments, limited visibility into transaction relationships, and fragmented evidence collection after a suspicious transaction.

Many workflows focus on detecting suspicious activity after payment. PayShield explores a broader approach: evaluate a payment request before it reaches the provider, make related activity easier to inspect, and help users organize evidence when they need to report a problem.

## Proposed solution

PayShield provides three connected capabilities:

1. **Prevent — AgentPay Firewall:** enforce deterministic policy rules before a payment order is created, with human approval for requests that need review.
2. **Investigate — Fraud Intelligence:** explore transaction relationships and organize analyst investigations and case notes.
3. **Recover — Payback AI:** extract candidate details from uploaded evidence, let users review and verify them, and prepare a complaint draft and reporting guidance.

The platform is an investigation and workflow assistant. It does not guarantee fraud detection or reimbursement, reverse payments, or submit complaints automatically.

## Accomplished features

### 1. AgentPay Firewall — Prevent

- Server-side deterministic policy evaluation with **ALLOW**, **REVIEW**, and **BLOCK** outcomes.
- Agent identity, recipient, amount, and transaction-frequency checks.
- Approved and blocked recipient controls.
- Per-transaction cap and human-approval threshold.
- Human approval workflow for requests requiring review.
- Server-side PayPal Orders v2 Sandbox order creation, with policy re-evaluation before order creation.
- PayPal buyer approval and capture flow implemented through separate routes; capture is intended only after buyer approval.
- Demo mode when PayPal credentials are absent; demo mode does not make a real PayPal payment.

**Policy note:** The policy model includes a daily limit, but accurate daily-spend enforcement requires persistent per-agent aggregation. Do not treat the daily limit as fully enforced unless that aggregation is implemented and verified in the deployed version.

### 2. Fraud Intelligence — Investigate

- Interactive transaction relationship graph.
- Agent/recipient relationship visualization.
- Transaction details and risk-oriented visual signals.
- Investigation case creation and management.
- PostgreSQL-backed case records, status updates, and analyst notes.

**Data note:** Graph relationships and demo transactions may use illustrative/synthetic data. A relationship or risk indicator is a lead for investigation, not proof of fraud.

### 3. Payback AI — Recover

- Evidence upload workflow.
- Text-file candidate extraction.
- Optional OCR microservice integration for supported image/PDF processing.
- Candidate transaction details such as amount, transaction/reference ID, date, and recipient.
- Editable evidence fields and manual verification workflow.
- Complaint draft generation after evidence review.
- Official reporting guidance and evidence-preparation checklist.

**Recovery note:** Extraction results are unverified candidates. Users must compare every field with the original evidence. PayShield does not automatically submit a dispute or complaint, recover money, reverse a transaction, or guarantee reimbursement. Image/PDF OCR requires the optional OCR service to be running and connected.

### 4. Platform and analytics

- Next.js dashboard and protected application routes.
- Auth.js authentication with Google, GitHub, and demo credentials configured through environment variables.
- PostgreSQL persistence for investigation cases and evidence records.
- AG Grid Community transaction tables with sorting, filtering, and pagination.
- Analytics workspace integration point; see the integration-status section below.

## Integration status

| Integration | Current status |
|---|---|
| PayPal Orders v2 | Sandbox create-order and separate capture APIs are present. Use Sandbox credentials and test buyer approval before capture. |
| PostgreSQL | Case/evidence persistence is implemented through the configured database connection and SQL migration. |
| Auth.js | Google, GitHub, and demo credential providers are configured. Provider credentials and demo credentials must be supplied as environment variables. |
| AG Grid | Integrated for transaction data grids. |
| AG Studio | The current repository's Analytics Studio component is a placeholder/integration point. Do not represent it as a completed AG Studio runtime integration. |
| OCR | TXT extraction is available in the Next.js route. Image/PDF processing depends on the separately deployed PaddleOCR service and its connection through `OCR_SERVICE_URL`. |
| AI explanations | An optional AI service key is represented in the environment template; deterministic backend policy decisions remain authoritative. |

## Architecture

```text
User / Agent
    |
    v
Next.js + Auth.js dashboard
    |
    +--> AgentPay Firewall
    |       |
    |       +--> Deterministic policy engine
    |       +--> Human approval
    |       +--> PayPal Sandbox Orders API
    |
    +--> Fraud Intelligence
    |       +--> Transaction relationship graph
    |       +--> Investigation cases and notes
    |
    +--> Payback AI
    |       +--> Evidence upload and text extraction
    |       +--> Optional FastAPI / PaddleOCR service
    |       +--> Manual review and complaint draft
    |
    +--> PostgreSQL (case/evidence persistence)
```

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend and server | Next.js 15, React 19, TypeScript |
| Authentication | Auth.js |
| Database | PostgreSQL, `pg` |
| Payments | PayPal REST Orders v2 Sandbox |
| Data grids | AG Grid Community |
| Transaction graph | React Flow (`@xyflow/react`) |
| Analytics package dependencies | AG Charts Enterprise and AG Studio React (license/runtime setup may be required) |
| OCR service | Python, FastAPI, PaddleOCR |
| PDF/image processing | Depends on the optional OCR service implementation and supported inputs |
| Testing | Node.js test runner |
| Deployment | Render (Next.js and OCR are separate services) |

## Requirements

- Node.js **20.9 or later** (Node.js 22 is recommended).
- npm.
- Git.
- PostgreSQL database for persisted investigation data.
- PayPal Developer account and Sandbox REST app credentials for Sandbox checkout.
- Python 3.10/3.11 recommended for the optional OCR service; review the OCR service requirements for platform compatibility.

## Installation and local development

### 1. Clone the repository

```bash
git clone https://github.com/Vennela2006/PayShield-AI.git
cd PayShield-AI
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local environment file:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux**
```bash
cp .env.example .env.local
```

Open `.env.local` and configure the values needed for the integrations you intend to use.

| Variable | Required when | Description |
|---|---|---|
| `DATABASE_URL` | Using PostgreSQL persistence | PostgreSQL connection string. |
| `AUTH_SECRET` | Using Auth.js sessions | Random secret used by Auth.js. |
| `AUTH_GOOGLE_ID` | Enabling Google login | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | Enabling Google login | Google OAuth client secret. |
| `AUTH_GITHUB_ID` | Enabling GitHub login | GitHub OAuth client ID. |
| `AUTH_GITHUB_SECRET` | Enabling GitHub login | GitHub OAuth client secret. |
| `DEMO_EMAIL` | Enabling demo credentials | Demo account email. |
| `DEMO_PASSWORD_HASH` | Enabling demo credentials | PBKDF2 password hash in the format expected by `auth.ts`; do not put a plaintext password here. |
| `PAYPAL_ENV` | PayPal integration | Use `sandbox` for hackathon testing. |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox calls | Sandbox REST app client ID. |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox calls | Sandbox REST app secret. |
| `NEXT_PUBLIC_APP_URL` | PayPal redirects / deployed app | Public app URL; use the Render HTTPS URL after deployment. |
| `PAYSHIELD_APPROVAL_PIN` | Human approval flow, if enabled by the deployment | Approval PIN configured server-side. |
| `OCR_SERVICE_URL` | Image/PDF OCR | Base URL of the separately running OCR service. |
| `OPENAI_API_KEY` | Optional AI-assisted functionality | Server-side API key, only if the relevant feature is enabled. |
| `AG_STUDIO_LICENSE_KEY` | Only if integrating licensed AG Studio | License key supplied through the official sponsor/product channel. |

Not every variable is required for every local run. Configure the variables required by the features being tested and the corresponding code paths. Do not commit `.env.local`, real credentials, OAuth secrets, password hashes, or license keys.

### 4. Apply the database migration

Create a PostgreSQL database, set `DATABASE_URL`, and apply the repository migration:

```bash
psql "$DATABASE_URL" -f scripts/001_create_persistence_tables.sql
```

On Windows, run this from a terminal where the `psql` command is installed and the database connection environment variable is available. Alternatively, run the SQL file using your provider's SQL editor.

### 5. Configure PayPal Sandbox (optional)

1. Open the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox).
2. Create or select a Sandbox REST app.
3. Copy its Sandbox Client ID and Secret into `.env.local` as `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
4. Set `PAYPAL_ENV=sandbox`.
5. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local development.
6. Restart the Next.js server after changing environment variables.
7. Test with a Sandbox buyer account and a policy-approved recipient/amount.

The server re-evaluates policy before creating an order. Complete the buyer approval step before invoking the separate capture endpoint. Never use live payment credentials for the hackathon demo.

### 6. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional OCR service

The OCR service is separate from the Next.js application. It can be run locally or deployed as its own web service.

### 1. Create a Python virtual environment

From the repository root:

**Windows PowerShell**
```powershell
cd ocr-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**
```bash
cd ocr-service
python3.11 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies and start FastAPI

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

Set the Next.js environment variable:

```dotenv
OCR_SERVICE_URL=http://localhost:8001
```

Restart Next.js after changing `.env.local`.

**OCR limitations:** OCR output is a candidate extraction, not verification of document authenticity or transaction legitimacy. Confirm every extracted value manually. PaddleOCR can require substantial memory, model downloads, and platform-specific dependency support. For deployment, run OCR as a separate service and choose an instance with sufficient memory. If OCR is not configured, the main application can still run, but image/PDF extraction will not be available through the OCR service.

## Tests and production build

Run the automated policy tests:

```bash
npm test
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Deploy to Render

The Next.js application and OCR service should be deployed separately.

### Next.js Web Service

1. In the [Render Dashboard](https://dashboard.render.com/), select **New → Web Service**.
2. Connect the GitHub repository `Vennela2006/PayShield-AI`.
3. Select the `master` branch.
4. Set the runtime to Node.
5. Use these commands:

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Root Directory | Repository root |

6. Add the required environment variables in Render's Environment settings. At minimum, configure the database and Auth.js secrets for the features being used. Add PayPal Sandbox credentials for real Sandbox API calls.
7. After the first deployment, set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS URL and configure the corresponding OAuth callback URLs and PayPal return/cancel URLs.
8. Redeploy after changing build-time public environment variables.

### OCR Web Service

Create a separate Python web service using the `ocr-service` directory (or configure the service root/build/start commands for that directory). Install `requirements.txt`, start the FastAPI application with Uvicorn on the platform-provided port, and set the Next.js `OCR_SERVICE_URL` to the deployed OCR service URL.

Check memory usage and PaddleOCR compatibility before choosing the instance size. OCR model downloads and inference can exceed the resources available on the smallest instances. Keep costs within the available hackathon credit balance.

## API quick reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/firewall/evaluate` | Evaluate a payment request against policy. |
| POST | `/api/firewall/approve` | Process a human approval request. |
| POST | `/api/paypal/create-order` | Re-evaluate policy and create a PayPal Sandbox order when permitted. |
| POST | `/api/paypal/capture` | Capture an order after buyer approval. |
| GET / POST / PATCH | `/api/cases` | Retrieve and manage investigation cases. |
| POST | `/api/evidence/extract` | Extract candidate fields from uploaded text or delegate to the optional OCR service. |
| GET | `/api/db-health` | Check database connectivity. |

Refer to the route handlers for request schemas and validation requirements.

## Security, limitations, and responsible use

- This is a hackathon prototype, not a production payment processor or certified fraud-prevention system.
- PayPal credentials and all other secrets must remain server-side. Never use a `NEXT_PUBLIC_` prefix for secrets.
- Use PayPal Sandbox accounts for testing.
- The backend policy engine is authoritative; AI-generated explanations must never override authorization decisions.
- Daily aggregate spending enforcement requires reliable persistent accounting; a configured policy field alone does not establish that enforcement.
- Demo data and graph relationships may be synthetic and must not be presented as verified real-world fraud.
- OCR values are unverified candidates and require human review.
- Reporting guidance does not submit a complaint or guarantee payment recovery.
- Before production use, conduct a security review and add/verify controls such as authorization boundaries, CSRF protections where applicable, rate limiting, webhook verification, idempotency, durable audit logging, operational monitoring, and data-retention controls.

## Future scope

- Persistent per-agent daily spend aggregation and richer policy administration.
- More advanced behavioral and anomaly detection.
- Expanded real-time transaction monitoring.
- Additional payment-provider integrations.
- Richer analyst collaboration and audit reporting.
- Improved evidence classification and supported document formats.
- Completion and verification of the official licensed AG Studio sponsor integration.

## Hackathon impact

PayShield AI demonstrates a payment-security workflow designed around autonomous agents: **control payments before execution, investigate relationships when activity looks unusual, and organize evidence for reporting afterward.**

**Protect Every Payment. Investigate Every Threat. Empower Every Recovery.**

## License

This repository is a hackathon project. Review the licenses of all third-party dependencies and any separately licensed sponsor software before redistribution or commercial use. No endorsement by PayPal or other third parties is implied.
