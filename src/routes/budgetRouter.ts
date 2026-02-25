import { Router } from "express";
import { body, param } from "express-validator";
import { BudgetController } from "../controllers/BudgetController";
import { handleInputErrors } from "../middleware/validation";
import {
  hasAccessToBudget,
  validateBudgetExist,
  validateBudgetId,
  validateBudgetInput,
} from "../middleware/budget";
import { ExpensesController } from "../controllers/ExpenseController";
import {
  validateExpenseExist,
  validateExpenseId,
  validateExpenseInput,
} from "../middleware/expense";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate); //req.user

//VALIDAR ID Y SI EXISTE FUERA DEL ROUTER
router.param("budgetId", validateBudgetId);
router.param("budgetId", validateBudgetExist); //req.budget
router.param("budgetId", hasAccessToBudget);

router.param("expenseId", validateExpenseId);
router.param("expenseId", validateExpenseExist);

router.get("/", BudgetController.getAll);

router.post(
  "/",
  validateBudgetInput,
  handleInputErrors,
  BudgetController.create,
);

router.get("/:budgetId", BudgetController.getById);

router.put(
  "/:budgetId",
  validateBudgetInput,
  handleInputErrors,
  BudgetController.updateById,
);

router.delete("/:budgetId", BudgetController.deleteById);

// ROUTES DE EXPENSES

router.post(
  "/:budgetId/expenses",
  validateExpenseInput,
  handleInputErrors,
  ExpensesController.create,
);

router.get("/:budgetId/expenses/:expenseId", ExpensesController.getById);

router.put(
  "/:budgetId/expenses/:expenseId",
  validateExpenseInput,
  handleInputErrors,
  ExpensesController.updateById,
);

router.delete(
  "/:budgetId/expenses/:expenseId",
  validateExpenseExist,
  handleInputErrors,
  ExpensesController.deleteById,
);

export default router;
