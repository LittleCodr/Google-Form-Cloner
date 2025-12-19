export type FormFieldType = 'short_text' | 'long_text' | 'radio' | 'checkbox' | 'dropdown'

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

export interface FieldEvaluation {
  fieldId: string
  isCorrect: boolean
  awardedScore: number
  maxScore: number
  correctAnswer?: string | string[]
  userAnswer?: string | string[]
  feedback?: string
}

export interface QuizScoring {
  totalScore: number
  maxScore: number
  evaluations: FieldEvaluation[]
}

export interface FormSection {
  id: string
  title?: string
  description?: string
  fields: FormField[]
}

export interface FormDefinition {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order?: number
  sections?: FormSection[]
}

export interface FormResponse {
  id: string
  answers: Record<string, unknown>
  submittedAt?: Date
  scoring?: QuizScoring
}
