import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Noto_Serif_Devanagari } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const hindi = Noto_Serif_Devanagari({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["devanagari"],
  variable: "--font-hindi",
});

const SITE_URL = "https://loktantravani.in";

export const metadata: Metadata = {
  title: {
    default: "LoktantraVani — India's First AI Newspaper",
    template: "%s | LoktantraVani",
  },
  description:
    "India's first AI-powered digital newspaper. Breaking news, in-depth analysis, and opinion on India, politics, geopolitics, economy, sports, tech, and defence. Bilingual Hindi-English coverage powered by AI.",
  keywords: [
    "India news", "AI newspaper", "LoktantraVani", "Indian politics", "geopolitics",
    "economy news India", "sports news", "tech news India", "defence news",
    "Hindi news", "English news", "breaking news India", "opinion", "editorial",
    "digital newspaper", "Neo Bharat", "loktantravani",
  ],
  authors: [{ name: "LoktantraVani Editorial", url: SITE_URL }],
  creator: "LoktantraVani by Kautilya World",
  publisher: "LoktantraVani",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: "hi_IN",
    url: SITE_URL,
    siteName: "LoktantraVani",
    title: "LoktantraVani — India's First AI Newspaper",
    description: "Breaking news, analysis & opinion on India, politics, geopolitics, economy, sports & tech. AI-powered bilingual Hindi-English coverage.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "LoktantraVani — India's First AI Newspaper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@loktantravani",
    creator: "@loktantravani",
    title: "LoktantraVani — India's First AI Newspaper",
    description: "Breaking news, analysis & opinion. AI-powered bilingual Hindi-English coverage.",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  verification: {
    google: "9exH3O1dFsRrqR72ntT5ZCiCA2KghOXal7Ah1NiZE3k",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense — auto-ads enabled */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9021821912868122"
          crossOrigin="anonymous"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              name: "LoktantraVani",
              alternateName: "लोकतंत्रवाणी",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/og-image.png`,
                width: 1200,
                height: 630,
              },
              image: `${SITE_URL}/og-image.png`,
              sameAs: [
                "https://x.com/loktantravani",
                "https://www.instagram.com/loktantravani",
                "https://www.youtube.com/@loktantravani",
              ],
              description: "India's first AI-powered digital newspaper providing bilingual Hindi-English news coverage.",
              foundingDate: "2026",
              founder: {
                "@type": "Person",
                name: "Aditya Ashok",
              },
              publishingPrinciples: `${SITE_URL}/about`,
              actionableFeedbackPolicy: `${SITE_URL}/about`,
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "editorial",
                url: `${SITE_URL}/about`,
              },
              inLanguage: ["en-IN", "hi-IN"],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${newsreader.variable} ${hindi.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
