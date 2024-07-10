"use client";

import { useState } from "react";
import { useServerAction } from "zsa-react";
import { cn, extractSequence } from "@/lib/utils";
import { BrutalButton } from "./button";
import { IconArrowElbow, IconSpinner } from "./ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ExternalLinkIcon, MoveRight } from "lucide-react";
import { Position, Problem } from "@/lib/types";
import { runQuery, runSubmission } from "@/lib/game/actions";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { spinner } from "./spinner";
import { ModernLoader } from "./loader/modern-loader";

export type PositionData = {
  value: string;
  guess: string;
  currentAttention?: number;
};

export function ProblemDisplay({ problem }: { problem: Problem }) {

  const { isPending: queryIsPending, execute: executeQuery } =
    useServerAction(runQuery);

  const {
    isPending: submissionIsPending,
    execute: executeSubmission,
    data: submissionResult,
  } = useServerAction(runSubmission);

  const [sequence, setSequence] = useState(problem.sequence);

  const [submission, setSubmission] = useState("");

  return (
    <main className="flex flex-col items-center justify-center gap-8 min-h-screen">
      <div className="px-6 w-full flex flex-col pb-10 max-w-3xl items-center">
        <h1 className="text-xl font-semibold tracking-tighter pb-[20px]">
          {problem.subject}
        </h1>
        <div className="flex flex-wrap gap-y-4 gap-1 text-xl font-bold tracking-tight justify-center">
          {sequence.map((position, i) => (
            <div
              key={i}
              contentEditable={!position.isGiven}
              onInput={(e) => {
                const value = (e.target as HTMLDivElement).textContent || "";
                const newSequence = [...sequence];
                newSequence[i] = { ...position, guess: value };
                setSequence(newSequence);
              }}
              suppressContentEditableWarning
              className={cn(
                "relative flex items-center px-4 text-base rounded-md py-[10px] justify-center font-medium tracking-normal w-auto  overflow-hidden border-black",
                getPositionColor(position),
                position.isGiven ? "" : "border-[1px] min-w-[60px] mx-[3px]",
              )}
            >
              {position.isGiven ? position.value : ""}
            </div>
          ))}
        </div>
      </div>
      <Dialog
        onOpenChange={(open) => {
          if (open) {
            setSubmission(
              sequence
                .map(({ value, guess, isGiven }) => (isGiven ? value : guess))
                .join(" "),
            );
          }
        }}
      >
        <DialogTrigger asChild>
          <div className="cursor-pointer hover:underline transition-all hover:gap-2 flex items-center gap-1 py-2 text-base font-medium tracking-tight ">
            <p>Submit</p> <MoveRight className="h-4" />
          </div>
        </DialogTrigger>
        {submissionResult !== undefined ? (
          <DialogContent className="sm:rounded-none">
              <DialogHeader>
                <DialogTitle>Submission</DialogTitle>
                <DialogDescription>
                  Guess the sentence. You only get one attempt.
                </DialogDescription>
              </DialogHeader>
              <form
                className='flex flex-col gap-3'
                onSubmit={async (e) => {
                  console.log("submitted submission")
    
                  e.preventDefault();
                  const [, error] = await executeSubmission({
                    submission,
                    problem: {
                      ...problem,
                      sequence,
                    },
                  });
                  if (error) {
                    console.error(error);
                  } else {
                  }
                }}
              >
              <input
                name="submission"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                className="border-[1.5px] border-primary h-14 w-full px-4 font-normal tracking-tight rounded-none"
                placeholder="Your prediction"
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
              ></input>
              <div className="flex w-full justify-end">
                <Button type="submit">Submit</Button>
              </div>
            </form>
            </DialogContent>
        ) : (
          <DialogContent className="sm:rounded-none flex justify-center items-center">
            <DialogTitle></DialogTitle>
            <ModernLoader />
          </DialogContent>
        )}
      </Dialog>
      <ModernLoader />
      <div className="w-full flex flex-col px-6">
        <form
          className="flex flex-col items-center justify-center"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const query = formData.get("query") as string;
            const [newSequence, error] = await executeQuery({
              query,
              sequence,
            });
            if (error) {
              console.error(error);
            } else {
              setSequence(newSequence);
            }
          }}
        >
          <div className="fixed bottom-0 py-2 inset-x-0 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full flex items-center justify-end">
              <div className="flex flex-col py-1 text-muted-foreground text-sm">
                <p>5/30 questions remaining</p>
              </div>
            </div>
            <div className="w-full max-w-3xl relative">
              <input
                name="query"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                className="relative border-[1.5px] border-primary h-14 w-full px-4 font-normal tracking-tight rounded-none"
                placeholder="Ask a question"
              ></input>
              <div className="absolute right-0 top-[9px] sm:right-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-none"
                      disabled={false}
                    >
                      <IconArrowElbow />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function getPositionColor({ currentAttention, isGiven }: Position): string {
  let accent: string;
  if (currentAttention === undefined) {
    accent = "";
  } else {
    const color =
      currentAttention > 0 ? "blue" : currentAttention < 0 ? "red" : "gray";
    const number =
      currentAttention === 0 ? 200 : Math.abs(currentAttention) * 100;
    accent = `bg-${color}-${number}`;
  }
  if (isGiven) {
    accent = "";
  }
  return accent;
}

function PositionDisplay({
  position: { value, guess, isGiven, currentAttention },
  handleInput,
}: {
  position: Position;
  handleInput: (value: string) => void;
}) {
  const [content, setContent] = useState("");

  function _handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    handleInput(e.target.value);
  }

  let accent: string;
  if (currentAttention === undefined) {
    accent = "";
  } else {
    const color =
      currentAttention > 0 ? "blue" : currentAttention < 0 ? "red" : "gray";
    const number =
      currentAttention === 0 ? 200 : Math.abs(currentAttention) * 100;
    accent = `bg-${color}-${number}`;
  }
  if (isGiven) {
    accent = "";
  }
  console.log(accent);
  return (
    <textarea
      value={content}
      onChange={_handleInput}
      readOnly={isGiven}
      className={cn(
        "relative flex items-center px-4 text-xl rounded-md py-[10px] justify-center font-medium tracking-normal w-auto overflow-hidden border-black resize-none",
        accent,
        isGiven ? "" : "border-[1px] min-w-[60px] mx-[3px]",
      )}
      style={{ width: `calc(${content.length + 1}ch + 16px)` }}
    />
  );
}
