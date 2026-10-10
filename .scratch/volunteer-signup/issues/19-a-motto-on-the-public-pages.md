# 19: A motto on the public pages

**What to build:** A short line at the foot of every public page saying what
the app is for — that the mosque is built and kept by the people in it. Three
texts, rotating, each shown in Arabic with a translation in the reader's
language and its source named.

Asked for mid-build: "add a motto or slogan that together we grow and build
mosques (better be authentic hadith or from quran)". Then, offered a choice
between three candidates: "how about all three changing periodically".

**Blocked by:** None.

**Status:** done, pending the mosque's approval of the wording

## The three texts

All three are well known and all three are given with their source on the
page, so a reader can check rather than take the app's word for it.

1. **Qur'an, al-Ma'idah 5:2** — وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى
   "And help one another in righteousness and piety." The one about the
   volunteers themselves and what they are doing on this page.

2. **al-Bukhari 450, Muslim 533** — مَنْ بَنَى لِلَّهِ مَسْجِدًا بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ
   "Whoever builds a mosque for Allah, Allah will build for him the like of it
   in Paradise." Sahih, agreed upon by both. The one about building.

3. **Qur'an, at-Tawbah 9:18** — إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ
   "The mosques of Allah are maintained only by those who believe in Allah and
   the Last Day." The one about عمارة المساجد, maintaining the houses of
   Allah, which is what most of these Tasks actually are.

**The mosque approves the final wording.** Khair already treats the mosque's
name as configuration rather than something the code decides, for the same
reason: this is Al-Madinah Center's voice and not the app's. Scripture on a
page that also asks for a phone number is theirs to sign off, including the
translations.

## How it rotates

**CSS only, no JavaScript.** Every other thing on these pages works with
scripting switched off, and a motto is the last thing that should be the
exception. Three stacked blocks in one grid cell, crossfading on a timer, with
the first one visible as the plain unanimated state: where there is no
animation there is still a motto, just one of them.

**It honours `prefers-reduced-motion`**, where it stops rotating and shows the
first text only. WCAG 2.2.2 asks for a way to pause or stop content that moves
for more than five seconds; reduced-motion is the mechanism here, and hovering
or focusing the band also pauses it. A fully conformant pause button would
need scripting, which is the trade recorded rather than hidden.

- [x] A motto band sits at the foot of every public page
- [x] All three texts rotate on a timer
- [x] Each shows the Arabic, a translation in the reader's language, and its
      source
- [x] The Arabic is marked `lang="ar"` and renders right-to-left even inside
      the English and French pages
- [x] Nothing rotates when the reader has asked for reduced motion, and one
      text still shows
- [x] It works with JavaScript switched off
- [x] It does not push the task list down the page or move it as it rotates
- [x] The Admin view does not have it: it is one reader, doing a job
