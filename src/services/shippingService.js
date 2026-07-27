import { createRequestError } from "./checkoutService.js";

function normalizeMeasurement(value, field, productName) {
  const normalizedValue =
    typeof value === "string" ? value.replace(",", ".").trim() : value;

  const measurement = Number(normalizedValue);

  if (!Number.isFinite(measurement) || measurement <= 0) {
    throw createRequestError(
      `O produto "${productName}" não possui ${field} válido para o cálculo do frete`,
    );
  }

  return measurement;
}

function normalizePostalCode(value) {
  const postalCode = String(value || "").replace(/\D/g, "");

  if (!/^\d{8}$/.test(postalCode)) {
    throw createRequestError("Informe um CEP válido");
  }

  return postalCode;
}

export function buildShippingProducts(requestedItems, productsById) {
  return requestedItems.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw createRequestError("Um ou mais produtos não estão disponíveis");
    }

    const productName = product.name;

    return {
      id: String(product.id),
      width: normalizeMeasurement(product.width, "largura", productName),
      height: normalizeMeasurement(product.height, "altura", productName),
      length: normalizeMeasurement(product.length, "comprimento", productName),
      weight: normalizeMeasurement(product.weight, "peso", productName),
      insurance_value: Number(item.insuranceValue ?? product.price),
      quantity: item.quantity,
    };
  });
}

export function buildShippingPayload({
  destinationPostalCode,
  requestedItems,
  productsById,
  originPostalCode = process.env.STORE_POSTAL_CODE,
}) {
  return {
    from: {
      postal_code: normalizePostalCode(originPostalCode),
    },
    to: {
      postal_code: normalizePostalCode(destinationPostalCode),
    },
    products: buildShippingProducts(requestedItems, productsById),
    options: {
      receipt: false,
      own_hand: false,
    },
  };
}
function getShippingConfig() {
  const token = process.env.MELHOR_ENVIO_TOKEN?.trim();

  const baseUrl = process.env.MELHOR_ENVIO_BASE_URL?.trim();

  const userAgent = process.env.MELHOR_ENVIO_USER_AGENT?.trim();

  if (!token || !baseUrl || !userAgent) {
    throw new Error("Configuração do Melhor Envio incompleta");
  }

  return {
    token,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    userAgent,
  };
}

function normalizeShippingOptions(data) {
  if (!Array.isArray(data)) {
    throw new Error("Resposta inválida do Melhor Envio");
  }

  return data
    .filter((option) => {
      const price = Number(option.price);

      return !option.error && Number.isFinite(price) && price >= 0;
    })
    .map((option) => ({
      id: Number(option.id),
      name: option.name,
      price: Number(option.price),
      currency: option.currency || "R$",
      deliveryTime: Number(option.delivery_time),
      deliveryRange: {
        min: Number(option.delivery_range?.min ?? option.delivery_time),
        max: Number(option.delivery_range?.max ?? option.delivery_time),
      },
      company: {
        id: Number(option.company?.id),
        name: option.company?.name || null,
        picture: option.company?.picture || null,
      },
    }));
}

export async function requestShippingQuote(
  payload,
  { fetchImplementation = fetch } = {},
) {
  const { token, baseUrl, userAgent } = getShippingConfig();

  let response;

  try {
    response = await fetchImplementation(
      `${baseUrl}/api/v2/me/shipment/calculate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        body: JSON.stringify(payload),
      },
    );
  } catch {
    throw createRequestError(
      "Não foi possível consultar o frete no momento",
      502,
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw createRequestError(
      "O serviço de frete retornou uma resposta inválida",
      502,
    );
  }

  if (!response.ok) {
    const providerMessage =
      data?.message || data?.error || "Falha ao consultar o Melhor Envio";

    throw createRequestError(providerMessage, 502);
  }

  const options = normalizeShippingOptions(data);

  if (options.length === 0) {
    throw createRequestError(
      "Nenhuma modalidade de frete está disponível para este CEP",
      422,
    );
  }

  return options;
}
export async function validateSelectedShipping({
  destinationPostalCode,
  shippingServiceId,
  requestedItems,
  productsById,
  originPostalCode = process.env.STORE_POSTAL_CODE,
  fetchImplementation = fetch,
}) {
  const normalizedServiceId = Number(shippingServiceId);

  if (!Number.isInteger(normalizedServiceId) || normalizedServiceId <= 0) {
    throw createRequestError("Selecione uma modalidade de frete válida");
  }

  const payload = buildShippingPayload({
    destinationPostalCode,
    requestedItems,
    productsById,
    originPostalCode,
  });

  const shippingOptions = await requestShippingQuote(payload, {
    fetchImplementation,
  });

  const selectedShipping = shippingOptions.find(
    (option) => option.id === normalizedServiceId,
  );

  if (!selectedShipping) {
    throw createRequestError(
      "A modalidade de frete selecionada não está mais disponível",
      422,
    );
  }

  const priceCents = Math.round(selectedShipping.price * 100);

  if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
    throw createRequestError(
      "O serviço de frete retornou um valor inválido",
      502,
    );
  }

  return {
    ...selectedShipping,
    priceCents,
    postalCode: normalizePostalCode(destinationPostalCode),
  };
}
