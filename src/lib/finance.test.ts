import { describe, it, expect } from "vitest";
import { consolidatedBalance, summarize } from "./finance";

describe("finance", () => {
  it("saldo consolidado soma contas e desconta fatura do cartão", () => {
    expect(consolidatedBalance([{ balance: 8742.35 }, { balance: 15320 }, { balance: -2184.9 }])).toBe(21877.45);
  });
  it("separa entradas e saídas e agrupa gastos por categoria", () => {
    const s = summarize([
      { amount: 7800, category: "Salário" },
      { amount: -62.9, category: "Alimentação" },
      { amount: -48.5, category: "Alimentação" },
      { amount: -28.4, category: "Transporte" },
    ]);
    expect(s.income).toBe(7800);
    expect(s.expenses).toBe(139.8);
    expect(s.categories[0]).toEqual({ category: "Alimentação", total: 111.4 });
  });
});
