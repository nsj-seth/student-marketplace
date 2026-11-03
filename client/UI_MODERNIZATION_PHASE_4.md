# UI Modernization — Phase 4: Explore Products & Stores

Phase 4 modernizes the two marketplace discovery pages while preserving all existing search, filtering, sorting and API behavior.

## Product catalogue

Updated with:

- modern hero/header section
- sticky desktop filter panel
- independently scrollable filter controls
- pinned Apply Filters action
- active-filter count badge
- Lucide icons throughout
- improved search field
- cleaner selects and price inputs
- modern sorting control
- skeleton loading cards
- stronger empty state
- redesigned product cards with:
  - larger imagery
  - stock badge
  - category metadata
  - ratings
  - price hierarchy
  - seller details
  - location and delivery metadata
  - clearer product CTA

## Business directory

Updated with:

- modern directory hero
- matching sticky/scrollable filter panel
- active-filter count badge
- improved search and selects
- modern sorting control
- skeleton loading cards
- improved empty state
- redesigned business cards with:
  - brand cover treatment
  - logo/avatar
  - seller type badge
  - availability badge
  - location
  - categories
  - ratings
  - pickup/delivery indicators
  - clearer storefront CTA

## Existing behavior preserved

No backend or service logic was changed.

The existing query parameters and filters still work:

Products:
- search
- category
- university
- seller type
- availability
- stock
- fulfilment
- min / max price
- sort

Businesses:
- search
- category
- university
- business type
- availability
- fulfilment
- sort

## Responsive behavior

Desktop:
- sticky left filter panel
- filter controls scroll internally
- results remain independent

Tablet / mobile:
- filter panel falls into normal page flow
- results stack responsively
- cards remain readable without horizontal overflow

## Verification

After pulling:

```bash
cd ~/projects/student-marketplace/client
npm install
npm run check
npm run dev
```

Test:

- /products
- /businesses
- every filter
- Reset
- Apply filters
- sort controls
- long names/descriptions
- out-of-stock products
- unavailable businesses
- desktop
- narrow Chromebook
- tablet
- phone
