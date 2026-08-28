import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import * as React from "react";
import { Resend } from "resend";

const PRIMARY = "#8B2020";
const GOLD = "#C9A96E";
const DARK = "#1A0A0A";
const MID = "#d90429";

function getPropertiesApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.SITE_URL ||
    "https://gulfshoregroup.com"
  );
}

interface TourEmailProps {
  recipientName?: string;
  propertyAddress?: string;
}

export function TourEmail({ recipientName = "Client", propertyAddress }: TourEmailProps) {
  const previewText = "Tour Request Received - Gulfshore Group";

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Poppins"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrJJfecg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body
          style={{
            backgroundColor: "#F4F4F5",
            margin: 0,
            padding: "40px 0",
            fontFamily: "'Poppins', Arial, sans-serif",
          }}
        >
          <Container
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              padding: "0",
              backgroundColor: "#FFFFFF",
              borderRadius: "4px",
              overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            }}
          >
            {/* ── Premium Header ── */}
            <Section style={{ background: "#FFFFFF", padding: "40px 40px" }}>
              <table align="center" border={0} cellPadding="0" cellSpacing="0" role="presentation">
                <tbody>
                  <tr>
                    <td style={{ paddingRight: "16px", verticalAlign: "middle" }}>
                      <Img
                        src={`${getPropertiesApiBaseUrl()}/logored.svg`}
                        width="56"
                        height="56"
                        alt="Gulfshore Group Logo"
                        style={{ display: "block" }}
                      />
                    </td>
                    <td style={{ verticalAlign: "middle", textAlign: "left" }}>
                      <Text
                        style={{
                          fontSize: "26px",
                          fontWeight: "700",
                          color: "#D90429",
                          margin: "0 0 4px 0",
                          fontFamily: "'Poppins', Arial, sans-serif",
                          letterSpacing: "0.02em",
                          lineHeight: "1",
                        }}
                      >
                        GULFSHORE GROUP
                      </Text>
                      <Text
                        style={{
                          fontSize: "18px",
                          color: "#4B5563",
                          margin: "0",
                          fontFamily: "'Poppins', Arial, sans-serif",
                          fontWeight: "500",
                          lineHeight: "1",
                        }}
                      >
                        London Forster Realty
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* ── Title Area ── */}
            <Section style={{ backgroundColor: "#FFFFFF", padding: "48px 40px 0", textAlign: "center" as const }}>
              <Heading
                as="h1"
                style={{
                  fontSize: "22px",
                  fontWeight: "400",
                  color: DARK,
                  margin: "0 0 12px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                  lineHeight: "1.4",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Tour Request Received
              </Heading>

              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "0 0 24px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                We have received your request to tour the property.
              </Text>

              <Section style={{ margin: "0 auto", maxWidth: "60px" }}>
                <Hr style={{ borderColor: GOLD, borderWidth: "1px", margin: "0" }} />
              </Section>
            </Section>

            {/* ── Content ── */}
            <Section style={{ backgroundColor: "#FFF", padding: "32px 40px 16px" }}>
              <Text
                style={{
                  fontSize: "16px",
                  color: DARK,
                  margin: 0,
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Dear <strong>{recipientName}</strong>,
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#444444",
                  margin: "12px 0 0",
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Thank you for your interest! We have successfully received your request to tour the property{propertyAddress ? ` at ${propertyAddress}` : ""}.
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#444444",
                  margin: "12px 0 0",
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                One of our luxury real estate advisors will be in touch with you shortly to confirm the exact date, time, and details for your private showing.
              </Text>
            </Section>

            {/* ── CTA Section ── */}
            <Section
              style={{
                backgroundColor: "#FFF",
                padding: "32px 40px",
                textAlign: "center" as const,
                borderTop: `3px solid ${PRIMARY}`,
              }}
            >
              <Text
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: DARK,
                  margin: "0 0 8px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Questions?
              </Text>
              <Text
                style={{
                  fontSize: "13px",
                  color: "#000000",
                  margin: "0 0 24px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Our concierge team is available 7 days a week for exclusive tours and inquiries.
              </Text>
              <Button
                href={`${getPropertiesApiBaseUrl()}/contact`}
                style={{
                  backgroundColor: MID,
                  color: "#FFFFFF",
                  padding: "14px 36px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  display: "inline-block",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Contact Our Team
              </Button>
            </Section>

            {/* ── Footer ── */}
            <Section
              style={{
                backgroundColor: DARK,
                padding: "28px 40px",
                textAlign: "center" as const,
              }}
            >
              <Text
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  margin: "0 0 12px",
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Gulfshore Group | London Forster Realty
              </Text>

              <Hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "20px 0 16px" }} />

              <Text
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.25)",
                  margin: 0,
                  letterSpacing: "0.05em",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                © {new Date().getFullYear()} {getPropertiesApiBaseUrl().replace('https://', '')} · ALL RIGHTS RESERVED
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// ─── Send Function ────────────────────────────────────────────────────────────

interface SendTourEmailOptions {
  resendApiKey?: string;
  to: string;
  recipientName?: string;
  propertyAddress?: string;
  from?: string;
  subject?: string;
}

export async function sendTourEmail(
  options: SendTourEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = options.resendApiKey ?? process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "No Resend API key provided" };

  const html = await render(
    <TourEmail recipientName={options.recipientName} propertyAddress={options.propertyAddress} />
  );

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: options.from ?? process.env.RESEND_FROM_EMAIL!,
    to: options.to,
    subject: options.subject ?? "Tour Request Received - Gulfshore Group",
    html,
  });

  if (error) {
    console.error("Resend error (Tour Email):", error);
    return { success: false, error: error.message };
  }

  console.log(`Tour email sent. ID: ${data?.id}`);
  return { success: true, id: data?.id };
}
