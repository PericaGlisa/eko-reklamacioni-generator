import jsPDF from "jspdf";
import robotoBase64 from "roboto-base64";

export interface ReclamationData {
  reclamationNumber: string;
  nazivKupca: string;
  adresa: string;
  kontaktOsoba: string;
  telefon: string;
  email: string;
  modelUredjaja: string;
  serijskiBroj: string;
  tipFluida: string;
  tipSistema: string;
  opisReklamacije: string;
  izjavaKupca: string;
  mesto: string;
  datum: string;
  signatureDataUrl: string | null;
  logoDataUrl: string;
}

const FONT_FAMILY = "Roboto";
const REGULAR_FONT_FILE = "Roboto-Regular.ttf";
const BOLD_FONT_FILE = "Roboto-Bold.ttf";

const ensureFont = (doc: jsPDF) => {
  const roboto = robotoBase64 as unknown as {
    normal: string;
    bold: string;
    italics: string;
    bolditalics: string;
  };
  doc.addFileToVFS(REGULAR_FONT_FILE, roboto.normal);
  doc.addFileToVFS(BOLD_FONT_FILE, roboto.bold);
  doc.addFont(REGULAR_FONT_FILE, FONT_FAMILY, "normal");
  doc.addFont(BOLD_FONT_FILE, FONT_FAMILY, "bold");
  doc.setFont(FONT_FAMILY, "normal");
};

// Premium color palette
const C = {
  dark: [21, 42, 66] as [number, number, number],       // deep navy
  primary: [28, 100, 52] as [number, number, number],    // EKO green
  mid: [90, 100, 115] as [number, number, number],       // medium gray
  light: [140, 148, 158] as [number, number, number],    // light gray text
  line: [215, 222, 230] as [number, number, number],     // subtle line
  bg: [245, 247, 250] as [number, number, number],       // section bg
  white: [255, 255, 255] as [number, number, number],
};

export async function generatePdf(data: ReclamationData): Promise<jsPDF> {
  const doc = new jsPDF("p", "mm", "a4");
  ensureFont(doc);
  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const rightX = pageWidth - margin;
  let y = 14;

  // ── Top accent bar ──
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pageWidth, 3, "F");

  y = 14;

  // ── Logo ──
  try {
    doc.addImage(data.logoDataUrl, "PNG", margin, y - 2, 34, 13);
  } catch { /* skip */ }

  // ── Company identity ──
  const cx = margin + 38;
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.dark);
  doc.text("EKO ELEKTROFRIGO DOO, BEOGRAD", cx, y + 4);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.mid);
  doc.text("PIB: 100833888  ·  MB: 17328972", cx, y + 9);
  doc.text("Svetolika Nikačevića 11, Beograd, Srbija", cx, y + 13);

  // Right column contacts
  doc.setFontSize(7);
  doc.setTextColor(...C.mid);
  doc.text("Tel: 011 375 7287 / 7288", rightX, y + 4, { align: "right" });
  doc.text("Fax: 011 375 7289", rightX, y + 8, { align: "right" });
  doc.text("prodaja@eef.rs  ·  servis@eef.rs", rightX, y + 12, { align: "right" });
  doc.text("www.eef.rs", rightX, y + 16, { align: "right" });

  y += 22;

  // ── Divider ──
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.4);
  doc.line(margin, y, rightX, y);
  y += 8;

  // ── Title block ──
  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(...C.dark);
  doc.text("REKLAMACIONI LIST", pageWidth / 2, y, { align: "center" });
  y += 3;

  // Green underline accent
  const titleWidth = doc.getTextWidth("REKLAMACIONI LIST");
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - titleWidth / 2, y, pageWidth / 2 + titleWidth / 2, y);
  y += 6;

  // Reclamation number & date
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  doc.text(`Broj: ${data.reclamationNumber}`, margin, y);
  doc.text(`Datum: ${data.datum}`, rightX, y, { align: "right" });
  y += 10;

  // ── Section helpers ──
  const sectionTitle = (num: string, title: string) => {
    // Background strip
    doc.setFillColor(...C.bg);
    doc.roundedRect(margin, y - 4, contentWidth, 9, 1.5, 1.5, "F");

    // Green accent dot
    doc.setFillColor(...C.primary);
    doc.circle(margin + 4, y, 1.2, "F");

    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.dark);
    doc.text(`${num}  ${title}`, margin + 8, y + 0.5);
    y += 10;
  };

  const field = (label: string, value: string) => {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.text(label, margin + 2, y);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.dark);
    doc.text(value || "—", margin + 44, y);
    y += 6.5;
  };

  const textBlock = (label: string, value: string) => {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.text(label, margin + 2, y);
    y += 5;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(value || "—", contentWidth - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 5 + 4;
  };

  // ── Section 1 ──
  sectionTitle("01", "PODACI O KUPCU");
  field("Naziv kupca", data.nazivKupca);
  field("Adresa", data.adresa);
  field("Kontakt osoba", data.kontaktOsoba);
  field("Telefon", data.telefon);
  field("E-mail", data.email);
  y += 3;

  // ── Section 2 ──
  sectionTitle("02", "PODACI O UREĐAJU");
  field("Model uređaja", data.modelUredjaja);
  field("Serijski broj", data.serijskiBroj);
  field("Rashladno fluid", data.tipFluida);
  field("Tip sistema", data.tipSistema);
  y += 3;

  // ── Section 3 ──
  sectionTitle("03", "REKLAMACIJA");
  textBlock("Opis reklamacije / kvara", data.opisReklamacije);
  if (data.izjavaKupca) {
    textBlock("Izjava kupca", data.izjavaKupca);
  }
  y += 2;

  // ── Section 4 ──
  sectionTitle("04", "ZAVRŠNI PODACI");
  field("Mesto", data.mesto);
  field("Datum", data.datum);

  // Signature
  if (data.signatureDataUrl) {
    y += 6;
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.text("Potpis kupca:", margin + 2, y);
    y += 2;

    // Signature box
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + 1, y, 55, 22, 2, 2, "S");

    try {
      doc.addImage(data.signatureDataUrl, "PNG", margin + 3, y + 1, 51, 20);
    } catch { /* skip */ }
    y += 26;
  }

  // ── Footer ──
  const footerY = 282;

  // Bottom accent bar
  doc.setFillColor(...C.primary);
  doc.rect(0, 294, pageWidth, 3, "F");

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 6, rightX, footerY - 6);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.light);
  const footerText = "Dokument je generisan elektronski i važi bez pečata.";
  const footerTextWidth = doc.getTextWidth(footerText);
  doc.text(footerText, pageWidth / 2 - footerTextWidth / 2, footerY - 1);

  doc.setFontSize(6.5);
  doc.setTextColor(180, 185, 192);
  doc.text("EKO ELEKTROFRIGO DOO  ·  www.eef.rs  ·  servis@eef.rs", pageWidth / 2, footerY + 3.5, { align: "center" });

  return doc;
}
