export type FormFieldType = 'short_text' | 'long_text' | 'radio' | 'checkbox'

export interface FormFieldOption {
  id: string
  label: string
  value: string
}

export interface FormField {
  id: string
  label: string
  helperText?: string
  type: FormFieldType
  required?: boolean
  options?: FormFieldOption[]
}

export interface FormDefinition {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order?: number
}

export interface FormResponse {
  id: string
  answers: Record<string, unknown>
  submittedAt?: Date
}
