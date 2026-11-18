import { crc32, inflateRawSync } from 'node:zlib'

export interface ZipEntry {
	name: string
	content: Buffer
}

export interface ZipLimits {
	// Upper bound for the uncompressed size of a single file
	maxEntrySize: number
	// Upper bound for the uncompressed size of all files together
	maxTotalSize: number
	maxEntries: number
}

const endOfCentralDirectorySignature = 0x06054b50
const centralDirectorySignature = 0x02014b50
const localHeaderSignature = 0x04034b50

/**
 * Tells whether the data starts like a ZIP archive.
 *
 * @param data - The uploaded data
 * @returns Whether it is a ZIP archive
 */
export function isZip(data: Buffer) {
	return data.length >= 4 && (
		data.readUInt32LE(0) === localHeaderSignature ||
		data.readUInt32LE(0) === endOfCentralDirectorySignature
	)
}

function fail(message: string): never {
	throw createError({
		statusCode: 400,
		statusMessage: message,
	})
}

function findEndOfCentralDirectory(data: Buffer) {
	// The record is 22 bytes long, followed by a comment of at most 64 KiB.
	const start = Math.max(0, data.length - 22 - 0xffff)
	for(let offset = data.length - 22; offset >= start; offset--) {
		if(data.readUInt32LE(offset) === endOfCentralDirectorySignature) {
			return offset
		}
	}

	fail('Die ZIP-Datei ist beschädigt')
}

/**
 * Reads the files of a ZIP archive.
 *
 * Only what archives of bank statements need is supported: files that are
 * stored or deflated, without encryption and without ZIP64. The limits are
 * enforced on the actual uncompressed data, not on the sizes the archive
 * claims.
 *
 * @param data - The archive
 * @param limits - Limits against archives that unpack to excessive sizes
 * @returns The files of the archive, without directories
 */
export function readZip(data: Buffer, limits: ZipLimits): ZipEntry[] {
	if(data.length < 22) {
		fail('Die ZIP-Datei ist beschädigt')
	}

	try {
		const end = findEndOfCentralDirectory(data)
		const count = data.readUInt16LE(end + 10)
		let offset = data.readUInt32LE(end + 16)

		if(count === 0xffff || offset === 0xffffffff) {
			fail('ZIP64-Archive werden nicht unterstützt')
		}

		if(count > limits.maxEntries) {
			fail(`Die ZIP-Datei enthält mehr als ${limits.maxEntries} Dateien`)
		}

		const entries: ZipEntry[] = []
		let totalSize = 0

		for(let index = 0; index < count; index++) {
			if(data.readUInt32LE(offset) !== centralDirectorySignature) {
				fail('Die ZIP-Datei ist beschädigt')
			}

			const flags = data.readUInt16LE(offset + 8)
			const method = data.readUInt16LE(offset + 10)
			const checksum = data.readUInt32LE(offset + 16)
			const compressedSize = data.readUInt32LE(offset + 20)
			const nameLength = data.readUInt16LE(offset + 28)
			const extraLength = data.readUInt16LE(offset + 30)
			const commentLength = data.readUInt16LE(offset + 32)
			const localOffset = data.readUInt32LE(offset + 42)
			const name = data
				.subarray(offset + 46, offset + 46 + nameLength)
				// Bit 11 marks UTF-8 names, others are in code page 437. The name
				// only serves to tell the files apart in messages.
				.toString(flags & 0x800 ? 'utf8' : 'latin1')

			offset += 46 + nameLength + extraLength + commentLength

			if(name.endsWith('/')) {
				continue
			}

			if(flags & 0x1) {
				fail(`Die Datei ${name} in der ZIP-Datei ist verschlüsselt`)
			}

			if(data.readUInt32LE(localOffset) !== localHeaderSignature) {
				fail('Die ZIP-Datei ist beschädigt')
			}

			const start = localOffset + 30 +
				data.readUInt16LE(localOffset + 26) +
				data.readUInt16LE(localOffset + 28)
			if(start + compressedSize > data.length) {
				fail('Die ZIP-Datei ist beschädigt')
			}

			const compressed = data.subarray(start, start + compressedSize)
			const remaining = Math.min(limits.maxEntrySize, limits.maxTotalSize - totalSize)

			let content: Buffer
			if(method === 0) {
				content = compressed
			} else if(method === 8) {
				try {
					content = inflateRawSync(compressed, { maxOutputLength: remaining + 1 })
				} catch(_error) {
					fail(`Die Datei ${name} in der ZIP-Datei ist beschädigt oder zu groß`)
				}
			} else {
				fail(`Die Datei ${name} in der ZIP-Datei nutzt ein nicht unterstütztes Packverfahren`)
			}

			if(content.length > remaining) {
				fail(content.length > limits.maxEntrySize
					? `Die Datei ${name} in der ZIP-Datei ist größer als erlaubt`
					: 'Der Inhalt der ZIP-Datei ist größer als erlaubt')
			}

			if(crc32(content) !== checksum) {
				fail(`Die Datei ${name} in der ZIP-Datei ist beschädigt`)
			}

			totalSize += content.length
			entries.push({ name, content })
		}

		return entries
	} catch(error) {
		// Reading beyond the end of the data means the offsets are broken.
		if(error instanceof RangeError) {
			fail('Die ZIP-Datei ist beschädigt')
		}
		throw error
	}
}
