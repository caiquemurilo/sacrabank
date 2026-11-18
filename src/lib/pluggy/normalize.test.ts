import { describe, it, expect } from "vitest";
import { normalizeAccount, normalizeTransaction } from "./normalize";

describe("normalização Pluggy", () => {
  it("despesa (DEBIT) vira amount negativo", () => {
    expect(normalizeTransaction({ id: "t1", amount: 62.9, type: "DEBIT" }, false).amount).toBe(-62.9);
  });
  it("entrada (CREDIT) vira amount positivo", () => {
    expect(normalizeTransaction({ id: "t2", amount: -7800, type: "CREDIT" }, false).amount).toBe(7800);
  });
  it("compra no cartão sem tipo vira amount negativo", () => {
    expect(normalizeTransaction({ id: "t3", amount: 120 }, true).amount).toBe(-120);
  });
  it("saldo do cartão entra negativo", () => {
    const a = normalizeAccount({ id: "a1", type: "CREDIT", subtype: "CREDIT_CARD", balance: 2184.9 }, "Pluggy Bank");
    expect(a.type).toBe("cartao");
    expect(a.balance).toBe(-2184.9);
  });
  it("campos opcionais ausentes não impedem a sincronização", () => {
    const t = normalizeTransaction({ id: "t4", amount: 10, type: "DEBIT", date: "2026-11-10T00:00:00.000Z" }, false);
    expect(t).toMatchObject({ external_id: "t4", occurred_on: "2026-11-10", description: "Transação", merchant: null, category: "Outros" });
  });
});
