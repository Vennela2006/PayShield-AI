# PayShield AI

**End-to-End Fraud Prevention and Recovery Platform**  
*Protect Every Payment. Investigate Every Threat. Empower Every Recovery.*

PayShield is a hackathon MVP for controlling autonomous agent payments, investigating suspicious transaction relationships, and organizing evidence for payment disputes.

## What's implemented

- Futuristic dark fintech command-center UI with responsive layout.
- AgentPay Firewall: deterministic allow/review/block policy engine, approved/blocked recipients, transaction cap, approval threshold and hourly velocity check.
- Server-side PayPal Orders v2 Sandbox order creation. The server re-runs the firewall before calling PayPal; a blocked/review request is not sent to PayPal.
- Demo mode when PayPal credentials are absent (clearly labelled; does not make a real payment).
- Transaction table using AG Grid Community.
- Fraud Intelligence relationship graph preview and synthetic investigation case.
- Evidence intake endpoint: text-file field candidate extraction; optional PaddleOCR microservice scaffold for image/PDF OCR.
- Eight automated policy unit tests.

## Important integration status

This ZIP is a **PayShield MVP scaffold built to match the agreed product architecture**, not a byte-for-byte fork of the PayPal starter. The execution environment used to prepare it could not reach GitHub, so the official starter could not be cloned and its proprietary AG Studio implementation could not be copied or validated here.

- **PayPal:** actual Sandbox REST Orders v2 create-order path is implemented. Credentials are required to make a real Sandbox API request. Capture endpoint is provided separately and should only be called after the buyer approves the order. This MVP UI does not yet complete the buyer approval/capture round-trip.
- **AG Studio:** not yet embedded. The Analytics Studio panel is an integration placeholder, not a claim that AG Studio is active. To complete the sponsor integration, merge this MVP into the official PayPal starter and use its licensed AG Studio dashboard/provider code. The official starter's README describes the AG Studio dashboard, endpoint grids, optional licence key and AI assistant.
- **Fraud graph:** the displayed graph and case are illustrative synthetic data, not live PayPal account relationships or proof of fraud.
- **OCR:** text files are parsed locally. Image/PDF OCR requires the optional PaddleOCR service; the current Next route returns a clear not-configured status for those formats.
- **Recovery:** this creates candidate extracted fields only; it does not submit disputes or recover funds.

## Requirements

- Node.js 20.9 or later
- npm
- PayPal Developer account and Sandbox REST app credentials for live Sandbox API calls

## Run locally

```bash
npm install
cp .env.example .env.local
# Add PayPal Sandbox Client ID and Secret to .env.local (optional for demo mode)
npm run dev
```

Open http://localhost:3000.

Run tests:

```bash
npm test
```

Production build:

```bash
npm run build
npm start
```

## PayPal Sandbox setup

1. Open https://developer.paypal.com/dashboard/applications/sandbox
2. Create or select a Sandbox REST app.
3. Copy its Client ID and Secret into `.env.local` as `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
4. Keep `PAYPAL_ENV=sandbox`.
5. Restart the dev server.
6. In PayShield, test an approved recipient and a small amount. The server checks the policy before creating a PayPal order.
7. Complete buyer approval using the `approvalUrl` returned by the API. Capture is a separate server endpoint: `POST /api/paypal/capture` with `{ "orderId": "..." }`. Do not call capture before buyer approval.

Never commit `.env.local`, secrets, or AG Studio licence keys.

## Optional PaddleOCR service

Python OCR service is isolated under `ocr-service/`. It is intentionally optional because PaddlePaddle wheels and model downloads are large and platform-dependent.

```bash
cd ocr-service
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001
```

Set `OCR_SERVICE_URL=http://127.0.0.1:8001` in `.env.local` and wire the `/extract` call into the Next.js evidence route before using image/PDF OCR. Do not rely on OCR output without manual verification.

## AG Studio completion path

1. Clone the official repository: https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate
2. Follow its README to install, configure PayPal sandbox and run the starter.
3. Obtain the AG Studio trial/licence through the sponsor's official channel; set `AG_STUDIO` (the starter's documented variable) in `.env.local`.
4. Preserve the starter's `AgStudioProvider`, dashboard data model, report configuration and AI adapter. Add PayShield's policy decisions, transaction/case datasets and analytics views to those actual Studio data sources.
5. Do not describe the placeholder panel in this ZIP as AG Studio until the real licensed component is embedded and tested.

Official starter: https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate

## Security and scope notes

- All PayPal credentials are server-side only. Never prefix secrets with `NEXT_PUBLIC_`.
- Demo transactions are synthetic and clearly labelled as demo data.
- The default policy is an example. Change limits and recipient lists to suit test cases before a demo.
- This is a hackathon prototype, not a production payment-security system. Add authentication, persistent storage, CSRF/rate limiting, webhook verification, idempotency strategy, full audit persistence, authorization and security review before production use.
- Daily limit is represented in the policy model but needs persistent per-agent daily spend aggregation before it can be enforced accurately. The current sample evaluator enforces per-transaction, recipient, approval and hourly-frequency checks.
- AI is not used to authorize or block payments. The policy engine is deterministic; an LLM may later explain decisions but must not override the engine.

## API quick reference

- `POST /api/firewall/evaluate` — evaluate `{agentId, recipient, amount, currency, recentTransactions, approvedByHuman}`.
- `POST /api/paypal/create-order` — re-evaluates policy and creates a PayPal order only when `ALLOW`.
- `POST /api/paypal/capture` — capture an already buyer-approved order.
- `POST /api/evidence/extract` — multipart form field `file`; text extraction works for `.txt`; images/PDF need PaddleOCR wiring.

## License

PayShield-authored code in this ZIP is provided for hackathon development. Third-party dependencies retain their respective licences. The official PayPal starter and AG Studio have their own terms; review them before copying or redistributing their code. No third-party starter source has been bundled into this ZIP.
