import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Reduced default shadow from shadow-sm to a very subtle one or none if preferred
      // Option 1: Very subtle shadow
      "rounded-lg border bg-card text-card-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_1px_2px_-1px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_0_rgba(255,255,255,0.03),0_1px_2px_-1px_rgba(255,255,255,0.03)]",
      // Option 2: No default shadow (rely solely on border)
      // "rounded-lg border bg-card text-card-foreground",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Reduced padding slightly from p-6 to p-4
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  // Changed element type from div to h3 for better semantics
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    // Reduced font size from text-2xl to text-lg or text-xl
    className={cn(
      "text-lg font-semibold leading-none tracking-tight", // Changed to text-lg
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  // Changed element type from div to p for better semantics
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p // Changed to p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
  // Reduced padding slightly from p-6 pt-0 to p-4 pt-0
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
  // Reduced padding slightly from p-6 pt-0 to p-4 pt-0
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

    