/**
 * LoktantraVani live events (shows, debates) that readers can register for.
 * Add a new entry here to open registrations; set `date` once it is announced.
 */

export type LvEvent = {
  slug: string;
  /** Public, shareable URL of the registration page. */
  path: string;
  show: { en: string; hi: string };
  title: { en: string; hi: string };
  guest: string;
  guestRole: { en: string; hi: string };
  guestNote: { en: string; hi: string };
  /** Hosts / panelists in conversation with the guest. */
  panelists: { name: string; bio: { en: string; hi: string } }[];
  description: { en: string; hi: string };
  /** ISO date-time once announced; null = "To be informed". */
  date: string | null;
  venue: { en: string; hi: string } | null;
  poster: string;
  themes: string[];
  open: boolean;
};

export const EVENTS: LvEvent[] = [
  {
    slug: "ai-public-policy",
    path: "/chitchat",
    show: { en: "First Show", hi: "पहला शो" },
    title: { en: "Chit-Chat on AI and Public Policy", hi: "AI और सार्वजनिक नीति पर गपशप" },
    guest: "Anil K Antony",
    guestRole: { en: "BJP National Secretary", hi: "भाजपा राष्ट्रीय सचिव" },
    guestNote: {
      en: "Son of Former CM of Kerala and Ex-Defence Minister of India",
      hi: "केरल के पूर्व मुख्यमंत्री व पूर्व रक्षा मंत्री के पुत्र",
    },
    panelists: [
      {
        name: "Bhavya Razshree",
        bio: { en: "Co-Founder, Law Sarathi · Advocate, Delhi High Court", hi: "सह-संस्थापक, लॉ सारथी · अधिवक्ता, दिल्ली उच्च न्यायालय" },
      },
      {
        name: "Aditya Ashok",
        bio: { en: "AI Expert, Government Advisory · IIM Mumbai, Public Policy", hi: "AI विशेषज्ञ, सरकारी सलाहकार · IIM मुंबई, सार्वजनिक नीति" },
      },
      {
        name: "Adarsh Ashok",
        bio: { en: "Co-Founder, LoktantraVani", hi: "सह-संस्थापक, लोकतंत्रवाणी" },
      },
    ],
    description: {
      en: "An AI-powered conversation on how artificial intelligence will shape governance, jobs, defence and democracy in India. Register now, send your question, and our AI will help shortlist the best audience questions for the show.",
      hi: "AI आधारित संवाद — कृत्रिम बुद्धिमत्ता भारत में शासन, रोज़गार, रक्षा और लोकतंत्र को कैसे बदलेगी। अभी पंजीकरण करें, अपना प्रश्न भेजें, और हमारा AI शो के लिए सर्वश्रेष्ठ प्रश्न चुनने में मदद करेगा।",
    },
    date: null,
    venue: null,
    poster: "/events/ai-public-policy-anil-antony.webp",
    themes: [
      "AI in governance",
      "Jobs & skills",
      "Data privacy & regulation",
      "Defence & national security",
      "Elections & misinformation",
      "Startups & economy",
      "Youth & education",
      "Other",
    ],
    open: true,
  },
];

export function getEvent(slug: string): LvEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export const PROFESSIONS = [
  { en: "Student", hi: "छात्र" },
  { en: "Working professional", hi: "कामकाजी पेशेवर" },
  { en: "Tech / AI", hi: "टेक / AI" },
  { en: "Policy / Government", hi: "नीति / सरकार" },
  { en: "Media / Journalist", hi: "मीडिया / पत्रकार" },
  { en: "Political worker", hi: "राजनीतिक कार्यकर्ता" },
  { en: "Entrepreneur", hi: "उद्यमी" },
  { en: "Other", hi: "अन्य" },
];
