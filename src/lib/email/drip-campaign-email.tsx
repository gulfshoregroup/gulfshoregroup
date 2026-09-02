import {
  Body,
  Container,
  Font,
  Head,
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

const PRIMARY = "#8B2020";          // deep crimson
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

interface DripCampaignEmailProps {
  recipientName?: string;
  messageContent: string;
  subjectTitle?: string;
}

export function DripCampaignEmail({ recipientName, messageContent, subjectTitle }: DripCampaignEmailProps) {
  const previewText = subjectTitle || "Updates from Gulfshore Group";

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

            {/* ── Content ── */}
            <Section style={{ backgroundColor: "#FFF", padding: "12px 40px 16px" }}>
              {messageContent.split("<br/>").map((paragraph, index) => (
                <Text
                  key={index}
                  style={{
                    fontSize: "15px",
                    color: "#444444",
                    margin: "0 0 16px",
                    lineHeight: "1.6",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: paragraph }}
                />
              ))}

              <Text
                style={{
                  fontSize: "15px",
                  color: "#444444",
                  marginTop: "32px",
                  marginBottom: 0,
                  lineHeight: "1.6",
                  fontFamily: "'Poppins', Arial, sans-serif",
                  fontWeight: 500,
                }}
              >
                {subjectTitle ? `${subjectTitle} - ` : ""}Dimitri Schwarz, Your SW Florida Realtor 239.992.9119
              </Text>
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
                You're receiving this email because you subscribed to updates from Gulfshore Group.<br />
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

interface SendDripEmailOptions {
  resendApiKey?: string;
  to: string;
  recipientName?: string;
  from?: string;
  subject: string;
  messageContent: string;
  subjectTitle?: string;
}

export async function sendDripEmail(
  options: SendDripEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = options.resendApiKey ?? process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "No Resend API key provided" };

  const html = await render(
    <DripCampaignEmail 
      recipientName={options.recipientName} 
      messageContent={options.messageContent}
      subjectTitle={options.subjectTitle}
    />
  );

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: options.from ?? process.env.RESEND_FROM_EMAIL!,
    to: options.to,
    subject: options.subject,
    html,
  });

  if (error) {
    console.error("Resend error (Drip Email):", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}
