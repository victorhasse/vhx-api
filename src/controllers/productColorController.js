import sequelize from "../database/connection.js";
import Product from "../models/Product.js";
import ProductColor from "../models/ProductColor.js";
import ProductVariant from "../models/ProductVariant.js";

import {
  normalizeSlug,
  validateHexColor,
} from "../services/productCatalogService.js";

export async function createColor(req, res) {
  try {
    const productId = Number(req.params.productId);
    const { name, name_en, slug, hex_code } = req.body;

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "Produto inválido",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Nome da cor é obrigatório",
      });
    }

    if (name_en !== undefined && !String(name_en).trim()) {
      return res.status(400).json({
        error: "O nome da cor em inglês não pode estar vazio",
      });
    }

    const normalizedNameEn =
      name_en === undefined ? null : String(name_en).trim();

    if (!hex_code || !validateHexColor(hex_code)) {
      return res.status(400).json({
        error: "A cor hexadecimal deve seguir o formato #RRGGBB",
      });
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        active: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado",
      });
    }

    const normalizedSlug = normalizeSlug(slug?.trim() || name.trim());

    if (!normalizedSlug) {
      return res.status(400).json({
        error: "Slug da cor inválido",
      });
    }
    const existingColor = await ProductColor.findOne({
      where: {
        product_id: productId,
        slug: normalizedSlug,
      },
    });

    if (existingColor) {
      if (existingColor.active) {
        return res.status(409).json({
          error: "Este produto já possui esta cor",
        });
      }

      await sequelize.transaction(async (transaction) => {
        await existingColor.update(
          {
            name: name.trim(),
            name_en: normalizedNameEn,
            hex_code: hex_code.toUpperCase(),
            active: true,
          },
          {
            transaction,
          },
        );

        /*
         * A exclusão da cor também desativou suas
         * variantes; restauramos o conjunto.
         */
        await ProductVariant.update(
          {
            active: true,
          },
          {
            where: {
              product_id: productId,
              product_color_id: existingColor.id,
            },
            transaction,
          },
        );
      });

      return res.status(200).json(existingColor);
    }
    const color = await ProductColor.create({
      product_id: productId,
      name: name.trim(),
      name_en: normalizedNameEn,
      slug: normalizedSlug,
      hex_code: hex_code.toUpperCase(),
      active: true,
    });

    return res.status(201).json(color);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Este produto já possui uma cor com esse identificador",
      });
    }

    console.error("Erro ao criar cor:", error);

    return res.status(500).json({
      error: "Não foi possível criar a cor",
    });
  }
}

export async function updateColor(req, res) {
  try {
    const productId = Number(req.params.productId);
    const colorId = Number(req.params.colorId);
    const { name, name_en, slug, hex_code, active } = req.body;

    const color = await ProductColor.findOne({
      where: {
        id: colorId,
        product_id: productId,
      },
    });

    if (!color) {
      return res.status(404).json({
        error: "Cor não encontrada",
      });
    }

    const changes = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          error: "Nome da cor é obrigatório",
        });
      }

      changes.name = String(name).trim();
    }

    if (name_en !== undefined) {
      if (name_en === null) {
        changes.name_en = null;
      } else if (!String(name_en).trim()) {
        return res.status(400).json({
          error: "O nome da cor em inglês não pode estar vazio",
        });
      } else {
        changes.name_en = String(name_en).trim();
      }
    }

    if (slug !== undefined) {
      const normalizedSlug = normalizeSlug(String(slug));

      if (!normalizedSlug) {
        return res.status(400).json({
          error: "Slug da cor inválido",
        });
      }

      changes.slug = normalizedSlug;
    }

    if (hex_code !== undefined) {
      if (!validateHexColor(String(hex_code))) {
        return res.status(400).json({
          error: "A cor hexadecimal deve seguir o formato #RRGGBB",
        });
      }

      changes.hex_code = String(hex_code).toUpperCase();
    }

    if (active !== undefined) {
      if (typeof active !== "boolean") {
        return res.status(400).json({
          error: 'O campo "active" deve ser um valor booleano',
        });
      }

      changes.active = active;
    }

    await color.update(changes);

    return res.json(color);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Este produto já possui uma cor com esse identificador",
      });
    }

    console.error("Erro ao atualizar cor:", error);

    return res.status(500).json({
      error: "Não foi possível atualizar a cor",
    });
  }
}

export async function removeColor(req, res) {
  try {
    const productId = Number(req.params.productId);
    const colorId = Number(req.params.colorId);

    const color = await ProductColor.findOne({
      where: {
        id: colorId,
        product_id: productId,
      },
    });

    if (!color) {
      return res.status(404).json({
        error: "Cor não encontrada",
      });
    }

    await sequelize.transaction(async (transaction) => {
      await color.update(
        {
          active: false,
        },
        {
          transaction,
        },
      );

      await ProductVariant.update(
        {
          active: false,
        },
        {
          where: {
            product_id: productId,
            product_color_id: colorId,
          },
          transaction,
        },
      );
    });

    return res.json({
      message: "Cor desativada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover cor:", error);

    return res.status(500).json({
      error: "Não foi possível remover a cor",
    });
  }
}
