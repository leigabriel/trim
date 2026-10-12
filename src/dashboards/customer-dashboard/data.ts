import {
  BookmarkSquare2,
  FaceScanCircle,
  Handshake,
  HomeSmile2,
  StarFall4,
} from 'reicon-react';
import type { IconComponent } from 'reicon-react/createIcon';

export type DashboardView =
  | 'overview'
  | 'recommendation'
  | 'face-shape'
  | 'booking'
  | 'ai'
  | 'account';

export interface DashboardNavItem {
  id: DashboardView;
  label: string;
  /** Reicon component. Drawn at 20px, outline weight. */
  icon: IconComponent;
}

/**
 * Rail order. Account is absent on purpose: it opens from the identity block at
 * the foot of the rail, and listing it twice gave two ways into one page.
 *
 * No blurbs: each restated the section's own standfirst, and two lines per item
 * made five links feel crowded.
 *
 * Icons are Reicon components rather than inline path data, so they are typed,
 * share one weight, and inherit currentColor without each one restating it.
 */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: HomeSmile2,
  },
  {
    id: 'recommendation',
    label: 'Recommendation',
    icon: StarFall4,
  },
  {
    id: 'face-shape',
    label: 'Faceshape Analyzer',
    icon: FaceScanCircle,
  },
  {
    id: 'booking',
    label: 'Booking',
    icon: BookmarkSquare2,
  },
  {
    id: 'ai',
    label: 'Trimo',
    icon: Handshake,
  },
];

/** Row shown in the middle column. */
export interface FeedItem {
  id: string;
  title: string;
  meta: string;
  body: string;
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
  /** True when the delta is an improvement. */
  isGood: boolean;
}

export interface BookingRow {
  id: string;
  barber: string;
  shop: string;
  service: string;
  when: string;
  status: 'Confirmed' | 'Requested' | 'Completed';
  price: string;
}

export const BOOKING_METRICS: Metric[] = [
  { label: 'Upcoming', value: '2', delta: '1 awaiting reply', isGood: false },
  { label: 'Completed', value: '7', delta: 'since August', isGood: true },
  { label: 'Spend', value: 'P 3,240', delta: 'across 4 visits', isGood: true },
  { label: 'Usual barber', value: 'Kuya Ren', delta: '5 of 7 cuts', isGood: true },
];

export const AI_PROMPTS = [
  'What should I ask for if I want to keep it low maintenance?',
  'How do I describe this reference to a barber?',
  'How long will this cut last before I need a refresh?',
  'What does a 1.5 grade taper actually mean?',
  'Will this suit a square jaw if I grow it out?',
  'How short can the sides go and still look intentional?',
];

/** Answers shown under the prompts. */
export const AI_ANSWERS = [
  {
    q: 'What does a 1.5 grade taper actually mean?',
    a: 'A 1.5 is where the clipper guard stops and you switch to a scissor-over-comb. The blend is soft, so it grows out over two to three weeks without a hard shelf.',
  },
  {
    q: 'How long before I need a refresh?',
    a: 'Your last three cuts ran six weeks apart at about 1.4cm a month. Book a week before the shape starts to break, so around week five.',
  },
  {
    q: 'Can I keep it low maintenance?',
    a: 'Keep length through the top so the part line loses itself, and keep the fade grade at or below 1.5 so there is no hard shadow to correct.',
  },
];

export const OVERVIEW_FEED: FeedItem[] = [
  {
    id: 'f1',
    title: 'Your Oval match went up',
    meta: 'Analyzer · Today',
    body:
      'Re-running the analyzer with your current jawline photo raised confidence from 71% to 92%. Low taper and textured crops now rank higher for you.',
  },
  {
    id: 'f2',
    title: 'Barber confirmed your cut',
    meta: 'Booking · Fri 14, 11:30',
    body:
      'Kuya Ren confirmed the textured crop with a 1.5 grade taper. Bring the reference image on your phone, it is attached to the appointment.',
  },
  {
    id: 'f3',
    title: 'Three new styles saved',
    meta: 'Recommendation · Tue',
    body:
      'Side part, quiff and the low taper were added to your board after you asked about easier morning routines.',
  },
  {
    id: 'f4',
    title: 'Length guide updated for you',
    meta: 'AI · Mon',
    body:
      'Your hair grows about 1.4cm a month on average. That puts the next length check at roughly six weeks, which lines up with your booking cadence.',
  },
];

