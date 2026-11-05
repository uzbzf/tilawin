import { Check, Copy, MoonStar, Share2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { useSound } from '../hooks/useSound'
import { useLocale } from '../i18n/LocaleContext'
import { formatClock } from '../lib/prayer'

const VERSES = {
  ru: [
    {
      ref: '73:1–3',
      ar: 'يَـٰٓأَيُّهَا ٱلْمُزَّمِّلُ ۝ قُمِ ٱلَّيْلَ إِلَّا قَلِيلًۭا ۝ نِّصْفَهُۥٓ أَوِ ٱنقُصْ مِنْهُ قَلِيلًا',
      tr: 'О завернувшийся! Проведи в молитве ночь, кроме небольшой части. Половину ночи или чуть меньше.',
    },
    {
      ref: '73:6',
      ar: 'إِنَّ نَاشِئَةَ ٱلَّيْلِ هِىَ أَشَدُّ وَطْـًۭا وَأَقْوَمُ قِيلًا',
      tr: 'Воистину, молитвы ночью производят более сильное впечатление и ясны для произнесения.',
    },
    {
      ref: '39:9',
      ar: 'أَمَّنْ هُوَ قَـٰنِتٌ ءَانَآءَ ٱلَّيْلِ سَاجِدًۭا وَقَآئِمًۭا يَحْذَرُ ٱلْـَٔاخِرَةَ وَيَرْجُوا۟ رَحْمَةَ رَبِّهِۦ',
      tr: 'Разве тот, кто смиренно проводит ночные часы в земных поклонах и стоя, страшась Последней жизни и надеясь на милость своего Господа…',
    },
  ],
  en: [
    {
      ref: '73:1–3',
      ar: 'يَـٰٓأَيُّهَا ٱلْمُزَّمِّلُ ۝ قُمِ ٱلَّيْلَ إِلَّا قَلِيلًۭا ۝ نِّصْفَهُۥٓ أَوِ ٱنقُصْ مِنْهُ قَلِيلًا',
      tr: 'O you who wraps himself [in clothing]! Arise [to pray] the night, except for a little — half of it, or subtract from it a little.',
    },
    {
      ref: '73:6',
      ar: 'إِنَّ نَاشِئَةَ ٱلَّيْلِ هِىَ أَشَدُّ وَطْـًۭا وَأَقْوَمُ قِيلًا',
      tr: 'Indeed, the hours of the night are more effective for concurrence [of heart and tongue] and more suitable for words.',
    },
    {
      ref: '39:9',
      ar: 'أَمَّنْ هُوَ قَـٰنِتٌ ءَانَآءَ ٱلَّيْلِ سَاجِدًۭا وَقَآئِمًۭا يَحْذَرُ ٱلْـَٔاخِرَةَ وَيَرْجُوا۟ رَحْمَةَ رَبِّهِۦ',
      tr: 'Is one who is devoutly obedient during periods of the night, prostrating and standing [in prayer], fearing the Hereafter and hoping for the mercy of his Lord…',
    },
  ],
  ar: [
    {
      ref: '٧٣:١–٣',
      ar: 'يَـٰٓأَيُّهَا ٱلْمُزَّمِّلُ ۝ قُمِ ٱلَّيْلَ إِلَّا قَلِيلًۭا ۝ نِّصْفَهُۥٓ أَوِ ٱنقُصْ مِنْهُ قَلِيلًا',
      tr: 'يا أيها المزمل · قم الليل إلا قليلا · نصفه أو انقص منه قليلا',
    },
    {
      ref: '٧٣:٦',
      ar: 'إِنَّ نَاشِئَةَ ٱلَّيْلِ هِىَ أَشَدُّ وَطْـًۭا وَأَقْوَمُ قِيلًا',
      tr: 'إن ناشئة الليل هي أشد وطئا وأقوم قيلا',
    },
    {
      ref: '٣٩:٩',
      ar: 'أَمَّنْ هُوَ قَـٰنِتٌ ءَانَآءَ ٱلَّيْلِ سَاجِدًۭا وَقَآئِمًۭا يَحْذَرُ ٱلْـَٔاخِرَةَ وَيَرْجُوا۟ رَحْمَةَ رَبِّهِۦ',
      tr: 'أمن هو قانت آناء الليل ساجدا وقائما يحذر الآخرة ويرجو رحمة ربه',
    },
  ],
}

function versesFor(lang) {
  if (lang === 'ar') return VERSES.ar
  if (lang === 'en') return VERSES.en
  return VERSES.ru
}

export function TahajjudCard() {
  const { t, lang } = useLocale()
  const { click, success } = useSound()
  const geo = useGeolocation()
  const { schedule } = usePrayerTimes(geo.lat, geo.lng)
  const [copied, setCopied] = useState(null)
  const [verseIndex, setVerseIndex] = useState(0)

  const verses = useMemo(() => versesFor(lang), [lang])
  const verse = verses[verseIndex % verses.length]
  const tahajjud = schedule?.times?.tahajjud
  const maghrib = schedule?.times?.maghrib
  const fajr = schedule?.times?.fajr

  const shareText = useMemo(() => {
    const lines = [
      verse.ar,
      '',
      verse.tr,
      `— ${t('prayer.tahajjudQuran')} ${verse.ref}`,
      '',
      'TILAWIN',
    ]
    return lines.join('\n')
  }, [verse, t])

  const copyVerse = async () => {
    click()
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied('copy')
      success()
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      /* ignore */
    }
  }

  const shareVerse = async () => {
    click()
    try {
      if (navigator.share) {
        await navigator.share({ title: t('prayer.tahajjudTitle'), text: shareText })
        setCopied('share')
        success()
        window.setTimeout(() => setCopied(null), 1600)
        return
      }
      await copyVerse()
    } catch {
      /* user cancelled */
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl p-5"
      aria-label={t('prayer.tahajjudTitle')}
    >
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
          <MoonStar size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            {t('prayer.tahajjudBadge')}
          </p>
          <h3 className="mt-0.5 font-display text-2xl text-[var(--text)]">{t('prayer.tahajjudTitle')}</h3>
        </div>
      </div>

      <div className="relative mb-4 rounded-2xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 backdrop-blur-md">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {t('prayer.tahajjudWindow')}
        </p>
        <p className="mt-1 font-display text-3xl tracking-wide text-gold-bright">
          {tahajjud ? formatClock(tahajjud, schedule?.timeZone) : '—:—'}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          {t('prayer.tahajjudCalcHint')}
          {maghrib && fajr
            ? ` · ${formatClock(maghrib, schedule?.timeZone)} → ${formatClock(fajr, schedule?.timeZone)}`
            : ''}
        </p>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">{t('prayer.tahajjudDesc')}</p>

      <div className="rounded-2xl border border-[var(--glass-border)] bg-white/5 p-4 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            {t('prayer.tahajjudQuran')} · {verse.ref}
          </p>
          <div className="flex gap-1">
            {verses.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}`}
                onClick={() => {
                  click()
                  setVerseIndex(i)
                }}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === verseIndex % verses.length ? 'bg-gold' : 'bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={verse.ref}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
          >
            <p className="font-quran text-[1.35rem] leading-[2] text-[var(--text)]" dir="rtl">
              {verse.ar}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{verse.tr}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyVerse}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-white/10 px-3 py-2.5 text-xs text-[var(--text)] sm:flex-none"
          >
            {copied === 'copy' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'copy' ? t('prayer.copied') : t('prayer.copyAyah')}
          </button>
          <button
            type="button"
            onClick={shareVerse}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gold/20 px-3 py-2.5 text-xs text-[var(--text)] sm:flex-none"
          >
            <Share2 size={14} />
            {t('prayer.shareAyah')}
          </button>
        </div>
      </div>
    </motion.section>
  )
}
