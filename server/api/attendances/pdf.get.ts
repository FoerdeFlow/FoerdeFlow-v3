import { z } from 'zod'
import { jsPDF } from 'jspdf'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		session: z.uuid(),
	}).parseAsync(data))

	const result = await $fetch('/api/attendances', {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
		},
		params: {
			session: query.session,
		},
	})

	const session = result.session
	const participantGroups = result.groups
		.map((group) => ({
			name: group.name,
			participants: group.members.map((member) => ({
				name: formatPerson(member.person),
				status: member.status,
			})),
		}))
	const guests = result.guests.map((guest) => ({
		name: formatPerson(guest.person),
		status: guest.status,
	}))

	const sessionTitle = [
		`${session.organizationItem.code}-Sitzung`,
		formatSessionNumber(session.period, session.number),
	].join(' ')
	const filenameCode = [
		session.organizationItem.code,
		formatSessionNumber(session.period, session.number),
	].join('-')

	// eslint-disable-next-line new-cap
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth()
	const docHeight = doc.internal.pageSize.getHeight()
	const pos = {
		_y: 20,
		_number: 1,
		get y() {
			return this._y
		},
		set y(value) {
			if(value > docHeight - 30) {
				doc.setFont('OpenSans', 'normal')
				doc.setFontSize(14)
				doc.text(this._number.toString(), docWidth / 2, docHeight - 10, { align: 'center' })
				doc.addPage()
				this._number++
				this._y = 30

				doc.setFont('OpenSans', 'italic')
				doc.setFontSize(14)
				doc.text('Anwesenheitsliste', 20, 15, { align: 'left' })
				doc.text(sessionTitle, docWidth - 20, 15, { align: 'right' })
				return
			}
			this._y = value
		},
		finalize() {
			doc.setFont('OpenSans', 'normal')
			doc.setFontSize(12)
			doc.text(this._number.toString(), docWidth / 2, docHeight - 10, { align: 'center' })
		},
	}

	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, pos.y - logoHeight / 2, logoWidth, logoHeight)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(32)
	doc.text('Anwesenheitsliste', 20, pos.y)
	pos.y += 12

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(24)
	doc.text(sessionTitle, 20, pos.y)
	pos.y += 20

	for(const participantGroup of participantGroups) {
		if(pos.y + 12 > docHeight - 42) {
			pos.y = docHeight
		}
		doc.setFont('OpenSans', 'bold')
		doc.setFontSize(16)
		doc.text(participantGroup.name, docWidth / 2, pos.y, { align: 'center' })
		pos.y += 8

		for(const participant of participantGroup.participants) {
			doc.setFont('OpenSans', 'normal')
			doc.setFontSize(12)
			doc.text(participant.name, 20, pos.y, { maxWidth: 75 })

			if(participant.status) {
				doc.setFont('OpenSans', 'italic')
				doc.setFontSize(9)
				doc.text({
					present: '(anwesend)',
					excused: '(entschuldigt)',
					absent: '(fehlt)',
					late: '(verspätet)',
				}[participant.status], docWidth - 20, pos.y + 5, { align: 'right' })
			}

			doc.setLineDashPattern([ 1, 1 ], 0)
			doc.line(100, pos.y + 7, 190, pos.y + 7)
			pos.y += 12
		}
		pos.y += 8
	}

	if(pos.y + 12 > docHeight - 42) {
		pos.y = docHeight
	}
	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(16)
	doc.text('Gäste', docWidth / 2, pos.y, { align: 'center' })
	pos.y += 10

	for(const guest of guests) {
		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(guest.name, 20, pos.y, { maxWidth: 75 })

		if(guest.status) {
			doc.setFont('OpenSans', 'italic')
			doc.setFontSize(9)
			doc.text({
				present: '(anwesend)',
				excused: '(entschuldigt)',
				absent: '(fehlt)',
				late: '(verspätet)',
			}[guest.status], docWidth - 20, pos.y + 5, { align: 'right' })
		}

		doc.setLineDashPattern([ 1, 1 ], 0)
		doc.line(100, pos.y + 7, 190, pos.y + 7)

		pos.y += 15
	}

	for(let i = 0; pos.y < docHeight - 45; i++) {
		doc.setLineDashPattern([], 0)
		doc.line(20, pos.y + 7, 95, pos.y + 7)

		doc.setLineDashPattern([ 1, 1 ], 0)
		doc.line(100, pos.y + 7, 190, pos.y + 7)

		pos.y += 15
	}

	pos.finalize()
	const blob = doc.output('blob')
	setResponseHeader(event, 'Content-Disposition', `inline; filename="${filenameCode}_Anwesenheitsliste.pdf"`)
	return blob
})
