import type { Local } from '@/types/local'
import { format } from '@/utils/format'

export const label = (value: Local) => format(value.id)
