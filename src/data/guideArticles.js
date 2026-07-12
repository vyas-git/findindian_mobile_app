/**
 * Quick links → static SEO blog pages on findindian.de/blog/
 */
export const BLOG_BASE_URL = 'https://findindian.de/blog';

export const GUIDE_ARTICLES = [
  {
    id: 'student-visa-checklist',
    slug: 'student-visa-checklist',
    icon: 'school-outline',
    title: 'Student visa document checklist',
  },
  {
    id: 'opportunity-card',
    slug: 'opportunity-card',
    icon: 'ribbon-outline',
    title: 'Opportunity Card (Chancenkarte)',
  },
  {
    id: 'anmeldung',
    slug: 'anmeldung-city-registration',
    icon: 'home-outline',
    title: 'City registration (Anmeldung)',
  },
  {
    id: 'eu-blue-card',
    slug: 'eu-blue-card',
    icon: 'card-outline',
    title: 'EU Blue Card',
  },
  {
    id: 'family-reunion',
    slug: 'family-reunion-visa',
    icon: 'people-outline',
    title: 'Family reunion visa',
  },
  {
    id: 'public-transport-ticket',
    slug: 'deutschlandticket-public-transport',
    icon: 'ticket-outline',
    title: 'Deutschlandticket & passes',
  },
  {
    id: 'ubahn-sbahn-guide',
    slug: 'ubahn-sbahn-guide',
    icon: 'train-outline',
    title: 'U-Bahn & S-Bahn guide',
  },
  {
    id: 'transport-maps',
    slug: 'public-transport-maps',
    icon: 'map-outline',
    title: 'Transit maps by city',
  },
  {
    id: 'airport-arrival-sim',
    slug: 'airport-arrival-sim-cards',
    icon: 'airplane-outline',
    title: 'Airport arrival & SIM cards',
  },
];

export function getGuideUrl(slug) {
  return `${BLOG_BASE_URL}/${slug}`;
}
