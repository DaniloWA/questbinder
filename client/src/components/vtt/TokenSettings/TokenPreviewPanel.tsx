import React from 'react';
import { TokenShape, TokenIdleAnimation, TokenEffect } from '../../../types';
import { getIdleAnimationClass, getEffectClass } from './tokenModalUtils';
import { useTranslation } from '../../../i18n/TranslationContext';

interface TokenPreviewPanelProps {
  displayMode: 'image' | 'text';
  imgUrl: string;
  textVal: string;
  textBgColor: string;
  textColor: string;
  size: number;
  shape: TokenShape;
  scale: number;
  rotation: number;
  imageX: number;
  imageY: number;
  imageRotation: number;
  borderColor: string;
  borderWidth: number;
  borderStyle: string;
  tintColor: string;
  tintAlpha: number;
  idleAnimation: TokenIdleAnimation;
  effect: TokenEffect;
  lightEnabled: boolean;
  lightDim: number;
  lightColor: string;
  lightIntensity: number;
}

const GRID_PX = 50;

export const TokenPreviewPanel: React.FC<TokenPreviewPanelProps> = ({
  displayMode,
  imgUrl,
  textVal,
  textBgColor,
  textColor,
  size,
  shape,
  scale,
  rotation,
  imageX,
  imageY,
  imageRotation,
  borderColor,
  borderWidth,
  borderStyle,
  tintColor,
  tintAlpha,
  idleAnimation,
  effect,
  lightEnabled,
  lightDim,
  lightColor,
  lightIntensity,
}) => {
  const { t } = useTranslation();
  const displaySize = size * GRID_PX;
  const scaleFactor = Math.min(1, 250 / displaySize);

  const animClass = getIdleAnimationClass(idleAnimation);
  const effectClass = getEffectClass(effect);
  const isTopDown = shape === 'topdown';

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {lightEnabled && (
        <div
          className="absolute rounded-full pointer-events-none mix-blend-screen"
          style={{
            width: `${lightDim * GRID_PX * 2}px`,
            height: `${lightDim * GRID_PX * 2}px`,
            background: `radial-gradient(circle, ${lightColor} 0%, transparent 70%)`,
            opacity: lightIntensity,
            transform: `scale(${scaleFactor})`,
          }}
        />
      )}

      <div
        className={`relative transition-all duration-300 ${animClass} ${effectClass}`}
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          transform: `scale(${scaleFactor}) rotate(${rotation}deg)`,
        }}
      >
        <div
          className="w-full h-full overflow-hidden relative flex items-center justify-center transition-all"
          style={{
            borderRadius: !isTopDown ? (shape === 'circle' ? '50%' : shape === 'square' ? '8px' : '0') : undefined,
            clipPath: shape === 'hex' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined,
            border: (!isTopDown && shape !== 'hex') ? `${borderWidth}px ${borderStyle} ${borderColor}` : undefined,
            boxShadow: !isTopDown ? '0 10px 30px rgba(0,0,0,0.5)' : undefined,
            backgroundColor: displayMode === 'text' && !isTopDown ? textBgColor : (!isTopDown ? '#18181b' : 'transparent'),
          }}
        >
          {displayMode === 'image' ? (
            <>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `translate(${imageX * 100}%, ${imageY * 100}%) rotate(${imageRotation}deg) scale(${scale})`,
                  transition: 'transform 0.1s linear',
                }}
              >
                <img
                  src={imgUrl}
                  className="w-full h-full object-cover"
                  onError={(e) => e.currentTarget.src = 'https://placehold.co/96x96/333/fff?text=?'}
                  alt={t('vtt.tokens.editModal.preview.alt')}
                />
              </div>
              {tintAlpha > 0 && !isTopDown && (
                <div className="absolute inset-0" style={{ backgroundColor: tintColor, opacity: tintAlpha }} />
              )}
            </>
          ) : (
            <span style={{ color: textColor, fontSize: `${displaySize * 0.4}px`, fontWeight: 'bold' }}>
              {textVal || '?'}
            </span>
          )}
        </div>

        {shape === 'hex' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: borderColor,
              zIndex: -1,
              transform: `scale(${1 + (borderWidth * 0.01)})`,
            }}
          />
        )}

        {isTopDown && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[20%] border border-[#22d3ee] rounded-[50%] opacity-50" />
        )}
      </div>
    </div>
  );
};
