import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Sequence } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractSequence(question: string): Sequence {
  const words = question.split(" ");
  return words.map((word, i) => {
    return {
      value: word,
      guess: "",
      isGiven: i === words.length - 1,
    };
  });
}
