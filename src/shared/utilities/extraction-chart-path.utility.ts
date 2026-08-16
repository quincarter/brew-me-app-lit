export interface IChartPoint {
  elapsedSeconds: number;
  value: number;
}

export interface IChartDomain {
  minElapsedSeconds: number;
  maxElapsedSeconds: number;
  minValue: number;
  maxValue: number;
}

/**
 * Maps chart-space points into an SVG path `d` string (straight `L`
 * segments - this is live/real telemetry, not a decorative mockup curve)
 * scaled into a viewBox `viewBoxWidth`x`viewBoxHeight`. Returns "" for < 2
 * points (nothing meaningful to draw).
 */
export const buildExtractionChartPath = (
  points: IChartPoint[],
  domain: IChartDomain,
  viewBoxWidth: number,
  viewBoxHeight: number,
): string => {
  if (points.length < 2) return "";

  const elapsedRange = domain.maxElapsedSeconds - domain.minElapsedSeconds;
  const valueRange = domain.maxValue - domain.minValue;

  const toX = (elapsedSeconds: number): number =>
    elapsedRange === 0
      ? viewBoxWidth / 2
      : ((elapsedSeconds - domain.minElapsedSeconds) / elapsedRange) * viewBoxWidth;

  const toY = (value: number): number =>
    valueRange === 0
      ? viewBoxHeight / 2
      : viewBoxHeight - ((value - domain.minValue) / valueRange) * viewBoxHeight;

  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${toX(point.elapsedSeconds)},${toY(point.value)}`;
    })
    .join(" ");
};
