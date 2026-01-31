import type { MetadataRoute } from 'next';
import { BOROUGH_NAMES, NEIGHBORHOODS_BY_BOROUGH, slugifyNeighborhood } from '@/lib/locations';

const baseUrl = 'https://www.nyclandlordcheck.com';
const lastModified = new Date();

const staticRoutes = [
  '/',
  '/about',
  '/api',
  '/data-sources',
  '/leaderboard/buildings',
  '/leaderboard/landlords',
  '/map',
  '/methodology',
  '/neighborhoods',
  '/privacy',
  '/violations/recent',
];

const boroughRoutes = Object.keys(BOROUGH_NAMES).map((slug) => `/borough/${slug}`);

const neighborhoodRoutes = Object.values(NEIGHBORHOODS_BY_BOROUGH).flatMap((neighborhoods) =>
  neighborhoods.map((name) => `/neighborhood/${slugifyNeighborhood(name)}`)
);

const routes = [...staticRoutes, ...boroughRoutes, ...neighborhoodRoutes];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
  }));
}
