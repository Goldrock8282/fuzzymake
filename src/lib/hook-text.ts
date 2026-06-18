import { Orientation } from "./types";

const GENERIC_HOOKS = ["SO EASY!", "AMAZING DIY!", "MUST TRY!"];

const ORIENTATION_HOOKS: Record<Orientation, string[]> = {
  vertical: ["DIY IN 1 MIN!", ...GENERIC_HOOKS],
  horizontal: ["DIY IN FEW MIN", ...GENERIC_HOOKS],
};

/** Picks a hook line automatically, biased towards the orientation-specific hook. */
export function generateHook(orientation: Orientation): string {
  const pool = ORIENTATION_HOOKS[orientation];
  return pool[Math.floor(Math.random() * pool.length)];
}
