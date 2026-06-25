export function pickTwoColors(palette: readonly string[], rng: () => number): [string, string] {
  const a = Math.floor(rng() * palette.length);
  let b = Math.floor(rng() * (palette.length - 1));
  if (b >= a) b += 1;
  return [palette[a], palette[b]];
}
