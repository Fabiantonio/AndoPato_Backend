import { NextFunction, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import Budget from "../models/Budget";

declare global {
  namespace Express {
    interface Request {
      budget?: Budget;
    }
  }
}

export const validateBudgetId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await param("budgetId")
    .isInt()
    .withMessage("ID inválido")
    .custom((value) => value > 0)
    .withMessage("ID inválido")
    .run(req);

  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateBudgetExist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const budget = await Budget.findOne({
      where: {
        id: req.params.budgetId,
      },
    });
    if (!budget) return res.status(404).json({ message: "Presupuesto no encontrado" });

    req.budget = budget;
    next();
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo el Presupuesto" });
  }
};

export const validateBudgetInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await body("name")
      .notEmpty()
      .withMessage("El nombre es requerido")
      .run(req);
    await body("amount")
      .notEmpty()
      .withMessage("El monto es requerido")
      .isNumeric()
      .withMessage("Monto inválido")
      .custom((value) => value > 0)
      .withMessage("El monto debe ser mayor a 0")
      .run(req);
    next();
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo el Presupuesto" });
  }
};

export function hasAccessToBudget(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.budget.userId !== req.user.id) {
    return res.status(401).json({ message: "No tienes acceso a este Presupuesto" });
  }
  next();
}
