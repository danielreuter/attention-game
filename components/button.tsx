import React from "react";
import { ButtonProps, Button } from "./ui/button";
import { cn } from "@/lib/utils";

const BrutalButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        {...props}
        ref={ref}
        className={cn(
          `hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
  dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] rounded-none
  transition-all active:translate-x-[3px] 
  active:translate-y-[3px] active:shadow-none`,
          className,
        )}
      />
    );
  },
);
BrutalButton.displayName = "Button2";

export { BrutalButton };
