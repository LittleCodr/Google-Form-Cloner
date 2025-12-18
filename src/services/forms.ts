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
import type { FormDefinition, FormField, FormFieldOption, FormResponse } from '../types/forms'

const FIELD_TYPES = new Set(['short_text', 'long_text', 'radio', 'checkbox'])

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

function cloneForm(form: FormDefinition): FormDefinition {
  return {
    ...form,
    fields: form.fields.map((field) => cloneField(field)),
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
): Promise<void> {
  if (!formsById.has(formId)) {
    throw new Error('Form not found')
  }

  const responsesRef = collection(db, 'forms', formId, 'responses')
  await addDoc(responsesRef, {
    answers,
    submittedAt: serverTimestamp(),
  })
}

export async function fetchFormResponses(formId: string): Promise<FormResponse[]> {
  if (!formsById.has(formId)) {
    throw new Error('Form not found')
  }

  const responsesRef = collection(db, 'forms', formId, 'responses')
  const responsesQuery = query(responsesRef, orderBy('submittedAt', 'desc'))
  const snapshot = await getDocs(responsesQuery)

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as {
      answers?: Record<string, unknown>
      submittedAt?: Timestamp
    }

    return {
      id: docSnapshot.id,
      answers: data.answers ?? {},
      submittedAt: data.submittedAt ? data.submittedAt.toDate() : undefined,
    }
  })
}
