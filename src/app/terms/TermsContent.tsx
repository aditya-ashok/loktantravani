"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EFFECTIVE_DATE = "April 1, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl md:text-3xl font-newsreader font-black uppercase mb-6 dark:text-white">
        {title}
      </h2>
      <div className="space-y-4 text-lg font-newsreader leading-relaxed dark:text-white/80">
        {children}
      </div>
    </div>
  );
}

export default function TermsContent() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-newsreader font-black uppercase tracking-tighter mb-6 dark:text-white">
              Terms of Service
            </h1>
            <div className="h-1 w-24 bg-primary mx-auto mb-8" />
            <p className="text-2xl font-newsreader italic opacity-60 max-w-2xl mx-auto dark:text-white/60">
              Please read these terms carefully before using LoktantraVani.
            </p>
            <p className="text-sm font-inter mt-4 opacity-40 dark:text-white/40">
              Effective Date: {EFFECTIVE_DATE}
            </p>
          </motion.div>

          {/* Terms Body */}
          <div className="border-4 border-black dark:border-white/20 p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using the LoktantraVani website at{" "}
                <a href="https://loktantravani.in" className="underline text-primary">loktantravani.in</a>{" "}
                (&quot;the Platform&quot;), you agree to be bound by these Terms of Service
                (&quot;Terms&quot;). If you do not agree to all of these Terms, you must not
                use the Platform. LoktantraVani is India&apos;s 1st AI-powered newspaper,
                and these Terms govern your entire relationship with us.
              </p>
            </Section>

            <Section title="2. AI-Generated Content Disclaimer">
              <p>
                LoktantraVani uses artificial intelligence to generate, curate, and
                augment editorial content. While our AI-powered authors produce
                articles grounded in publicly available data and our editorial
                guidelines, <strong>AI-generated content may contain inaccuracies,
                outdated information, or unintended biases.</strong>
              </p>
              <p>
                Our editorial stance is pro-development and nationalist, rooted in
                India&apos;s civilizational perspective. Content reflects this editorial
                direction and should not be taken as impartial or exhaustive
                reporting.
              </p>
              <p>
                You acknowledge that AI-generated articles are not a substitute for
                professional advice (legal, medical, financial, or otherwise). You
                rely on any content published on the Platform at your own risk.
              </p>
            </Section>

            <Section title="3. User Accounts">
              <p>
                Account creation and authentication on LoktantraVani is powered by
                Firebase Authentication. You may sign in using Google, email/password,
                or other supported providers.
              </p>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Maintaining the confidentiality of your account credentials.</li>
                <li>All activities that occur under your account.</li>
                <li>Promptly notifying us of any unauthorized use of your account.</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that violate
                these Terms or engage in prohibited conduct.
              </p>
            </Section>

            <Section title="4. Subscriptions &amp; Payments">
              <p>
                LoktantraVani offers premium &quot;Ultra&quot; subscription plans that unlock
                additional features. All payments are processed securely through
                Razorpay.
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>
                  <strong>No Refunds:</strong> All digital subscription purchases are
                  final. We do not offer refunds or credits for partial subscription
                  periods, unused features, or dissatisfaction with content.
                </li>
                <li>
                  <strong>Auto-Renewal:</strong> Subscriptions automatically renew at
                  the end of each billing cycle unless you cancel before the renewal
                  date. You will be charged at the then-current subscription rate.
                </li>
                <li>
                  <strong>Cancellation:</strong> You may cancel your subscription at
                  any time through your account settings. Cancellation takes effect at
                  the end of the current billing period.
                </li>
              </ul>
            </Section>

            <Section title="5. User-Generated Content">
              <p>
                By submitting comments, articles, feedback, or any other content to
                the Platform (&quot;User Content&quot;), you grant LoktantraVani a
                non-exclusive, worldwide, royalty-free, perpetual, irrevocable,
                sublicensable license to use, reproduce, modify, adapt, publish,
                translate, distribute, and display such User Content in any media.
              </p>
              <p>
                You represent that you own or have the necessary rights to submit
                User Content and that it does not infringe upon the rights of any
                third party.
              </p>
            </Section>

            <Section title="6. Intellectual Property">
              <p>
                All content on the Platform — including but not limited to articles,
                cartoons, illustrations, graphics, logos, design elements, software,
                and AI-generated text — is the exclusive property of LoktantraVani
                and is protected by applicable intellectual property laws.
              </p>
              <p>
                You may not reproduce, distribute, modify, create derivative works
                from, or commercially exploit any content without prior written
                consent from LoktantraVani.
              </p>
            </Section>

            <Section title="7. Prohibited Conduct">
              <p>You agree not to:</p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Post or transmit hate speech, threats, or content that promotes violence or discrimination.</li>
                <li>Spam, advertise, or solicit without authorization.</li>
                <li>Scrape, crawl, or use automated tools to extract content from the Platform without written permission.</li>
                <li>Attempt to gain unauthorized access to our systems, servers, or user accounts.</li>
                <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
                <li>Use the Platform for any unlawful purpose.</li>
              </ul>
            </Section>

            <Section title="8. Disclaimers">
              <p>
                The Platform and all content are provided on an{" "}
                <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis
                without warranties of any kind, whether express or implied,
                including but not limited to implied warranties of merchantability,
                fitness for a particular purpose, and non-infringement.
              </p>
              <p>
                LoktantraVani does not warrant that the Platform will be
                uninterrupted, error-free, secure, or free of viruses or other
                harmful components.
              </p>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>
                To the fullest extent permitted by applicable law, LoktantraVani,
                its directors, employees, partners, agents, and affiliates shall not
                be liable for any indirect, incidental, special, consequential, or
                punitive damages, including but not limited to loss of profits, data,
                goodwill, or other intangible losses, arising out of or in connection
                with your use of the Platform.
              </p>
              <p>
                In no event shall our total liability exceed the amount paid by you,
                if any, for accessing the Platform during the twelve (12) months
                preceding the claim.
              </p>
            </Section>

            <Section title="10. Third-Party Links">
              <p>
                The Platform may contain links to third-party websites, services, or
                advertisements. LoktantraVani does not endorse, control, or assume
                responsibility for the content, privacy policies, or practices of any
                third-party sites. You access third-party links at your own risk.
              </p>
            </Section>

            <Section title="11. Modification of Terms">
              <p>
                We reserve the right to modify these Terms at any time. Changes will
                be posted on this page with an updated effective date. Your continued
                use of the Platform after any changes constitutes acceptance of the
                revised Terms. We encourage you to review this page periodically.
              </p>
            </Section>

            <Section title="12. Governing Law &amp; Jurisdiction">
              <p>
                These Terms shall be governed by and construed in accordance with the
                laws of India. Any disputes arising out of or relating to these Terms
                or the Platform shall be subject to the exclusive jurisdiction of the
                courts of India.
              </p>
            </Section>

            <Section title="13. Contact Us">
              <p>
                If you have any questions or concerns about these Terms, please
                contact us at:
              </p>
              <p className="font-bold">
                <a href="mailto:admin@loktantravani.in" className="underline text-primary">
                  admin@loktantravani.in
                </a>
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
