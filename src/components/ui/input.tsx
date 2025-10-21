import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-base shadow-sm transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
        "placeholder:text-gray-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
