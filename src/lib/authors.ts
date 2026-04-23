export interface AuthorSocial {
  twitter?: string;       // Full URL e.g. https://twitter.com/username
  linkedin?: string;      // Full URL
  instagram?: string;     // Full URL
  facebook?: string;      // Full URL
  youtube?: string;       // Full URL
  github?: string;        // Full URL
  website?: string;       // Personal website URL
  wikipedia?: string;     // Wikipedia page URL
}

export interface AuthorProfile {
  name: string;
  nameHi: string;
  email: string;
  role: "admin" | "author";
  designation: string;
  designationHi: string;
  bio: string;
  bioHi: string;
  /** Photo path under /public/authors/ — e.g. "aditya-ashok.jpg" */
  photo?: string;
  /** Social media profiles for sameAs schema (boosts Knowledge Panel) */
  social?: AuthorSocial;
  /** Education, e.g. "IIIT Bangalore" */
  alumniOf?: string;
  /** City of work */
  location?: string;
}

export const AUTHORS: AuthorProfile[] = [
  {
    name: "Aditya Ashok",
    nameHi: "आदित्य अशोक",
    email: "aditya.ashok@gmail.com",
    role: "admin",
    designation: "Founder & Editor-in-Chief",
    designationHi: "संस्थापक एवं प्रधान संपादक",
    bio: "Founder of LoktantraVani. IIIT Bangalore alumnus. Building the future of Indian digital journalism.",
    bioHi: "लोकतंत्रवाणी के संस्थापक। IIIT बैंगलोर से शिक्षित। भारतीय डिजिटल पत्रकारिता का भविष्य निर्माण।",
    photo: "aditya-ashok.jpg",
    alumniOf: "IIIT Bangalore",
    location: "Bangalore, India",
    social: {
      twitter: "https://twitter.com/adityaashok",
      linkedin: "https://www.linkedin.com/in/adityaashok",
      website: "https://kautilya.world",
    },
  },
  {
    name: "Ashok Kumar Choudhary",
    nameHi: "अशोक कुमार चौधरी",
    email: "ashok.choudhary@gmail.com",
    role: "admin",
    designation: "Managing Editor",
    designationHi: "प्रबंध संपादक",
    bio: "Veteran journalist with 30+ years covering Indian politics and governance from the ground up.",
    bioHi: "30+ वर्षों के अनुभव वाले वरिष्ठ पत्रकार। भारतीय राजनीति और शासन की जमीनी रिपोर्टिंग।",
    photo: "ashok-kumar-choudhary.jpg",
    location: "New Delhi, India",
    social: {
      twitter: "https://twitter.com/ashokchoudhary",
      linkedin: "https://www.linkedin.com/in/ashokchoudhary",
    },
  },
  {
    name: "Sanjay Saraogi",
    nameHi: "संजय सरावगी",
    email: "sanjay.saraogi@gmail.com",
    role: "author",
    designation: "Business & Economy Editor",
    designationHi: "व्यापार एवं अर्थव्यवस्था संपादक",
    bio: "CA turned journalist. Decodes India's economic story — from Dalal Street to chai tapris.",
    bioHi: "CA से पत्रकार बने। भारत की आर्थिक कहानी — दलाल स्ट्रीट से चाय की टपरी तक।",
    photo: "sanjay-saraogi.jpg",
    location: "Mumbai, India",
    social: {
      twitter: "https://twitter.com/sanjaysaraogi",
      linkedin: "https://www.linkedin.com/in/sanjaysaraogi",
    },
  },
  {
    name: "Adarsh Ashok",
    nameHi: "आदर्श अशोक",
    email: "adarsh.ashok@gmail.com",
    role: "author",
    designation: "Tech & Defence Correspondent",
    designationHi: "तकनीक एवं रक्षा संवाददाता",
    bio: "Covers India's tech ecosystem and defence modernization. Believer in Atmanirbhar Bharat.",
    bioHi: "भारत के तकनीकी पारिस्थितिकी तंत्र और रक्षा आधुनिकीकरण की रिपोर्टिंग। आत्मनिर्भर भारत में विश्वास।",
    photo: "adarsh-ashok.jpg",
    location: "Bangalore, India",
    social: {
      twitter: "https://twitter.com/adarshashok",
      linkedin: "https://www.linkedin.com/in/adarshashok",
    },
  },
  {
    name: "Seema Choudhary",
    nameHi: "सीमा चौधरी",
    email: "seema.choudhary@gmail.com",
    role: "author",
    designation: "Cities & Culture Editor",
    designationHi: "शहर एवं संस्कृति संपादक",
    bio: "Reports from New Delhi, Patna, Guwahati, Kolkata. Bringing grassroots stories to national discourse.",
    bioHi: "नई दिल्ली, पटना, गुवाहाटी, कोलकाता से रिपोर्टिंग। जमीनी कहानियों को राष्ट्रीय विमर्श तक।",
    photo: "seema-choudhary.jpg",
    location: "New Delhi, India",
    social: {
      twitter: "https://twitter.com/seemachoudhary",
      linkedin: "https://www.linkedin.com/in/seemachoudhary",
    },
  },
  {
    name: "Shreya Rahul Anand",
    nameHi: "श्रेया राहुल आनंद",
    email: "shreya.anand@gmail.com",
    role: "author",
    designation: "Sr. Correspondent — Politics & Opinion",
    designationHi: "वरिष्ठ संवाददाता — राजनीति एवं विचार",
    bio: "Political analyst and opinion writer. Sharp takes on neta culture, policy, and people's pulse.",
    bioHi: "राजनीतिक विश्लेषक और विचार लेखिका। नेता संस्कृति, नीति और जनता की नब्ज पर तीखी नजर।",
    photo: "shreya-rahul-anand.jpg",
    location: "New Delhi, India",
    social: {
      twitter: "https://twitter.com/shreyaranand",
      linkedin: "https://www.linkedin.com/in/shreyaranand",
    },
  },
  {
    name: "Bhavya Rajshree",
    nameHi: "भव्या राजश्री",
    email: "bhavya.rajshree@gmail.com",
    role: "author",
    designation: "Correspondent — Cities & Lifestyle",
    designationHi: "संवाददाता — शहर एवं जीवनशैली",
    bio: "Tracks urban India — from metro corridors to weekend chai stops. Storytelling at the intersection of policy and people.",
    bioHi: "शहरी भारत की रिपोर्टिंग — मेट्रो गलियारों से सप्ताहांत चाय की दुकानों तक। नीति और जनता के संगम पर कहानियाँ।",
    photo: "bhavya-rajshree.jpg",
    location: "New Delhi, India",
    social: {
      twitter: "https://twitter.com/bhavyarajshree",
      linkedin: "https://www.linkedin.com/in/bhavyarajshree",
      instagram: "https://instagram.com/bhavyarajshree",
    },
  },
  {
    name: "LoktantraVani AI",
    nameHi: "लोकतंत्रवाणी AI",
    email: "ai@loktantravani.in",
    role: "author",
    designation: "AI News Bureau",
    designationHi: "AI समाचार ब्यूरो",
    bio: "LoktantraVani AI is powered by Claude and Gemini—delivering deep-researched, fact-checked journalism.",
    bioHi: "लोकतंत्रवाणी AI, Claude और Gemini द्वारा संचालित—गहन शोध और तथ्य-जाँच पत्रकारिता।",
    photo: "loktantravani-ai.jpg",
    social: {
      website: "https://loktantravani.in/about",
    },
  },
  {
    name: "Admin",
    nameHi: "एडमिन",
    email: "admin@loktantravani.com",
    role: "admin",
    designation: "System Administrator",
    designationHi: "सिस्टम प्रशासक",
    bio: "LoktantraVani editorial desk.",
    bioHi: "लोकतंत्रवाणी संपादकीय डेस्क।",
  },
];

