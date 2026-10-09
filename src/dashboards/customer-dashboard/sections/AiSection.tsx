import { AI_ANSWERS, AI_PROMPTS } from '../data';
import SectionHead from './SectionHead';

const AiSection: React.FC = () => (
  <>
    <SectionHead
      title="AI"
      lede="Ask in your own words. Answers use your face shape, your booking history and how often you can actually get it cut."
    />

    <div className="trim-card">
      <h2 className="trim-card__title">Try asking</h2>
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
      <h2 className="trim-card__title">Answers so far</h2>
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
      <h2 className="trim-card__title">What it knows about you</h2>
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

export default AiSection;