export const BOOKINGS: BookingRow[] = [
  {
    id: 'b1',
    barber: 'Kuya Ren',
    shop: 'Trim · Quezon City',
    service: 'Textured crop, 1.5 taper',
    when: 'Fri 14 Nov, 11:30',
    status: 'Confirmed',
    price: 'P 480',
  },
  {
    id: 'b2',
    barber: 'Marco Dela Cruz',
    shop: 'Trim · Makati',
    service: 'Beard line-up',
    when: 'Tue 19 Nov, 16:00',
    status: 'Requested',
    price: 'P 220',
  },
  {
    id: 'b3',
    barber: 'Kuya Ren',
    shop: 'Trim · Quezon City',
    service: 'Low taper refresh',
    when: 'Sat 26 Oct, 11:30',
    status: 'Completed',
    price: 'P 420',
  },
  {
    id: 'b4',
    barber: 'Jonas Lim',
    shop: 'Trim · BGC',
    service: 'Full cut and wash',
    when: 'Sat 12 Oct, 14:00',
    status: 'Completed',
    price: 'P 560',
  },
];

export const FEED_BY_VIEW: Record<Exclude<DashboardView, 'account'>, FeedItem[]> = {
  overview: OVERVIEW_FEED,
  recommendation: [
    {
      id: 'r1',
      title: 'Textured crop ranks first',
      meta: '94% match · Oval',
      body:
        'Keeps length through the top so it works with your jawline, and the sides stay short enough for a two week refresh.',
    },
    {
      id: 'r2',
      title: 'Low taper is your safe option',
      meta: '88% match · Round',
      body:
        'For weeks when you cannot make the shop, this holds its shape longest and grows out without a hard line.',
    },
    {
      id: 'r3',
      title: 'Mid fade needs a sharper jaw',
      meta: '81% match · Square',
      body:
        'It scores well but wants more definition at the jaw than you currently have. Ask the barber to clean the neckline.',
    },
  ],
  'face-shape': [
    {
      id: 'a1',
      title: 'Oval, 92% confidence',
      meta: '4 landmarks measured',
      body:
        'Forehead slightly wider than the cheekbones with a tapered jaw. Oval takes almost every short cut well, so the choice comes down to upkeep.',
    },
    {
      id: 'a2',
      title: 'Recalibrate with a new photo',
      meta: 'Lighting matters',
      body:
        'Front lit, no glasses, hair pushed back. Angled shots throw the forehead measurement off by enough to change the result.',
    },
  ],
  booking: [
    {
      id: 'k1',
      title: 'Kuya Ren · Fri 14 Nov',
      meta: 'Confirmed · 11:30',
      body:
        'Textured crop with a 1.5 grade taper. Reference image attached, about 40 minutes.',
    },
    {
      id: 'k2',
      title: 'Marco Dela Cruz · Tue 19 Nov',
      meta: 'Awaiting reply',
      body:
        'Beard line-up, 30 minutes. The shop has not confirmed yet, so keep Friday as the fallback.',
    },
  ],
  ai: [
    {
      id: 'ai1',
      title: 'Low maintenance means two things',
      meta: 'Length · Contrast',
      body:
        'Keep the top long enough to lose the part line, and keep the fade grade low so the grow out has no hard shadow to correct.',
    },
    {
      id: 'ai2',
      title: 'Your hair grows about 1.4cm a month',
      meta: 'From your last three cuts',
      body:
        'That is why your six week rhythm works. Book a refresh a week before the shape starts to break rather than after.',
    },
  ],
};