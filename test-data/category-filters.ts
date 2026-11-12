/**
 * Category filters (specs/category-filters.md): what the normal Sprint 5 Toolshop shows, at the default price range
 * (1 to 100). Change them here, not in the tests.
 */

/** Each sub-category and the products the category filter shows for it. */
export const categoryProducts: Record<string, string[]> = {
  Hammer: [
    'Claw Hammer with Shock Reduction Grip',
    'Hammer',
    'Claw Hammer',
    'Thor Hammer',
    'Sledgehammer',
    'Claw Hammer with Fiberglass Handle',
    'Court Hammer',
  ],
  'Hand Saw': ['Wood Saw'],
  Wrench: ['Adjustable Wrench', 'Angled Spanner', 'Open-end Spanners (Set)'],
  Screwdriver: ['Phillips Screwdriver', 'Mini Screwdriver'],
  Pliers: ['Combination Pliers', 'Pliers', 'Bolt Cutters', 'Long Nose Pliers', 'Slip Joint Pliers'],
  Chisels: ['Chisels Set', 'Wood Carving Chisels', 'Swiss Woodcarving Chisels'],
  Measures: ['Tape Measure 7.5m', 'Measuring Tape', 'Tape Measure 5m', 'Square Ruler'],
  Grinder: [],
  Sander: ['Sheet Sander', 'Belt Sander'],
  Saw: ['Circular Saw'],
  // As observed; see observed note 2 (docs/observed-notes.md): not used by a test until the team answers.
  Drill: ['Cordless Drill 24V', 'Cordless Drill 12V'],
  'Tool Belts': ['Leather toolbelt'],
  'Storage Solutions': ['Drawer Tool Cabinet', 'Tool Cabinet'],
  Workbench: [],
  'Safety Gear': [
    'Safety Goggles',
    'Safety Helmet Face Shield',
    'Protective Gloves',
    'Super-thin Protection Gloves',
    'Construction Helmet',
    'Ear Protection',
  ],
  Fasteners: ['Screws', 'Nuts and bolts', 'Cross-head screws', 'Flat-Head Wood Screws', 'M4 Nuts', 'Washers'],
};

/** The parent categories and their children, in the order the sidebar shows them. */
export const parentCategories: Record<'Hand Tools' | 'Power Tools' | 'Other', string[]> = {
  'Hand Tools': ['Hammer', 'Hand Saw', 'Wrench', 'Screwdriver', 'Pliers', 'Chisels', 'Measures'],
  'Power Tools': ['Grinder', 'Sander', 'Saw', 'Drill'],
  Other: ['Tool Belts', 'Storage Solutions', 'Workbench', 'Safety Gear', 'Fasteners'],
};

/** The sub-categories test 1.2 walks through; Drill is left out (observed note 2). */
export const subCategoriesChecked = [
  'Hammer',
  'Pliers',
  'Sander',
  'Saw',
  'Wrench',
  'Screwdriver',
  'Chisels',
  'Measures',
  'Tool Belts',
  'Fasteners',
];

export const listCounts = {
  pageSize: 9,
  unfilteredPages: 5,
  handToolsProducts: 25,
  handToolsPages: 3,
  // As observed; see observed note 2: includes the two drills the filter shows.
  powerToolsProducts: 5,
  otherProducts: 15,
  otherPages: 2,
};

export const noResultsText = 'There are no products found.';
export const sanityCategory = 'Pliers';
export const hammerCategory = 'Hammer';
/** The second sub-category in test 1.3: Hammer (7) plus Sander (2) fills one page of 9. */
export const unionPartnerCategory = 'Sander';
export const emptyCategory = 'Grinder';
export const narrowedParent = 'Hand Tools';
export const unticked = 'Wrench';

export const sortCase = {
  nameAZ: 'Name (A - Z)',
  priceHighLow: 'Price (High - Low)',
  hammersByName: [
    'Claw Hammer',
    'Claw Hammer with Fiberglass Handle',
    'Claw Hammer with Shock Reduction Grip',
    'Court Hammer',
    'Hammer',
    'Sledgehammer',
    'Thor Hammer',
  ],
  hammerPricesHighLow: [20.14, 18.63, 17.75, 13.41, 12.58, 11.48, 11.14],
};

export const brandCase = {
  forgeFlex: 'ForgeFlex Tools',
  mightyCraft: 'MightyCraft Hardware',
  forgeFlexAlonePages: 4,
  /** The one hammer that is not a ForgeFlex Tools product. */
  hammerNotForgeFlex: 'Claw Hammer',
};

export const priceCase = { category: 'Hand Tools', maxPrice: 15, pages: 2 };

export const ecoLabel = 'Show only eco-friendly products';

export const searchAcrossCategories = {
  firstTerm: 'Claw',
  firstNames: ['Claw Hammer with Shock Reduction Grip', 'Claw Hammer', 'Claw Hammer with Fiberglass Handle'],
  secondTerm: 'Drill',
  secondNames: ['Cordless Drill 20V', 'Cordless Drill 24V', 'Cordless Drill 18V', 'Cordless Drill 12V'],
};
