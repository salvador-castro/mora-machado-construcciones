import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

const INK = "#111a0d";
const PAPER = "#f4f3f0";

/** Shared frame for transactional emails (inline styles: email clients ignore CSS files). */
export function EmailLayout({
  preview,
  brandName,
  children,
}: {
  preview: string;
  brandName: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: PAPER, fontFamily: "Helvetica, Arial, sans-serif", margin: 0 }}
      >
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
          <Text style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: INK }}>
            {brandName}
          </Text>
          <Section
            style={{ backgroundColor: "#ffffff", padding: "24px", border: `1px solid ${INK}1f` }}
          >
            {children}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailText = { color: INK, fontSize: 15, lineHeight: "24px", margin: "0 0 16px" };
