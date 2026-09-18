import { sql } from 'drizzle-orm'
import { check, integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

export const announcements = pgTable('announcements', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	title: varchar({ length: 256 }).notNull(),
	text: varchar({ length: 4096 }).notNull(),
})

/**
 * Angaben für Impressum, Datenschutz- und Barrierefreiheitserklärung.
 *
 * Diese Angaben hängen an der betreibenden Körperschaft, nicht an der
 * Anwendung. Sie werden über die Einstellungen gepflegt und sind bewusst als
 * einzelner Datensatz abgelegt; die Check-Bedingung auf `id` stellt sicher,
 * dass keine zweite Zeile entsteht. Leere Angaben erscheinen auf den Seiten
 * als „noch zu ergänzen“.
 */
export const settings = pgTable('settings', {
	id: integer().notNull().primaryKey().default(1),

	// Impressum (§ 5 DDG)
	providerName: varchar({ length: 256 }).notNull().default(''),
	providerLegalForm: varchar({ length: 256 }).notNull().default(''),
	providerAddress: varchar({ length: 1024 }).notNull().default(''),
	representedBy: varchar({ length: 1024 }).notNull().default(''),
	contactEmail: varchar({ length: 256 }).notNull().default(''),
	contactPhone: varchar({ length: 256 }).notNull().default(''),
	supervisoryAuthority: varchar({ length: 1024 }).notNull().default(''),
	responsibleForContent: varchar({ length: 1024 }).notNull().default(''),
	vatId: varchar({ length: 256 }).notNull().default(''),

	// Datenschutzerklärung (Art. 13 DSGVO)
	privacyController: varchar({ length: 1024 }).notNull().default(''),
	privacyOfficer: varchar({ length: 1024 }).notNull().default(''),
	privacyPurposes: varchar({ length: 4096 }).notNull().default(''),
	privacyRetention: varchar({ length: 4096 }).notNull().default(''),
	privacyRecipients: varchar({ length: 4096 }).notNull().default(''),
	privacyAuthority: varchar({ length: 1024 }).notNull().default(''),

	// Erklärung zur Barrierefreiheit (§ 12b BITV 2.0)
	accessibilityConformance: varchar({ length: 4096 }).notNull().default(''),
	accessibilityNonAccessible: varchar({ length: 4096 }).notNull().default(''),
	accessibilityCreatedAt: varchar({ length: 256 }).notNull().default(''),
	accessibilityReviewedAt: varchar({ length: 256 }).notNull().default(''),
	accessibilityReviewMethod: varchar({ length: 1024 }).notNull().default(''),
	accessibilityFeedbackContact: varchar({ length: 1024 }).notNull().default(''),
	accessibilityArbitrationBody: varchar({ length: 1024 }).notNull().default(''),
	accessibilityEasyLanguage: varchar({ length: 4096 }).notNull().default(''),
	accessibilitySignLanguage: varchar({ length: 4096 }).notNull().default(''),
}, (table) => [
	check('settings_singleton', sql`${table.id} = 1`),
])
