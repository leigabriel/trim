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
  /** Inline SVG path data, drawn at 24x24. */
  icon: string;
}

/**
 * Rail order. Account is absent on purpose: it opens from the identity block at
 * the foot of the rail, and listing it twice gave two ways into one page.
 *
 * No blurbs: each restated the section's own standfirst, and two lines per item
 * made five links feel crowded.
 */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'M3 12l9-8 9 8M5 10v10h14V10',
  },
  {
    id: 'recommendation',
    label: 'Recommendation',
    icon: 'M12 3l2.6 5.6 6.4.8-4.7 4.3 1.3 6.3L12 17l-5.6 3 1.3-6.3L3 9.4l6.4-.8z',
  },
  {
    id: 'face-shape',
    label: 'Faceshape Analyzer',
    // A face outline. The circle-and-hands this replaced read as a clock.
    icon: 'M12 3c-4 0-6.5 2.6-6.5 6.2 0 2.4 1.3 4 2.5 4.8V17a4 4 0 008 0v-3c1.2-.8 2.5-2.4 2.5-4.8C18.5 5.6 16 3 12 3zM9.8 10.2h.01M14.2 10.2h.01',
  },
  {
    id: 'booking',
    label: 'Booking',
    icon: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  },
  {
    id: 'ai',
    label: 'AI',
    icon: 'M5 4h9l5 5v11H5zM14 4v5h5M8 13h8M8 17h5',
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

export interface StyleCard {
  id: string;
  name: string;
  shape: string;
  upkeep: string;
  match: number;
  image: string;
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

export interface FaceMetric {
  label: string;
  /** Landmark width as a percentage of cheekbone width. */
  value: number;
  reading: string;
}

/** The baseline the other landmarks are read against. */
export const CHEEKBONE_REFERENCE = 78;

export const FACE_METRICS: FaceMetric[] = [
  { label: 'Forehead width', value: 92, reading: 'Wider than cheekbones' },
  { label: 'Cheekbone width', value: CHEEKBONE_REFERENCE, reading: 'The reference' },
  { label: 'Jaw width', value: 71, reading: 'Tapered' },
  { label: 'Face length', value: 88, reading: 'Slightly long' },
];

/** What each landmark's offset from the baseline means. */
export const FACE_FINDINGS = [
  {
    label: 'Forehead wider',
    value: '+14%',
    body: 'The brow is the widest part of your face, and that is what carries the Oval reading.',
  },
  {
    label: 'Jaw narrower',
    value: '-9%',
    body: 'A jaw that pulls in below the cheekbone is what keeps the longer styles from reading heavy.',
  },
  {
    label: 'Length above average',
    value: '88%',
    body: 'Enough length to keep the sides shorter than the top without losing the shape.',
  },
];

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

export const OVERVIEW_METRICS: Metric[] = [
  { label: 'Styles saved', value: '12', delta: '+3 this month', isGood: true },
  { label: 'Face shape', value: 'Oval', delta: '92% confidence', isGood: true },
  { label: 'Next booking', value: 'Fri 14', delta: 'in 2 days', isGood: true },
  { label: 'Barbers followed', value: '4', delta: '1 new nearby', isGood: true },
];

/** Match score by month. In data so the chart stays presentational. */
export const MATCH_TREND = [
  { month: 'May', score: 58 },
  { month: 'Jun', score: 64 },
  { month: 'Jul', score: 61 },
  { month: 'Aug', score: 72 },
  { month: 'Sep', score: 78 },
  { month: 'Oct', score: 86 },
];

/** Rows for the Overview's saved list. */
export const SAVED_STYLES = [
  {
    name: 'Textured Crop',
    meta: 'Saved Tue · Oval',
    match: 94,
    image: '/assets/styles/high-fade.png',
  },
  {
    name: 'Low Taper',
    meta: 'Saved Tue · Round',
    match: 88,
    image: '/assets/styles/low-fade.png',
  },
  {
    name: 'Mid Fade',
    meta: 'Saved last week · Square',
    match: 81,
    image: '/assets/styles/mid-fade.png',
  },
  {
    name: 'Crew Cut',
    meta: 'Saved 3 Aug · Oval',
    match: 76,
    image: '/assets/styles/crew-cut.png',
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

export const STYLE_CARDS: StyleCard[] = [
  {
    id: 's1',
    name: 'Textured Crop',
    shape: 'Oval',
    upkeep: '2 weeks',
    match: 94,
    image: '/assets/styles/high-fade.png',
  },
  {
    id: 's2',
    name: 'Low Taper',
    shape: 'Round',
    upkeep: '3 weeks',
    match: 88,
    image: '/assets/styles/low-fade.png',
  },
  {
    id: 's3',
    name: 'Mid Fade',
    shape: 'Square',
    upkeep: '2 weeks',
    match: 81,
    image: '/assets/styles/mid-fade.png',
  },
  {
    id: 's4',
    name: 'Crew Cut',
    shape: 'Oval',
    upkeep: '4 weeks',
    match: 76,
    image: '/assets/styles/crew-cut.png',
  },
  {
    id: 's5',
    name: 'Buzz Cut',
    shape: 'Diamond',
    upkeep: '1 week',
    match: 64,
    image: '/assets/styles/buzz-cut.png',
  },
  {
    id: 's6',
    name: 'Semikal',
    shape: 'Heart',
    upkeep: '3 weeks',
    match: 59,
    image: '/assets/styles/semikal.png',
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