import type { FeedItem } from '../data';

interface ActivityFeedProps {
  label: string;
  items: FeedItem[];
}

/** Middle column: what happened in the current section, most recent first. */
const ActivityFeed: React.FC<ActivityFeedProps> = ({ label, items }) => (
  <div className="trim-dash__feed" aria-label={`${label} activity`}>
    <p className="trim-dash__feed-title">Activity</p>

    <ul>
      {items.map((item) => (
        <li className="trim-dash__entry" key={item.id}>
          <p className="trim-dash__entry-meta">{item.meta}</p>
          <h2 className="trim-dash__entry-title">{item.title}</h2>
          <p className="trim-dash__entry-body">{item.body}</p>
        </li>
      ))}
    </ul>
  </div>
);

export default ActivityFeed;