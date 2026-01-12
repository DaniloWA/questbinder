export const TOOL_ICONS: Record<string, string> = {
  // Basics
  'select': '',
  'ping': '📍',
  'pan': '✋',

  // Measurement
  'measure-path': '📏',

  // Drawing
  'brush': '🖌️',
  'eraser-drawing': '🧼',

  // Obstacles (Walls/Doors/Windows)
  'draw-wall': '🧱',
  'freehand-wall': '✍️',
  'smart-wall': '🪄',
  'draw-door': '🚪',
  'draw-window': '🪟',
  'eraser': '🔨', // General obstacle eraser

  // Lighting
  'draw-light-rect': '💡',
  'draw-light-poly': '🔦',

  // Fog
  'fog-rect': '☁️',
  'fog-poly': '🌫️',

  // Audio
  'draw-audio-rect': '🔊',
  'draw-audio-poly': '📢',
  'eraser-audio': '🔇',

  // Triggers
  'draw-trigger-rect': '⚡',
  'draw-trigger-poly': '🌩️',
  'eraser-trigger': '🔋',

  // Magic/Special
  'wand': '✨',

  // Chat
  'chat': '💬',
  'combat': '⚔️',

  // Fallback
  'default': '🔧'
};

export const getToolIcon = (tool: string | null | undefined): string => {
  if (!tool) return TOOL_ICONS['default'];
  return TOOL_ICONS[tool] || TOOL_ICONS['default'];
};
