import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        // Prevent "uncontrolled to controlled" warning.
        // If a value is provided (even if null), use it or fallback to "".
        // If value is undefined but we have an onChange, it's likely a controlled input 
        // that hasn't initialized its state yet, so we force it to "" to stay controlled.
        const value = props.value !== undefined
            ? (props.value ?? "")
            : (props.onChange ? "" : undefined);

        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className
                )}
                ref={ref}
                {...props}
                value={value}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
