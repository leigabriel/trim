import type { DashboardView } from './data';
import {
  AI_ANSWERS,
  AI_PROMPTS,
  BOOKING_METRICS,
  BOOKINGS,
  CHEEKBONE_REFERENCE,
  FACE_FINDINGS,
  FACE_METRICS,
  STYLE_CARDS,
} from './data';

interface SectionProps {
  view: Exclude<DashboardView, 'account'>;
}

/** Real, shaped content per section, not a placeholder line. */
const Section: React.FC<SectionProps> = ({ view }) => {
  if (view === 'recommendation') {
    return (
      <>
        <SectionHead
          title="Recommendation"
          lede="Scored against your face shape, hair type and how often you can get it cut. Higher match means less correction later."
        />

        <ul className="trim-style-grid">
          {STYLE_CARDS.map((style) => (
            <li className="trim-style" key={style.id}>
              <div className="trim-style__frame">
                <img src={style.image} alt="" loading="lazy" />
                <span className="trim-style__match">{style.match}%</span>
              </div>

              <div className="trim-style__body">
                <h3 className="trim-style__name">{style.name}</h3>
                <dl className="trim-style__specs">
                  <div>
                    <dt>Shape</dt>
                    <dd>{style.shape}</dd>
                  </div>
                  <div>
                    <dt>Upkeep</dt>
                    <dd>{style.upkeep}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (view === 'face-shape') {
    return (
      <>
        <SectionHead
          title="Faceshape Analyzer"
          lede="Four landmarks measured from your photo. Each bar is how far that measurement sits from your cheekbones, which is the reference the shape is read against."
        />

        <div className="trim-card">
          <h3 className="trim-card__title">Landmarks</h3>

          {/* The scale is stated once, and the tick marks the cheekbones on it. */}
          <p className="trim-card__scale">
            Width as a percentage of your cheekbones
            <span className="trim-card__scale-mark" aria-hidden="true" />
          </p>

          <ul className="trim-landmarks">
            {FACE_METRICS.map((metric) => (
              <li className="trim-landmark" key={metric.label}>
                <div className="trim-landmark__head">
                  <span className="trim-landmark__label">{metric.label}</span>
                  <span className="trim-landmark__value">{metric.value}%</span>
                </div>

                <div className="trim-landmark__track">
                  <div className="trim-landmark__fill" style={{ width: `${metric.value}%` }} />
                  <span
                    className="trim-landmark__reference"
                    style={{ left: `${CHEEKBONE_REFERENCE}%` }}
                    aria-hidden="true"
                  />
                </div>

                <p className="trim-landmark__reading">{metric.reading}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="trim-card">
          <h3 className="trim-card__title">Result</h3>
          <p className="trim-result">
            <strong>Oval</strong>
            <span className="trim-result__confidence">92% confidence</span>
          </p>
          <p className="trim-card__text">
            Forehead slightly wider than the cheekbones with a tapered jaw and no strong
            brow shelf. Oval takes almost every short cut well, so your choice comes
            down to upkeep rather than shape.
          </p>
        </div>

        <div className="trim-card">
          <h3 className="trim-card__title">What it means</h3>
          <ul className="trim-findings">
            {FACE_FINDINGS.map((finding) => (
              <li className="trim-finding" key={finding.label}>
                <span className="trim-finding__head">
                  <span className="trim-finding__label">{finding.label}</span>
                  <span className="trim-finding__value">{finding.value}</span>
                </span>
                <span className="trim-finding__body">{finding.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  if (view === 'booking') {
    return (
      <>
        <SectionHead
          title="Booking"
          lede="Every appointment with the barbers you follow. Confirmed cuts keep your recommendation history in order so the next one starts from what you actually got."
        />

        <ul className="trim-metrics">
          {BOOKING_METRICS.map((metric) => (
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

        <div className="trim-table-wrap">
          <table className="trim-table">
            <caption className="trim-visually-hidden">
              Appointments by date, barber, service and status
            </caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Barber</th>
                <th scope="col">Service</th>
                <th scope="col">Status</th>
                <th scope="col" className="trim-table__num">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {BOOKINGS.map((booking) => (
                <tr key={booking.id}>
                  <td data-label="When">{booking.when}</td>
                  <td data-label="Barber">
                    <span className="trim-table__primary">{booking.barber}</span>
                    <span className="trim-table__secondary">{booking.shop}</span>
                  </td>
                  <td data-label="Service">{booking.service}</td>
                  <td data-label="Status">
                    <span
                      className={`trim-status trim-status--${booking.status.toLowerCase()}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td data-label="Price" className="trim-table__num">
                    {booking.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (view === 'ai') {
    return (
      <>
        <SectionHead
          title="AI"
          lede="Ask in your own words. Answers use your face shape, your booking history and how often you can actually get it cut."
        />

        <div className="trim-card">
          <h3 className="trim-card__title">Try asking</h3>
          <ul className="trim-prompts">
            {AI_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button className="trim-prompt" type="button">
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="trim-card">
          <h3 className="trim-card__title">Answers so far</h3>
          <ul className="trim-answers">
            {AI_ANSWERS.map((answer) => (
              <li className="trim-answer" key={answer.q}>
                <p className="trim-answer__q">{answer.q}</p>
                <p className="trim-answer__a">{answer.a}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="trim-card">
          <h3 className="trim-card__title">What it knows about you</h3>
          <dl className="trim-facts">
            <div>
              <dt>Face shape</dt>
              <dd>Oval, 92% confidence</dd>
            </div>
            <div>
              <dt>Hair type</dt>
              <dd>Straight, medium density</dd>
            </div>
            <div>
              <dt>Growth rate</dt>
              <dd>About 1.4cm a month</dd>
            </div>
            <div>
              <dt>Typical gap</dt>
              <dd>Six weeks</dd>
            </div>
            <div>
              <dt>Usual barber</dt>
              <dd>Kuya Ren</dd>
            </div>
            <div>
              <dt>Cuts completed</dt>
              <dd>Seven since August</dd>
            </div>
          </dl>
        </div>
      </>
    );
  }

  return null;
};

interface SectionHeadProps {
  title: string;
  lede: string;
}

/** Shared title and standfirst, so every section opens the same way. */
export const SectionHead: React.FC<SectionHeadProps> = ({ title, lede }) => (
  <header className="trim-section__head">
    <h1 className="trim-section__title">{title}</h1>
    <p className="trim-section__lede">{lede}</p>
  </header>
);

export default Section;