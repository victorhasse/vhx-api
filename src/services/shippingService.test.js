import { describe, expect, it, vi } from "vitest";

import {
  buildShippingPayload,
  buildShippingProducts,
  requestShippingQuote,
  validateSelectedShipping,
} from "./shippingService.js";

function createProduct(overrides = {}) {
  return {
    id: 10,
    name: "Camiseta VHX",
    price: "149.90",
    weight: "0.350",
    width: "20.00",
    height: "10.00",
    length: "30.00",
    ...overrides,
  };
}

describe("buildShippingProducts", () => {
  it("monta os produtos para o Melhor Envio", () => {
    const productsById = new Map([[10, createProduct()]]);

    const products = buildShippingProducts(
      [
        {
          productId: 10,
          quantity: 2,
        },
      ],
      productsById,
    );

    expect(products).toEqual([
      {
        id: "10",
        width: 20,
        height: 10,
        length: 30,
        weight: 0.35,
        insurance_value: 149.9,
        quantity: 2,
      },
    ]);
  });

  it("rejeita produto sem medidas de frete", () => {
    const productsById = new Map([
      [
        10,
        createProduct({
          weight: null,
        }),
      ],
    ]);

    expect(() =>
      buildShippingProducts(
        [
          {
            productId: 10,
            quantity: 1,
          },
        ],
        productsById,
      ),
    ).toThrow("não possui peso válido");
  });

  it("rejeita produto inexistente", () => {
    expect(() =>
      buildShippingProducts(
        [
          {
            productId: 99,
            quantity: 1,
          },
        ],
        new Map(),
      ),
    ).toThrow("Um ou mais produtos não estão disponíveis");
  });
});

describe("buildShippingPayload", () => {
  it("normaliza os CEPs e monta o payload", () => {
    const payload = buildShippingPayload({
      originPostalCode: "88035-000",
      destinationPostalCode: "01310-100",
      requestedItems: [
        {
          productId: 10,
          quantity: 1,
        },
      ],
      productsById: new Map([[10, createProduct()]]),
    });

    expect(payload.from.postal_code).toBe("88035000");

    expect(payload.to.postal_code).toBe("01310100");

    expect(payload.products).toHaveLength(1);
  });

  it("rejeita CEP de destino inválido", () => {
    expect(() =>
      buildShippingPayload({
        originPostalCode: "88035000",
        destinationPostalCode: "123",
        requestedItems: [
          {
            productId: 10,
            quantity: 1,
          },
        ],
        productsById: new Map([[10, createProduct()]]),
      }),
    ).toThrow("Informe um CEP válido");
  });
});

describe("requestShippingQuote", () => {
  it("normaliza as opções válidas retornadas", async () => {
    process.env.MELHOR_ENVIO_TOKEN = "token-de-teste";
    process.env.MELHOR_ENVIO_BASE_URL = "https://sandbox.melhorenvio.com.br";
    process.env.MELHOR_ENVIO_USER_AGENT = "VHX Store (teste@example.com)";

    const fetchImplementation = async () => ({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "PAC",
          price: "24.90",
          currency: "R$",
          delivery_time: 6,
          delivery_range: {
            min: 5,
            max: 7,
          },
          company: {
            id: 1,
            name: "Correios",
            picture: "logo.png",
          },
        },
        {
          id: 2,
          name: "Indisponível",
          error: "Serviço indisponível",
        },
      ],
    });

    const options = await requestShippingQuote(
      {
        from: {
          postal_code: "88035000",
        },
        to: {
          postal_code: "01310100",
        },
        products: [],
      },
      {
        fetchImplementation,
      },
    );

    expect(options).toEqual([
      {
        id: 1,
        name: "PAC",
        price: 24.9,
        currency: "R$",
        deliveryTime: 6,
        deliveryRange: {
          min: 5,
          max: 7,
        },
        company: {
          id: 1,
          name: "Correios",
          picture: "logo.png",
        },
      },
    ]);
  });

  it("trata falha de comunicação", async () => {
    process.env.MELHOR_ENVIO_TOKEN = "token-de-teste";
    process.env.MELHOR_ENVIO_BASE_URL = "https://sandbox.melhorenvio.com.br";
    process.env.MELHOR_ENVIO_USER_AGENT = "VHX Store (teste@example.com)";

    const fetchImplementation = async () => {
      throw new Error("Falha de rede");
    };

    await expect(
      requestShippingQuote(
        {},
        {
          fetchImplementation,
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: "Não foi possível consultar o frete no momento",
    });
  });

  it("rejeita resposta sem opções disponíveis", async () => {
    process.env.MELHOR_ENVIO_TOKEN = "token-de-teste";
    process.env.MELHOR_ENVIO_BASE_URL = "https://sandbox.melhorenvio.com.br";
    process.env.MELHOR_ENVIO_USER_AGENT = "VHX Store (teste@example.com)";

    const fetchImplementation = async () => ({
      ok: true,
      json: async () => [
        {
          id: 1,
          error: "Serviço indisponível",
        },
      ],
    });

    await expect(
      requestShippingQuote(
        {},
        {
          fetchImplementation,
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});
describe("validateSelectedShipping", () => {
  const productsById = new Map([
    [
      36,
      {
        id: 36,
        name: "Camiseta VHX",
        width: 20,
        height: 5,
        length: 30,
        weight: 0.4,
        price: 100,
      },
    ],
  ]);

  const requestedItems = [
    {
      productId: 36,
      quantity: 1,
    },
  ];

  it("recalcula e retorna a modalidade selecionada", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "PAC",
          price: "25.90",
          currency: "R$",
          delivery_time: 6,
          delivery_range: {
            min: 5,
            max: 7,
          },
          company: {
            id: 1,
            name: "Correios",
            picture: null,
          },
        },
      ],
    });

    const result = await validateSelectedShipping({
      destinationPostalCode: "88035-000",
      shippingServiceId: 1,
      requestedItems,
      productsById,
      originPostalCode: "88035000",
      fetchImplementation,
    });

    expect(result).toMatchObject({
      id: 1,
      name: "PAC",
      price: 25.9,
      priceCents: 2590,
      postalCode: "88035000",
    });
  });

  it("rejeita modalidade que não está disponível", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "PAC",
          price: "25.90",
          delivery_time: 6,
          company: {
            id: 1,
            name: "Correios",
          },
        },
      ],
    });

    await expect(
      validateSelectedShipping({
        destinationPostalCode: "88035000",
        shippingServiceId: 999,
        requestedItems,
        productsById,
        originPostalCode: "88035000",
        fetchImplementation,
      }),
    ).rejects.toThrow(
      "A modalidade de frete selecionada não está mais disponível",
    );
  });

  it("rejeita identificador de modalidade inválido", async () => {
    await expect(
      validateSelectedShipping({
        destinationPostalCode: "88035000",
        shippingServiceId: "inválido",
        requestedItems,
        productsById,
      }),
    ).rejects.toThrow("Selecione uma modalidade de frete válida");
  });
});
