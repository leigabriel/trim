import { useEffect, useRef, useState } from 'react';

import './Location.css';

// Leaflet is vendored in public/assets/leaflet and loaded via a script tag,
// because Vite refuses module imports out of public/. The global build attaches
// to globalThis.leaflet, so each class is constructed with new.
const LEAFLET_JS = '/assets/leaflet/dist/leaflet-global.js';
const LEAFLET_CSS = '/assets/leaflet/dist/leaflet.css';

// Calapan, Oriental Mindoro.
const COORDS: [number, number] = [13.320023, 121.256381];

// Card clearance from the frame edge and the marker dot.
const GAP = 12;
// Below this the card docks to the frame bottom.
const NARROW = 768;

const SHOP = {
  name: 'Trim',
  branch: 'Oriental Mindoro',
  address: 'Naujan, Oriental Mindoro, Philippines',
  hours: 'Mon to Sat, 8:00 AM to 5:00 PM',
  phone: '+63 917 000 0000',
};

// Only the surface used here; the build ships no declarations.
interface LeafletPoint {
  x: number;
  y: number;
}

interface LeafletMap {
  remove(): void;
  invalidateSize(animate?: boolean): this;
  on(type: string, handler: () => void): this;
  off(type: string, handler: () => void): this;
  latLngToContainerPoint(position: [number, number]): LeafletPoint;
}

interface LeafletLayer {
  addTo(map: LeafletMap): this;
}

interface LeafletMarker extends LeafletLayer {
  getElement(): HTMLElement | null;
}

interface LeafletGlobal {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  TileLayer: new (url: string, options: Record<string, unknown>) => LeafletLayer;
  Marker: new (position: [number, number], options: Record<string, unknown>) => LeafletMarker;
  DivIcon: new (options: Record<string, unknown>) => unknown;
}

declare global {
  interface Window {
    leaflet?: LeafletGlobal;
  }
}

/** Loads the bundle once and resolves with its global. */
const loadLeaflet = () =>
  new Promise<LeafletGlobal>((resolve, reject) => {
    if (window.leaflet) {
      resolve(window.leaflet);
      return;
    }

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`);

    const onLoad = () => {
      if (window.leaflet) resolve(window.leaflet);
      else reject(new Error('Leaflet loaded but exposed no global'));
    };

    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('Leaflet failed to load')), {
      once: true,
    });
    document.head.appendChild(script);
  });

const Location: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Latched by click, so the card stays put when the pointer leaves.
  const [isPinned, setIsPinned] = useState(false);
  const isHoveredRef = useRef(false);
  const pinnedRef = useRef(false);

  useEffect(() => {
    pinnedRef.current = isPinned;
  }, [isPinned]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || mapRef.current) return;

    let cancelled = false;
    const teardown: Array<() => void> = [];

    loadLeaflet()
      .then((L) => {
        if (cancelled) return;

        const map = new L.Map(mount, {
          center: COORDS,
          zoom: 14,
          // Page scroll must win over map zoom, or the map swallows the scroll.
          scrollWheelZoom: false,
          zoomControl: true,
          attributionControl: true,
        });

        new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const marker = new L.Marker(COORDS, {
          // Div icon, so nothing depends on the marker PNGs resolving.
          icon: new L.DivIcon({
            className: 'trim-location__pin',
            html: '<span aria-hidden="true"></span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          title: `${SHOP.name}, ${SHOP.branch}`,
          alt: `${SHOP.name} barbershop in ${SHOP.branch}`,
        }).addTo(map);

        // The card tracks the marker, so re-place it on every move and zoom.
        // Clamped in script rather than CSS: the marker sits mid-map, so a fixed
        // offset runs off the edge on a narrow phone.
        const place = () => {
          const card = cardRef.current;
          if (!card) return;

          const point = map.latLngToContainerPoint(COORDS);

          if (mount.clientWidth <= NARROW) {
            // Phone: a card floating above the marker is too wide, so it docks to
            // the frame bottom. Set here because the inline styles would win.
            card.style.left = `${GAP}px`;
            card.style.top = `${Math.max(GAP, mount.clientHeight - card.offsetHeight - GAP)}px`;
            return;
          }

          const width = card.offsetWidth;
          const maxLeft = Math.max(GAP, mount.clientWidth - width - GAP);

          card.style.left = `${Math.min(Math.max(point.x, GAP), maxLeft)}px`;
          card.style.top = `${point.y}px`;
        };

        const sync = () => {
          const shouldShow = isHoveredRef.current || pinnedRef.current;
          cardRef.current?.classList.toggle('trim-location__card--open', shouldShow);
          if (shouldShow) place();
        };

        map.on('move', place);
        map.on('zoom', place);
        teardown.push(() => map.off('move', place), () => map.off('zoom', place));

        // On touch the card only closes via the marker, so the map dismisses it.
        const dismiss = (event: MouseEvent) => {
          if (!event.target || mount.contains(event.target as Node)) return;
          isHoveredRef.current = false;
          setIsPinned(false);
        };
        mount.addEventListener('click', dismiss);
        teardown.push(() => mount.removeEventListener('click', dismiss));

        // The marker element only exists after addTo, so the listeners go on
        // here rather than through the marker's event API.
        //
        // Hover is gated on a fine pointer: an emulated mouseenter followed by a
        // synthetic mouseleave would leave the card stuck half-open on touch.
        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const element = marker.getElement();
        if (element) {
          const enter = () => {
            isHoveredRef.current = true;
            sync();
          };
          const leave = () => {
            isHoveredRef.current = false;
            sync();
          };
          // On touch, stop the tap reaching the drag handlers.
          const toggle = (event: MouseEvent) => {
            if (!canHover) event.stopPropagation();
            setIsPinned((pinned) => !pinned);
          };

          if (canHover) {
            element.addEventListener('mouseenter', enter);
            element.addEventListener('mouseleave', leave);
          }
          element.addEventListener('click', toggle);
          teardown.push(() => {
            if (canHover) {
              element.removeEventListener('mouseenter', enter);
              element.removeEventListener('mouseleave', leave);
            }
            element.removeEventListener('click', toggle);
          });
        }

        mapRef.current = map;
        // Measures on attach; without this the tiles clip while settling.
        map.invalidateSize();
        place();
      })
      .catch((error: unknown) => {
        console.warn('Map unavailable:', error);
      });

    return () => {
      cancelled = true;
      teardown.forEach((off) => off());
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section className="trim-location" aria-labelledby="trim-location-title">
      <div className="trim-location__head">
        <h2 className="trim-location__title" id="trim-location-title">
          Location
        </h2>

        <p className="trim-location__address">{SHOP.address}</p>
      </div>

      {/* Square section box, orange grid border, no rounding. */}
      <div className="trim-location__frame">
        <div
          ref={mountRef}
          className="trim-location__map"
          role="region"
          aria-label={`Map of ${SHOP.name} barbershop, ${SHOP.address}`}
        />

        {/* Anchored to the marker, so it is positioned in script rather than
            laid out in flow. Not a dialog: it takes no focus, cannot be
            dismissed with Escape, and is hidden from assistive tech while
            closed, which is the opposite of what role="dialog" promises. */}
        <div ref={cardRef} className="trim-location__card">
          <p className="trim-location__card-name">{SHOP.name}</p>
          <p className="trim-location__card-branch">{SHOP.branch}</p>

          <ul className="trim-location__card-list">
            <li>{SHOP.address}</li>
            <li>{SHOP.hours}</li>
            <li>{SHOP.phone}</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Location;