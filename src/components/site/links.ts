// Where the website's buttons go.
/** The CreativeVision dashboard (clients, editors and the team sign in here). */
export const DASHBOARD_URL = 'https://dashboard.creativevision.dev';
/** The CreativeVision dashboard's booking API ("Book a free call" goes to the Super Admin to approve). */
export const BOOKING_API = (import.meta.env.VITE_BOOKING_API as string | undefined)?.replace(/\/$/, '') || DASHBOARD_URL;
