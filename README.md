# Qualitas Engineering Asia website

Responsive website source with static HTML pages and a lightweight Node enquiry API, aligned to the Qualitas brand and website guideline.

## Brand system

- Manrope for headings and buttons.
- Spline Sans for body copy.
- Forest green `#0B6B43`, deep green `#063B28`, accent `#128252`, black `#050806`, light green `#CAEAD8`, background `#F1F8F4`.
- Maximum content width of 1200px with mobile, tablet and desktop layouts.

## Site structure

- Home, About, Services, Approach, Sectors, Insights, Careers and Contact.
- Five detailed service pages matching the approved service architecture.
- Working-with-Qualitas guidance and a comprehensive FAQ.
- Privacy, Terms, Cookie Notice and Disclaimer pages.
- Three published insight articles and an editorial library of planned topics.
- Legacy service URLs redirect to the current service architecture.

## Local preview

Set the transactional email variables, then serve this directory so absolute paths and the enquiry API resolve correctly:

```text
$env:RESEND_API_KEY="re_..."
$env:ENQUIRY_FROM_EMAIL="Qualitas website <enquiries@your-verified-domain.com>"
$env:ENQUIRY_TO_EMAIL="contact@qualitasasia.com"
node server.mjs
```

Then open `http://127.0.0.1:4173/`.

The contact endpoint sends the internal enquiry and visitor auto-reply together through Resend's batch API. It rejects oversized or invalid payloads, rate-limits repeated attempts and includes a honeypot and minimum completion time. The sending domain must be verified by the email provider before production use.
Set `TRUST_PROXY=1` only when the app is behind a trusted reverse proxy that overwrites `X-Forwarded-For`.

## Deployment notes

- Configure `RESEND_API_KEY` and a verified `ENQUIRY_FROM_EMAIL` before production. The form reports a delivery error when email is not configured or the provider rejects the request.
- Add GA4 and Search Console identifiers only after the accounts and consent configuration are approved.
- Privacy and legal copy should receive final legal review before go-live.
- Publish only verified team profiles, projects, statistics and job openings.
