# UI Modernization — Phase 1: Design Foundation

This phase establishes the modern frontend foundation without redesigning existing marketplace screens yet.

## Added

- Tailwind CSS v4 through the official Vite plugin
- shadcn-compatible project configuration
- Lucide React icon support
- semantic design tokens for:
  - background / foreground
  - cards / popovers
  - primary / secondary / accent
  - muted surfaces and text
  - borders / inputs / focus rings
  - destructive actions
  - shared radius and typography
- `cn()` helper using `clsx` + `tailwind-merge`
- reusable UI primitives:
  - `Button`
  - `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`
  - `Badge`
  - `Input`
  - `AppIcon`
- `@/*` source alias

## Migration strategy

The existing plain CSS remains active during this phase.

Tailwind is layered into the project first so later phases can migrate one area at a time without rewriting business logic or breaking the current UI.

Future phases will progressively replace legacy presentation styles with the new primitives and Tailwind classes.

## Local setup

After pulling this branch, run:

```bash
cd ~/projects/student-marketplace/client
npm install
npm run check
```

`npm install` is required because this phase adds frontend dependencies and updates `package-lock.json`.

## Phase 2 target

The next phase will modernize the customer application shell:

- main header
- desktop navigation
- mobile navigation
- search affordance
- cart / wishlist / notification icons
- account menu
- consistent Lucide iconography
