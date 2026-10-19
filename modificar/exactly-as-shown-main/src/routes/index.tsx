import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { User, Phone, Cake, Dumbbell, Wallet, CalendarDays, Clock, Info, Eraser } from "lucide-react";

import { normalizeName, validateNome } from "@/lib/validacao-nome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CENA FIT — Cadastro Oficial de Alunos" },
      { name: "description", content: "Faça seu cadastro na CENA FIT de forma rápida e simples e envie pelo WhatsApp." },
      { property: "og:title", content: "CENA FIT — Cadastro Oficial de Alunos" },
      { property: "og:description", content: "Seu próximo nível começa aqui. Cadastre-se na CENA FIT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const WA_NUMBER = "5533991306306";
type Form = { nome: string; tel: string; nasc: string; dias: string; turma: string; valor: string; venc: string };
const empty: Form = { nome: "", tel: "", nasc: "", dias: "", turma: "", valor: "", venc: "" };

const TURMAS = [
  "TURMA DAS 05:00", "TURMA DAS 06:00", "TURMA DAS 07:00", "TURMA DAS 10:00", "TURMA DAS 14:00",
  "TURMA DAS 15:00", "TURMA DAS 16:00", "TURMA DAS 17:00", "TURMA DAS 18:00", "TURMA DAS 19:00",
];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskMoney(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 9);
  if (!d) return "";
  return (Number(d) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const moneyNum = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;

// Formata a data no padrão brasileiro DD/MM/AAAA, inserindo as barras
// automaticamente enquanto o usuário digita, sem atrapalhar a edição.
function maskDate(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// Converte "DD/MM/AAAA" em uma Date real, validando dias por mês e anos
// bissextos. Retorna null quando a data não existe.
function parseDateBR(v: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const minDate = () => new Date(1900, 0, 1);

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  const nomeError = validateNome(f.nome);
  if (nomeError) e.nome = nomeError;
  const tel = f.tel.replace(/\D/g, "");
  if (tel.length < 10 || tel.length > 11) e.tel = "Informe um telefone válido com DDD.";
  if (!f.nasc) e.nasc = "Informe sua data de nascimento.";
  else { const d = parseDateBR(f.nasc); if (!d || d > todayStart() || d < minDate()) e.nasc = "Data de nascimento inválida."; }
  if (!f.dias) e.dias = "Selecione quantos dias por semana você treina.";
  if (!f.turma) e.turma = "Selecione sua turma de treino.";
  if (moneyNum(f.valor) <= 0) e.valor = "Informe um valor maior que zero.";
  if (!f.venc) e.venc = "Selecione o dia de vencimento.";
  return e;
}

function Index() {
  const [f, setF] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [sent, setSent] = useState(false);
  const set = (k: keyof Form, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  // Valida o nome enquanto a pessoa digita (se já houver erro) e ao sair do campo.
  const setNomeError = (err: string | undefined) => {
    setErrors((p) => {
      const next: Partial<Record<keyof Form, string>> = { ...p };
      if (err) next.nome = err;
      else delete next.nome;
      return next;
    });
  };
  const onNomeChange = (v: string) => {
    setF((p) => ({ ...p, nome: v }));
    if (errors.nome) setNomeError(validateNome(v));
  };
  const onNomeBlur = () => {
    if (!f.nome.trim()) return;
    setNomeError(validateNome(f.nome));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length) { setSent(false); return; }
    const valor = moneyNum(f.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const msg = [
      "NOVO CADASTRO DE ALUNO — CENA FIT", "",
      `Nome completo: ${normalizeName(f.nome)}`,
      `Telefone/WhatsApp: ${f.tel}`,
      `Data de nascimento: ${f.nasc}`,
      `Plano de treino: ${f.dias} dias por semana`,
      `Turma de treino: ${f.turma}`,
      `Mensalidade: ${valor}`,
      `Dia de vencimento: ${f.venc}`, "",
      "Cadastro enviado pelo site oficial da CENA FIT.",
    ].join("\n");
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    setSent(true);
  };

  const clear = () => {
    if (window.confirm("Deseja realmente apagar todos os dados preenchidos?")) {
      setF(empty); setErrors({}); setSent(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <img src="/cena.png" alt="Logo CENA FIT" className="h-14 w-14 rounded-lg object-contain sm:h-16 sm:w-16" />
          <div className="leading-tight">
            <p className="font-display text-xl font-extrabold tracking-wide">CENA FIT</p>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-glow">Cadastro de Alunos</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
        <section className="py-12 text-center sm:py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold tracking-[0.25em] text-primary-glow">
            CADASTRO OFICIAL DE ALUNOS
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold italic uppercase leading-[0.95] sm:text-7xl">
            Seu próximo nível <br /><span className="text-gradient">começa aqui</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground sm:text-lg">
            Faça seu cadastro na CENA FIT de forma rápida e simples. Preencha seus dados abaixo e venha fazer parte do nosso time!
          </p>
        </section>

        <form onSubmit={submit} noValidate className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/80 p-5 shadow-2xl backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Seus dados</h2>
            <span className="text-xs text-muted-foreground"><span className="text-primary-glow">*</span> obrigatório</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nome completo" icon={<User />} error={errors.nome} className="md:col-span-2">
              <input className="field" placeholder="Digite seu nome completo" value={f.nome} maxLength={100}
                aria-invalid={!!errors.nome} onChange={(e) => onNomeChange(e.target.value)} onBlur={onNomeBlur} autoComplete="name" />
            </Field>
            <Field label="Telefone / WhatsApp" icon={<Phone />} error={errors.tel}>
              <input className="field" type="tel" inputMode="numeric" placeholder="(00) 00000-0000" value={f.tel}
                aria-invalid={!!errors.tel} onChange={(e) => set("tel", maskPhone(e.target.value))} autoComplete="tel" />
            </Field>
            <Field label="Data de nascimento" icon={<Cake />} error={errors.nasc} hint="Exemplo: 25/08/2000">
              <input className="field" type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={f.nasc}
                aria-invalid={!!errors.nasc} onChange={(e) => set("nasc", maskDate(e.target.value))} />
            </Field>
            <Field label="Quantos dias por semana você treina?" icon={<Dumbbell />} error={errors.dias}>
              <select className="field appearance-none" value={f.dias} aria-invalid={!!errors.dias} onChange={(e) => set("dias", e.target.value)}>
                <option value="" disabled>Selecione o plano</option>
                {["2", "3", "4", "5"].map((n) => <option key={n} value={n}>{n} dias por semana</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-[18px] w-[18px] text-primary" />
                Escolha sua turma de treino <span className="text-primary-glow">*</span>
              </span>
              <div role="radiogroup" aria-label="Escolha sua turma de treino" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {TURMAS.map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={f.turma === t} onClick={() => set("turma", t)}
                    className={`flex h-12 items-center justify-center rounded-xl px-2 font-display text-sm font-bold uppercase tracking-wide transition active:scale-[0.98] sm:text-base ${
                      f.turma === t
                        ? "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110"
                        : "border border-border bg-secondary text-secondary-foreground hover:border-primary/50"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              {errors.turma ? <span className="mt-1.5 block text-xs text-destructive">{errors.turma}</span> : null}
            </div>
            <Field label="Valor da mensalidade" icon={<Wallet />} error={errors.valor}>
              <div className="relative">
                <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <input className="field !pl-[4.25rem]" inputMode="numeric" placeholder="0,00" value={f.valor}
                  aria-invalid={!!errors.valor} onChange={(e) => set("valor", maskMoney(e.target.value))} />
              </div>
            </Field>
            <Field label="Dia de vencimento da mensalidade" icon={<CalendarDays />} error={errors.venc}
              hint="Selecione o dia em que sua mensalidade vence." className="md:col-span-2">
              <select className="field appearance-none" value={f.venc} aria-invalid={!!errors.venc} onChange={(e) => set("venc", e.target.value)}>
                <option value="" disabled>Selecione o dia</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>Dia {d}</option>)}
              </select>
            </Field>
          </div>

          {sent && (
            <div role="status" className="mt-6 flex gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm animate-in fade-in">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-glow" />
              <p>Estamos quase lá! Confira seus dados no WhatsApp e toque em Enviar para concluir seu cadastro na CENA FIT.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="flex h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-gradient-primary px-6 font-display text-lg font-bold uppercase tracking-wide text-primary-foreground shadow-glow transition hover:brightness-110 active:scale-[0.99]">
              <WhatsAppIcon /> Enviar cadastro pelo WhatsApp
            </button>
            <button type="button" onClick={clear} className="flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-6 font-display font-semibold uppercase tracking-wide text-secondary-foreground transition hover:border-primary/50">
              <Eraser className="h-4 w-4" /> Limpar formulário
            </button>
          </div>
        </form>
      </main>

      <footer className="border-t border-border/60 py-8 text-center">
        <p className="font-display text-2xl font-extrabold italic tracking-wide">CENA <span className="text-gradient">FIT</span></p>
        <p className="mt-1 text-sm text-muted-foreground">Sua evolução começa aqui.</p>
      </footer>
    </div>
  );
}

function Field({ label, icon, error, hint, className = "", children }: {
  label: string; icon: ReactNode; error?: string | undefined; hint?: string; className?: string; children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium">{label} <span className="text-primary-glow">*</span></span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-primary [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</span>
        {children}
      </div>
      {error ? <span className="mt-1.5 block text-xs text-destructive">{error}</span>
        : hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.43 9.43 0 0 1 9.43 9.44c0 5.2-4.23 9.43-9.44 9.43M20.08 3.9A11.3 11.3 0 0 0 12.05.57C5.78.57.67 5.68.67 11.95c0 2 .52 3.96 1.52 5.69L.57 23.43l5.93-1.55a11.4 11.4 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.11 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05" />
    </svg>
  );
}
