# PayShield AI — local integration setup

## 1. Install and run the Next.js application

- Use Node.js 20.9+.
- Run `npm install`.
- Copy `.env.example` to `.env.local`.
- Run `npm test` and `npm run dev`.
- Open http://localhost:3000.

## 2. PayPal Sandbox checkout

1. Create a REST app in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox).
2. Copy its Sandbox Client ID and Secret into `.env.local`:

```dotenv
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Restart `npm run dev` after changing environment variables.
4. In Agent Firewall, use an approved recipient and amount within policy, evaluate, create the order, then follow the PayPal approval link using a Sandbox buyer account.
5. PayPal redirects back to the app. The app rechecks policy and verifies order amount, agent metadata and recipient description before capture.

Without credentials, the app stays in local demo mode and does not call PayPal. Never expose the Secret in browser code or commit `.env.local`.

For a deployed demo, set `NEXT_PUBLIC_APP_URL` to the public HTTPS app URL and configure the PayPal app's return/cancel URLs as required by your account.

## 3. PaddleOCR service (optional local service)

The OCR service is separate from Next.js. Python 3.10/3.11 is recommended for compatibility with PaddlePaddle 3.0. Create a virtual environment inside `ocr-service`, then install its requirements:

```powershell
cd ocr-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001
```

In another terminal, set this in the project `.env.local`:

```dotenv
OCR_SERVICE_URL=http://127.0.0.1:8001
```

Restart Next.js after editing `.env.local`. Upload a JPG/PNG receipt in Recovery Workspace. The endpoint returns OCR text plus candidate fields. **OCR does not verify authenticity; manually confirm every field.** PDF handling depends on the installed OCR engine and input format; this starter's OCR endpoint currently targets image files.

If PaddlePaddle installation fails on your Python/Windows combination, use a supported Python environment or Linux/WSL and follow the current PaddleOCR installation guide.

## 4. AG Grid and AG Studio

AG Grid Community is included in the app and powers sortable, filterable, paginated transaction grids.

AG Studio is a separate licensed product. This package does not include the official AG Studio runtime or trial license. Obtain the hackathon's official PayPal + AG Studio starter/runtime and license, then integrate its documented packages and initialization. Do not treat the AG Grid table as an AG Studio integration.

## 5. Tests

```powershell
npm test
npm run build
```

The policy tests are automated. PayPal Sandbox checkout and OCR require their respective credentials/services for end-to-end testing.
