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
  Link,
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

interface InquiryEmailProps {
  recipientName?: string;
  message?: string;
}

export function InquiryEmail({ recipientName = "Valued Client", message = "" }: InquiryEmailProps) {
  const previewText = "Thank you for your inquiry - Gulfshore Group";

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
                Inquiry Received
              </Heading>

              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "0 0 24px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Thank you for reaching out to us.
              </Text>

              <Section style={{ margin: "0 auto", maxWidth: "60px" }}>
                <Hr style={{ borderColor: GOLD, borderWidth: "1px", margin: "0" }} />
              </Section>
            </Section>

            {/* ── Content ── */}
            <Section style={{ backgroundColor: "#FFF", padding: "16px 40px 32px" }}>
              <Text
                style={{
                  fontSize: "15px",
                  color: DARK,
                  margin: "0 0 16px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                Dear {recipientName},
              </Text>
              <Text
                style={{
                  fontSize: "15px",
                  color: "#1A0A0A",
                  margin: "0 0 16px",
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                We have successfully received your message and our team will get back to you shortly.
              </Text>
              <Text
                style={{
                  fontSize: "15px",
                  color: "#1A0A0A",
                  margin: "0 0 32px",
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                For immediate assistance, please feel free to reply to this email or call us directly.
              </Text>

              <Section
                style={{
                  backgroundColor: "#FAF7F2",
                  padding: "24px",
                  border: "1px solid #E8DDD8",
                  borderRadius: "4px",
                }}
              >
                <Heading
                  as="h3"
                  style={{
                    fontSize: "13px",
                    color: "#666666",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  Your Message
                </Heading>
                <Text
                  style={{
                    fontSize: "14px",
                    color: DARK,
                    margin: "0",
                    fontStyle: "italic",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  "{message || 'No additional message provided.'}"
                </Text>
              </Section>
            </Section>

            {/* ── Footer ── */}
            <Section
              style={{
                backgroundColor: DARK,
                padding: "32px 40px",
                textAlign: "center" as const,
              }}
            >
              <Text
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.5)",
                  margin: "0 0 8px",
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                You're receiving this because you contacted us through our website.<br />
                All listings courtesy of respective brokerages. Equal Housing Opportunity.
              </Text>
              
              <Text
                style={{
                  fontSize: "12px",
                  margin: "0 0 16px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                <Link href={`${getPropertiesApiBaseUrl()}/unsubscribe`} style={{ color: "#C9A96E", textDecoration: "none" }}>Manage Preferences</Link>
                <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 8px" }}>|</span>
                <Link href={`${getPropertiesApiBaseUrl()}/unsubscribe`} style={{ color: "#C9A96E", textDecoration: "none" }}>Unsubscribe</Link>
              </Text>

              <Hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

              <Text
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.3)",
                  margin: 0,
                  letterSpacing: "0.05em",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                © {new Date().getFullYear()} {getPropertiesApiBaseUrl().replace('https://', '').replace(/\/$/, '')} - ALL RIGHTS RESERVED
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// ─── Send Function ────────────────────────────────────────────────────────────

interface SendInquiryEmailOptions {
  resendApiKey?: string;
  to: string;
  recipientName?: string;
  message?: string;
  from?: string;
  subject?: string;
}

export async function sendInquiryEmail(
  options: SendInquiryEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = options.resendApiKey ?? process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "No Resend API key provided" };

  const html = await render(
    <InquiryEmail recipientName={options.recipientName} message={options.message} />
  );

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: options.from ?? process.env.RESEND_FROM_EMAIL!,
    to: options.to,
    subject: options.subject ?? "Thank you for reaching out to Gulfshore Group",
    html,
  });

  if (error) {
    console.error("Resend error (Inquiry Email):", error);
    return { success: false, error: error.message };
  }

  console.log(`Inquiry email sent. ID: ${data?.id}`);
  return { success: true, id: data?.id };
}
