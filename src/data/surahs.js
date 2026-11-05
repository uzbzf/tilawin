/** 114 surahs — smart search by number, Arabic, transliteration, RU/EN */
export const surahs = [
  { n: 1, ayahs: 7, ar: 'الفاتحة', tr: 'Al-Fatihah', ru: 'Аль-Фатиха', en: 'The Opening' },
  { n: 2, ayahs: 286, ar: 'البقرة', tr: 'Al-Baqarah', ru: 'Аль-Бакара', en: 'The Cow' },
  { n: 3, ayahs: 200, ar: 'آل عمران', tr: 'Ali ‘Imran', ru: 'Аль ‘Имран', en: 'Family of Imran' },
  { n: 4, ayahs: 176, ar: 'النساء', tr: 'An-Nisa', ru: 'Ан-Ниса', en: 'The Women' },
  { n: 5, ayahs: 120, ar: 'المائدة', tr: 'Al-Ma’idah', ru: 'Аль-Маида', en: 'The Table Spread' },
  { n: 6, ayahs: 165, ar: 'الأنعام', tr: 'Al-An‘am', ru: 'Аль-Ан‘ам', en: 'The Cattle' },
  { n: 7, ayahs: 206, ar: 'الأعراف', tr: 'Al-A‘raf', ru: 'Аль-А‘раф', en: 'The Heights' },
  { n: 8, ayahs: 75, ar: 'الأنفال', tr: 'Al-Anfal', ru: 'Аль-Анфаль', en: 'The Spoils' },
  { n: 9, ayahs: 129, ar: 'التوبة', tr: 'At-Tawbah', ru: 'Ат-Тауба', en: 'The Repentance' },
  { n: 10, ayahs: 109, ar: 'يونس', tr: 'Yunus', ru: 'Юнус', en: 'Jonah' },
  { n: 11, ayahs: 123, ar: 'هود', tr: 'Hud', ru: 'Худ', en: 'Hud' },
  { n: 12, ayahs: 111, ar: 'يوسف', tr: 'Yusuf', ru: 'Юсуф', en: 'Joseph' },
  { n: 13, ayahs: 43, ar: 'الرعد', tr: 'Ar-Ra‘d', ru: 'Ар-Ра‘д', en: 'The Thunder' },
  { n: 14, ayahs: 52, ar: 'إبراهيم', tr: 'Ibrahim', ru: 'Ибрахим', en: 'Abraham' },
  { n: 15, ayahs: 99, ar: 'الحجر', tr: 'Al-Hijr', ru: 'Аль-Хиджр', en: 'The Rocky Tract' },
  { n: 16, ayahs: 128, ar: 'النحل', tr: 'An-Nahl', ru: 'Ан-Нахль', en: 'The Bee' },
  { n: 17, ayahs: 111, ar: 'الإسراء', tr: 'Al-Isra', ru: 'Аль-Исра', en: 'The Night Journey' },
  { n: 18, ayahs: 110, ar: 'الكهف', tr: 'Al-Kahf', ru: 'Аль-Кахф', en: 'The Cave' },
  { n: 19, ayahs: 98, ar: 'مريم', tr: 'Maryam', ru: 'Марьям', en: 'Mary' },
  { n: 20, ayahs: 135, ar: 'طه', tr: 'Ta-Ha', ru: 'Та Ха', en: 'Ta-Ha' },
  { n: 21, ayahs: 112, ar: 'الأنبياء', tr: 'Al-Anbiya', ru: 'Аль-Анбия', en: 'The Prophets' },
  { n: 22, ayahs: 78, ar: 'الحج', tr: 'Al-Hajj', ru: 'Аль-Хадж', en: 'The Pilgrimage' },
  { n: 23, ayahs: 118, ar: 'المؤمنون', tr: 'Al-Mu’minun', ru: 'Аль-Муминун', en: 'The Believers' },
  { n: 24, ayahs: 64, ar: 'النور', tr: 'An-Nur', ru: 'Ан-Нур', en: 'The Light' },
  { n: 25, ayahs: 77, ar: 'الفرقان', tr: 'Al-Furqan', ru: 'Аль-Фуркан', en: 'The Criterion' },
  { n: 26, ayahs: 227, ar: 'الشعراء', tr: 'Ash-Shu‘ara', ru: 'Аш-Шу‘ара', en: 'The Poets' },
  { n: 27, ayahs: 93, ar: 'النمل', tr: 'An-Naml', ru: 'Ан-Намль', en: 'The Ant' },
  { n: 28, ayahs: 88, ar: 'القصص', tr: 'Al-Qasas', ru: 'Аль-Касас', en: 'The Stories' },
  { n: 29, ayahs: 69, ar: 'العنكبوت', tr: 'Al-‘Ankabut', ru: 'Аль-‘Анкабут', en: 'The Spider' },
  { n: 30, ayahs: 60, ar: 'الروم', tr: 'Ar-Rum', ru: 'Ар-Рум', en: 'The Romans' },
  { n: 31, ayahs: 34, ar: 'لقمان', tr: 'Luqman', ru: 'Лукман', en: 'Luqman' },
  { n: 32, ayahs: 30, ar: 'السجدة', tr: 'As-Sajdah', ru: 'Ас-Сажда', en: 'The Prostration' },
  { n: 33, ayahs: 73, ar: 'الأحزاب', tr: 'Al-Ahzab', ru: 'Аль-Ахзаб', en: 'The Combined Forces' },
  { n: 34, ayahs: 54, ar: 'سبإ', tr: 'Saba', ru: 'Саба’', en: 'Sheba' },
  { n: 35, ayahs: 45, ar: 'فاطر', tr: 'Fatir', ru: 'Фатыр', en: 'The Originator' },
  { n: 36, ayahs: 83, ar: 'يس', tr: 'Ya-Sin', ru: 'Йа Син', en: 'Ya-Sin' },
  { n: 37, ayahs: 182, ar: 'الصافات', tr: 'As-Saffat', ru: 'Ас-Саффат', en: 'Those Lined Up' },
  { n: 38, ayahs: 88, ar: 'ص', tr: 'Sad', ru: 'Сад', en: 'Sad' },
  { n: 39, ayahs: 75, ar: 'الزمر', tr: 'Az-Zumar', ru: 'Аз-Зумар', en: 'The Troops' },
  { n: 40, ayahs: 85, ar: 'غافر', tr: 'Ghafir', ru: 'Гафир', en: 'The Forgiver' },
  { n: 41, ayahs: 54, ar: 'فصلت', tr: 'Fussilat', ru: 'Фуссилат', en: 'Explained in Detail' },
  { n: 42, ayahs: 53, ar: 'الشورى', tr: 'Ash-Shura', ru: 'Аш-Шура', en: 'The Consultation' },
  { n: 43, ayahs: 89, ar: 'الزخرف', tr: 'Az-Zukhruf', ru: 'Аз-Зухруф', en: 'The Ornaments' },
  { n: 44, ayahs: 59, ar: 'الدخان', tr: 'Ad-Dukhan', ru: 'Ад-Духан', en: 'The Smoke' },
  { n: 45, ayahs: 37, ar: 'الجاثية', tr: 'Al-Jathiyah', ru: 'Аль-Джасия', en: 'The Kneeling' },
  { n: 46, ayahs: 35, ar: 'الأحقاف', tr: 'Al-Ahqaf', ru: 'Аль-Ахкаф', en: 'The Wind-Curved Sandhills' },
  { n: 47, ayahs: 38, ar: 'محمد', tr: 'Muhammad', ru: 'Мухаммад', en: 'Muhammad' },
  { n: 48, ayahs: 29, ar: 'الفتح', tr: 'Al-Fath', ru: 'Аль-Фатх', en: 'The Victory' },
  { n: 49, ayahs: 18, ar: 'الحجرات', tr: 'Al-Hujurat', ru: 'Аль-Худжурат', en: 'The Rooms' },
  { n: 50, ayahs: 45, ar: 'ق', tr: 'Qaf', ru: 'Каф', en: 'Qaf' },
  { n: 51, ayahs: 60, ar: 'الذاريات', tr: 'Adh-Dhariyat', ru: 'Аз-Зарият', en: 'The Winnowing Winds' },
  { n: 52, ayahs: 49, ar: 'الطور', tr: 'At-Tur', ru: 'Ат-Тур', en: 'The Mount' },
  { n: 53, ayahs: 62, ar: 'النجم', tr: 'An-Najm', ru: 'Ан-Наджм', en: 'The Star' },
  { n: 54, ayahs: 55, ar: 'القمر', tr: 'Al-Qamar', ru: 'Аль-Камар', en: 'The Moon' },
  { n: 55, ayahs: 78, ar: 'الرحمن', tr: 'Ar-Rahman', ru: 'Ар-Рахман', en: 'The Beneficent' },
  { n: 56, ayahs: 96, ar: 'الواقعة', tr: 'Al-Waqi‘ah', ru: 'Аль-Ваки‘а', en: 'The Inevitable' },
  { n: 57, ayahs: 29, ar: 'الحديد', tr: 'Al-Hadid', ru: 'Аль-Хадид', en: 'The Iron' },
  { n: 58, ayahs: 22, ar: 'المجادلة', tr: 'Al-Mujadila', ru: 'Аль-Муджадила', en: 'The Pleading Woman' },
  { n: 59, ayahs: 24, ar: 'الحشر', tr: 'Al-Hashr', ru: 'Аль-Хашр', en: 'The Exile' },
  { n: 60, ayahs: 13, ar: 'الممتحنة', tr: 'Al-Mumtahanah', ru: 'Аль-Мумтахана', en: 'She That Is To Be Examined' },
  { n: 61, ayahs: 14, ar: 'الصف', tr: 'As-Saff', ru: 'Ас-Сафф', en: 'The Ranks' },
  { n: 62, ayahs: 11, ar: 'الجمعة', tr: 'Al-Jumu‘ah', ru: 'Аль-Джуму‘а', en: 'Friday' },
  { n: 63, ayahs: 11, ar: 'المنافقون', tr: 'Al-Munafiqun', ru: 'Аль-Мунафикун', en: 'The Hypocrites' },
  { n: 64, ayahs: 18, ar: 'التغابن', tr: 'At-Taghabun', ru: 'Ат-Тагабун', en: 'Mutual Disillusion' },
  { n: 65, ayahs: 12, ar: 'الطلاق', tr: 'At-Talaq', ru: 'Ат-Талак', en: 'The Divorce' },
  { n: 66, ayahs: 12, ar: 'التحريم', tr: 'At-Tahrim', ru: 'Ат-Тахрим', en: 'The Prohibition' },
  { n: 67, ayahs: 30, ar: 'الملك', tr: 'Al-Mulk', ru: 'Аль-Мульк', en: 'The Sovereignty' },
  { n: 68, ayahs: 52, ar: 'القلم', tr: 'Al-Qalam', ru: 'Аль-Калам', en: 'The Pen' },
  { n: 69, ayahs: 52, ar: 'الحاقة', tr: 'Al-Haqqah', ru: 'Аль-Хакка', en: 'The Reality' },
  { n: 70, ayahs: 44, ar: 'المعارج', tr: 'Al-Ma‘arij', ru: 'Аль-Ма‘аридж', en: 'The Ascending Stairways' },
  { n: 71, ayahs: 28, ar: 'نوح', tr: 'Nuh', ru: 'Нух', en: 'Noah' },
  { n: 72, ayahs: 28, ar: 'الجن', tr: 'Al-Jinn', ru: 'Аль-Джинн', en: 'The Jinn' },
  { n: 73, ayahs: 20, ar: 'المزمل', tr: 'Al-Muzzammil', ru: 'Аль-Муззаммиль', en: 'The Enshrouded One' },
  { n: 74, ayahs: 56, ar: 'المدثر', tr: 'Al-Muddaththir', ru: 'Аль-Муддассир', en: 'The Cloaked One' },
  { n: 75, ayahs: 40, ar: 'القيامة', tr: 'Al-Qiyamah', ru: 'Аль-Кыяма', en: 'The Resurrection' },
  { n: 76, ayahs: 31, ar: 'الانسان', tr: 'Al-Insan', ru: 'Аль-Инсан', en: 'Man' },
  { n: 77, ayahs: 50, ar: 'المرسلات', tr: 'Al-Mursalat', ru: 'Аль-Мурсалят', en: 'The Emissaries' },
  { n: 78, ayahs: 40, ar: 'النبإ', tr: 'An-Naba', ru: 'Ан-Наба’', en: 'The Tidings' },
  { n: 79, ayahs: 46, ar: 'النازعات', tr: 'An-Nazi‘at', ru: 'Ан-Нази‘ат', en: 'Those Who Drag Forth' },
  { n: 80, ayahs: 42, ar: 'عبس', tr: '‘Abasa', ru: 'Абаса', en: 'He Frowned' },
  { n: 81, ayahs: 29, ar: 'التكوير', tr: 'At-Takwir', ru: 'Ат-Таквир', en: 'The Overthrowing' },
  { n: 82, ayahs: 19, ar: 'الإنفطار', tr: 'Al-Infitar', ru: 'Аль-Инфитар', en: 'The Cleaving' },
  { n: 83, ayahs: 36, ar: 'المطففين', tr: 'Al-Mutaffifin', ru: 'Аль-Мутаффифин', en: 'The Defrauding' },
  { n: 84, ayahs: 25, ar: 'الإنشقاق', tr: 'Al-Inshiqaq', ru: 'Аль-Иншикак', en: 'The Sundering' },
  { n: 85, ayahs: 22, ar: 'البروج', tr: 'Al-Buruj', ru: 'Аль-Бурудж', en: 'The Mansions of the Stars' },
  { n: 86, ayahs: 17, ar: 'الطارق', tr: 'At-Tariq', ru: 'Ат-Тарик', en: 'The Morning Star' },
  { n: 87, ayahs: 19, ar: 'الأعلى', tr: 'Al-A‘la', ru: 'Аль-А‘ля', en: 'The Most High' },
  { n: 88, ayahs: 26, ar: 'الغاشية', tr: 'Al-Ghashiyah', ru: 'Аль-Гашия', en: 'The Overwhelming' },
  { n: 89, ayahs: 30, ar: 'الفجر', tr: 'Al-Fajr', ru: 'Аль-Фаджр', en: 'The Dawn' },
  { n: 90, ayahs: 20, ar: 'البلد', tr: 'Al-Balad', ru: 'Аль-Баляд', en: 'The City' },
  { n: 91, ayahs: 15, ar: 'الشمس', tr: 'Ash-Shams', ru: 'Аш-Шамс', en: 'The Sun' },
  { n: 92, ayahs: 21, ar: 'الليل', tr: 'Al-Layl', ru: 'Аль-Ляйл', en: 'The Night' },
  { n: 93, ayahs: 11, ar: 'الضحى', tr: 'Ad-Duha', ru: 'Ад-Духа', en: 'The Morning Hours' },
  { n: 94, ayahs: 8, ar: 'الشرح', tr: 'Ash-Sharh', ru: 'Аш-Шарх', en: 'The Relief' },
  { n: 95, ayahs: 8, ar: 'التين', tr: 'At-Tin', ru: 'Ат-Тин', en: 'The Fig' },
  { n: 96, ayahs: 19, ar: 'العلق', tr: 'Al-‘Alaq', ru: 'Аль-‘Аляк', en: 'The Clot' },
  { n: 97, ayahs: 5, ar: 'القدر', tr: 'Al-Qadr', ru: 'Аль-Кадр', en: 'The Power' },
  { n: 98, ayahs: 8, ar: 'البينة', tr: 'Al-Bayyinah', ru: 'Аль-Баййина', en: 'The Clear Proof' },
  { n: 99, ayahs: 8, ar: 'الزلزلة', tr: 'Az-Zalzalah', ru: 'Аз-Зальзаля', en: 'The Earthquake' },
  { n: 100, ayahs: 11, ar: 'العاديات', tr: 'Al-‘Adiyat', ru: 'Аль-‘Адият', en: 'The Courser' },
  { n: 101, ayahs: 11, ar: 'القارعة', tr: 'Al-Qari‘ah', ru: 'Аль-Кари‘а', en: 'The Calamity' },
  { n: 102, ayahs: 8, ar: 'التكاثر', tr: 'At-Takathur', ru: 'Ат-Такасур', en: 'The Rivalry' },
  { n: 103, ayahs: 3, ar: 'العصر', tr: 'Al-‘Asr', ru: 'Аль-‘Аср', en: 'The Declining Day' },
  { n: 104, ayahs: 9, ar: 'الهمزة', tr: 'Al-Humazah', ru: 'Аль-Хумаза', en: 'The Traducer' },
  { n: 105, ayahs: 5, ar: 'الفيل', tr: 'Al-Fil', ru: 'Аль-Филь', en: 'The Elephant' },
  { n: 106, ayahs: 4, ar: 'قريش', tr: 'Quraysh', ru: 'Курайш', en: 'Quraysh' },
  { n: 107, ayahs: 7, ar: 'الماعون', tr: 'Al-Ma‘un', ru: 'Аль-Ма‘ун', en: 'The Small Kindnesses' },
  { n: 108, ayahs: 3, ar: 'الكوثر', tr: 'Al-Kawthar', ru: 'Аль-Кавсар', en: 'The Abundance' },
  { n: 109, ayahs: 6, ar: 'الكافرون', tr: 'Al-Kafirun', ru: 'Аль-Кафирун', en: 'The Disbelievers' },
  { n: 110, ayahs: 3, ar: 'النصر', tr: 'An-Nasr', ru: 'Ан-Наср', en: 'The Divine Support' },
  { n: 111, ayahs: 5, ar: 'المسد', tr: 'Al-Masad', ru: 'Аль-Масад', en: 'The Palm Fiber' },
  { n: 112, ayahs: 4, ar: 'الإخلاص', tr: 'Al-Ikhlas', ru: 'Аль-Ихлас', en: 'The Sincerity' },
  { n: 113, ayahs: 5, ar: 'الفلق', tr: 'Al-Falaq', ru: 'Аль-Фаляк', en: 'The Daybreak' },
  { n: 114, ayahs: 6, ar: 'الناس', tr: 'An-Nas', ru: 'Ан-Нас', en: 'Mankind' },
]

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘ʻ`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchSurahs(query) {
  const q = normalize(query)
  if (!q) return surahs.slice(0, 12)

  const asNum = Number(q)
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= 114) {
    return surahs.filter((s) => s.n === asNum)
  }

  return surahs
    .map((s) => {
      const hay = normalize(`${s.n} ${s.ar} ${s.tr} ${s.ru} ${s.en}`)
      let score = 0
      if (hay.startsWith(q) || normalize(s.tr).startsWith(q) || normalize(s.ru).startsWith(q)) score += 40
      if (hay.includes(q)) score += 20
      if (normalize(s.tr).includes(q)) score += 15
      if (normalize(s.ru).includes(q)) score += 12
      if (s.ar.includes(query.trim())) score += 25
      return { s, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.s.n - b.s.n)
    .map((item) => item.s)
    .slice(0, 24)
}
