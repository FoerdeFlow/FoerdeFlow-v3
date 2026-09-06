/**
 * Default settings for the automatic e-mail reminders of a workflow step.
 *
 * They are used both as the column defaults of the database and as the initial
 * values of the editor, so that a newly created step and a step whose reminder
 * fields were left untouched behave the same way.
 */
export const reminderDefaults = {
	interval: 604800,
	delay: 259200,
	subject: 'Erinnerung: Du hast eine anstehende Aufgabe',
	message: 'Du hast eine anstehende Aufgabe.',
} as const
