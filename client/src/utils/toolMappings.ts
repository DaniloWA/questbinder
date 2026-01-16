export const getToolTranslationKey = (toolId: string): string => {
  // Map complex or namespaced tool IDs to their translation keys
  const mapping: Record<string, string> = {
    // Select
    'select': 'vtt.tools.toolbar.selectTool.button.label',
    'pan': 'vtt.tools.toolbar.selectTool.button.label', // Fallback

    // Ruler
    'measure-path': 'vtt.tools.toolbar.rulerTool.button.label',

    // Drawing
    'brush': 'vtt.tools.toolbar.drawingTools.brush.button.label',
    'eraser-drawing': 'vtt.tools.toolbar.drawingTools.eraser.button.label',

    // Architecture
    'draw-wall': 'vtt.tools.toolbar.architectureTools.wall.button.label',
    'freehand-wall': 'vtt.tools.toolbar.architectureTools.freehandWall.button.label',
    'smart-wall': 'vtt.tools.toolbar.architectureTools.smartWall.button.label',
    'draw-door': 'vtt.tools.toolbar.architectureTools.door.button.label',
    'draw-window': 'vtt.tools.toolbar.architectureTools.window.button.label',
    'eraser': 'vtt.tools.toolbar.architectureTools.eraser.button.label',

    // Lighting
    'draw-light-rect': 'vtt.tools.toolbar.lightingTools.lightRect.button.label',
    'draw-light-poly': 'vtt.tools.toolbar.lightingTools.lightPoly.button.label',
    'fog-rect': 'vtt.tools.toolbar.lightingTools.fogOfWar.revealRect.button.label', // Approximation
    'fog-poly': 'vtt.tools.toolbar.lightingTools.fogOfWar.revealPoly.button.label', // Approximation

    // Audio
    'draw-audio-rect': 'vtt.tools.toolbar.audioTools.zones.rect.button.label',
    'draw-audio-poly': 'vtt.tools.toolbar.audioTools.zones.poly.button.label',
    'eraser-audio': 'vtt.tools.toolbar.audioTools.zones.eraser.button.label',

    // Triggers
    'draw-trigger-rect': 'vtt.tools.toolbar.triggerTools.rect.button.label',
    'draw-trigger-poly': 'vtt.tools.toolbar.triggerTools.poly.button.label',
    'eraser-trigger': 'vtt.tools.toolbar.triggerTools.eraser.button.label',

    // Gameplay
    'combat': 'vtt.tools.toolbar.gameplayTools.startCombat.button.label',
  };

  return mapping[toolId] || 'vtt.tools.toolbar.selectTool.button.label';
};
