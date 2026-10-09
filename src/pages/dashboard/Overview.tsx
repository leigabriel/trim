import { SectionHead } from './Section';
import { OVERVIEW_METRICS, SAVED_STYLES } from './data';
import TrendChart from './TrendChart';

/**
 * Landing section: the four numbers, then the trend, then the next booking, so
 * the panel answers "what today" without scrolling.
 */
const Overview: React.FC = () => (
  <>
    <SectionHead
      title="Overview"
      lede="Everything Trim knows about your face, your saved styles and your upcoming cuts, updated each time you sign in."
    />

    <ul className="trim-metrics">
      {OVERVIEW_METRICS.map((metric) => (
        <li className="trim-metric" key={metric.label}>
          <p className="trim-metric__label">{metric.label}</p>
          <p className="trim-metric__value">{metric.value}</p>
          <p
            className={`trim-metric__delta${metric.isGood ? '' : ' trim-metric__delta--down'}`}
          >
            {metric.delta}
          </p>
        </li>
      ))}
    </ul>

    <section className="trim-chart-block">
      <div className="trim-chart-block__head">
        <h2 className="trim-card__title">Match score</h2>
        <p className="trim-chart-block__note">Last six months</p>
      </div>
      <TrendChart />
    </section>

    <div className="trim-overview__bottom">
      <div className="trim-card trim-card--next">
        <h2 className="trim-card__title">Next booking</h2>
        <p className="trim-next__when">Fri 14 Nov, 11:30</p>
        <p className="trim-next__what">
          Kuya Ren · Textured crop, 1.5 taper · Trim Quezon City
        </p>
        <p className="trim-next__note">
          Two days out. The reference image is already attached to the appointment.
        </p>
      </div>

      <div className="trim-card">
        <h2 className="trim-card__title">Saved styles</h2>
        <ul className="trim-saved">
          {SAVED_STYLES.map((style) => (
            <li className="trim-saved__row" key={style.name}>
              <img className="trim-saved__thumb" src={style.image} alt="" loading="lazy" />
              <span className="trim-saved__text">
                <span className="trim-saved__name">{style.name}</span>
                <span className="trim-saved__meta">{style.meta}</span>
              </span>
              <span className="trim-saved__match">{style.match}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </>
);

export default Overview;