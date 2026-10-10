import type { Locale } from "./config";

export type Messages = {
  /** The browser tab and the heading at the top of the public list. */
  pageTitle: string;
  pageIntro: string;
  languageLabel: string;
  noFixedTime: string;
  before: (deadline: string) => string;
  spotsLeft: (remaining: number) => string;
  fullyCovered: string;
  signUp: string;
  emptyTitle: string;
  emptyBody: string;
  notFoundTitle: string;
  notFoundBody: string;
};

const en: Messages = {
  pageTitle: "Where help is needed",
  pageIntro:
    "Pick anything you can manage. Nobody will ask you, and nobody is told what you did not take.",
  languageLabel: "Language",
  noFixedTime: "No fixed time",
  before: (deadline) => `before ${deadline}`,
  spotsLeft: (remaining) => (remaining === 1 ? "1 spot left" : `${remaining} spots left`),
  fullyCovered: "Fully covered",
  signUp: "Sign up",
  emptyTitle: "Nothing needs doing right now",
  emptyBody: "Come back after Jumu'ah, or ask whoever is on the desk what is coming up.",
  notFoundTitle: "That page is not here",
  notFoundBody: "The task may have passed its deadline. The current list is on the front page.",
};

const ar: Messages = {
  pageTitle: "أين تلزم المساعدة",
  pageIntro: "اختر ما تستطيع. لن يسألك أحد، ولا يُخبر أحد بما لم تأخذه.",
  languageLabel: "اللغة",
  noFixedTime: "بلا وقت محدد",
  before: (deadline) => `قبل ${deadline}`,
  spotsLeft: (remaining) => `المتبقي: ${remaining}`,
  fullyCovered: "مكتمل",
  signUp: "التسجيل",
  emptyTitle: "لا يوجد عمل مطلوب الآن",
  emptyBody: "عُد بعد الجمعة، أو اسأل المسؤول عمّا هو قادم.",
  notFoundTitle: "هذه الصفحة غير موجودة",
  notFoundBody: "قد يكون العمل قد انتهى موعده. القائمة الحالية في الصفحة الرئيسية.",
};

const fr: Messages = {
  pageTitle: "Où l'aide est nécessaire",
  pageIntro:
    "Prenez ce que vous pouvez. Personne ne vous sollicitera, et personne ne saura ce que vous n'avez pas pris.",
  languageLabel: "Langue",
  noFixedTime: "Sans horaire fixe",
  before: (deadline) => `avant le ${deadline}`,
  spotsLeft: (remaining) => (remaining === 1 ? "1 place restante" : `${remaining} places restantes`),
  fullyCovered: "Complet",
  signUp: "S'inscrire",
  emptyTitle: "Rien à faire pour le moment",
  emptyBody: "Revenez après la Jumu'ah, ou demandez à la personne à l'accueil ce qui s'annonce.",
  notFoundTitle: "Cette page n'existe pas",
  notFoundBody: "La tâche a peut-être dépassé son échéance. La liste actuelle est sur la page d'accueil.",
};

export const messages: Record<Locale, Messages> = { en, ar, fr };
