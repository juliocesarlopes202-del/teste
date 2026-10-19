import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NOME_ERROR, normalizeName, validateNome } from "@/lib/validacao-nome";
import { Route } from "@/routes/index";

const Index = Route.options.component as ComponentType;

function prefill(container: HTMLElement, nome: string, nasc = "01/01/2000") {
  const date = container.querySelector('input[placeholder="DD/MM/AAAA"]');
  const [dias, venc] = container.querySelectorAll("select");
  if (!date || !dias || !venc) throw new Error("Campos do formulário não encontrados");
  fireEvent.change(screen.getByPlaceholderText("Digite seu nome completo"), {
    target: { value: nome },
  });
  fireEvent.change(screen.getByPlaceholderText("(00) 00000-0000"), {
    target: { value: "(31) 99999-9999" },
  });
  fireEvent.change(date, { target: { value: nasc } });
  fireEvent.change(dias, { target: { value: "3" } });
  fireEvent.click(screen.getByRole("radio", { name: "TURMA DAS 06:00" }));
  fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "150,00" } });
  fireEvent.change(venc, { target: { value: "10" } });
}

function submitForm(container: HTMLElement) {
  const form = container.querySelector("form");
  if (!form) throw new Error("Formulário não encontrado");
  fireEvent.submit(form);
}

describe("Validação do campo Nome completo", () => {
  it("recusa o nome vazio", () => {
    expect(validateNome("")).toBe(NOME_ERROR);
    expect(validateNome("   ")).toBe(NOME_ERROR);
  });

  it("recusa somente o primeiro nome", () => {
    expect(validateNome("João")).toBe(NOME_ERROR);
    expect(validateNome("  João  ")).toBe(NOME_ERROR);
  });

  it("aceita nome e sobrenome", () => {
    expect(validateNome("João Silva")).toBeUndefined();
  });

  it("aceita nomes com mais de duas partes", () => {
    expect(validateNome("João Pedro da Silva")).toBeUndefined();
    expect(validateNome("Ana Souza Cruz Neto")).toBeUndefined();
  });

  it("remove espaços extras e trata espaços repetidos como um único separador", () => {
    expect(validateNome("   João   Silva   ")).toBeUndefined();
    expect(validateNome("João  da  Silva")).toBeUndefined();
    expect(validateNome("João     ")).toBe(NOME_ERROR);
    expect(normalizeName("  João   Pedro   da  Silva ")).toBe("João Pedro da Silva");
    expect(normalizeName("João")).toBe("João");
  });
});

describe("Formulário CENA FIT", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não abre o WhatsApp quando o nome tem uma única parte", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<Index />);

    prefill(container, "João");
    submitForm(container);

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText(NOME_ERROR)).toBeInTheDocument();
  });

  it("não abre o WhatsApp quando o campo de nome está vazio", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<Index />);

    prefill(container, "   ");
    submitForm(container);

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText(NOME_ERROR)).toBeInTheDocument();
  });

  it("abre o WhatsApp com o nome completo quando nome e sobrenome são informados", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<Index />);

    prefill(container, "  João   Pedro   da Silva ");
    submitForm(container);

    expect(open).toHaveBeenCalledTimes(1);
    const url = String(open.mock.calls[0]?.[0]);
    expect(decodeURIComponent(url)).toContain("Nome completo: João Pedro da Silva");
    expect(decodeURIComponent(url)).toContain("Turma de treino: TURMA DAS 06:00");
  });

  it("valida ao sair do campo e remove o erro quando o sobrenome é digitado", () => {
    render(<Index />);
    const input = screen.getByPlaceholderText("Digite seu nome completo");

    fireEvent.change(input, { target: { value: "João" } });
    fireEvent.blur(input);
    expect(screen.getByText(NOME_ERROR)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "João Silva" } });
    expect(screen.queryByText(NOME_ERROR)).not.toBeInTheDocument();
  });
});

describe("Data de nascimento (DD/MM/AAAA)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recusa uma data inexistente e não abre o WhatsApp", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<Index />);

    prefill(container, "João Silva", "31/02/2000");
    submitForm(container);

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText("Data de nascimento inválida.")).toBeInTheDocument();
  });

  it("aceita a data digitada e a envia no WhatsApp no formato DD/MM/AAAA", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<Index />);

    prefill(container, "João Silva", "25/08/2000");
    submitForm(container);

    expect(open).toHaveBeenCalledTimes(1);
    const url = String(open.mock.calls[0]?.[0]);
    expect(decodeURIComponent(url)).toContain("Data de nascimento: 25/08/2000");
  });
});
