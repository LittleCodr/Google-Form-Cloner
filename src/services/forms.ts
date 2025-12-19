import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { formsData } from '../data/forms'
import type {
  FormDefinition,
  FormField,
  FormFieldOption,
  FormResponse,
  FormSection,
  QuizScoring,
} from '../types/forms'

const FIELD_TYPES = new Set(['short_text', 'long_text', 'radio', 'checkbox', 'dropdown'])
const FALLBACK_STORAGE_KEY = 'gfc-local-responses'

type FallbackResponse = {
  id: string
  answers: Record<string, unknown>
  submittedAt: string
  scoring?: QuizScoring
}

type FallbackBucket = Record<string, FallbackResponse[]>

const memoryFallback = new Map<string, FallbackResponse[]>()

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date) {
      return value
    }

    const result: Record<string, unknown> = {}
    Object.entries(value as Record<string, unknown>).forEach(([key, current]) => {
      if (current === undefined) {
        return
      }
      result[key] = stripUndefinedDeep(current)
    })
    return result as unknown as T
  }

  return value
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function loadFallbackBucket(): FallbackBucket {
  if (!isBrowser()) {
    const entries: FallbackBucket = {}
    memoryFallback.forEach((value, key) => {
      entries[key] = [...value]
    })
    return entries
  }

  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch (err) {
    console.warn('Unable to read fallback responses from storage.', err)
    return {}
  }
}

function saveFallbackBucket(bucket: FallbackBucket): void {
  if (!isBrowser()) {
    Object.entries(bucket).forEach(([formId, responses]) => {
      memoryFallback.set(formId, [...responses])
    })
    return
  }

  try {
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(bucket))
  } catch (err) {
    console.warn('Unable to persist fallback responses to storage.', err)
  }
}

function appendFallbackResponse(
  formId: string,
  answers: Record<string, unknown>,
  scoring?: QuizScoring,
): void {
  const bucket = loadFallbackBucket()
  const responseList = bucket[formId] ?? []
  responseList.unshift({
    id: `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    answers,
    submittedAt: new Date().toISOString(),
    scoring,
  })
  bucket[formId] = responseList
  saveFallbackBucket(bucket)
}

function readFallbackResponses(formId: string): FormResponse[] {
  const bucket = loadFallbackBucket()
  const items = bucket[formId] ?? memoryFallback.get(formId) ?? []

  return items
    .map<FormResponse>((entry) => ({
      id: entry.id,
      answers: entry.answers,
      submittedAt: entry.submittedAt ? new Date(entry.submittedAt) : undefined,
      scoring: entry.scoring,
    }))
    .sort((a, b) => {
      const aTime = a.submittedAt ? a.submittedAt.getTime() : 0
      const bTime = b.submittedAt ? b.submittedAt.getTime() : 0
      return bTime - aTime
    })
}

const sortedForms = [...formsData].sort((a, b) => {
  const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
  const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
  return orderA - orderB
})

const formsById = new Map(sortedForms.map((form) => [form.id, form]))

function cloneOptions(options?: FormFieldOption[]): FormFieldOption[] | undefined {
  return options ? options.map((option) => ({ ...option })) : undefined
}

function cloneField(field: FormField): FormField {
  if (!FIELD_TYPES.has(field.type)) {
    throw new Error(`Unknown field type: ${field.type}`)
  }

  return {
    ...field,
    options: cloneOptions(field.options),
  }
}

function cloneSection(section: FormSection): FormSection {
  return {
    ...section,
    fields: section.fields.map((field) => cloneField(field)),
  }
}

function cloneForm(form: FormDefinition): FormDefinition {
  return {
    ...form,
    fields: form.fields.map((field) => cloneField(field)),
    sections: form.sections ? form.sections.map((section) => cloneSection(section)) : undefined,
  }
}

export async function fetchForms(): Promise<FormDefinition[]> {
  return sortedForms.map((form) => cloneForm(form))
}

export async function fetchFormById(formId: string): Promise<FormDefinition | null> {
  const form = formsById.get(formId)
  return form ? cloneForm(form) : null
}

export async function submitFormResponse(
  formId: string,
  answers: Record<string, unknown>,
  scoring?: QuizScoring,
): Promise<void> {
  if (!formsById.has(formId)) {
    throw new Error('Form not found')
  }

  try {
    const responsesRef = collection(db, 'forms', formId, 'responses')
    const sanitizedScoring = scoring ? stripUndefinedDeep(scoring) : undefined

    await addDoc(responsesRef, {
      answers,
      scoring: sanitizedScoring,
      submittedAt: serverTimestamp(),
    })
  } catch (err) {
    console.warn('Falling back to local storage for responses.', err)
    const sanitizedScoring = scoring ? stripUndefinedDeep(scoring) : undefined
    appendFallbackResponse(formId, answers, sanitizedScoring)
  }
}

export async function fetchFormResponses(formId: string): Promise<FormResponse[]> {
  if (!formsById.has(formId)) {
    throw new Error('Form not found')
  }

  let remoteResponses: FormResponse[] = []

  try {
    const responsesRef = collection(db, 'forms', formId, 'responses')
    const responsesQuery = query(responsesRef, orderBy('submittedAt', 'desc'))
    const snapshot = await getDocs(responsesQuery)

    remoteResponses = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as {
        answers?: Record<string, unknown>
        submittedAt?: Timestamp
        scoring?: QuizScoring
      }

      return {
        id: docSnapshot.id,
        answers: data.answers ?? {},
        submittedAt: data.submittedAt ? data.submittedAt.toDate() : undefined,
        scoring: data.scoring,
      }
    })
  } catch (err) {
    console.warn('Reading responses from local fallback store.', err)
  }

  const fallbackResponses = readFallbackResponses(formId)
  const merged = [...fallbackResponses, ...remoteResponses]

  return merged.sort((a, b) => {
    const aTime = a.submittedAt ? a.submittedAt.getTime() : 0
    const bTime = b.submittedAt ? b.submittedAt.getTime() : 0
    return bTime - aTime
  })
}
