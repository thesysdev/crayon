import { createAnalyticsLibrary } from "@openuidev/dashboard-kits/analytics";
import { createEcommerceLibrary } from "@openuidev/dashboard-kits/ecommerce";
import { dashboardLibrary } from "@openuidev/thesys";

// Each kit's library is the dashboard artifact's base library plus the kit's
// components. `npm run generate` writes each one's spec to src/generated/.
export const ecommerceLibrary = createEcommerceLibrary(dashboardLibrary);
export const analyticsLibrary = createAnalyticsLibrary(dashboardLibrary);
