import {
  BookmarkSquare2,
  FaceScanCircle,
  HomeSmile2,
  UserCircle,
} from 'reicon-react';

import { MOBILE_TABS } from '../MobileApp';

const LABELS: Record<(typeof MOBILE_TABS)[number], string> = {
  '/home': 'Home',
  '/recommendation': 'Styles',
  '/face-shape': 'Face',
  '/account': 'Account',
};

const ICONS: Record<(typeof MOBILE_TABS)[number], React.ComponentType<{ size?: number }>> = {
  '/home': HomeSmile2,
  '/recommendation': BookmarkSquare2,
  '/face-shape': FaceScanCircle,
  '/account': UserCircle,
};

interface BottomNavProps {
  hidden?: boolean;
  onSelect: (path: string) => void;
}

/**
 * Four destinations, no more. A fifth tab is what turns a tab bar into a menu,
 * and both top-bar destinations stay out of here because they are tasks, not
 * places.
 */
const BottomNav: React.FC<BottomNavProps> = ({ hidden, onSelect }) => {
  if (hidden) return null;

  // Selected from the prop the shell passes, not from a router hook, so the bar
  // does not re-render on every location change it does not care about.
  const current = window.location.pathname;

  return (
    <nav className="m-nav" aria-label="Main">
      {MOBILE_TABS.map((path) => {
        const Icon = ICONS[path];
        const isOn = current === path;

        return (
          <button
            className={`m-nav__item${isOn ? ' m-nav__item--on' : ''}`}
            type="button"
            key={path}
            aria-current={isOn ? 'page' : undefined}
            onClick={() => onSelect(path)}
          >
            <Icon size={22} />
            <span className="m-nav__label">{LABELS[path]}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;