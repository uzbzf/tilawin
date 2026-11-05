const METHOD_KEY = 'tilawin-prayer-method'
const ASR_KEY = 'tilawin-asr-madhab'

export const CALC_METHODS = [
  { id: 'mwl', aladhan: 3, label: { ru: 'Muslim World League (MWL)', en: 'Muslim World League (MWL)', ar: 'رابطة العالم الإسلامي' } },
  { id: 'isna', aladhan: 2, label: { ru: 'ISNA (Северная Америка)', en: 'ISNA (North America)', ar: 'إسنا' } },
  { id: 'egypt', aladhan: 5, label: { ru: 'Egyptian General Authority', en: 'Egyptian General Authority', ar: 'هيئة المساحة المصرية' } },
  { id: 'makkah', aladhan: 4, label: { ru: 'Umm al-Qura, Makkah', en: 'Umm al-Qura, Makkah', ar: 'أم القرى' } },
  { id: 'fixedIsha', aladhan: 4, label: { ru: 'Fixed Isha Interval (90 мин)', en: 'Fixed Isha Interval (90 min)', ar: 'عشاء بفاصل ثابت' } },
]

export const ASR_METHODS = [
  { id: 'standard', school: 0, label: { ru: 'Стандартный (Шафии / Малики / Ханбали)', en: 'Standard (Shafi / Maliki / Hanbali)', ar: 'شافعي / مالكي / حنبلي' } },
  { id: 'hanafi', school: 1, label: { ru: 'Ханафитский (тень ×2)', en: 'Hanafi (shadow ×2)', ar: 'حنفي' } },
]

export function readCalcMethod() {
  try {
    const id = localStorage.getItem(METHOD_KEY)
    if (CALC_METHODS.some((m) => m.id === id)) return id
  } catch {
    /* ignore */
  }
  return 'mwl'
}

export function writeCalcMethod(id) {
  try {
    localStorage.setItem(METHOD_KEY, id)
  } catch {
    /* ignore */
  }
}

export function readAsrMadhab() {
  try {
    const id = localStorage.getItem(ASR_KEY)
    if (ASR_METHODS.some((m) => m.id === id)) return id
  } catch {
    /* ignore */
  }
  return 'standard'
}

export function writeAsrMadhab(id) {
  try {
    localStorage.setItem(ASR_KEY, id)
  } catch {
    /* ignore */
  }
}

export function getAladhanParams(methodId = readCalcMethod(), asrId = readAsrMadhab()) {
  const method = CALC_METHODS.find((m) => m.id === methodId) || CALC_METHODS[0]
  const asr = ASR_METHODS.find((m) => m.id === asrId) || ASR_METHODS[0]
  return {
    methodId: method.id,
    method: method.aladhan,
    school: asr.school,
    asrId: asr.id,
    fixedIsha: methodId === 'fixedIsha',
  }
}
