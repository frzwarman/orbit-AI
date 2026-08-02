import { useCallback, useLayoutEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD = 96;

export function isHistoryPrepend(previousFirstItem: string | undefined, currentItemKeys: string[]) {
  return previousFirstItem !== undefined && currentItemKeys.indexOf(previousFirstItem) > 0;
}

export function useSmartScroll(contentKey: string, itemKeys: string[]) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const previousMetrics = useRef({ height: 0, firstItemKey: itemKeys[0] });
  const [showJumpButton, setShowJumpButton] = useState(false);

  const updatePosition = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    nearBottomRef.current = distance <= BOTTOM_THRESHOLD;
    setShowJumpButton(!nearBottomRef.current);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    nearBottomRef.current = true;
    setShowJumpButton(false);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const previous = previousMetrics.current;
    const prepended = isHistoryPrepend(previous.firstItemKey, itemKeys);

    if (prepended && !nearBottomRef.current) {
      viewport.scrollTop += viewport.scrollHeight - previous.height;
    } else if (nearBottomRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
    }
    previousMetrics.current = { height: viewport.scrollHeight, firstItemKey: itemKeys[0] };
  }, [contentKey, itemKeys]);

  return { viewportRef, onScroll: updatePosition, scrollToBottom, showJumpButton };
}
