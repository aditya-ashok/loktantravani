/**
 * GET /api/whatsapp-card?type=achievement&title=...&stat=...&subtitle=...
 *
 * Generates a 1080x1080 shareable WhatsApp/Instagram card as a PNG image
 * using Next.js ImageResponse (OG image generation).
 *
 * Query params:
 *   type       — "achievement" | "factcheck" | "quote" | "comparison" | "scheme"
 *   title      — main heading / scheme name / quote text
 *   stat       — big number (e.g. "50 Crore")
 *   subtitle   — supporting line
 *   claim      — (factcheck) the false claim
 *   reality    — (factcheck) the truth
 *   upa        — (comparison) UPA-era stat
 *   nda        — (comparison) NDA-era stat
 *   metric     — (comparison) what is being compared
 *   growth     — (scheme) growth percentage
 *   beneficiaries — (scheme) beneficiary count
 *
 * Example:
 *   /api/whatsapp-card?type=achievement&title=Ayushman%20Bharat&stat=50%20Crore&subtitle=Free%20Healthcare
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SAFFRON = "#FF9933";
const WHITE = "#FFFFFF";
const GREEN = "#138808";
const NAVY = "#000080";
const DARK = "#1a1a2e";
const LIGHT_SAFFRON = "#FFF5EB";

// --- Card renderers by type ---

function AchievementCard({
  title,
  stat,
  subtitle,
}: {
  title: string;
  stat: string;
  subtitle: string;
}) {
  return (
    <BaseCard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: 24,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: NAVY,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: SAFFRON,
            lineHeight: 1,
          }}
        >
          {stat}
        </div>
        <div style={{ fontSize: 32, color: "#555", fontWeight: 500 }}>
          {subtitle}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            padding: "12px 40px",
            background: SAFFRON,
            color: WHITE,
            borderRadius: 12,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          Under Modi Government
        </div>
      </div>
    </BaseCard>
  );
}

function FactcheckCard({
  claim,
  reality,
}: {
  claim: string;
  reality: string;
}) {
  return (
    <BaseCard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
          gap: 32,
          padding: "0 60px",
        }}
      >
        {/* Header badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "#DC2626",
            color: WHITE,
            padding: "16px 48px",
            borderRadius: 16,
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: 3,
          }}
        >
          FACT CHECK
        </div>

        {/* Two columns */}
        <div
          style={{
            display: "flex",
            width: "100%",
            gap: 32,
            flex: 1,
            alignItems: "stretch",
          }}
        >
          {/* Claim */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "#FEE2E2",
              borderRadius: 20,
              padding: 32,
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#DC2626",
                letterSpacing: 2,
              }}
            >
              CLAIM
            </div>
            <div style={{ fontSize: 28, color: DARK, fontWeight: 500 }}>
              {claim}
            </div>
          </div>

          {/* Reality */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "#DCFCE7",
              borderRadius: 20,
              padding: 32,
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: GREEN,
                letterSpacing: 2,
              }}
            >
              REALITY
            </div>
            <div style={{ fontSize: 28, color: DARK, fontWeight: 500 }}>
              {reality}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

function QuoteCard({ title }: { title: string }) {
  return (
    <BaseCard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: 32,
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        {/* Large quote mark */}
        <div
          style={{
            fontSize: 140,
            color: SAFFRON,
            lineHeight: 0.6,
            fontWeight: 900,
            opacity: 0.4,
          }}
        >
          &ldquo;
        </div>
        <div
          style={{
            fontSize: 40,
            color: DARK,
            fontWeight: 600,
            lineHeight: 1.4,
            fontStyle: "italic",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 140,
            color: SAFFRON,
            lineHeight: 0.3,
            fontWeight: 900,
            opacity: 0.4,
          }}
        >
          &rdquo;
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 60,
              height: 4,
              background: SAFFRON,
              borderRadius: 2,
            }}
          />
          <div
            style={{ fontSize: 30, fontWeight: 700, color: NAVY }}
          >
            PM Narendra Modi
          </div>
          <div
            style={{
              width: 60,
              height: 4,
              background: GREEN,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </BaseCard>
  );
}

