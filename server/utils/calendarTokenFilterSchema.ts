import { z } from 'zod'

/**
 * Die Filter eines Kalender-Abos, wie sie über die API hereinkommen. Eine leere
 * Liste bedeutet „keine Einschränkung“, nicht „nichts“.
 */
export const calendarTokenFilterSchema = {
	kinds: z.array(z.union([ z.literal(calendarSessionKind), z.uuid() ])).default([]),
	organizationItems: z.array(z.uuid()).default([]),
}
