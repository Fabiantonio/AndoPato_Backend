import type { Request, Response } from "express";
import Expense from "../models/Expense";

export class ExpensesController {

  static create = async (req: Request, res: Response) => {
    try {
      const expense = await Expense.create(req.body);
      expense.budgetId = req.budget.id;
      await expense.save();
      res.status(201).json({ message: "Gasto creado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error creando el Gasto" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      res.json(req.expense);
    } catch (error) {
      res.status(500).json({ message: "Error obteniendo el Gasto" });
    }
  };

  static updateById = async (req: Request, res: Response) => {
    try {
      await req.expense.update(req.body);
      await req.expense.save();
      res.json({ message: "Gasto actualizado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error actualizando el Gasto" });
    }
  };

  static deleteById = async (req: Request, res: Response) => {
    try {
      await req.expense.destroy();
      res.json({ message: "Gasto eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error eliminando el Gasto" });
    }
  };
}


