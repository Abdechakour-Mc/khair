import type { Locale } from "./config";

/**
 * What the app is for, in three texts that rotate at the foot of the public
 * pages: the mosque is built and kept by the people in it.
 *
 * Each one names its source on the page, so a reader can check it rather than
 * take the app's word for it. All three are well known: 5:2 is the command to
 * help one another in good, the hadith on building a mosque is agreed upon by
 * al-Bukhari and Muslim, and 9:18 is the verse on maintaining the houses of
 * Allah, which is what most of these Tasks actually are.
 *
 * The final wording belongs to the mosque, not to this file. Khair already
 * treats the mosque's name as configuration for the same reason: scripture on
 * a page that also asks for a phone number is theirs to approve, translations
 * included.
 */
export type Motto = {
  /** The original, shown to every reader whatever language they are reading. */
  arabic: string;
  /** Left out in Arabic, where it would only repeat the line above it. */
  translation?: string;
  source: string;
};

const ar: Motto[] = [
  {
    arabic: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى",
    source: "القرآن، المائدة ٢",
  },
  {
    arabic: "مَنْ بَنَى لِلَّهِ مَسْجِدًا بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ",
    source: "رواه البخاري ٤٥٠ ومسلم ٥٣٣",
  },
  {
    arabic: "إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ",
    source: "القرآن، التوبة ١٨",
  },
];

const en: Motto[] = [
  {
    arabic: ar[0]!.arabic,
    translation: "And help one another in righteousness and piety.",
    source: "Qur'an, al-Ma'idah 5:2",
  },
  {
    arabic: ar[1]!.arabic,
    translation:
      "Whoever builds a mosque for Allah, Allah will build for him the like of it in Paradise.",
    source: "al-Bukhari 450, Muslim 533",
  },
  {
    arabic: ar[2]!.arabic,
    translation:
      "The mosques of Allah are maintained only by those who believe in Allah and the Last Day.",
    source: "Qur'an, at-Tawbah 9:18",
  },
];

const fr: Motto[] = [
  {
    arabic: ar[0]!.arabic,
    translation: "Entraidez-vous dans l'accomplissement du bien et de la piété.",
    source: "Coran, al-Ma'ida 5:2",
  },
  {
    arabic: ar[1]!.arabic,
    translation:
      "Quiconque bâtit une mosquée pour Allah, Allah lui bâtira la pareille au Paradis.",
    source: "al-Bukhari 450, Muslim 533",
  },
  {
    arabic: ar[2]!.arabic,
    translation:
      "Ne prennent soin des mosquées d'Allah que ceux qui croient en Allah et au Jour dernier.",
    source: "Coran, at-Tawba 9:18",
  },
];

export const mottos: Record<Locale, Motto[]> = { en, ar, fr };
