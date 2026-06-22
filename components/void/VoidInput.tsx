"use client";

import { useEffect, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { bindFieldAboveKeyboard } from "@/lib/keyboard-viewport";
import { hasPersianText, resolveInputDir } from "@/lib/persian-text";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function VoidInput({ className = "", value, onChange, onFocus, dir: dirProp, ...props }: InputProps) {
  const text = value == null ? "" : String(value);
  const [dir, setDir] = useState<"rtl" | "ltr">(() => resolveInputDir(text));
  const fa = hasPersianText(text);

  useEffect(() => {
    setDir(resolveInputDir(text));
  }, [text]);

  const resolvedDir = dirProp ?? dir;

  return (
    <input
      {...props}
      value={value}
      dir={resolvedDir}
      lang={fa ? "fa" : undefined}
      className={`void-input${fa ? " void-input--fa" : ""}${className ? ` ${className}` : ""}`}
      onChange={(e) => {
        setDir(resolveInputDir(e.target.value));
        onChange?.(e);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        bindFieldAboveKeyboard(e.currentTarget);
      }}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function VoidTextarea({
  className = "",
  value,
  onChange,
  onFocus,
  dir: dirProp,
  ...props
}: TextareaProps) {
  const text = value == null ? "" : String(value);
  const [dir, setDir] = useState<"rtl" | "ltr">(() => resolveInputDir(text));
  const fa = hasPersianText(text);

  useEffect(() => {
    setDir(resolveInputDir(text));
  }, [text]);

  const resolvedDir = dirProp ?? dir;

  return (
    <textarea
      {...props}
      value={value}
      dir={resolvedDir}
      lang={fa ? "fa" : undefined}
      className={`void-input void-textarea${fa ? " void-input--fa" : ""}${className ? ` ${className}` : ""}`}
      onChange={(e) => {
        setDir(resolveInputDir(e.target.value));
        onChange?.(e);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        bindFieldAboveKeyboard(e.currentTarget);
      }}
    />
  );
}
