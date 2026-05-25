export const ROUTES = {
  // Main routes
  HOME: "/strategies",
  DASHBOARD: "/dashboard",
  STRATEGIES: "/strategies",
  EXPLORE: "/explore",
  TRADE: "/trade",
  BEAM: "/beam",
  FEED: "/strategies",
  REWARDS: "/rewards",
  LEADERBOARD: "/leaderboard",
  LITEPAPER: "/docs",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  LEGAL: "/legal",

  // Nested routes and dynamic routes with params
  getAnalysisDetails: (id: string) => `/trade/${id}`,
};

export const NAV_ITEMS = [
  {
    label: "Trade",
    href: ROUTES.TRADE,
  },
  {
    label: "Beam",
    href: ROUTES.BEAM,
  },
  {
    label: "Strategies",
    href: ROUTES.STRATEGIES,
  },
  {
    label: "Leaderboard",
    href: ROUTES.LEADERBOARD,
  },
  {
    label: "Profile",
    href: ROUTES.DASHBOARD,
  },
  {
    label: "Rewards",
    href: ROUTES.REWARDS,
  },
];

export const X_URL = "https://x.com/lightterminal";
