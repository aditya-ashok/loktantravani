"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-newsreader font-black uppercase tracking-tighter mb-6 dark:text-white">
              {t("Privacy Policy", "गोपनीयता नीति")}
            </h1>
            <div className="h-1 w-24 bg-primary mx-auto mb-8" />
            <p className="text-lg font-inter opacity-60 dark:text-white/60">
              {t("Last updated: April 2026", "अंतिम अपडेट: अप्रैल 2026")}
            </p>
          </motion.div>

          {/* Content */}
          <div className="space-y-16">
            {/* Introduction */}
            <Section
              title={t("Introduction", "परिचय")}
              content={t(
                "LoktantraVani (\"we\", \"us\", or \"our\") operates the website loktantravani.in — India's 1st AI-powered newspaper. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. By accessing or using our platform, you agree to the terms of this Privacy Policy. If you do not agree, please discontinue use of our services immediately.",
                "लोकतंत्रवाणी (\"हम\", \"हमारा\") वेबसाइट loktantravani.in का संचालन करता है — भारत का पहला AI-संचालित समाचार पत्र। यह गोपनीयता नीति बताती है कि जब आप हमारी वेबसाइट पर जाते हैं और हमारी सेवाओं का उपयोग करते हैं तो हम आपकी जानकारी कैसे एकत्र, उपयोग, प्रकट और सुरक्षित करते हैं। हमारे प्लेटफ़ॉर्म तक पहुँच कर या उपयोग करके, आप इस गोपनीयता नीति की शर्तों से सहमत होते हैं।"
              )}
            />

            {/* Information We Collect */}
            <Section title={t("Information We Collect", "हम कौन सी जानकारी एकत्र करते हैं")}>
              <div className="space-y-6">
                <SubSection
                  title={t("1. Personal Information You Provide", "1. आपके द्वारा प्रदान की गई व्यक्तिगत जानकारी")}
                  items={[
                    t(
                      "Email address — when you subscribe to our newsletter or create an account.",
                      "ईमेल पता — जब आप हमारे न्यूज़लेटर की सदस्यता लेते हैं या खाता बनाते हैं।"
                    ),
                    t(
                      "Authentication data — when you sign in via Firebase Authentication (Google sign-in, email/password). We receive your display name, email, and profile photo URL from your identity provider.",
                      "प्रमाणीकरण डेटा — जब आप Firebase Authentication (Google साइन-इन, ईमेल/पासवर्ड) के माध्यम से साइन इन करते हैं। हम आपके पहचान प्रदाता से आपका प्रदर्शन नाम, ईमेल और प्रोफ़ाइल फ़ोटो URL प्राप्त करते हैं।"
                    ),
                    t(
                      "Payment information — when you purchase a premium subscription. Payments are processed securely by Razorpay; we do not store your credit/debit card details on our servers.",
                      "भुगतान जानकारी — जब आप प्रीमियम सदस्यता खरीदते हैं। भुगतान Razorpay द्वारा सुरक्षित रूप से संसाधित किए जाते हैं; हम आपके क्रेडिट/डेबिट कार्ड विवरण अपने सर्वर पर संग्रहीत नहीं करते।"
                    ),
                    t(
                      "User-generated content — comments, reactions, and any content you submit through our platform.",
                      "उपयोगकर्ता-जनित सामग्री — टिप्पणियाँ, प्रतिक्रियाएँ और कोई भी सामग्री जो आप हमारे प्लेटफ़ॉर्म के माध्यम से सबमिट करते हैं।"
                    ),
                  ]}
                />
                <SubSection
                  title={t("2. Automatically Collected Information", "2. स्वचालित रूप से एकत्र की गई जानकारी")}
                  items={[
                    t(
                      "Device and browser information (user agent, screen resolution, operating system).",
                      "डिवाइस और ब्राउज़र जानकारी (यूज़र एजेंट, स्क्रीन रिज़ॉल्यूशन, ऑपरेटिंग सिस्टम)।"
                    ),
                    t(
                      "IP address and approximate geographic location.",
                      "IP पता और अनुमानित भौगोलिक स्थान।"
                    ),
                    t(
                      "Pages visited, time spent, referral URLs, and interaction data via analytics.",
                      "विज़िट किए गए पृष्ठ, बिताया गया समय, रेफ़रल URL और एनालिटिक्स के माध्यम से इंटरैक्शन डेटा।"
                    ),
                    t(
                      "Cookies and similar tracking technologies (see Cookie Policy below).",
                      "कुकीज़ और समान ट्रैकिंग तकनीकें (नीचे कुकी नीति देखें)।"
                    ),
                  ]}
                />
              </div>
            </Section>

            {/* How We Use Your Information */}
            <Section
              title={t("How We Use Your Information", "हम आपकी जानकारी का उपयोग कैसे करते हैं")}
            >
              <BulletList
                items={[
                  t("To deliver and personalize your news experience using AI-driven recommendations.", "AI-संचालित अनुशंसाओं का उपयोग करके आपके समाचार अनुभव को वितरित और वैयक्तिकृत करने के लिए।"),
                  t("To send newsletters and editorial updates to subscribers (via Resend).", "सदस्यों को न्यूज़लेटर और संपादकीय अपडेट भेजने के लिए (Resend के माध्यम से)।"),
                  t("To process premium subscriptions and payments (via Razorpay).", "प्रीमियम सदस्यता और भुगतान संसाधित करने के लिए (Razorpay के माध्यम से)।"),
                  t("To generate AI-powered content, summaries, and text-to-speech audio (via Anthropic Claude, Google Gemini, and ElevenLabs).", "AI-संचालित सामग्री, सारांश और टेक्स्ट-टू-स्पीच ऑडियो उत्पन्न करने के लिए (Anthropic Claude, Google Gemini और ElevenLabs के माध्यम से)।"),
                  t("To serve relevant advertisements through Google AdSense.", "Google AdSense के माध्यम से प्रासंगिक विज्ञापन दिखाने के लिए।"),
                  t("To analyze usage patterns and improve our platform.", "उपयोग पैटर्न का विश्लेषण करने और हमारे प्लेटफ़ॉर्म को बेहतर बनाने के लिए।"),
                  t("To maintain security, prevent fraud, and enforce our terms of service.", "सुरक्षा बनाए रखने, धोखाधड़ी रोकने और हमारी सेवा शर्तों को लागू करने के लिए।"),
                ]}
              />
            </Section>

            {/* Cookie Policy */}
            <Section title={t("Cookie Policy", "कुकी नीति")}>
              <div className="space-y-6">
                <p className="text-lg font-newsreader leading-relaxed dark:text-white/80">
                  {t(
                    "We use cookies and similar technologies to enhance your experience. Cookies are small data files stored on your device. You can control cookies through your browser settings; however, disabling cookies may limit certain features of our platform.",
                    "हम आपके अनुभव को बेहतर बनाने के लिए कुकीज़ और समान तकनीकों का उपयोग करते हैं। कुकीज़ आपके डिवाइस पर संग्रहीत छोटी डेटा फ़ाइलें हैं। आप अपनी ब्राउज़र सेटिंग्स के माध्यम से कुकीज़ को नियंत्रित कर सकते हैं; हालाँकि, कुकीज़ को अक्षम करने से हमारे प्लेटफ़ॉर्म की कुछ सुविधाएँ सीमित हो सकती हैं।"
                  )}
                </p>
                <SubSection
                  title={t("Essential Cookies", "आवश्यक कुकीज़")}
                  items={[
                    t("Authentication session tokens (Firebase Auth) to keep you signed in.", "आपको साइन इन रखने के लिए प्रमाणीकरण सत्र टोकन (Firebase Auth)।"),
                    t("Language and theme preferences.", "भाषा और थीम प्राथमिकताएँ।"),
                  ]}
                />
                <SubSection
                  title={t("Analytics Cookies", "एनालिटिक्स कुकीज़")}
                  items={[
                    t("We use analytics to understand how visitors interact with our website, helping us improve content and user experience.", "हम यह समझने के लिए एनालिटिक्स का उपयोग करते हैं कि विज़िटर हमारी वेबसाइट के साथ कैसे इंटरैक्ट करते हैं, जिससे हमें सामग्री और उपयोगकर्ता अनुभव को बेहतर बनाने में मदद मिलती है।"),
                  ]}
                />
                <SubSection
                  title={t("Advertising Cookies (Google AdSense)", "विज्ञापन कुकीज़ (Google AdSense)")}
                  items={[
                    t(
                      "Google uses cookies to serve ads based on your prior visits to our website and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your browsing history.",
                      "Google आपकी हमारी वेबसाइट और अन्य वेबसाइटों पर पिछली विज़िट के आधार पर विज्ञापन दिखाने के लिए कुकीज़ का उपयोग करता है। Google द्वारा विज्ञापन कुकीज़ का उपयोग उसे और उसके भागीदारों को आपके ब्राउज़िंग इतिहास के आधार पर विज्ञापन दिखाने में सक्षम बनाता है।"
                    ),
                    t(
                      "You may opt out of personalized advertising by visiting Google Ads Settings (https://adssettings.google.com). For more information, see Google's Privacy Policy at https://policies.google.com/privacy.",
                      "आप Google Ads Settings (https://adssettings.google.com) पर जाकर वैयक्तिकृत विज्ञापन से ऑप्ट आउट कर सकते हैं। अधिक जानकारी के लिए, https://policies.google.com/privacy पर Google की गोपनीयता नीति देखें।"
                    ),
                  ]}
                />
              </div>
            </Section>

            {/* Third-Party Services */}
            <Section title={t("Third-Party Services", "तृतीय-पक्ष सेवाएँ")}>
              <p className="text-lg font-newsreader leading-relaxed dark:text-white/80 mb-6">
                {t(
                  "We integrate with the following third-party services, each governed by their own privacy policies:",
                  "हम निम्नलिखित तृतीय-पक्ष सेवाओं के साथ एकीकृत हैं, प्रत्येक अपनी स्वयं की गोपनीयता नीतियों द्वारा शासित है:"
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    name: "Firebase / Google Cloud",
                    desc: t("Authentication, database (Firestore), and hosting.", "प्रमाणीकरण, डेटाबेस (Firestore) और होस्टिंग।"),
                  },
                  {
                    name: "Google AdSense",
                    desc: t("Contextual and personalized advertising.", "संदर्भगत और वैयक्तिकृत विज्ञापन।"),
                  },
                  {
                    name: "Razorpay",
                    desc: t("Secure payment processing for premium subscriptions.", "प्रीमियम सदस्यता के लिए सुरक्षित भुगतान प्रसंस्करण।"),
                  },
                  {
                    name: "Resend",
                    desc: t("Transactional and newsletter email delivery.", "ट्रांज़ैक्शनल और न्यूज़लेटर ईमेल डिलीवरी।"),
                  },
                  {
                    name: "Anthropic (Claude AI)",
                    desc: t("AI-powered content generation and editorial assistance.", "AI-संचालित सामग्री निर्माण और संपादकीय सहायता।"),
                  },
                  {
                    name: "Google Gemini",
                    desc: t("AI content generation and summarization.", "AI सामग्री निर्माण और सारांशीकरण।"),
                  },
                  {
                    name: "ElevenLabs",
                    desc: t("Text-to-speech audio generation for articles.", "लेखों के लिए टेक्स्ट-टू-स्पीच ऑडियो जनरेशन।"),
                  },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="border-2 border-black dark:border-white/20 p-5 hover:shadow-[6px_6px_0px_0px_#FF9933] transition-all"
                  >
                    <h4 className="text-base font-newsreader font-black dark:text-white mb-1">{service.name}</h4>
                    <p className="text-sm font-inter opacity-60 dark:text-white/60">{service.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* User Rights */}
            <Section title={t("Your Rights", "आपके अधिकार")}>
              <p className="text-lg font-newsreader leading-relaxed dark:text-white/80 mb-6">
                {t(
                  "You have the following rights regarding your personal data:",
                  "आपके व्यक्तिगत डेटा के संबंध में आपके निम्नलिखित अधिकार हैं:"
                )}
              </p>
              <BulletList
                items={[
                  t("Right to Access — You may request a copy of the personal data we hold about you.", "पहुँच का अधिकार — आप हमारे पास रखे आपके व्यक्तिगत डेटा की एक प्रति का अनुरोध कर सकते हैं।"),
                  t("Right to Correction — You may request correction of inaccurate or incomplete data.", "सुधार का अधिकार — आप गलत या अपूर्ण डेटा के सुधार का अनुरोध कर सकते हैं।"),
                  t("Right to Deletion — You may request deletion of your account and associated personal data by contacting us at admin@loktantravani.in.", "हटाने का अधिकार — आप admin@loktantravani.in पर संपर्क करके अपने खाते और संबंधित व्यक्तिगत डेटा को हटाने का अनुरोध कर सकते हैं।"),
                  t("Right to Opt-Out — You may unsubscribe from our newsletter at any time using the link in any email. You may opt out of personalized ads via Google Ads Settings.", "ऑप्ट-आउट का अधिकार — आप किसी भी ईमेल में दिए गए लिंक का उपयोग करके किसी भी समय हमारे न्यूज़लेटर से सदस्यता रद्द कर सकते हैं। आप Google Ads Settings के माध्यम से वैयक्तिकृत विज्ञापनों से ऑप्ट आउट कर सकते हैं।"),
                  t("Right to Data Portability — You may request your data in a machine-readable format.", "डेटा पोर्टेबिलिटी का अधिकार — आप मशीन-पठनीय प्रारूप में अपने डेटा का अनुरोध कर सकते हैं।"),
                ]}
              />
              <p className="text-lg font-newsreader leading-relaxed dark:text-white/80 mt-6">
                {t(
                  "To exercise any of these rights, email us at admin@loktantravani.in. We will respond within 30 days.",
                  "इनमें से किसी भी अधिकार का प्रयोग करने के लिए, हमें admin@loktantravani.in पर ईमेल करें। हम 30 दिनों के भीतर जवाब देंगे।"
                )}
              </p>
            </Section>

            {/* Data Retention & Security */}
            <Section title={t("Data Retention & Security", "डेटा प्रतिधारण और सुरक्षा")}>
              <div className="space-y-4 text-lg font-newsreader leading-relaxed dark:text-white/80">
                <p>
                  {t(
                    "We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, or as required by applicable law. Account data is retained for the duration of your active account. Upon account deletion, your personal data will be removed from our active databases within 30 days, though residual copies may persist in backups for up to 90 days.",
                    "हम आपका व्यक्तिगत डेटा केवल इस नीति में उल्लिखित उद्देश्यों को पूरा करने के लिए या लागू कानून द्वारा आवश्यकतानुसार आवश्यक समय तक बनाए रखते हैं। खाता डेटा आपके सक्रिय खाते की अवधि के लिए बनाए रखा जाता है। खाता हटाने पर, आपका व्यक्तिगत डेटा 30 दिनों के भीतर हमारे सक्रिय डेटाबेस से हटा दिया जाएगा, हालाँकि अवशिष्ट प्रतियाँ 90 दिनों तक बैकअप में बनी रह सकती हैं।"
                  )}
                </p>
                <p>
                  {t(
                    "We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL), secure Firebase rules, and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
                    "हम आपके डेटा की सुरक्षा के लिए उद्योग-मानक सुरक्षा उपाय लागू करते हैं, जिसमें ट्रांज़िट में एन्क्रिप्शन (TLS/SSL), सुरक्षित Firebase नियम और एक्सेस नियंत्रण शामिल हैं। हालाँकि, इंटरनेट पर प्रसारण की कोई भी विधि 100% सुरक्षित नहीं है, और हम पूर्ण सुरक्षा की गारंटी नहीं दे सकते।"
                  )}
                </p>
              </div>
            </Section>

            {/* Children's Privacy */}
            <Section title={t("Children's Privacy", "बच्चों की गोपनीयता")}>
              <p className="text-lg font-newsreader leading-relaxed dark:text-white/80">
                {t(
                  "Our platform is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have inadvertently collected data from a child under 13, we will take steps to delete such information promptly. If you are a parent or guardian and believe your child has provided us with personal data, please contact us at admin@loktantravani.in.",
                  "हमारा प्लेटफ़ॉर्म 13 वर्ष से कम उम्र के बच्चों के लिए निर्देशित नहीं है। हम जानबूझकर 13 वर्ष से कम उम्र के बच्चों से व्यक्तिगत जानकारी एकत्र नहीं करते। यदि हमें पता चलता है कि हमने अनजाने में 13 वर्ष से कम उम्र के बच्चे से डेटा एकत्र किया है, तो हम ऐसी जानकारी को तुरंत हटाने के लिए कदम उठाएँगे। यदि आप माता-पिता या अभिभावक हैं और मानते हैं कि आपके बच्चे ने हमें व्यक्तिगत डेटा प्रदान किया है, तो कृपया admin@loktantravani.in पर हमसे संपर्क करें।"
                )}
              </p>
            </Section>

            {/* Changes to This Policy */}
            <Section title={t("Changes to This Policy", "इस नीति में परिवर्तन")}>
              <p className="text-lg font-newsreader leading-relaxed dark:text-white/80">
                {t(
                  "We may update this Privacy Policy from time to time. When we do, we will revise the \"Last updated\" date at the top of this page and, for material changes, notify you via email or a prominent notice on our website. Your continued use of our platform after any changes constitutes acceptance of the updated policy.",
                  "हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। जब हम ऐसा करेंगे, तो हम इस पृष्ठ के शीर्ष पर \"अंतिम अपडेट\" तिथि को संशोधित करेंगे और महत्वपूर्ण परिवर्तनों के लिए, आपको ईमेल या हमारी वेबसाइट पर एक प्रमुख सूचना के माध्यम से सूचित करेंगे। किसी भी परिवर्तन के बाद हमारे प्लेटफ़ॉर्म का आपका निरंतर उपयोग अपडेटेड नीति की स्वीकृति का गठन करता है।"
                )}
              </p>
            </Section>

            {/* Governing Law */}
            <Section title={t("Governing Law", "शासी कानून")}>
              <p className="text-lg font-newsreader leading-relaxed dark:text-white/80">
                {t(
                  "This Privacy Policy is governed by and construed in accordance with the laws of India, including the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023. Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the courts in India.",
                  "यह गोपनीयता नीति भारत के कानूनों के अनुसार शासित और निर्मित है, जिसमें सूचना प्रौद्योगिकी अधिनियम, 2000 और डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 शामिल हैं। इस नीति के तहत उत्पन्न होने वाले किसी भी विवाद पर भारत में न्यायालयों का विशेष अधिकार क्षेत्र होगा।"
                )}
              </p>
            </Section>

            {/* Contact */}
            <div className="border-4 border-black dark:border-white/20 p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-4 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-newsreader font-black uppercase dark:text-white">
                  {t("Contact Us", "हमसे संपर्क करें")}
                </h2>
              </div>
              <div className="space-y-4 text-lg font-newsreader leading-relaxed dark:text-white/80">
                <p>
                  {t(
                    "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
                    "यदि इस गोपनीयता नीति या हमारी डेटा प्रथाओं के बारे में आपके कोई प्रश्न, चिंताएँ या अनुरोध हैं, तो कृपया हमसे संपर्क करें:"
                  )}
                </p>
                <div className="font-inter text-base">
                  <p className="dark:text-white"><strong>LoktantraVani</strong></p>
                  <p className="dark:text-white/80">
                    {t("Email", "ईमेल")}:{" "}
                    <a href="mailto:admin@loktantravani.in" className="text-primary underline hover:no-underline">
                      admin@loktantravani.in
                    </a>
                  </p>
                  <p className="dark:text-white/80">
                    {t("Website", "वेबसाइट")}:{" "}
                    <a href="https://loktantravani.in" className="text-primary underline hover:no-underline">
                      loktantravani.in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ─── Helper Components ─── */

function Section({
  title,
  content,
  children,
}: {
  title: string;
  content?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
    >
      <h2 className="text-3xl font-newsreader font-black uppercase mb-6 dark:text-white">{title}</h2>
      <div className="h-0.5 w-16 bg-primary mb-6" />
      {content && (
        <p className="text-lg font-newsreader leading-relaxed dark:text-white/80">{content}</p>
      )}
      {children}
    </motion.section>
  );
}

function SubSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xl font-newsreader font-bold mb-3 dark:text-white">{title}</h3>
      <ul className="space-y-2 ml-6">
        {items.map((item, i) => (
          <li key={i} className="text-base font-inter leading-relaxed dark:text-white/80 list-disc marker:text-primary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 ml-6">
      {items.map((item, i) => (
        <li key={i} className="text-base font-inter leading-relaxed dark:text-white/80 list-disc marker:text-primary">
          {item}
        </li>
      ))}
    </ul>
  );
}