function ComparisonCard({
  metric,
  upa,
  nda,
}: {
  metric: string;
  upa: string;
  nda: string;
}) {
  return (
    <BaseCard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
          gap: 24,
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: NAVY,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          {metric}
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            gap: 40,
            flex: 1,
            alignItems: "center",
          }}
        >
          {/* UPA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              alignItems: "center",
              gap: 20,
              background: "#F3F4F6",
              borderRadius: 24,
              padding: "48px 32px",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#6B7280",
                letterSpacing: 4,
              }}
            >
              UPA ERA
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, color: "#9CA3AF" }}>
              {upa}
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#D1D5DB",
            }}
          >
            VS
          </div>

          {/* NDA */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              alignItems: "center",
              gap: 20,
              background: LIGHT_SAFFRON,
              borderRadius: 24,
              padding: "48px 32px",
              border: `3px solid ${SAFFRON}`,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: SAFFRON,
                letterSpacing: 4,
              }}
            >
              NDA ERA
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, color: SAFFRON }}>
              {nda}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

function SchemeCard({
  title,
  beneficiaries,
  growth,
  subtitle,
}: {
  title: string;
  beneficiaries: string;
  growth: string;
  subtitle: string;
}) {
  return (
    <BaseCard>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: 28,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        {/* Scheme badge */}
        <div
          style={{
            display: "flex",
            padding: "12px 36px",
            background: NAVY,
            color: WHITE,
            borderRadius: 50,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Government Scheme
        </div>

        {/* Scheme name */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: SAFFRON,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          {/* Beneficiaries */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: LIGHT_SAFFRON,
              borderRadius: 20,
              padding: "28px 40px",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 56, fontWeight: 900, color: SAFFRON }}>
              {beneficiaries}
            </div>
            <div style={{ fontSize: 22, color: "#888", fontWeight: 600 }}>
              Beneficiaries
            </div>
          </div>

          {/* Growth */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#DCFCE7",
              borderRadius: 20,
              padding: "28px 40px",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 56, fontWeight: 900, color: GREEN }}>
              {growth}
            </div>
            <div style={{ fontSize: 22, color: "#888", fontWeight: 600 }}>
              Growth
            </div>
          </div>
        </div>

        {subtitle && (
          <div style={{ fontSize: 28, color: "#666", fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>
    </BaseCard>
  );
}

function ArticleCard({
  title,
  author,
  category,
  imageUrl,
  authorPhoto,
}: {
  title: string;
  author: string;
  category: string;
  imageUrl: string;
  authorPhoto: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 630,
        background: WHITE,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top tricolor stripe */}
      <div style={{ display: "flex", width: "100%", height: 6 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: WHITE }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Main content - two columns */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left: Article image */}
        <div style={{ display: "flex", width: 480, position: "relative" }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "flex", width: "100%", height: "100%", background: `linear-gradient(135deg, ${SAFFRON}, ${NAVY})`, alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 80, color: WHITE, fontWeight: 900 }}>LV</div>
            </div>
          )}
          {/* Category badge overlay */}
          <div style={{
            display: "flex",
            position: "absolute",
            bottom: 16,
            left: 16,
            background: SAFFRON,
            color: WHITE,
            padding: "6px 18px",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}>
            {category}
          </div>
        </div>

        {/* Right: Text content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "40px 44px 32px",
          justifyContent: "space-between",
          background: `linear-gradient(180deg, ${WHITE} 0%, #FAFAFA 100%)`,
        }}>
          {/* Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>
              <span style={{ color: SAFFRON }}>Loktantra</span>
              <span style={{ color: NAVY }}>Vani</span>
            </div>
          </div>

          {/* Title */}
          <div style={{
            display: "flex",
            fontSize: title.length > 80 ? 30 : title.length > 50 ? 36 : 42,
            fontWeight: 900,
            color: DARK,
            lineHeight: 1.25,
            letterSpacing: -0.5,
            marginTop: 20,
          }}>
            {title.slice(0, 120)}
          </div>

          {/* Author row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: "auto",
            paddingTop: 20,
          }}>
            {/* Author avatar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={authorPhoto}
              alt=""
              style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${SAFFRON}` }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: DARK }}>{author}</div>
              <div style={{ fontSize: 16, color: "#888" }}>loktantravani.in</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tricolor stripe */}
      <div style={{ display: "flex", width: "100%", height: 6 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: WHITE }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>
    </div>
  );
}

// --- Shared layout wrapper ---

function BaseCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: 1080,
        background: `linear-gradient(180deg, ${LIGHT_SAFFRON} 0%, ${WHITE} 40%, ${WHITE} 100%)`,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle Ashoka Chakra watermark */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 340,
          left: 340,
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: `3px solid rgba(0, 0, 128, 0.04)`,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 440,
          left: 440,
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: `2px solid rgba(0, 0, 128, 0.03)`,
        }}
      />

      {/* Top tricolor stripe */}
      <div style={{ display: "flex", width: "100%", height: 8 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: WHITE }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 0 20px",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          <span style={{ color: SAFFRON }}>Loktantra</span>
          <span style={{ color: NAVY }}>Vani</span>
        </div>
      </div>

      {/* Thin divider */}
      <div
        style={{
          display: "flex",
          width: "80%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${SAFFRON}, transparent)`,
          margin: "0 auto 24px",
        }}
      />

      {/* Main content area */}
      {children}

      {/* Bottom section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "20px 0 8px",
        }}
      >
        {/* Share CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#25D366",
            color: WHITE,
            padding: "14px 36px",
            borderRadius: 50,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          Share on WhatsApp
        </div>

        <div style={{ fontSize: 20, color: "#999", fontWeight: 500 }}>
          loktantravani.in
        </div>
      </div>

      {/* Bottom tricolor stripe */}
      <div style={{ display: "flex", width: "100%", height: 8 }}>
        <div style={{ flex: 1, background: SAFFRON }} />
        <div style={{ flex: 1, background: WHITE }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>
    </div>
  );
}

// --- Route handler ---

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || "achievement";
  const title = sp.get("title") || "";
  const stat = sp.get("stat") || "";
  const subtitle = sp.get("subtitle") || "";
  const claim = sp.get("claim") || "";
  const reality = sp.get("reality") || "";
  const upa = sp.get("upa") || "";
  const nda = sp.get("nda") || "";
  const metric = sp.get("metric") || "";
  const growth = sp.get("growth") || "";
  const beneficiaries = sp.get("beneficiaries") || "";
  const imageUrl = sp.get("image") || "";
  const author = sp.get("author") || "LoktantraVani";
  const category = sp.get("category") || "India";
  const authorPhoto = sp.get("authorPhoto") || `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=FF9933&color=fff&size=128&bold=true`;

  // Article card — special 1200x630 size for OG
  if (type === "article") {
    const card = (
      <ArticleCard
        title={title || "LoktantraVani"}
        author={author}
        category={category}
        imageUrl={imageUrl}
        authorPhoto={authorPhoto}
      />
    );
    return new ImageResponse(card, { width: 1200, height: 630 });
  }

  let card: React.ReactElement;

  switch (type) {
    case "factcheck":
      card = (
        <FactcheckCard
          claim={claim || "No claim provided"}
          reality={reality || "No reality provided"}
        />
      );
      break;

    case "quote":
      card = <QuoteCard title={title || "Sabka Saath, Sabka Vikas, Sabka Vishwas, Sabka Prayas"} />;
      break;

    case "comparison":
      card = (
        <ComparisonCard
          metric={metric || title || "Performance"}
          upa={upa || "—"}
          nda={nda || "—"}
        />
      );
      break;

    case "scheme":
      card = (
        <SchemeCard
          title={title || "Government Scheme"}
          beneficiaries={beneficiaries || stat || "—"}
          growth={growth || "—"}
          subtitle={subtitle}
        />
      );
      break;

    case "achievement":
    default:
      card = (
        <AchievementCard
          title={title || "India's Achievement"}
          stat={stat || "—"}
          subtitle={subtitle || "Building a New India"}
        />
      );
      break;
  }

  return new ImageResponse(card, {
    width: 1080,
    height: 1080,
  });
}
