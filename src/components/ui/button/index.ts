import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'border border-violet-200/70 bg-linear-to-br from-violet-200 via-indigo-200 to-sky-200 text-slate-900 shadow-md shadow-violet-300/25 hover:brightness-105 hover:shadow-lg hover:shadow-violet-300/30 active:shadow-xs dark:border-violet-400/25 dark:from-violet-800 dark:via-indigo-800 dark:to-slate-800 dark:text-white dark:shadow-violet-950/30 dark:hover:brightness-110',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background/80 text-foreground shadow-xs hover:bg-linear-to-br hover:from-violet-100/70 hover:to-sky-100/60 hover:border-violet-200 dark:bg-input/30 dark:border-input dark:hover:from-violet-950/70 dark:hover:to-slate-800/60 dark:hover:border-violet-400/30',
        secondary:
          'bg-secondary/80 text-secondary-foreground shadow-xs hover:bg-linear-to-br hover:from-violet-100 hover:to-sky-100 dark:hover:from-violet-950 dark:hover:to-slate-800',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
