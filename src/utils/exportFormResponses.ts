import * as XLSX from 'xlsx'
import type { FormDefinition, FormResponse } from '../types/forms'

interface ExportConfig {
  formDefinition: FormDefinition
  responses: FormResponse[]
  dateFormatter?: Intl.DateTimeFormat
}

const defaultDateFormatter = new Intl.DateTimeFormat('hi-IN', {
  dateStyle: 'medium',
  import * as XLSX from 'xlsx'
  import type { FormDefinition, FormResponse } from '../types/forms'

  interface ExportConfig {
    formDefinition: FormDefinition
    responses: FormResponse[]
    dateFormatter?: Intl.DateTimeFormat
  }

  const defaultDateFormatter = new Intl.DateTimeFormat('hi-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  // Keep filenames filesystem-friendly for consistent downloads
  const sanitizeFileName = (input: string) => input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

  const formatAnswer = (answer: unknown): string => {
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }

    if (typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean') {
      return String(answer)
    }

    if (answer === null || answer === undefined) {
      return ''
    }

    return JSON.stringify(answer)
  }

  export const exportResponsesToWorkbook = ({
    formDefinition,
    responses,
    dateFormatter = defaultDateFormatter,
  }: ExportConfig) => {
    if (!responses.length) {
      return
    }

    const headers = [
      'Submission Time',
      ...formDefinition.fields.map((field) => field.label),
    ]

    const rows = responses.map((response) => {
      const submittedAt = response.submittedAt ? dateFormatter.format(response.submittedAt) : ''
      const fieldValues = formDefinition.fields.map((field) => formatAnswer(response.answers[field.id]))

      return [submittedAt, ...fieldValues]
    })

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses')

    const baseFileName = sanitizeFileName(formDefinition.title) || 'form-responses'
    const fileName = `${baseFileName}-${new Date().toISOString().split('T')[0]}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }
