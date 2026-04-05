# diasoft-web

React frontend for university operators, students, HR verification, and public diploma verification flows.

## Areas

- university cabinet
- student cabinet
- HR verification workspace
- public verification page
- public share-link page

## Stack

- React 18
- React Router
- Tailwind CSS
- shadcn-style component architecture
- Vite
- react-oidc-context

## Routes

- `/`
- `/university`
- `/student`
- `/hr`
- `/public/verify/:verificationToken`
- `/public/share/:shareToken`

## Backend contracts

The frontend now consumes one shared platform Swagger from `diasoft-gateway/api/openapi/openapi.yaml`.
Separate local yaml copies for `registry` and `gateway` are removed.

## Runtime

Frontend runtime uses env-driven configuration:

- `VITE_AUTH_ENABLED`
- `VITE_OIDC_AUTHORITY`
- `VITE_OIDC_CLIENT_ID`
- `VITE_OIDC_REDIRECT_URI`
- `VITE_OIDC_POST_LOGOUT_REDIRECT_URI`
- `VITE_GATEWAY_BASE_URL`
- `VITE_REGISTRY_BASE_URL`

## Main capabilities

- OIDC login and session bootstrap through `/api/v1/me`
- role-based navigation for university and student flows
- university import upload with CSV and XLSX support
- import job status and row-level error review
- diploma revoke flow
- student share-link creation flow
- live public verify and share-link pages via `diasoft-gateway`
- GitHub Actions validation, publish, and promotion workflow

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
npm run test:e2e
```

## CI/CD

- canonical CI runs in GitHub Actions
- the frontend contract is resolved from `diasoft-gateway` during CI instead of GitLab package downloads
- image publish target is `ghcr.io/ozzus/diasoft-web/diasoft-web`
- `platform-infra` promotion is done by GitHub-based direct commits for `dev` and pull requests for controlled promotion paths
