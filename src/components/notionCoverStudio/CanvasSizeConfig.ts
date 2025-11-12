export const CANVAS_SIZES = {
  notion: { width: 1500, height: 600, label: "Notion Cover" },
  "16:9": { width: 1600, height: 900, label: "Wide (16:9)" },
  "4:3": { width: 1600, height: 1200, label: "Classic (4:3)" },
  "3:2": { width: 1500, height: 1000, label: "Photo (3:2)" },
  "1:1": { width: 1200, height: 1200, label: "Square (1:1)" },
};

export type CanvasSizeKey = keyof typeof CANVAS_SIZES;

export const getCanvasDimensions = (sizeKey: string) => {
  const size = CANVAS_SIZES[sizeKey as CanvasSizeKey];
  return size || CANVAS_SIZES.notion;
};
