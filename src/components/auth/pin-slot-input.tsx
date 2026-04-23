"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type PinSlotInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  minVisibleSlots?: number;
  className?: string;
  inputClassName?: string;
  shake?: boolean;
  ariaLabel: string;
  onEnter?: () => void;
};

function sanitizePin(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function PinSlotInput({
  id,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  maxLength = 12,
  minVisibleSlots = 6,
  className,
  inputClassName,
  shake = false,
  ariaLabel,
  onEnter,
}: PinSlotInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const slotCount = useMemo(
    () => Math.max(minVisibleSlots, Math.min(maxLength, value.length + 1)),
    [maxLength, minVisibleSlots, value.length],
  );

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  function focusInput() {
    inputRef.current?.focus();
  }

  function preventClipboardEvent(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && onEnter) {
      event.preventDefault();
      onEnter();
    }
  }

  return (
    <div
      className={className}
      onClick={focusInput}
      onMouseDown={(event) => {
        event.preventDefault();
        focusInput();
      }}
      role="presentation"
    >
      <div
        className={`pin-slot-group ${shake ? "shake" : ""}`.trim()}
        aria-hidden="true"
      >
        {Array.from({ length: slotCount }, (_, index) => {
          const isFilled = index < value.length;
          const isActive =
            !disabled &&
            (index === Math.min(value.length, slotCount - 1) ||
              (value.length >= slotCount && index === slotCount - 1));

          return (
            <span
              className={`pin-slot ${isFilled ? "filled" : ""} ${isActive ? "active" : ""}`.trim()}
              key={`${id}-${index}`}
            >
              {isFilled ? "●" : ""}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={ariaLabel}
        className={inputClassName}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(sanitizePin(event.target.value, maxLength))}
        onPaste={preventClipboardEvent}
        onCopy={preventClipboardEvent}
        onCut={preventClipboardEvent}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
    </div>
  );
}
