export const verses = {
  calm: {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    ref: '13:28',
    keywords: ['покой', 'тревога', 'спокойствие', 'zikr', 'peace', 'calm', 'tinchlik', 'orom'],
    surah: { ru: 'Ар-Ра‘д', uz: 'Ar-Ra’d', en: 'Ar-Ra’d' },
    text: {
      ru: 'Воистину, в поминании Аллаха обретают покой сердца.',
      uz: 'Albatta, Allohni zikr qilish bilan qalblar orom topadi.',
      en: 'Surely in the remembrance of Allah do hearts find rest.',
    },
  },
  hope: {
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    ref: '94:5',
    keywords: ['надежда', 'грусть', 'трудность', 'hope', 'ease', 'umid', 'qiyinchilik'],
    surah: { ru: 'Аш-Шарх', uz: 'Ash-Sharh', en: 'Ash-Sharh' },
    text: {
      ru: 'Воистину, за трудностью следует лёгкость.',
      uz: 'Albatta, har qiyinchilik bilan birga osonlik ham bordir.',
      en: 'For indeed, with hardship comes ease.',
    },
  },
  gratitude: {
    arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    ref: '14:7',
    keywords: ['благодарность', 'шукр', 'grateful', 'thanks', 'shukr', 'minnatdorlik'],
    surah: { ru: 'Ибрахим', uz: 'Ibrohim', en: 'Ibrahim' },
    text: {
      ru: 'Если вы будете благодарны, Я непременно умножу вам.',
      uz: 'Agar shukr qilsangiz, albatta (ne’matni) ziyoda qilaman.',
      en: 'If you are grateful, I will surely increase you [in favor].',
    },
  },
  inspire: {
    arabic: 'وَإِلَىٰ رَبِّكَ فَارْغَبْ',
    ref: '94:8',
    keywords: ['мотивация', 'вдохновение', 'стремление', 'inspire', 'motivation', 'ilhom'],
    surah: { ru: 'Аш-Шарх', uz: 'Ash-Sharh', en: 'Ash-Sharh' },
    text: {
      ru: 'И к Господу своему устремись.',
      uz: 'Va Rabbiga intil.',
      en: 'And to your Lord direct your longing.',
    },
  },
  patience: {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    ref: '2:153',
    keywords: ['терпение', 'сабр', 'patience', 'sabr', 'sabr'],
    surah: { ru: 'Аль-Бакара', uz: 'Al-Baqara', en: 'Al-Baqarah' },
    text: {
      ru: 'Воистину, Аллах — с терпеливыми.',
      uz: 'Albatta, Alloh sabrlilar bilan birgadir.',
      en: 'Indeed, Allah is with the patient.',
    },
  },
  light: {
    arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
    ref: '24:35',
    keywords: ['свет', 'нур', 'light', 'nur', 'yorug'],
    surah: { ru: 'Ан-Нур', uz: 'An-Nur', en: 'An-Nur' },
    text: {
      ru: 'Аллах — свет небес и земли.',
      uz: 'Alloh osmonlar va yerning nuridir.',
      en: 'Allah is the Light of the heavens and the earth.',
    },
  },
}

export const verseList = Object.entries(verses).map(([id, verse]) => ({ id, ...verse }))

export function searchVerses(query, lang = 'ru') {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return verseList.filter((verse) => {
    const hay = [
      verse.ref,
      verse.arabic,
      verse.text.ru,
      verse.text.uz,
      verse.text.en,
      verse.surah.ru,
      verse.surah.uz,
      verse.surah.en,
      ...(verse.keywords || []),
      verse.text[lang],
      verse.surah[lang],
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}
