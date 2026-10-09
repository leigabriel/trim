import { STYLE_CARDS } from '../data';
import SectionHead from './SectionHead';

const Recommendation: React.FC = () => (
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

export default Recommendation;