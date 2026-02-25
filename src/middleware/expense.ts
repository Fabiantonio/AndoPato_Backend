import { NextFunction, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import Expense from "../models/Expense";

declare global {
  namespace Express {
    interface Request {
      expense?: Expense;
    }
  }
}


export const validateExpenseInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await body("name")
      .notEmpty()
      .withMessage("El nombre del gasto es requerido")
      .run(req);
    await body("amount")
      .notEmpty()
      .withMessage("El monto del gasto es requerido")
      .isNumeric()
      .withMessage("Monto inválido")
      .custom((value) => value > 0)
      .withMessage("El monto del gasto debe ser mayor a 0")
      .run(req);
    next();
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo el Gasto" });
  }
};

export const validateExpenseId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await param("expenseId")
    .isInt()
    .withMessage("ID inválido")
    .custom((value) => value > 0)
    .run(req);
  next();
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};


export const validateExpenseExist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const expense = await Expense.findOne({
      where: {
        id: req.params.expenseId,
      },
    });
    if (!expense) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    req.expense = expense;
    next(); 
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo el Gasto" });
  }
};
