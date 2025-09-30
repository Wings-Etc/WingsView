import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : v != null ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function toFixedSafe(v: unknown, digits = 1, fallback = 0): string {
  return safeNumber(v, fallback).toFixed(digits);
}
