export const getImageUrl = (filename) =>
  new URL(`../assets/images/${filename}`, import.meta.url).href;