import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tableVariants = cva(
  "w-full caption-bottom text-sm",
  {
    variants: {
      variant: {
        default: "",
        // Healthcare-specific variants
        healthcare: "border border-primary/20",
        healthcareSuccess: "border border-success/20",
        healthcareWarning: "border border-warning/20",
        healthcareError: "border border-destructive/20",
        healthcareInfo: "border border-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tableRowVariants = cva(
  "border-b transition-colors data-[state=selected]:bg-muted",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50",
        // Healthcare-specific variants
        healthcare: "hover:bg-primary/5",
        healthcareSuccess: "hover:bg-success/5",
        healthcareWarning: "hover:bg-warning/5",
        healthcareError: "hover:bg-destructive/5",
        healthcareInfo: "hover:bg-info/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tableHeaderVariants = cva(
  "[&_tr]:border-b",
  {
    variants: {
      variant: {
        default: "",
        // Healthcare-specific variants
        healthcare: "bg-primary/5",
        healthcareSuccess: "bg-success/5",
        healthcareWarning: "bg-warning/5",
        healthcareError: "bg-destructive/5",
        healthcareInfo: "bg-info/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<
  HTMLTableElement,
  TableProps
>(({ className, variant, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(tableVariants({ variant }), className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableHeaderVariants> {}

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, variant, ...props }, ref) => (
  <thead ref={ref} className={cn(tableHeaderVariants({ variant }), className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  TableRowProps
>(({ className, variant, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(tableRowVariants({ variant }), className)}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  tableVariants,
  tableRowVariants,
  tableHeaderVariants,
}
