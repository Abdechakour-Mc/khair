import type { ConflictReason, ValidationCode } from "@/core/errors";
import type { Locale } from "./config";

/** Every reason the core can refuse something, said in the reader's language. */
export type ProblemKey = ValidationCode | ConflictReason | "unknown";

export type Messages = {
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

  backToList: string;
  whenLabel: string;
  whereLabel: string;
  neededLabel: string;
  deadlineLabel: string;
  openToLabel: string;
  openToBrothers: string;
  openToSisters: string;
  urgentHeading: string;
  urgentMark: string;
  calendarLabel: string;
  calendarGoogle: string;
  calendarIcs: string;
  helpersNeeded: (count: number) => string;

  nameLabel: string;
  phoneLabel: string;
  phoneHint: string;
  submitting: string;

  closedTitle: string;
  closedBody: string;
  passedTitle: string;
  passedBody: string;
  fullTitle: string;
  fullBody: string;

  confirmedTitle: string;
  confirmedFor: (title: string) => string;
  confirmedKeepLink: string;
  confirmedUnknownTitle: string;
  confirmedUnknownBody: string;

  releaseSlot: string;
  releaseTooLate: string;
  markDone: string;
  markDoneHint: string;
  markedDone: string;
  undoDone: string;
  releasedTitle: string;
  releasedBody: string;
  heldBy: (organisation: string) => string;

  problems: Record<ProblemKey, string>;
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

  backToList: "All tasks",
  whenLabel: "When",
  whereLabel: "Where",
  neededLabel: "Needed",
  deadlineLabel: "Deadline",
  openToLabel: "Who it is for",
  openToBrothers: "Brothers",
  openToSisters: "Sisters",
  urgentHeading: "Needed now",
  urgentMark: "Urgent",
  calendarLabel: "Put it in your calendar",
  calendarGoogle: "Google Calendar",
  calendarIcs: "Apple or Outlook",
  helpersNeeded: (count) => (count === 1 ? "1 helper" : `${count} helpers`),

  nameLabel: "Your name",
  phoneLabel: "Phone number",
  phoneHint: "So the organiser can reach you about this task. It is never shown on this page.",
  submitting: "Signing you up",

  closedTitle: "This task has been called off",
  closedBody: "Nothing is needed here any more. The current list is on the front page.",
  passedTitle: "This task's deadline has passed",
  passedBody: "Thank you for looking. The current list is on the front page.",
  fullTitle: "Every spot is taken",
  fullBody: "Someone may release a spot later, so it is worth looking again.",

  confirmedTitle: "You are on the list",
  confirmedFor: (title) => `You signed up for ${title}.`,
  confirmedKeepLink:
    "Save this page. It is how you release your spot if your plans change, and it works without signing in.",
  confirmedUnknownTitle: "This link does not match a signup",
  confirmedUnknownBody:
    "It may already have been used. The current list is on the front page.",

  heldBy: (organisation) =>
    `${organisation} holds your name and number for this task, and uses them for nothing else.`,
  releaseSlot: "Release my spot",
  markDone: "I have done this",
  markDoneHint:
    "Only if it is finished. It saves the organiser asking, and nobody else sees it.",
  markedDone: "You said you have done this. Thank you.",
  undoDone: "Actually, not yet",
  releaseTooLate:
    "This task has already taken place, so the spot can no longer be released. If something went wrong, speak to whoever is on the desk.",
  releasedTitle: "Your spot is released",
  releasedBody:
    "You are no longer expected, and nobody is told why. Thank you for saying so in good time.",

  problems: {
    title_required: "Give the task a title.",
    deadline_required: "Set a deadline.",
    start_invalid: "That start time cannot be read.",
    start_after_deadline: "The start time is after the deadline.",
    slots_too_few: "At least one helper is needed.",
    slots_below_claimed: "More people have already claimed a spot than that.",
    open_to_invalid: "Choose who the task is for.",
    name_required: "Enter your name.",
    name_too_long: "That name is too long.",
    phone_required: "Enter a phone number.",
    phone_invalid: "That does not look like a phone number.",
    task_full: "Every spot was taken while you were filling this in.",
    already_signed_up: "You are already on the list for this task.",
    task_closed: "This task has been called off.",
    task_passed: "This task's deadline has passed.",
    task_missing: "That task is no longer listed.",
    task_happened: "That task has already taken place.",
    task_not_started: "That task has not started yet.",
    signup_missing: "That link does not match a signup.",
    signup_released: "That spot has already been released.",
    confirmation_mismatch: "That does not match what was asked for.",
    undo_expired: "That can no longer be undone.",
    unknown: "Something went wrong. Please try again.",
  },
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

  backToList: "كل الأعمال",
  whenLabel: "الوقت",
  whereLabel: "المكان",
  neededLabel: "المطلوب",
  deadlineLabel: "الموعد النهائي",
  openToLabel: "لمن هذا العمل",
  openToBrothers: "للإخوة",
  openToSisters: "للأخوات",
  urgentHeading: "مطلوب الآن",
  urgentMark: "عاجل",
  calendarLabel: "أضفه إلى تقويمك",
  calendarGoogle: "تقويم Google",
  calendarIcs: "Apple أو Outlook",
  helpersNeeded: (count) => `${count}`,

  nameLabel: "اسمك",
  phoneLabel: "رقم الهاتف",
  phoneHint: "ليتمكن المسؤول من التواصل معك بشأن هذا العمل. لا يظهر في هذه الصفحة أبدًا.",
  submitting: "جارٍ التسجيل",

  closedTitle: "تم إلغاء هذا العمل",
  closedBody: "لم تعد هناك حاجة هنا. القائمة الحالية في الصفحة الرئيسية.",
  passedTitle: "انتهى موعد هذا العمل",
  passedBody: "شكرًا لاهتمامك. القائمة الحالية في الصفحة الرئيسية.",
  fullTitle: "اكتملت جميع الأماكن",
  fullBody: "قد يتراجع أحدهم لاحقًا، فتفقّد الصفحة مرة أخرى.",

  confirmedTitle: "تم تسجيلك",
  confirmedFor: (title) => `سجّلت في: ${title}.`,
  confirmedKeepLink:
    "احفظ هذه الصفحة. منها تتراجع عن مكانك إن تغيّرت خططك، وتعمل بدون تسجيل دخول.",
  confirmedUnknownTitle: "هذا الرابط لا يطابق أي تسجيل",
  confirmedUnknownBody: "قد يكون استُخدم من قبل. القائمة الحالية في الصفحة الرئيسية.",

  heldBy: (organisation) =>
    `${organisation} يحفظ اسمك ورقمك لهذا العمل فقط، ولا يستخدمهما لغير ذلك.`,
  releaseSlot: "التراجع عن مكاني",
  markDone: "أنجزتُ هذا العمل",
  markDoneHint: "فقط إن كان قد انتهى. يوفّر على المسؤول السؤال، ولا يراه أحد غيره.",
  markedDone: "أخبرتنا أنك أنجزت هذا العمل. شكرًا لك.",
  undoDone: "لم أنجزه بعد",
  releaseTooLate:
    "انتهى هذا العمل بالفعل، فلم يعد بالإمكان التراجع عن المكان. إن كان هناك خطأ، تحدّث إلى المسؤول.",
  releasedTitle: "تم التراجع عن مكانك",
  releasedBody: "لم تعد متوقعًا، ولا يُخبر أحد بالسبب. شكرًا لإبلاغك في الوقت المناسب.",

  problems: {
    title_required: "أدخل عنوان العمل.",
    deadline_required: "حدّد موعدًا نهائيًا.",
    start_invalid: "لا يمكن قراءة وقت البدء.",
    start_after_deadline: "وقت البدء بعد الموعد النهائي.",
    slots_too_few: "يلزم شخص واحد على الأقل.",
    slots_below_claimed: "عدد المسجّلين أكبر من هذا العدد.",
    open_to_invalid: "اختر لمن هذا العمل.",
    name_required: "أدخل اسمك.",
    name_too_long: "الاسم طويل جدًا.",
    phone_required: "أدخل رقم الهاتف.",
    phone_invalid: "هذا لا يبدو رقم هاتف.",
    task_full: "اكتملت الأماكن أثناء إدخالك للبيانات.",
    already_signed_up: "أنت مسجّل في هذا العمل بالفعل.",
    task_closed: "تم إلغاء هذا العمل.",
    task_passed: "انتهى موعد هذا العمل.",
    task_missing: "هذا العمل غير مدرج.",
    task_happened: "انتهى هذا العمل بالفعل.",
    task_not_started: "لم يبدأ هذا العمل بعد.",
    signup_missing: "هذا الرابط لا يطابق أي تسجيل.",
    signup_released: "تم التراجع عن هذا المكان بالفعل.",
    confirmation_mismatch: "لا يطابق المطلوب.",
    undo_expired: "لم يعد بالإمكان التراجع عن هذا.",
    unknown: "حدث خطأ. حاول مرة أخرى.",
  },
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
  notFoundBody:
    "La tâche a peut-être dépassé son échéance. La liste actuelle est sur la page d'accueil.",

  backToList: "Toutes les tâches",
  whenLabel: "Quand",
  whereLabel: "Où",
  neededLabel: "Besoin",
  deadlineLabel: "Échéance",
  openToLabel: "Pour qui",
  openToBrothers: "Frères",
  openToSisters: "Sœurs",
  urgentHeading: "À faire maintenant",
  urgentMark: "Urgent",
  calendarLabel: "Ajoutez-le à votre agenda",
  calendarGoogle: "Google Agenda",
  calendarIcs: "Apple ou Outlook",
  helpersNeeded: (count) => (count === 1 ? "1 personne" : `${count} personnes`),

  nameLabel: "Votre nom",
  phoneLabel: "Numéro de téléphone",
  phoneHint:
    "Pour que l'organisateur puisse vous joindre au sujet de cette tâche. Jamais affiché sur cette page.",
  submitting: "Inscription en cours",

  closedTitle: "Cette tâche a été annulée",
  closedBody: "Il n'y a plus rien à faire ici. La liste actuelle est sur la page d'accueil.",
  passedTitle: "L'échéance de cette tâche est passée",
  passedBody: "Merci d'avoir regardé. La liste actuelle est sur la page d'accueil.",
  fullTitle: "Toutes les places sont prises",
  fullBody: "Quelqu'un peut se désinscrire plus tard, cela vaut la peine de revenir.",

  confirmedTitle: "Vous êtes inscrit",
  confirmedFor: (title) => `Vous vous êtes inscrit à : ${title}.`,
  confirmedKeepLink:
    "Gardez cette page. C'est ainsi que vous libérez votre place si vos plans changent, sans aucune connexion.",
  confirmedUnknownTitle: "Ce lien ne correspond à aucune inscription",
  confirmedUnknownBody:
    "Il a peut-être déjà été utilisé. La liste actuelle est sur la page d'accueil.",

  heldBy: (organisation) =>
    `${organisation} conserve votre nom et votre numéro pour cette tâche uniquement.`,
  releaseSlot: "Libérer ma place",
  markDone: "C'est fait",
  markDoneHint:
    "Seulement si c'est terminé. Cela évite à l'organisateur de demander, et personne d'autre ne le voit.",
  markedDone: "Vous avez indiqué que c'est fait. Merci.",
  undoDone: "En fait, pas encore",
  releaseTooLate:
    "Cette tâche a déjà eu lieu, la place ne peut donc plus être libérée. En cas de problème, parlez à la personne à l'accueil.",
  releasedTitle: "Votre place est libérée",
  releasedBody:
    "Vous n'êtes plus attendu, et personne n'en connaît la raison. Merci de l'avoir dit à temps.",

  problems: {
    title_required: "Donnez un titre à la tâche.",
    deadline_required: "Indiquez une échéance.",
    start_invalid: "Cette heure de début est illisible.",
    start_after_deadline: "L'heure de début est après l'échéance.",
    slots_too_few: "Il faut au moins une personne.",
    slots_below_claimed: "Plus de personnes se sont déjà inscrites que ce nombre.",
    open_to_invalid: "Choisissez pour qui est la tâche.",
    name_required: "Entrez votre nom.",
    name_too_long: "Ce nom est trop long.",
    phone_required: "Entrez un numéro de téléphone.",
    phone_invalid: "Cela ne ressemble pas à un numéro de téléphone.",
    task_full: "Toutes les places ont été prises pendant que vous remplissiez le formulaire.",
    already_signed_up: "Vous êtes déjà inscrit à cette tâche.",
    task_closed: "Cette tâche a été annulée.",
    task_passed: "L'échéance de cette tâche est passée.",
    task_missing: "Cette tâche n'est plus affichée.",
    task_happened: "Cette tâche a déjà eu lieu.",
    task_not_started: "Cette tâche n'a pas encore commencé.",
    signup_missing: "Ce lien ne correspond à aucune inscription.",
    signup_released: "Cette place a déjà été libérée.",
    confirmation_mismatch: "Cela ne correspond pas à ce qui est demandé.",
    undo_expired: "Cela ne peut plus être annulé.",
    unknown: "Une erreur est survenue. Veuillez réessayer.",
  },
};

export const messages: Record<Locale, Messages> = { en, ar, fr };
