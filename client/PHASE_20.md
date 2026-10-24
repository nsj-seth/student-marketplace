# Phase 20 — Frontend Resilience

- Added a top-level React error boundary.
- Hardened the API client against non-JSON/failed responses.
- API errors now preserve HTTP status, application code, and server request ID for debugging.
- No marketplace feature behavior is intentionally changed in this phase.

Run before release:

```bash
npm run build
```
