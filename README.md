# ReuseCare.com – B2B Website Package

Static multi-page website for **ReuseCare**, positioned as a reusable hygiene products manufacturer for OEM/private label reusable menstrual pads and cloth diapers.

## Deploy to GitHub + Vercel
1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Import the repository into Vercel.
4. Framework preset: **Other** (no build command required).
5. Add `reusecare.com` and `www.reusecare.com` in Vercel Domains.

## Quote form email setup
The website includes `/api/quote.js` for Vercel Serverless Functions using the Resend HTTP API.

Set these Vercel environment variables:
- `RESEND_API_KEY` = your Resend API key
- `QUOTE_TO_EMAIL` = the mailbox that should receive website inquiries
- `QUOTE_FROM_EMAIL` = optional verified sender, e.g. `ReuseCare Website <website@reusecare.com>`

Until configured, the form falls back to `sales@reusecare.com` via the visitor's email application.

## Important placeholders to replace before launch
- `sales@reusecare.com` if this mailbox is not active
- Legal company name
- Factory address
- WhatsApp number
- Real factory photos
- Real product photos
- Verified MOQ, sample time and lead time
- Verified certifications and test reports
- Real production capacity / factory statistics

The current copy intentionally avoids inventing those facts.

## Main pages
- Home
- Reusable Menstrual Pads + 4 product pages
- Cloth Diapers + 4 product pages
- Wet Bags
- Private Label
- Materials
- Factory & Quality
- About
- Contact
- Request a Quote
- Resources + 3 buyer guides

## Style
Primary brand direction: deep green + sage + warm beige.

## Local preview
From the project directory run:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.
