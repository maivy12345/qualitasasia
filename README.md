# Qualitas Engineering Asia website

Static, responsive website source aligned to the Qualitas brand and website guideline.

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

Serve this directory from a local web server so absolute paths resolve correctly:

```text
node server.mjs
```

Then open `http://127.0.0.1:4173/`.

## Deployment notes

- The contact form prepares an email in the visitor's email application. Connect it to an approved form backend before production if server-side submission, storage, spam filtering or automated replies are required.
- Add GA4 and Search Console identifiers only after the accounts and consent configuration are approved.
- Privacy and legal copy should receive final legal review before go-live.
- Publish only verified team profiles, projects, statistics and job openings.
