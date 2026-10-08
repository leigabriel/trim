export interface FooterLink {
  index: string;
  label: string;
  href: string;
}

export const FOOTER_LINKS: FooterLink[] = [
  { index: '01', label: 'About', href: '#about' },
//   { index: '02', label: 'Styles', href: '#styles' },
  { index: '02', label: 'Download App', href: '/download' },
];

export interface SocialLink {
  label: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'email', href: 'mailto:hello@trim.app' },
  { label: 'instagram', href: 'https://instagram.com/trim' },
  { label: 'facebook', href: 'https://facebook.com/trim' },
  { label: 'tiktok', href: 'https://tiktok.com/leimxnsquare' },
];