export interface Style {
  id: number;
  name: string;
  img: string;
}

export const STYLES: Style[] = [
  { id: 1, name: 'Low Fade', img: '/assets/styles/low-fade.png' },
  { id: 2, name: 'Mid Fade', img: '/assets/styles/mid-fade.png' },
  { id: 3, name: 'High Fade', img: '/assets/styles/high-fade.png' },
//   { id: 4, name: 'Pompadour', img: '/assets/styles/pompadour.jpg' },
//   { id: 5, name: 'Slick Back', img: '/assets/styles/slick-back.jpg' },
//   { id: 6, name: 'Textured Crop', img: '/assets/styles/textured-crop.jpg' },
//   { id: 7, name: 'Mullet', img: '/assets/styles/mullet.jpg' },
//   { id: 8, name: 'Curly Fringe', img: '/assets/styles/curly-fringe.jpg' },
//   { id: 9, name: 'Mid Part', img: '/assets/styles/mid-part.jpg' },
];