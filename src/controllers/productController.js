import { Op } from "sequelize";
import Product from "../models/Product.js";
import ProductColor from "../models/ProductColor.js";
import ProductVariant from "../models/ProductVariant.js";
import ProductImage from "../models/ProductImage.js";

import { filterProducts } from "../services/productFilterService.js";
import { normalizeOptionalMeasurement } from "../services/productCatalogService.js";

function getProductIncludes() {
  return [
    {
      model: ProductColor,
      as: "colors",
      required: false,
      where: {
        active: true,
      },
      separate: true,
      order: [["id", "ASC"]],
      include: [
        {
          model: ProductImage,
          as: "images",
          required: false,
          separate: true,
          order: [
            ["sort_order", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    },
    {
      model: ProductVariant,
      as: "variants",
      required: false,
      where: {
        active: true,
      },
      separate: true,
      order: [
        ["size", "ASC"],
        ["id", "ASC"],
      ],
      include: [
        {
          model: ProductColor,
          as: "color",
          required: false,
          attributes: ["id", "name", "slug", "hex_code"],
        },
      ],
    },
    {
      model: ProductImage,
      as: "images",
      required: false,
      separate: true,
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
    },
  ];
}

const shippingFields = [
  {
    name: "weight",
    label: "Peso",
    decimalPlaces: 3,
  },
  {
    name: "width",
    label: "Largura",
    decimalPlaces: 2,
  },
  {
    name: "height",
    label: "Altura",
    decimalPlaces: 2,
  },
  {
    name: "length",
    label: "Comprimento",
    decimalPlaces: 2,
  },
];

function prepareProductPayload(body) {
  const payload = {
    ...body,
  };

  for (const field of shippingFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field.name)) {
      continue;
    }

    const normalizedValue = normalizeOptionalMeasurement(
      body[field.name],
      field.decimalPlaces,
    );

    if (normalizedValue === undefined) {
      const error = new Error(`${field.label} deve ser maior que zero`);

      error.statusCode = 400;
      throw error;
    }

    payload[field.name] = normalizedValue;
  }

  return payload;
}

export async function getAll(req, res) {
  try {
    const { category, search, color, size, minPrice, maxPrice } = req.query;

    function parseOptionalPrice(value, fieldName) {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      const normalizedValue = String(value).replace(",", ".").trim();

      const price = Number(normalizedValue);

      if (!Number.isFinite(price) || price < 0) {
        const error = new Error(`${fieldName} inválido`);

        error.statusCode = 400;
        throw error;
      }

      return price;
    }

    const parsedMinPrice = parseOptionalPrice(minPrice, "Preço mínimo");

    const parsedMaxPrice = parseOptionalPrice(maxPrice, "Preço máximo");

    if (
      parsedMinPrice !== null &&
      parsedMaxPrice !== null &&
      parsedMinPrice > parsedMaxPrice
    ) {
      return res.status(400).json({
        error: "O preço mínimo não pode ser maior que o preço máximo",
      });
    }

    const where = {
      active: true,
    };

    if (category?.trim()) {
      where.category = category.trim();
    }

    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;

      where[Op.or] = [
        {
          name: {
            [Op.iLike]: searchTerm,
          },
        },
        {
          description: {
            [Op.iLike]: searchTerm,
          },
        },
      ];
    }

    const products = await Product.findAll({
      where,
      include: getProductIncludes(),
      order: [["createdAt", "DESC"]],
    });

    const plainProducts = products.map((product) =>
      product.get({
        plain: true,
      }),
    );

    const filteredProducts = filterProducts(plainProducts, {
      color: color?.trim() || "",

      size: size?.trim() || "",

      minPrice: parsedMinPrice,

      maxPrice: parsedMaxPrice,
    });

    return res.json(filteredProducts);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);

    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : "Não foi possível listar os produtos",
    });
  }
}

export async function getById(req, res) {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        active: true,
      },
      include: getProductIncludes(),
    });

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado",
      });
    }

    return res.json(product);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);

    return res.status(500).json({
      error: "Não foi possível buscar o produto",
    });
  }
}

export async function create(req, res) {
  try {
    const payload = prepareProductPayload(req.body);

    const product = await Product.create(payload);

    return res.status(201).json(product);
  } catch (error) {
    console.error("Erro ao criar produto:", error);

    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : "Não foi possível criar o produto",
    });
  }
}

export async function update(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado",
      });
    }

    const payload = prepareProductPayload(req.body);

    await product.update(payload);

    return res.json(product);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);

    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : "Não foi possível atualizar o produto",
    });
  }
}

export async function remove(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Produto não encontrado" });
    await product.update({ active: false });
    return res.json({ message: "Produto removido" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
