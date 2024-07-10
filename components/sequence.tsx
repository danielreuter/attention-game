// "use client";

// import { cn, getPrefilled } from "@/lib/utils";
// import { useState } from "react";

// export function Sequence({
//   sequence,
//   attention,
// }: {
//   sequence: string[];
//   attention?: Record<number, number>;
// }) {
//   const prefilled = getPrefilled({ sequence, ratio: 0.25 });
//   console.log("got no here", attention, sequence, prefilled);
//   return (
//     <div className="flex flex-wrap gap-y-4 gap-1 text-xl font-bold tracking-tight justify-center">
//       {sequence.map((element, i) => (
//         <Position
//           key={i}
//           value={element}
//           given={!!prefilled.filter((val) => val === i).length}
//           attentionValue={attention?.[i]}
//         />
//       ))}
//     </div>
//   );
// }

// function Position({
//   value,
//   given,
//   attentionValue,
// }: {
//   value: string;
//   given: boolean;
//   attentionValue?: number;
// }) {
//   const [content, setContent] = useState("");

//   function handleInput(e: React.FormEvent<HTMLParagraphElement>) {
//     setContent(e.currentTarget.textContent || "");
//     console.log(content);
//   }

//   let accent: string;
//   if (attentionValue === undefined) {
//     accent = "";
//   } else {
//     const color =
//       attentionValue > 0 ? "blue" : attentionValue < 0 ? "red" : "gray";
//     const number = attentionValue === 0 ? 200 : Math.abs(attentionValue) * 100;
//     accent = `bg-${color}-${number}`;
//   }
//   if (given) {
//     accent = "";
//   }
//   console.log(accent);
//   return (
//     <div
//       contentEditable={!given}
//       onInput={handleInput}
//       suppressContentEditableWarning
//       className={cn(
//         "relative flex items-center px-4 text-xl rounded-md py-[10px] justify-center font-medium tracking-normal w-auto  overflow-hidden border-black",
//         accent,
//         given ? "border-b-[1px]" : "border-[1px] min-w-[60px] mx-[3px]",
//       )}
//     >
//       {given ? value : ""}
//     </div>
//   );
// }
