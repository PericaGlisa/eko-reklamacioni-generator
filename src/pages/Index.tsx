import React, { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, FileDown, Share2, FileText, CheckCircle2, Building2, Cpu, ClipboardList, PenLine, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { generatePdf, ReclamationData } from "@/lib/generatePdf";
import { toast } from "@/hooks/use-toast";
import SignaturePad from "@/components/SignaturePad";
import FormProgressBar from "@/components/FormProgressBar";
import FormStepper from "@/components/FormStepper";
import ValidatedFormField from "@/components/ValidatedFormField";
import ekoLogo from "@/assets/eko-logo.png";

const formSchema = z.object({
  nazivKupca: z.string().trim().min(1, "Obavezno polje").max(200),
  adresa: z.string().trim().min(1, "Obavezno polje").max(300),
  kontaktOsoba: z.string().trim().min(1, "Obavezno polje").max(200),
  telefon: z.string().trim().min(1, "Obavezno polje").max(50),
  email: z.string().trim().email("Unesite ispravan email").max(255),
  modelUredjaja: z.string().trim().min(1, "Obavezno polje").max(200),
  serijskiBroj: z.string().trim().min(1, "Obavezno polje").max(100),
  tipFluida: z.enum(["R290", "R32"], { required_error: "Izaberite tip fluida" }),
  tipSistema: z.enum(["Monoblock", "Split sistem"], { required_error: "Izaberite tip sistema" }),
  opisReklamacije: z.string().trim().min(1, "Obavezno polje").max(2000),
  izjavaKupca: z.string().trim().max(2000).optional(),
  mesto: z.string().trim().max(200).optional(),
  datum: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

const REQUIRED_FIELDS: (keyof FormValues)[] = [
  "nazivKupca", "adresa", "kontaktOsoba", "telefon", "email",
  "modelUredjaja", "serijskiBroj", "tipFluida", "tipSistema", "opisReklamacije",
];

const SectionCard = ({ index, title, icon: Icon, children, sectionRef, stepIndex }: {
  index: number;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  sectionRef: React.Ref<HTMLElement>;
  stepIndex: number;
}) => (
  <section
    ref={sectionRef}
    data-step-index={stepIndex}
    className="premium-card rounded-2xl overflow-hidden animate-fade-in"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center gap-3 border-b border-border/60">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent">
        <Icon className="h-4.5 w-4.5 text-accent-foreground" />
      </div>
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Korak {index + 1}</span>
        <h2 className="section-heading text-lg leading-tight">{title}</h2>
      </div>
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
);

const Index = () => {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRefs = React.useRef<(HTMLElement | null)[]>([]);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveStep(index);
  };

  const reclamationNumber = useMemo(() => {
    const now = new Date();
    return `R-${format(now, "yyyyMMdd")}-${format(now, "HHmmss")}`;
  }, []);

  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      setLogoDataUrl(canvas.toDataURL("image/png"));
    };
    img.src = ekoLogo;
  }, []);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.stepIndex);
          if (!Number.isNaN(index)) {
            setActiveStep(index);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      },
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nazivKupca: "", adresa: "", kontaktOsoba: "", telefon: "", email: "",
      modelUredjaja: "", serijskiBroj: "", tipFluida: undefined, tipSistema: undefined,
      opisReklamacije: "", izjavaKupca: "", mesto: "", datum: new Date(),
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  const fieldValidity = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const key of REQUIRED_FIELDS) {
      const val = watchedValues[key];
      if (key === "email") {
        result[key] = typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      } else if (key === "tipFluida" || key === "tipSistema") {
        result[key] = !!val;
      } else {
        result[key] = typeof val === "string" && val.trim().length > 0;
      }
    }
    return result;
  }, [watchedValues]);

  const progress = useMemo(() => {
    const filled = Object.values(fieldValidity).filter(Boolean).length;
    return (filled / REQUIRED_FIELDS.length) * 100;
  }, [fieldValidity]);

  const onSubmit = useCallback(async (values: FormValues) => {
    setIsGenerating(true);
    // Small delay for animation effect
    await new Promise((r) => setTimeout(r, 600));
    const data: ReclamationData = {
      reclamationNumber,
      nazivKupca: values.nazivKupca,
      adresa: values.adresa,
      kontaktOsoba: values.kontaktOsoba,
      telefon: values.telefon,
      email: values.email,
      modelUredjaja: values.modelUredjaja,
      serijskiBroj: values.serijskiBroj,
      tipFluida: values.tipFluida,
      tipSistema: values.tipSistema,
      opisReklamacije: values.opisReklamacije,
      izjavaKupca: values.izjavaKupca || "",
      mesto: values.mesto || "",
      datum: format(values.datum, "dd.MM.yyyy"),
      signatureDataUrl,
      logoDataUrl,
    };
    try {
      const doc = await generatePdf(data);
      const blob = doc.output("blob");
      setPdfBlob(blob);
      setShowDialog(true);
    } finally {
      setIsGenerating(false);
    }
  }, [reclamationNumber, signatureDataUrl, logoDataUrl]);

  const downloadPdf = () => {
    if (!pdfBlob) {
      toast({
        title: "PDF nije spreman",
        description: "Prvo kliknite “Generiši PDF”, pa zatim “Preuzmi PDF”.",
        variant: "destructive",
      });
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reclamationNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Preuzimanje je pokrenuto",
      description: `Fajl: ${reclamationNumber}.pdf`,
    });
  };

  const sharePdf = async () => {
    if (!pdfBlob) return;
    const filename = `${reclamationNumber}.pdf`;
    const file = new File([pdfBlob], filename, { type: "application/pdf" });
    const subject = encodeURIComponent(`Reklamacija ${reclamationNumber}`);
    const body = encodeURIComponent(`U prilogu je reklamacioni list ${reclamationNumber}. Molimo dodajte PDF fajl ${filename}.`);

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Reklamacioni list",
          text: `U prilogu je reklamacioni list ${reclamationNumber}.`
        });
        return;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          downloadPdf();
          window.open(`mailto:?subject=${subject}&body=${body}`);
        }
        return;
      }
    }

    downloadPdf();
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-background pattern-bg">
      {/* Sticky Progress Bar */}
      <FormProgressBar progress={progress} />

      {/* Premium Hero Header */}
      <header className="hero-gradient text-primary-foreground">
        <div className="max-w-4xl mx-auto px-5 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
            <div className="flex-shrink-0 self-start bg-white/20 backdrop-blur-sm rounded-2xl p-2.5 shadow-lg border border-white/10">
              <img src={ekoLogo} alt="EKO Heat Pump" className="h-12 sm:h-14 w-auto brightness-0 invert drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base font-bold tracking-wide opacity-95">EKO ELEKTROFRIGO DOO, BEOGRAD</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5 mt-2 text-[10.5px] sm:text-[11px] text-white/70 leading-relaxed font-light">
                <div><span className="text-white/50 font-medium">PIB:</span> 100833888 &nbsp; <span className="text-white/50 font-medium">MB:</span> 17328972</div>
                <div><span className="text-white/50 font-medium">Tel:</span> 011 375 7287 / 7288</div>
                <div><span className="text-white/50 font-medium">Adresa:</span> Svetolika Nikačevića 11, Beograd</div>
                <div><span className="text-white/50 font-medium">Fax:</span> 011 375 7289</div>
                <div><span className="text-white/50 font-medium">E-mail:</span> prodaja@eef.rs / servis@eef.rs</div>
                <div><span className="text-white/50 font-medium">Web:</span> www.eef.rs</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold mb-1">Platforma</p>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">Reklamacioni List</h1>
              <p className="text-xs sm:text-sm text-white/70 mt-1">Brza digitalna reklamacija toplotnih pumpi</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-0.5">Broj</p>
              <p className="text-sm font-mono font-semibold text-white/80 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">{reclamationNumber}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-5 -mt-3 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Stepper Sidebar */}
        <div className="sticky top-16 self-start pt-6 hidden lg:block">
          <FormStepper fieldValidity={fieldValidity} activeStep={activeStep} onStepClick={scrollToSection} />
        </div>

        <div className="flex-1 max-w-2xl w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-10">

            {/* Section 1 – Customer */}
            <SectionCard
              index={0}
              title="Podaci o kupcu"
              icon={Building2}
              sectionRef={(el) => {
                sectionRefs.current[0] = el;
              }}
              stepIndex={0}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="nazivKupca" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.nazivKupca} className="sm:col-span-2">
                    <FormItem><FormLabel>Naziv kupca</FormLabel><FormControl><Input className="premium-input pr-10" placeholder="Unesite naziv kupca" {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="adresa" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.adresa} className="sm:col-span-2">
                    <FormItem><FormLabel>Adresa</FormLabel><FormControl><Input className="premium-input pr-10" placeholder="Unesite adresu" {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="kontaktOsoba" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.kontaktOsoba}>
                    <FormItem><FormLabel>Kontakt osoba</FormLabel><FormControl><Input className="premium-input pr-10" placeholder="Ime i prezime" {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="telefon" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.telefon}>
                    <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input className="premium-input pr-10" placeholder="+381..." {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.email} className="sm:col-span-2">
                    <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input className="premium-input pr-10" type="email" placeholder="email@primer.rs" {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
              </div>
            </SectionCard>

            {/* Section 2 – Device */}
            <SectionCard
              index={1}
              title="Podaci o uređaju"
              icon={Cpu}
              sectionRef={(el) => {
                sectionRefs.current[1] = el;
              }}
              stepIndex={1}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="modelUredjaja" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.modelUredjaja}>
                    <FormItem><FormLabel>Model uređaja</FormLabel><FormControl><Input className="premium-input pr-10" placeholder="npr. EKO-HP12" {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="serijskiBroj" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.serijskiBroj}>
                    <FormItem><FormLabel>Serijski broj</FormLabel><FormControl><Input className="premium-input pr-10" placeholder="Unesite serijski broj" {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="tipFluida" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Tip rashladnog fluida
                      {fieldValidity.tipFluida && <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-scale-in" />}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col sm:flex-row gap-3 pt-1">
                        {["R290", "R32"].map((v) => (
                          <label key={v} htmlFor={v.toLowerCase()} className={cn(
                            "flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-sm font-medium w-full sm:w-auto",
                            field.value === v ? "border-primary bg-accent text-accent-foreground shadow-sm" : "border-border bg-background hover:border-primary/30"
                          )}>
                            <RadioGroupItem value={v} id={v.toLowerCase()} />
                            {v}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipSistema" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Tip sistema
                      {fieldValidity.tipSistema && <CheckCircle2 className="h-3.5 w-3.5 text-primary animate-scale-in" />}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col sm:flex-row gap-3 pt-1">
                        {[{ v: "Monoblock", id: "mono" }, { v: "Split sistem", id: "split" }].map(({ v, id }) => (
                          <label key={id} htmlFor={id} className={cn(
                            "flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 text-sm font-medium w-full sm:w-auto",
                            field.value === v ? "border-primary bg-accent text-accent-foreground shadow-sm" : "border-border bg-background hover:border-primary/30"
                          )}>
                            <RadioGroupItem value={v} id={id} />
                            {v}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </SectionCard>

            {/* Section 3 – Complaint */}
            <SectionCard
              index={2}
              title="Reklamacija"
              icon={ClipboardList}
              sectionRef={(el) => {
                sectionRefs.current[2] = el;
              }}
              stepIndex={2}
            >
              <div className="space-y-4">
                <FormField control={form.control} name="opisReklamacije" render={({ field }) => (
                  <ValidatedFormField isValid={fieldValidity.opisReklamacije}>
                    <FormItem><FormLabel>Opis reklamacije / kvara</FormLabel><FormControl><Textarea className="premium-input min-h-[120px] resize-none" placeholder="Detaljno opišite problem..." {...field} /></FormControl><FormMessage /></FormItem>
                  </ValidatedFormField>
                )} />
                <FormField control={form.control} name="izjavaKupca" render={({ field }) => (
                  <FormItem><FormLabel>Izjava kupca <span className="text-muted-foreground font-normal">(opciono)</span></FormLabel><FormControl><Textarea className="premium-input min-h-[90px] resize-none" placeholder="Opciona izjava kupca..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </SectionCard>

            {/* Section 4 – Final */}
            <SectionCard
              index={3}
              title="Završni podaci"
              icon={PenLine}
              sectionRef={(el) => {
                sectionRefs.current[3] = el;
              }}
              stepIndex={3}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="mesto" render={({ field }) => (
                  <FormItem><FormLabel>Mesto</FormLabel><FormControl><Input className="premium-input" placeholder="npr. Beograd" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="datum" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal premium-input", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {field.value ? format(field.value, "dd.MM.yyyy") : "Izaberite datum"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium leading-none mb-3 block">Potpis kupca</label>
                <SignaturePad onSignatureChange={setSignatureDataUrl} />
              </div>
            </SectionCard>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="w-full h-16 text-base sm:text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-primary to-primary/80 disabled:opacity-80 disabled:cursor-wait"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                  Generisanje PDF-a...
                </>
              ) : (
                <>
                  <FileText className="mr-2.5 h-5 w-5" /> Generiši PDF
                </>
              )}
            </Button>
          </form>
        </Form>

        <footer className="text-center text-xs text-muted-foreground mt-6 pb-8 opacity-60">
          Dokument je generisan elektronski i važi bez pečata.
        </footer>
        </div>
      </div>

      {/* PDF Actions Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-xl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-2xl bg-accent">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold">PDF je generisan!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Reklamacioni list <span className="font-mono font-semibold text-foreground">{reclamationNumber}</span> je spreman.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3 sm:flex-col pt-2">
            <Button
              size="lg"
              onClick={downloadPdf}
              className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all"
            >
              <FileDown className="mr-2 h-5 w-5" /> Preuzmi PDF
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={sharePdf}
              className="w-full h-14 rounded-2xl text-base font-semibold border-2"
            >
              <Share2 className="mr-2 h-5 w-5" /> Podeli
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
