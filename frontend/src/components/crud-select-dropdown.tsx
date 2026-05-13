"use client";

import { Check, ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CrudSelectOption = { value: string; label: string };

export function CrudSelectDropdown({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  align = "start",
  triggerClassName,
  emptyLabel = "No options",
}: {
  id?: string;
  value: string;
  onValueChange: (next: string) => void;
  options: CrudSelectOption[];
  placeholder: string;
  disabled?: boolean;
  align?: "start" | "end" | "center";
  triggerClassName?: string;
  emptyLabel?: string;
}) {
  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-9 w-full justify-between gap-1 px-3 font-normal",
          "disabled:pointer-events-none disabled:opacity-50",
          triggerClassName
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !selected && "text-muted-foreground"
          )}
        >
          {display}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="max-h-72 min-w-(--anchor-width) max-w-[min(100vw-2rem,28rem)]"
      >
        <DropdownMenuGroup>
          {options.length === 0 ? (
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              {emptyLabel}
            </DropdownMenuLabel>
          ) : (
            options.map((o) => (
              <DropdownMenuItem
                key={o.value}
                className="justify-between gap-2"
                onClick={() => onValueChange(o.value)}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {value === o.value ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
