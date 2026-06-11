export type ColorMapName = 'viridis' | 'magma' | 'plasma' | 'inferno';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const VIRIDIS: RGB[] = [
  { r: 26, g: 26, b: 26 },
  { r: 28, g: 37, b: 48 },
  { r: 29, g: 48, b: 69 },
  { r: 25, g: 60, b: 88 },
  { r: 17, g: 71, b: 102 },
  { r: 12, g: 82, b: 110 },
  { r: 14, g: 93, b: 114 },
  { r: 20, g: 104, b: 116 },
  { r: 28, g: 115, b: 116 },
  { r: 38, g: 125, b: 114 },
  { r: 50, g: 136, b: 110 },
  { r: 64, g: 146, b: 105 },
  { r: 80, g: 156, b: 98 },
  { r: 98, g: 166, b: 88 },
  { r: 119, g: 174, b: 76 },
  { r: 142, g: 182, b: 62 },
  { r: 166, g: 188, b: 47 },
  { r: 192, g: 193, b: 34 },
  { r: 218, g: 196, b: 33 },
  { r: 243, g: 198, b: 43 },
  { r: 253, g: 231, b: 37 },
];

const MAGMA: RGB[] = [
  { r: 0, g: 0, b: 4 },
  { r: 13, g: 1, b: 31 },
  { r: 34, g: 2, b: 58 },
  { r: 55, g: 3, b: 85 },
  { r: 76, g: 3, b: 112 },
  { r: 98, g: 2, b: 138 },
  { r: 121, g: 4, b: 161 },
  { r: 143, g: 11, b: 179 },
  { r: 163, g: 22, b: 191 },
  { r: 181, g: 36, b: 198 },
  { r: 197, g: 52, b: 200 },
  { r: 211, g: 69, b: 198 },
  { r: 223, g: 88, b: 193 },
  { r: 233, g: 108, b: 185 },
  { r: 241, g: 128, b: 175 },
  { r: 247, g: 149, b: 165 },
  { r: 251, g: 171, b: 154 },
  { r: 253, g: 193, b: 144 },
  { r: 254, g: 215, b: 136 },
  { r: 253, g: 238, b: 132 },
  { r: 252, g: 255, b: 164 },
];

const PLASMA: RGB[] = [
  { r: 13, g: 8, b: 135 },
  { r: 35, g: 5, b: 160 },
  { r: 59, g: 3, b: 182 },
  { r: 83, g: 2, b: 201 },
  { r: 106, g: 5, b: 217 },
  { r: 129, g: 13, b: 229 },
  { r: 151, g: 25, b: 238 },
  { r: 172, g: 40, b: 243 },
  { r: 191, g: 58, b: 244 },
  { r: 209, g: 77, b: 242 },
  { r: 225, g: 98, b: 236 },
  { r: 238, g: 120, b: 228 },
  { r: 249, g: 142, b: 217 },
  { r: 255, g: 166, b: 204 },
  { r: 255, g: 189, b: 189 },
  { r: 255, g: 212, b: 174 },
  { r: 255, g: 235, b: 158 },
  { r: 249, g: 255, b: 143 },
];

const INFERNO: RGB[] = [
  { r: 0, g: 0, b: 4 },
  { r: 15, g: 3, b: 36 },
  { r: 40, g: 4, b: 66 },
  { r: 67, g: 5, b: 91 },
  { r: 94, g: 9, b: 111 },
  { r: 121, g: 16, b: 127 },
  { r: 147, g: 27, b: 139 },
  { r: 172, g: 41, b: 147 },
  { r: 194, g: 58, b: 150 },
  { r: 214, g: 77, b: 149 },
  { r: 232, g: 99, b: 145 },
  { r: 246, g: 122, b: 136 },
  { r: 254, g: 148, b: 125 },
  { r: 255, g: 175, b: 113 },
  { r: 250, g: 203, b: 102 },
  { r: 241, g: 231, b: 96 },
  { r: 230, g: 255, b: 106 },
];

const COLOR_MAPS: Record<ColorMapName, RGB[]> = {
  viridis: VIRIDIS,
  magma: MAGMA,
  plasma: PLASMA,
  inferno: INFERNO,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

export function getColor(
  value: number,
  minValue: number,
  maxValue: number,
  colorMap: ColorMapName = 'magma',
  dynamicRange: number = 80
): RGB {
  const clampedValue = Math.max(minValue, Math.min(maxValue, value));
  const normalized = (clampedValue - minValue) / (maxValue - minValue);

  const effectiveMax = maxValue;
  const effectiveMin = Math.max(minValue, maxValue - dynamicRange);
  const normalizedDR = Math.max(0, (clampedValue - effectiveMin) / (effectiveMax - effectiveMin));

  const colors = COLOR_MAPS[colorMap];
  const position = normalizedDR * (colors.length - 1);
  const index = Math.floor(position);
  const t = position - index;

  if (index >= colors.length - 1) {
    return colors[colors.length - 1];
  }

  return lerpRGB(colors[index], colors[index + 1], t);
}

export function getColorCSS(
  value: number,
  minValue: number,
  maxValue: number,
  colorMap: ColorMapName = 'magma',
  dynamicRange: number = 80
): string {
  const rgb = getColor(value, minValue, maxValue, colorMap, dynamicRange);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function createColorMapImageData(
  width: number,
  height: number,
  colorMap: ColorMapName = 'magma',
  dynamicRange: number = 80
): ImageData {
  const imageData = new ImageData(width, height);
  const colors = COLOR_MAPS[colorMap];

  for (let x = 0; x < width; x++) {
    const t = x / (width - 1);
    const position = t * (colors.length - 1);
    const index = Math.floor(position);
    const frac = position - index;

    let rgb: RGB;
    if (index >= colors.length - 1) {
      rgb = colors[colors.length - 1];
    } else {
      rgb = lerpRGB(colors[index], colors[index + 1], frac);
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      imageData.data[idx] = rgb.r;
      imageData.data[idx + 1] = rgb.g;
      imageData.data[idx + 2] = rgb.b;
      imageData.data[idx + 3] = 255;
    }
  }

  return imageData;
}
