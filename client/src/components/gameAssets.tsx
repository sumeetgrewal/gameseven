export const boardImages = importAll(require.context('../assets/images/boards', false, /\.jpg|png$/));
export const cardImages = importAll(require.context('../assets/images/cards', false, /\.jpg|png$/));

function importAll(r: any) {
  let images: any = {};
  r.keys().forEach((item: any, index: any) => { images[item.replace('./', '')] = r(item); });
  return images;
}