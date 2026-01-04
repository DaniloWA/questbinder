export interface CursorShape {
  id: string;
  label: string;
  path: string; // SVG Path 'd' attribute
  imageUrl?: string; // Full SVG/Image URL (Overrides path)
  viewBox?: string; // Default 0 0 24 24
  scale?: number; // Adjust if shape is too big/small
  hotspot: { x: number, y: number; }; // The 'tip' of the cursor relative to 0,0
}

export const CURSOR_SHAPES: CursorShape[] = [
  {
    id: 'default',
    label: 'Seta Padrão',
    path: 'M5.5 3.5L11 19L14.5 13.5L20.5 13.5L5.5 3.5Z',
    hotspot: { x: 5.5, y: 3.5 }
  },
  {
    id: 'hand',
    label: 'Mão',
    path: '',
    imageUrl: '/cursors/cursor-hand.svg',
    scale: 0.005,
    hotspot: { x: 4312, y: 300 } // Tip of index finger (scaled for pt units)
  },
  {
    id: 'sword',
    label: 'Espada',
    path: '', // Not used when imageUrl is present
    imageUrl: '/cursors/cursor-sword.svg',
    scale: 0.1,
    hotspot: { x: 256, y: 40 }
  },
  {
    id: 'target',
    label: 'Alvo',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'wand',
    label: 'Varinha',
    path: '',
    imageUrl: '/cursors/cursor-wand.svg',
    scale: 0.08,
    hotspot: { x: 366, y: 146 } // Star tip position
  },
  {
    id: 'paw',
    label: 'Pata',
    path: '',
    imageUrl: '/cursors/cursor-paw.svg',
    scale: 0.06,
    hotspot: { x: 256, y: 170 } // Top center of paw
  },
  {
    id: 'skull',
    label: 'Caveira',
    path: 'M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1v2c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-2c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'gem',
    label: 'Gema',
    path: '',
    imageUrl: '/cursors/cursor-diamond.svg',
    scale: 0.06,
    hotspot: { x: 256, y: 130 } // Top of the gem crown
  },
  {
    id: 'quill',
    label: 'Pena',
    path: 'M4 21l1-6 13-13c1-1 3-1 4 0s1 3 0 4L9 19l-5 2zm15-16l-2 2m-8 8l-2 2',
    hotspot: { x: 4, y: 21 }
  },
  {
    id: 'eye',
    label: 'Olho',
    path: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'ghost',
    label: 'Fantasma',
    path: 'M12 2a9 9 0 0 0-9 9v11l3-3 3 3 3-3 3 3 3-3v-11a9 9 0 0 0-9-9z m-4 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z m8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'heart',
    label: 'Coração',
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'shield',
    label: 'Escudo',
    path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'potion',
    label: 'Poção',
    path: '',
    imageUrl: '/cursors/cursor-potion.svg',
    scale: 0.06,
    hotspot: { x: 256, y: 60 } // Cork top
  },
  {
    id: 'lightning',
    label: 'Raio',
    path: 'M7 2v11h3v9l7-12h-4l4-8z',
    hotspot: { x: 7, y: 2 } // Top tip
  },
  {
    id: 'star',
    label: 'Estrela',
    path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    hotspot: { x: 12, y: 12 }
  },
  {
    id: 'axe',
    label: 'Machado',
    path: '',
    imageUrl: '/cursors/cursor-axe.svg',
    scale: 0.08,
    hotspot: { x: 100, y: 100 } // Top-left corner after rotation (blade tip area)
  },
  {
    id: 'crown',
    label: 'Coroa',
    path: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11h-14zm14 2H5v2h14v-2z',
    hotspot: { x: 12, y: 12 }
  }
];

export const getCursorShape = (id: string): CursorShape => {
  return CURSOR_SHAPES.find(s => s.id === id) || CURSOR_SHAPES[0];
};
