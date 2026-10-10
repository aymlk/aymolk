import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * shadcn 约定：合并条件类名并去重 Tailwind 冲突类。
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