const SITE_URL = "https://loktantravani.in";

/** Get full photo URL — falls back to ui-avatars.com if no photo */
export function getAuthorPhoto(name: string): string {
  const author = AUTHORS.find(a => a.name === name);
  if (author?.photo) return `${SITE_URL}/authors/${author.photo}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF9933&color=fff&size=256&bold=true`;
}

/** Get array of social URLs for sameAs schema */
export function getAuthorSameAs(name: string): string[] {
  const author = AUTHORS.find(a => a.name === name);
  if (!author?.social) return [];
  return Object.values(author.social).filter(Boolean) as string[];
}

// Quick lookup for assigning articles
export const AUTHOR_NAMES = AUTHORS.filter(a => a.role === "author" || a.designation.includes("Editor")).map(a => a.name);

/** Get Hindi name for an author, returns original if not found */
export function getAuthorHiName(name: string): string {
  if (name === "LoktantraVani AI") return "लोकतंत्रवाणी AI";
  const author = AUTHORS.find(a => a.name === name);
  return author?.nameHi || name;
}

/** Get full Hindi author info */
export function getAuthorHi(name: string): { nameHi: string; designationHi: string; bioHi: string } {
  if (name === "LoktantraVani AI") return { nameHi: "लोकतंत्रवाणी AI", designationHi: "AI समाचार ब्यूरो", bioHi: "लोकतंत्रवाणी AI, Claude और Gemini द्वारा संचालित—गहन शोध और तथ्य-जाँच पत्रकारिता।" };
  const author = AUTHORS.find(a => a.name === name);
  return {
    nameHi: author?.nameHi || name,
    designationHi: author?.designationHi || "",
    bioHi: author?.bioHi || "",
  };
}
