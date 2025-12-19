import { getAnswerKey } from '../data/answerKeys'
import type { FieldEvaluation, FormDefinition, FormField, QuizScoring } from '../types/forms'

const SUPPORTED_TYPES = new Set(['radio', 'checkbox', 'dropdown', 'short_text', 'long_text'])

function collectQuizFields(form: FormDefinition): FormField[] {
  const byId = new Map<string, FormField>()

  const registerField = (field: FormField) => {
    if (!SUPPORTED_TYPES.has(field.type)) {
      return
    }
    if (!byId.has(field.id)) {
      byId.set(field.id, field)
    }
  }

  form.fields.forEach(registerField)

  form.sections?.forEach((section) => {
    section.fields.forEach(registerField)
  })

  return Array.from(byId.values())
}

function normalizeToString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value).trim()
  }

  return ''
}

function normalizeToArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeToString(entry)).filter((entry) => entry.length > 0)
  }

  const asString = normalizeToString(value)
  return asString ? [asString] : []
}

function compareAnswers(field: FormField, expected: string | string[], given: unknown): boolean {
  if (Array.isArray(expected)) {
    const expectedSet = new Set(expected.map((entry) => normalizeToString(entry).toLowerCase()))
    const givenValues = normalizeToArray(given).map((entry) => entry.toLowerCase())

    if (expectedSet.size !== givenValues.length) {
      return false
    }

    return givenValues.every((entry) => expectedSet.has(entry))
  }

  const normalizedExpected = normalizeToString(expected).toLowerCase()

  if (field.type === 'checkbox') {
    const givenValues = normalizeToArray(given)
    return givenValues.length === 1 && givenValues[0].toLowerCase() === normalizedExpected
  }

  return normalizeToString(given).toLowerCase() === normalizedExpected
}

function buildEvaluation(
  field: FormField,
  expected: string | string[] | undefined,
  answers: Record<string, unknown>,
): FieldEvaluation {
  const rawAnswer = answers[field.id]

  if (expected === undefined) {
    return {
      fieldId: field.id,
      isCorrect: false,
      awardedScore: 0,
      maxScore: 0,
      correctAnswer: undefined,
      userAnswer: Array.isArray(rawAnswer)
        ? normalizeToArray(rawAnswer)
        : normalizeToString(rawAnswer) || undefined,
      feedback: 'उत्तर कुंजी उपलब्ध नहीं है।',
    }
  }

  const isCorrect = compareAnswers(field, expected, rawAnswer)
  const userAnswer = Array.isArray(rawAnswer)
    ? normalizeToArray(rawAnswer)
    : normalizeToString(rawAnswer) || undefined

  return {
    fieldId: field.id,
    isCorrect,
    awardedScore: isCorrect ? 1 : 0,
    maxScore: 1,
    correctAnswer: expected,
    userAnswer,
  }
}

export async function evaluateQuizSubmission(
  form: FormDefinition,
  answers: Record<string, unknown>,
): Promise<QuizScoring> {
  const answerKey = getAnswerKey(form)
  const quizFields = collectQuizFields(form)

  if (!answerKey) {
    const evaluations = quizFields.map((field) => buildEvaluation(field, undefined, answers))
    return {
      totalScore: 0,
      maxScore: 0,
      evaluations,
    }
  }

  const keyedFields = quizFields.filter((field) => answerKey[field.id] !== undefined)

  const evaluations = keyedFields.map((field) => buildEvaluation(field, answerKey[field.id], answers))
  const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.awardedScore, 0)

  return {
    totalScore,
    maxScore: evaluations.length,
    evaluations,
  }
}
