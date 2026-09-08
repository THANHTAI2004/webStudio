# Studio Public Web

Next.js public website for Studio Platform.

## Development

```bash
npm run dev
```

Open http://localhost:3000.

## CMS-driven pages

- Home: /
- About: /gioi-thieu

The root layout loads public settings and theme from the API, applies safe CSS
variables, and renders the shared header/footer. If the API is unavailable, the
web app falls back to default settings and theme values.
