import { Heading, Text } from "@react-email/components";
import { EmailLayout, emailText } from "./layout";

/** Optional acknowledgement to the person who wrote (LEAD_CONFIRMATION_EMAIL=true). */
export function LeadConfirmationEmail({
  name,
  message,
  brandName,
  phone,
}: {
  name: string;
  message: string;
  brandName: string;
  phone: string | null;
}) {
  const firstName = name.split(/\s+/)[0];
  return (
    <EmailLayout preview="Recibimos tu consulta" brandName={brandName}>
      <Heading as="h1" style={{ ...emailText, fontSize: 20, fontWeight: 600 }}>
        ¡Gracias, {firstName}!
      </Heading>
      <Text style={emailText}>
        Recibimos tu consulta y te vamos a responder a la brevedad.
        {phone ? ` Si preferís, también podés escribirnos por WhatsApp al ${phone}.` : ""}
      </Text>
      <Text style={{ ...emailText, color: "#5e5a53", fontSize: 13 }}>Tu mensaje:</Text>
      <Text style={{ ...emailText, whiteSpace: "pre-wrap", fontStyle: "italic" }}>{message}</Text>
      <Text style={emailText}>{brandName}</Text>
    </EmailLayout>
  );
}
