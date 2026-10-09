import { MATCH_TREND } from './data';

interface TrendChartProps {
  /** Plot height in px. Width is fluid. */
  height?: number;
}

/**
 * Match score over six months. Inline SVG: one series, six points, and no
 * dependency to justify.
 *
 * The viewBox is sized to the pixel box rather than stretched by
 * preserveAspectRatio="none", which would distort the stroke.
 */
const TrendChart: React.FC<TrendChartProps> = ({ height = 180 }) => {
  const width = 640;
  const padTop = 22;
  const padBottom = 30;
  const padLeft = 8;
  const padRight = 12;
  // Gutter for the y-axis, so the first point is not flush to the edge.
  const Y_AXIS_W = 30;

  const plotW = width - padLeft - padRight - Y_AXIS_W;
  const plotH = height - padTop - padBottom;

  const originX = padLeft + Y_AXIS_W;

  const min = 50;
  const max = 100;

  const x = (index: number) => originX + (index / (MATCH_TREND.length - 1)) * plotW;
  const y = (score: number) => padTop + plotH - ((score - min) / (max - min)) * plotH;

  const points = MATCH_TREND.map((entry, index) => `${x(index)},${y(entry.score)}`);
  const line = `M ${points.join(' L ')}`;
  const area = `${line} L ${x(MATCH_TREND.length - 1)},${padTop + plotH} L ${originX},${
    padTop + plotH
  } Z`;

  return (
    <div className="trim-chart">
      <svg
        className="trim-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Match score by month: ${MATCH_TREND.map(
          (entry) => `${entry.month} ${entry.score}%`,
        ).join(', ')}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Unlabelled gridlines give the eye nothing to measure against. */}
        {[50, 75, 100].map((value) => (
          <g key={value}>
            <line
              className="trim-chart__grid"
              x1={padLeft + Y_AXIS_W}
              x2={width - padRight}
              y1={y(value)}
              y2={y(value)}
            />
            <text
              className="trim-chart__axis"
              x={padLeft + Y_AXIS_W - 10}
              y={y(value) + 4}
              textAnchor="end"
            >
              {value}
            </text>
          </g>
        ))}

        <path className="trim-chart__area" d={area} />
        <path className="trim-chart__line" d={line} />

        {/* First and last month labels pulled inside, so they do not clip. */}
        {MATCH_TREND.map((entry, index) => {
          const isFirst = index === 0;
          const isLast = index === MATCH_TREND.length - 1;
          const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';

          return (
            <g key={entry.month}>
              <circle className="trim-chart__dot" cx={x(index)} cy={y(entry.score)} r={4} />
              <text className="trim-chart__label" x={x(index)} y={height - 8} textAnchor={anchor}>
                {entry.month}
              </text>
            </g>
          );
        })}

        {/* Above the last point, rather than pinned to the edge. */}
        <text
          className="trim-chart__value"
          x={x(MATCH_TREND.length - 1)}
          y={y(MATCH_TREND[MATCH_TREND.length - 1].score) - 12}
          textAnchor="end"
        >
          {MATCH_TREND[MATCH_TREND.length - 1].score}%
        </text>
      </svg>
    </div>
  );
};

export default TrendChart;