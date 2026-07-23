import { describe, expect, it } from "vitest";

import {
  normalizeSlug,
  validateHexColor,
  isValidImageUrl,
  normalizeSku,
  validateStock,
  normalizeOptionalPrice,
  normalizeOptionalMeasurement,
} from "./productCatalogService.js";

describe("normalizeSlug", () => {
  it("normaliza espaços, acentos e maiúsculas", () => {
    expect(normalizeSlug("  Verde Limão  ")).toBe("verde-limao");
  });

  it("remove caracteres especiais", () => {
    expect(normalizeSlug("Azul & Branco!")).toBe("azul-branco");
  });

  it("retorna vazio para um valor sem letras ou números", () => {
    expect(normalizeSlug("---")).toBe("");
  });
});

describe("validateHexColor", () => {
  it("aceita uma cor hexadecimal válida", () => {
    expect(validateHexColor("#A1B2C3")).toBe(true);
  });

  it("aceita letras minúsculas", () => {
    expect(validateHexColor("#abcdef")).toBe(true);
  });

  it("rejeita valores sem cerquilha", () => {
    expect(validateHexColor("A1B2C3")).toBe(false);
  });

  it("rejeita formato hexadecimal abreviado", () => {
    expect(validateHexColor("#FFF")).toBe(false);
  });
});

describe("isValidImageUrl", () => {
  it("aceita uma URL HTTPS", () => {
    expect(isValidImageUrl("https://example.com/produto.webp")).toBe(true);
  });

  it("aceita um caminho relativo iniciado por barra", () => {
    expect(isValidImageUrl("/images/produto.webp")).toBe(true);
  });

  it("rejeita protocolos não permitidos", () => {
    expect(isValidImageUrl('javascript:alert("teste")')).toBe(false);
  });

  it("rejeita uma string vazia", () => {
    expect(isValidImageUrl("")).toBe(false);
  });
});

describe("normalizeSku", () => {
  it("normaliza espaços e letras minúsculas", () => {
    expect(normalizeSku(" camiseta preta m ")).toBe("CAMISETA-PRETA-M");
  });

  it("mantém um SKU que já está normalizado", () => {
    expect(normalizeSku("VHX-001-G")).toBe("VHX-001-G");
  });
});

describe("validateStock", () => {
  it("aceita estoque zero", () => {
    expect(validateStock(0)).toBe(true);
  });

  it("aceita um inteiro positivo em string", () => {
    expect(validateStock("15")).toBe(true);
  });

  it("rejeita estoque negativo", () => {
    expect(validateStock(-1)).toBe(false);
  });

  it("rejeita estoque fracionado", () => {
    expect(validateStock(2.5)).toBe(false);
  });

  it("rejeita valores não numéricos", () => {
    expect(validateStock("abc")).toBe(false);
  });
});

describe("normalizeOptionalPrice", () => {
  it("retorna null quando não há preço específico", () => {
    expect(normalizeOptionalPrice("")).toBeNull();
  });

  it("aceita preço com vírgula", () => {
    expect(normalizeOptionalPrice("129,90")).toBe(129.9);
  });

  it("arredonda o preço para duas casas decimais", () => {
    expect(normalizeOptionalPrice(19.999)).toBe(20);
  });

  it("rejeita preço negativo", () => {
    expect(normalizeOptionalPrice(-10)).toBeUndefined();
  });

  it("rejeita preço não numérico", () => {
    expect(normalizeOptionalPrice("inválido")).toBeUndefined();
  });
});

describe("normalizeOptionalMeasurement", () => {
  it("retorna null quando a medida está vazia", () => {
    expect(normalizeOptionalMeasurement("")).toBeNull();
  });

  it("aceita uma medida com vírgula decimal", () => {
    expect(normalizeOptionalMeasurement("12,5")).toBe(12.5);
  });

  it("arredonda dimensões para duas casas decimais", () => {
    expect(normalizeOptionalMeasurement(10.999)).toBe(11);
  });

  it("arredonda o peso para três casas decimais", () => {
    expect(normalizeOptionalMeasurement(0.4567, 3)).toBe(0.457);
  });

  it("rejeita uma medida igual a zero", () => {
    expect(normalizeOptionalMeasurement(0)).toBeUndefined();
  });

  it("rejeita uma medida negativa", () => {
    expect(normalizeOptionalMeasurement(-5)).toBeUndefined();
  });

  it("rejeita uma medida não numérica", () => {
    expect(normalizeOptionalMeasurement("inválido")).toBeUndefined();
  });
});
