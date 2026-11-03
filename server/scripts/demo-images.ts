export type DemoImageCategory =
  | "Food"
  | "Electronics"
  | "Fashion"
  | "Beauty"
  | "Books"
  | "Accessories"
  | "Services"
  | "Other";

export const demoImagePools: Record<DemoImageCategory, string[]> = {
  Food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Electronics: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Fashion: [
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1773565744218-d8d11de58362?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Books: [
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Accessories: [
    "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Services: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1497493292307-31c376b6e479?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&h=700&q=78"
  ],
  Other: [
    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&h=700&q=78",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&h=700&q=78"
  ]
};

export const businessImagePool = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&h=700&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&h=700&q=80",
  "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=700&h=700&q=80",
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=700&h=700&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&h=700&q=80"
];

/*
  The demo image pool uses Unsplash-hosted photos selected for marketplace simulation.
  Unsplash license: https://unsplash.com/license
*/
