import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import { EmailLayout, emailText } from "./layout";

export type LeadEmailData = {
  name: string;
  phone: string;
  email: string | null;
  budgetRange: string | null;
  message: string;
  sourcePage: string;
};

/** Sent to the team for every new lead from the contact form. */
export function LeadNotificationEmail({
  lead,
  brandName,
  adminUrl,
  whatsappUrl,
}: {
  lead: LeadEmailData;
  brandName: string;
  adminUrl: string;
  whatsappUrl: string;
}) {
  const rows: [string, React.ReactNode][] = [
    ["Nombre", lead.name],
    [
      "Teléfono",
      <Link key="phone" href={whatsappUrl}>
        {lead.phone}
      </Link>,
    ],
    [
      "Email",
      lead.email ? (
        <Link key="email" href={`mailto:${lead.email}`}>
          {lead.email}
        </Link>
      ) : null,
    ],
    ["Presupuesto", lead.budgetRange],
    ["Enviada desde", lead.sourcePage],
  ];

  return (
    <EmailLayout preview={`${lead.name}: ${lead.message.slice(0, 90)}`} brandName={brandName}>
      <Heading as="h1" style={{ ...emailText, fontSize: 20, fontWeight: 600 }}>
        Nueva consulta web
      </Heading>
      {rows
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <Text key={label} style={{ ...emailText, margin: "0 0 6px" }}>
            <span style={{ color: "#5e5a53" }}>{label}:</span> <strong>{value}</strong>
          </Text>
        ))}
      <Hr style={{ margin: "20px 0" }} />
      <Text style={{ ...emailText, whiteSpace: "pre-wrap" }}>{lead.message}</Text>
      <Section style={{ marginTop: 24 }}>
        <Button
          href={whatsappUrl}
          style={{
            backgroundColor: "#111a0d",
            color: "#f4f3f0",
            padding: "12px 20px",
            fontSize: 14,
          }}
        >
          Responder por WhatsApp
        </Button>
      </Section>
      <Text style={{ ...emailText, fontSize: 13, marginTop: 24 }}>
        <Link href={adminUrl}>Ver la consulta en el panel</Link>
        {lead.email ? " · Respondiendo este email le escribís directamente." : ""}
      </Text>
    </EmailLayout>
  );
}
