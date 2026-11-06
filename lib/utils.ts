import { twMerge } from "tailwind-merge";

export type ClassValue =
  | ClassValue[]
  | string
  | number
  | null
  | boolean
  | undefined
  | { [key: string]: any };

function toVal(mix: ClassValue): string {
  let str = "";
  if (typeof mix === "string" || typeof mix === "number") {
    str += mix;
  } else if (typeof mix === "object" && mix !== null) {
    if (Array.isArray(mix)) {
      for (let k = 0; k < mix.length; k++) {
        if (mix[k]) {
          const y = toVal(mix[k]);
          if (y) {
            if (str) str += " ";
            str += y;
          }
        }
      }
    } else {
      for (const k in mix) {
        if (mix[k]) {
          if (str) str += " ";
          str += k;
        }
      }
    }
  }
  return str;
}

export function clsx(...inputs: ClassValue[]): string {
  let str = "";
  for (let i = 0; i < inputs.length; i++) {
    const x = inputs[i];
    if (x) {
      const y = toVal(x);
      if (y) {
        if (str) str += " ";
        str += y;
      }
    }
  }
  return str;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
