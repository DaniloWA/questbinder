
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoutWindowProps {
  children: React.ReactNode;
  title?: string;
  onClose: () => void;
  width?: number;
  height?: number;
}

export const PopoutWindow: React.FC<PopoutWindowProps> = ({ children, title = 'QuestBinder', onClose, width = 400, height = 600 }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const newWindow = useRef<Window | null>(null);

  // Copy styles from main window to new window
  const copyStyles = (sourceDoc: Document, targetDoc: Document) => {
    Array.from(sourceDoc.styleSheets).forEach(styleSheet => {
      try {
        if (styleSheet.cssRules) {
          const newStyleEl = targetDoc.createElement('style');
          Array.from(styleSheet.cssRules).forEach(cssRule => {
            newStyleEl.appendChild(targetDoc.createTextNode(cssRule.cssText));
          });
          targetDoc.head.appendChild(newStyleEl);
        } else if (styleSheet.href) {
          const newLinkEl = targetDoc.createElement('link');
          newLinkEl.rel = 'stylesheet';
          newLinkEl.href = styleSheet.href;
          targetDoc.head.appendChild(newLinkEl);
        }
      } catch (e) {
        // Sementa de cross-origin stylesheets
        console.warn('Could not copy stylesheet:', e);
      }
    });

    // Copy Tailwind scripts or style tags specifically if they are inline
    Array.from(sourceDoc.querySelectorAll('style')).forEach(styleNode => {
      targetDoc.head.appendChild(styleNode.cloneNode(true));
    });

    // Copy linked stylesheets
    Array.from(sourceDoc.querySelectorAll('link[rel="stylesheet"]')).forEach(linkNode => {
      targetDoc.head.appendChild(linkNode.cloneNode(true));
    });
  };

  useEffect(() => {
    // Create window
    const win = window.open('', '', `width=${width},height=${height},left=200,top=200`);
    if (!win) {
      console.error("Popup blocked! Please allow popups for this site.");
      onClose();
      return;
    }

    newWindow.current = win;
    win.document.title = title;

    // Add dark mode class to html/body if present in main window
    if (document.documentElement.classList.contains('dark')) {
      win.document.documentElement.classList.add('dark');
    }
    win.document.body.className = document.body.className; // Copy body classes (bg colors etc)

    // Reset body style
    win.document.body.style.margin = '0';
    win.document.body.style.padding = '0';
    win.document.body.style.height = '100vh';
    win.document.body.style.overflow = 'hidden';

    // Create container
    const div = win.document.createElement('div');
    div.style.height = '100%';
    div.style.width = '100%';
    win.document.body.appendChild(div);
    setContainer(div);

    // Copy styles
    copyStyles(document, win.document);

    // Handle close
    win.onbeforeunload = () => {
      onClose();
    };

    return () => {
      if (newWindow.current) {
        newWindow.current.close();
        newWindow.current = null;
      }
    };
  }, []);

  if (!container) return null;

  return createPortal(children, container);
};
