import { describe, it, expect } from "vitest";
import { generatePdf } from "@/lib/generatePdf";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("generates PDF without errors", async () => {
    const doc = await generatePdf({
      reclamationNumber: "R-20260214-1200",
      nazivKupca: "Čačak d.o.o.",
      adresa: "Železnička 1",
      kontaktOsoba: "Đorđe Šimić",
      telefon: "+381 11 123 456",
      email: "test@example.com",
      modelUredjaja: "EKO-HP12",
      serijskiBroj: "SN-123",
      tipFluida: "R290",
      tipSistema: "Monoblock",
      opisReklamacije: "Test šđčćž",
      izjavaKupca: "",
      mesto: "Niš",
      datum: "14.02.2026",
      signatureDataUrl: null,
      logoDataUrl: "",
    });
    const bytes = doc.output("arraybuffer");
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
