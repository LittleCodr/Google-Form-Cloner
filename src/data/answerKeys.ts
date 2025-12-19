import type { FormDefinition } from '../types/forms'

export type AnswerKey = Record<string, string | string[]>

export const quizAnswerKeys: Record<string, AnswerKey> = {
  'grade-4-math-quiz-ramanujan-day': {
    q1: '5',
    q2: '100',
    q3: '99',
    q4: '100',
    q5: '60010',
    q6: 'C',
    q7: 'X',
    q8: '60',
    q9: '9',
    q10: '4210',
    q11: '22 दिसम्बर',
    q12: 'V',
    q13: '1',
    q14: '9',
    q15: '70 मिनट',
    q16: '125',
    q17: '998',
    q18: '1000 मिलीलीटर',
    q19: '9',
    q20: '366',
    q21: '14:00 बजे',
    q22: 'भारत',
    q23: '6761',
    q24: '17',
    q25: '2432',
  },
  'grade-5-math-quiz-ramanujan-day': {
    q1: '1001',
    q2: '10589',
    q3: '22 दिसम्बर',
    q4: '22 दिसम्बर 1887',
    q5: '120',
    q6: '96',
    q7: 'क्रयमूल्य',
    q8: '9999',
    q9: '999',
    q10: '18',
    q11: '20',
    q12: '95',
    q13: '46',
    q14: '200',
    q15: '3600 सेकंड',
    q16: '365',
    q17: 'भारत मे',
    q18: 'X',
    q19: '870',
    q20: '90',
    q21: '180',
    q22: 'तीन',
    q23: 'एक जैसे',
    q24: '5623',
    q25: '5445',
  },
}

export function getAnswerKey(form: FormDefinition): AnswerKey | null {
  return quizAnswerKeys[form.id] ?? null
}
