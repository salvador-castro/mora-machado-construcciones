import { Heading, Text } from "@react-email/components";
import { EmailLayout, emailText } from "./layout";

export function TestEmail({ brandName, sentBy }: { brandName: string; sentBy: string }) {
  return (
    <EmailLayout preview="Email de prueba" brandName={brandName}>
      <Heading as="h1" style={{ ...emailText, fontSize: 20, fontWeight: 600 }}>
        Email de prueba
      </Heading>
      <Text style={emailText}>
        Si estás leyendo esto, el envío de emails del sitio funciona. Las consultas del formulario
        de contacto van a llegar a esta casilla.
      </Text>
      <Text style={{ ...emailText, color: "#5e5a53", fontSize: 13 }}>Enviado por {sentBy}.</Text>
    </EmailLayout>
  );
}
