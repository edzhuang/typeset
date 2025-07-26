import { useRef, RefObject, useLayoutEffect, forwardRef } from "react";

function useAutoSizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  { maxRows }: { maxRows?: number } = {}
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Collapse the height so we can measure scrollHeight on one line
    el.style.height = "0px";

    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);
    const rowsNeeded = Math.ceil(el.scrollHeight / lineHeight);
    const rows = maxRows ? Math.min(rowsNeeded, maxRows) : rowsNeeded;

    el.style.height = `${rows * lineHeight}px`;
  }, [value, ref, maxRows]);
}

interface AutoSizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
}

export const AutoSizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoSizeTextareaProps
>(({ maxRows, value = "", ...props }, ref) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  // Merge the forwarded ref with the internal one so parent components can access it
  const setRefs = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref)
      (ref as React.RefObject<HTMLTextAreaElement | null>).current = node;
  };

  useAutoSizeTextarea(innerRef, String(value), { maxRows });

  return <textarea {...props} ref={setRefs} value={value} rows={1} />;
});
AutoSizeTextarea.displayName = "AutoSizeTextarea";
