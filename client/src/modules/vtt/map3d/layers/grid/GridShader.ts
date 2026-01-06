export const vertexShader = `
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const fragmentShader = `
  varying vec3 vWorldPosition;
  
  uniform float uSize;
  uniform vec3 uColor;
  uniform float uThickness;
  uniform float uAlpha;
  
  // Anti-aliased grid function
  float grid(vec3 pos, float size, float thickness) {
    vec2 coord = pos.xz / size; // Use XZ for top-down grid on ground plane
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    return 1.0 - min(line, 1.0);
  }

  void main() {
    float g = grid(vWorldPosition, uSize, uThickness);
    
    // Discard transparent pixels for performance (alpha test)
    if (g < 0.1) discard;
    
    gl_FragColor = vec4(uColor, g * uAlpha);
  }
`;
