export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const adjustAlpha = (rgba: string | undefined, alpha: number) => {
  if (!rgba) return `rgba(255, 255, 255, ${alpha})`;
  if (rgba.startsWith('#')) {
    return rgba;
  }
  return rgba.replace(/[\d\.]+\)$/g, `${alpha})`);
};
