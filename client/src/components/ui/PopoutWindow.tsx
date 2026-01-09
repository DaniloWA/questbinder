
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoutWindowProps {
  children: React.ReactNode;
  title?: string;
  onClose: () => void;
  onBlocked?: () => void;
  width?: number;
  height?: number;
}

export const PopoutWindow: React.FC<PopoutWindowProps> = ({
  children,
  title = 'QuestBinder',
  onClose,
  onBlocked,
  width = 400,
  height = 600
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const windowRef = useRef<Window | null>(null);
  const mountedRef = useRef(true);

  // Keep refs to latest callback values (avoid stale closures)
  const onCloseRef = useRef(onClose);
  const onBlockedRef = useRef(onBlocked);
  onCloseRef.current = onClose;
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    mountedRef.current = true;

    // Don't create another window if one exists
    if (windowRef.current && !windowRef.current.closed) {
      return;
    }

    // Open the popup window
    const popup = window.open(
      '',
      `questbinder_sidebar_${Date.now()}`,
      `width=${width},height=${height},left=200,top=200,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      console.warn("Popup blocked by browser.");
      onBlockedRef.current?.();
      onCloseRef.current();
      return;
    }

    windowRef.current = popup;

    // Setup the popup document
    popup.document.title = title;

    // Dark mode
    if (document.documentElement.classList.contains('dark')) {
      popup.document.documentElement.classList.add('dark');
    }

    // Body styles
    const body = popup.document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.height = '100vh';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = '#09090b';

    // Create portal container
    const portalRoot = popup.document.createElement('div');
    portalRoot.id = 'popout-root';
    portalRoot.style.height = '100%';
    portalRoot.style.width = '100%';
    body.appendChild(portalRoot);

    // Copy stylesheets (safe method - only linked stylesheets and inline styles)
    document.querySelectorAll('style').forEach(style => {
      try {
        popup.document.head.appendChild(style.cloneNode(true));
      } catch {
        // Ignore errors
      }
    });

    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      try {
        popup.document.head.appendChild(link.cloneNode(true));
      } catch {
        // Ignore errors
      }
    });

    // Set container for React portal
    setContainer(portalRoot);

    // Poll to check if window was closed by user
    const pollInterval = setInterval(() => {
      if (!windowRef.current || windowRef.current.closed) {
        clearInterval(pollInterval);
        windowRef.current = null;
        if (mountedRef.current) {
          onCloseRef.current();
        }
      }
    }, 300);

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      clearInterval(pollInterval);

      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
        windowRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only once

  if (!container) {
    return null;
  }

  return createPortal(children, container);
};
