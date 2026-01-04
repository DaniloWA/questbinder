import React from 'react';

interface CursorProps {
  color?: string;
  size?: number;
  className?: string;
}

export const CursorHand: React.FC<CursorProps> = ({ color = '#000000', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10240 10240"
    width={size}
    height={size}
    className={className}
  >
    <g fill={color} stroke="none" transform="rotate(180 5120 5120)">
      <path d="M4312 10218 c-303 -71 -561 -354 -613 -672 -11 -69 -19 -1152 -19
-2687 0 -2745 5 -2620 -99 -2618 -44 0 -109 83 -471 601 -567 811 -637 868
-1060 868 -428 0 -715 -234 -802 -653 -55 -265 -5 -428 241 -787 91 -132 600
-874 1131 -1650 531 -775 1025 -1480 1096 -1565 761 -906 2108 -1281 3242
-904 1150 384 1941 1392 2042 2602 26 321 26 2939 -1 3104 -86 530 -646 839
-1130 625 l-89 -40 0 120 c0 592 -697 1011 -1195 718 -38 -23 -72 -39 -75 -36
-3 3 -25 45 -49 93 -183 363 -669 545 -1031 385 -52 -23 -98 -42 -102 -42 -4
0 -9 439 -12 975 l-6 975 -62 130 c-168 353 -561 546 -936 458z"/>
    </g>
  </svg>
);

export const CursorSword: React.FC<CursorProps> = ({ color = '#78909C', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    {/* Blade */}
    <path d="M 256 40 L 226 340 L 256 340 Z" fill={color} />
    <path d="M 256 40 L 286 340 L 256 340 Z" fill={color} opacity="0.7" />
    <path d="M 256 40 L 256 340" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />

    {/* Handle */}
    <rect x="244" y="360" width="24" height="90" rx="4" fill="#5D4037" />
    <path d="M 244 375 L 268 385 M 244 395 L 268 405 M 244 415 L 268 425 M 244 435 L 268 445" stroke="#3E2723" strokeWidth="2" opacity="0.5" />

    {/* Guard */}
    <path d="M 196 330 Q 220 320 236 340 L 276 340 Q 292 320 316 330 L 320 345 Q 290 360 256 370 Q 222 360 192 345 Z" fill="#FFC107" stroke="#BF360C" strokeWidth="1" />

    {/* Pommel */}
    <circle cx="256" cy="460" r="20" fill="#FFC107" stroke="#BF360C" strokeWidth="1" />
    <circle cx="256" cy="460" r="6" fill="#FFD54F" />

    {/* Gem on Guard */}
    <polygon points="256,345 264,355 256,365 248,355" fill="#E53935" stroke="#880E4F" strokeWidth="1" />

    {/* Shine */}
    <path d="M 256 60 L 260 120 L 256 110 Z" fill="#FFFFFF" opacity="0.6" />
  </svg>
);

export const CursorWand: React.FC<CursorProps> = ({ color = '#FFC107', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    <g transform="rotate(-50 256 256)">
      {/* Handle */}
      <rect x="236" y="120" width="40" height="300" rx="20" fill="#795548" transform="rotate(45 256 256)" />

      {/* Main Star */}
      <g transform="translate(366, 146)">
        <path d="M0,-85 L23,-35 L78,-35 L34,-2 L50,50 L0,25 L-50,50 L-34,-2 L-78,-35 L-23,-35 Z" fill={color} />
        <path d="M0,25 L0,-85 L23,-35 L78,-35 L34,-2 L50,50 Z" fill="#FFFFFF" fillOpacity="0.3" />
      </g>

      {/* Sparkles */}
      <g transform="translate(240, 80)">
        <path d="M0,-25 C5,-5 5,-5 25,0 C5,5 5,5 0,25 C-5,5 -5,5 -25,0 C-5,-5 -5,-5 0,-25 Z" fill="#4DD0E1" />
      </g>
      <g transform="translate(450, 220)">
        <path d="M0,-20 C4,-4 4,-4 20,0 C4,4 4,4 0,20 C-4,4 -4,4 -20,0 C-4,-4 -4,-4 0,-20 Z" fill="#4DD0E1" />
      </g>
      <g transform="translate(400, 300)">
        <path d="M0,-15 C3,-3 3,-3 15,0 C3,3 3,3 0,15 C-3,3 -3,3 -15,0 C-3,-3 -3,-3 0,-15 Z" fill="#80DEEA" />
      </g>
    </g>
  </svg>
);

export const CursorPotion: React.FC<CursorProps> = ({ color = '#FF5252', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    {/* Cork */}
    <path d="M226 60 H286 V130 H226 Z" fill="#8D6E63" />
    <path d="M226 60 H286 V80 H226 Z" fill="#A1887F" />

    {/* Bottle Glass */}
    <path d="M206 130 V205.6 C147.8 228.7 106 285.3 106 352 C106 434.8 173.2 502 256 502 C338.8 502 406 434.8 406 352 C406 285.3 364.2 228.7 306 205.6 V130 H206Z" fill="#CFD8DC" />

    {/* Liquid */}
    <path d="M221 240 V245 C169.5 265 131 310 131 352 C131 421 187 477 256 477 C325 477 381 421 381 352 C381 310 342.5 265 291 245 V240 H221Z" fill={color} />
    <path d="M256 477 C325 477 381 421 381 352 C381 310 342.5 265 291 245 V240 H256 V477Z" fill={color} opacity="0.7" />

    {/* Liquid Surface */}
    <ellipse cx="256" cy="240" rx="35" ry="10" fill={color} opacity="0.5" />

    {/* Bubbles */}
    <circle cx="230" cy="380" r="12" fill="#FFFFFF" opacity="0.4" />
    <circle cx="270" cy="320" r="8" fill="#FFFFFF" opacity="0.4" />
    <circle cx="250" cy="420" r="6" fill="#FFFFFF" opacity="0.4" />

    {/* Bottle Rim */}
    <rect x="196" y="110" width="120" height="30" rx="8" fill="#B0BEC5" />

    {/* Glass Reflection */}
    <path d="M150 300 Q140 340 155 380 L180 375 Q170 340 180 300 Z" fill="#FFFFFF" opacity="0.4" />
    <circle cx="170" cy="280" r="10" fill="#FFFFFF" opacity="0.4" />
  </svg>
);

export const CursorAxe: React.FC<CursorProps> = ({ color = '#78909C', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    <g transform="rotate(45 256 256)">
      {/* Handle */}
      <rect x="232" y="60" width="48" height="392" rx="4" fill="#8D6E63" />
      <path d="M 256 60 L 276 60 A 4 4 0 0 1 280 64 L 280 448 A 4 4 0 0 1 276 452 L 256 452 Z" fill="#6D4C41" />

      {/* Axe Head Shadow */}
      <path d="M 232 180 L 280 180 L 280 210 Z" fill="#3E2723" opacity="0.2" />

      {/* Axe Head Poll */}
      <rect x="192" y="100" width="60" height="80" rx="4" fill={color} opacity="0.8" />

      {/* Axe Blade */}
      <path d="M 240 100 L 370 60 C 400 60 400 220 370 220 L 240 180 Z" fill={color} />

      {/* Cutting Edge */}
      <path d="M 370 60 C 400 60 400 220 370 220 C 385 180 385 100 370 60 Z" fill="#CFD8DC" />

      {/* Binding */}
      <rect x="232" y="110" width="48" height="60" fill="#455A64" opacity="0.2" />
    </g>
  </svg>
);

export const CursorPaw: React.FC<CursorProps> = ({ color = '#9b59b6', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    {/* Claws */}
    <path d="M110 220 Q75 190 65 125 Q100 155 125 200 Z" fill="#f1c40f" />
    <path d="M206 170 Q190 110 180 60 Q225 110 225 160 Z" fill="#f1c40f" />
    <path d="M306 170 Q322 110 332 60 Q287 110 287 160 Z" fill="#f1c40f" />
    <path d="M402 220 Q437 190 447 125 Q412 155 387 200 Z" fill="#f1c40f" />

    {/* Toe Pads */}
    <circle cx="110" cy="220" r="40" fill={color} />
    <circle cx="206" cy="170" r="46" fill={color} />
    <circle cx="306" cy="170" r="46" fill={color} />
    <circle cx="402" cy="220" r="40" fill={color} />

    {/* Main Pad */}
    <path d="M170 300 C170 260 210 260 256 260 C302 260 342 260 342 300 C360 350 350 390 256 430 C162 390 152 350 170 300 Z" fill={color} />

    {/* Rune */}
    <path d="M256 280 L275 330 L325 345 L275 360 L256 410 L237 360 L187 345 L237 330 Z" fill="#ecf0f1" />
  </svg>
);

export const CursorGem: React.FC<CursorProps> = ({ color = '#9C27B0', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    <g transform="translate(0, -9)">
      {/* Pavilion (Bottom) */}
      <path d="M76,210 L206,210 L256,400 Z" fill={color} opacity="0.6" />
      <path d="M436,210 L306,210 L256,400 Z" fill={color} opacity="0.4" />
      <path d="M206,210 L306,210 L256,400 Z" fill={color} />

      {/* Crown (Top) */}
      <path d="M76,210 L206,210 L166,130 Z" fill={color} opacity="0.8" />
      <path d="M436,210 L306,210 L346,130 Z" fill={color} opacity="0.7" />
      <path d="M166,130 L346,130 L306,210 L206,210 Z" fill={color} opacity="0.3" />
    </g>
  </svg>
);

// Simple path-based cursors (for fallback and variety)
export const CursorDefault: React.FC<CursorProps> = ({ color = '#fbbf24', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M5.5 3.5L11 19L14.5 13.5L20.5 13.5L5.5 3.5Z" fill={color} stroke="#fff" strokeWidth="0.5" />
  </svg>
);

export const CursorTarget: React.FC<CursorProps> = ({ color = '#ef4444', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill={color} />
  </svg>
);

export const CursorSkull: React.FC<CursorProps> = ({ color = '#ECEFF1', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    {/* Skull Base Shape */}
    <path fill={color} d="M256 96c-70.7 0-128 57.3-128 128 0 32.3 12.1 61.8 32.1 84.3l11.9 13.4v68.3c0 11 9 20 20 20h128c11 0 20-9 20-20v-68.3l11.9-13.4c20-22.5 32.1-52 32.1-84.3 0-70.7-57.3-128-128-128z" />

    {/* Eyes */}
    <circle cx="196" cy="224" r="40" fill="#263238" />
    <circle cx="316" cy="224" r="40" fill="#263238" />

    {/* Nose */}
    <path fill="#263238" d="M256 280l-24 40 24-12 24 12z" />

    {/* Teeth Details */}
    <g fill="#263238">
      <rect x="254" y="350" width="4" height="40" rx="2" />
      <rect x="224" y="350" width="4" height="35" rx="2" />
      <rect x="194" y="350" width="4" height="25" rx="2" />
      <rect x="284" y="350" width="4" height="35" rx="2" />
      <rect x="314" y="350" width="4" height="25" rx="2" />
    </g>
  </svg>
);

export const CursorQuill: React.FC<CursorProps> = ({ color = '#a855f7', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M4 21l1-6 13-13c1-1 3-1 4 0s1 3 0 4L9 19l-5 2z" fill={color} stroke="#fff" strokeWidth="0.3" />
  </svg>
);

export const CursorEye: React.FC<CursorProps> = ({ color = '#3b82f6', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill={color} />
  </svg>
);

export const CursorGhost: React.FC<CursorProps> = ({ color = '#f8fafc', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M12 2a9 9 0 0 0-9 9v11l3-3 3 3 3-3 3 3 3-3v-11a9 9 0 0 0-9-9z" fill={color} stroke="#94a3b8" strokeWidth="0.5" />
    <circle cx="8" cy="10" r="2" fill="#1e293b" />
    <circle cx="16" cy="10" r="2" fill="#1e293b" />
  </svg>
);

export const CursorHeart: React.FC<CursorProps> = ({ color = '#ef4444', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />
  </svg>
);

export const CursorShield: React.FC<CursorProps> = ({ color = '#3498db', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
  >
    {/* Shield Border Left (Light Gold) */}
    <path d="M256 48 L48 48 L48 160 C48 304 128 416 256 496 Z" fill="#f1c40f" />

    {/* Shield Border Right (Dark Gold/Orange) */}
    <path d="M256 48 L464 48 L464 160 C464 304 384 416 256 496 Z" fill="#e67e22" />

    {/* Shield Inner Field Left */}
    <path d="M256 88 L88 88 L88 176 C88 288 152 376 256 448 Z" fill={color} />

    {/* Shield Inner Field Right */}
    <path d="M256 88 L424 88 L424 176 C424 288 360 376 256 448 Z" fill={color} opacity="0.8" />

    {/* Heraldry: Vertical Sword/Cross Left */}
    <path d="M224 128 L256 128 L256 384 L224 368 Z" fill="#ecf0f1" />

    {/* Heraldry: Vertical Sword/Cross Right */}
    <path d="M256 128 L288 128 L288 368 L256 384 Z" fill="#bdc3c7" />

    {/* Heraldry: Horizontal Crossbar Left */}
    <path d="M128 192 L256 192 L256 240 L128 224 Z" fill="#ecf0f1" />

    {/* Heraldry: Horizontal Crossbar Right */}
    <path d="M256 192 L384 192 L384 224 L256 240 Z" fill="#bdc3c7" />

    {/* Central Gem Left */}
    <path d="M256 160 L216 216 L256 272 Z" fill="#e74c3c" />

    {/* Central Gem Right */}
    <path d="M256 160 L296 216 L256 272 Z" fill="#c0392b" />

    {/* Corner Rivets */}
    <circle cx="72" cy="72" r="12" fill="#f39c12" />
    <circle cx="440" cy="72" r="12" fill="#d35400" />
    <circle cx="256" cy="464" r="12" fill="#d35400" />
  </svg>
);

export const CursorLightning: React.FC<CursorProps> = ({ color = '#eab308', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M7 2v11h3v9l7-12h-4l4-8z" fill={color} />
  </svg>
);

export const CursorStar: React.FC<CursorProps> = ({ color = '#f59e0b', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={color} />
  </svg>
);

export const CursorCrown: React.FC<CursorProps> = ({ color = '#fbbf24', size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11h-14zm14 2H5v2h14v-2z" fill={color} />
  </svg>
);
