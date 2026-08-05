import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/connection.js", () => ({
  default: {
    transaction: vi.fn(async (callback) => callback({})),
  },
}));

vi.mock("../models/Product.js", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock("../models/ProductColor.js", () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock("../models/ProductVariant.js", () => ({
  default: {
    update: vi.fn(),
  },
}));

import sequelize from "../database/connection.js";
import Product from "../models/Product.js";
import ProductColor from "../models/ProductColor.js";
import ProductVariant from "../models/ProductVariant.js";

import {
  createColor,
  updateColor,
  removeColor,
} from "./productColorController.js";

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

describe("productColorController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createColor", () => {
    it("cria uma cor com nome em inglês normalizado", async () => {
      const req = {
        params: {
          productId: "10",
        },
        body: {
          name: "Verde Limão",
          name_en: "  Lime Green  ",
          slug: "verde-limao",
          hex_code: "#aabbcc",
        },
      };

      const res = createResponse();

      Product.findOne.mockResolvedValue({
        id: 10,
      });

      ProductColor.findOne.mockResolvedValue(null);

      ProductColor.create.mockResolvedValue({
        id: 20,
        product_id: 10,
        name: "Verde Limão",
        name_en: "Lime Green",
        slug: "verde-limao",
        hex_code: "#AABBCC",
        active: true,
      });

      await createColor(req, res);

      expect(ProductColor.create).toHaveBeenCalledWith({
        product_id: 10,
        name: "Verde Limão",
        name_en: "Lime Green",
        slug: "verde-limao",
        hex_code: "#AABBCC",
        active: true,
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("rejeita uma cor hexadecimal inválida", async () => {
      const req = {
        params: {
          productId: "10",
        },
        body: {
          name: "Preto",
          hex_code: "000000",
        },
      };

      const res = createResponse();

      await createColor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(Product.findOne).not.toHaveBeenCalled();

      expect(ProductColor.create).not.toHaveBeenCalled();
    });

    it("retorna 404 quando o produto não existe", async () => {
      const req = {
        params: {
          productId: "999",
        },
        body: {
          name: "Preto",
          hex_code: "#000000",
        },
      };

      const res = createResponse();

      Product.findOne.mockResolvedValue(null);

      await createColor(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(ProductColor.create).not.toHaveBeenCalled();
    });

    it("retorna 409 quando o slug já existe", async () => {
      const req = {
        params: {
          productId: "10",
        },
        body: {
          name: "Preto",
          hex_code: "#000000",
        },
      };

      const res = createResponse();

      Product.findOne.mockResolvedValue({
        id: 10,
      });

      const databaseError = new Error("Unique constraint");

      databaseError.name = "SequelizeUniqueConstraintError";

      ProductColor.create.mockRejectedValue(databaseError);

      await createColor(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("updateColor", () => {
    it("rejeita active enviado como string", async () => {
      const req = {
        params: {
          productId: "10",
          colorId: "2",
        },
        body: {
          active: "false",
        },
      };

      const res = createResponse();
      const update = vi.fn();

      ProductColor.findOne.mockResolvedValue({
        id: 2,
        product_id: 10,
        update,
      });

      await updateColor(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("removeColor", () => {
    it("desativa a cor e suas variantes", async () => {
      const req = {
        params: {
          productId: "10",
          colorId: "2",
        },
        body: {},
      };

      const res = createResponse();
      const colorUpdate = vi.fn().mockResolvedValue(undefined);

      ProductColor.findOne.mockResolvedValue({
        id: 2,
        product_id: 10,
        update: colorUpdate,
      });

      ProductVariant.update.mockResolvedValue([2]);

      await removeColor(req, res);

      expect(sequelize.transaction).toHaveBeenCalledTimes(1);

      expect(colorUpdate).toHaveBeenCalledWith(
        {
          active: false,
        },
        {
          transaction: expect.any(Object),
        },
      );

      expect(ProductVariant.update).toHaveBeenCalledWith(
        {
          active: false,
        },
        {
          where: {
            product_id: 10,
            product_color_id: 2,
          },
          transaction: expect.any(Object),
        },
      );

      expect(res.json).toHaveBeenCalledWith({
        message: "Cor desativada com sucesso",
      });
    });
  });
});
