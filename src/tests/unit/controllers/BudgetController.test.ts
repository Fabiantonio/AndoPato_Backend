import { createRequest, createResponse } from "node-mocks-http";
import { budgets } from "../../mocks/budgets";
import { BudgetController } from "../../../controllers/BudgetController";
import Budget from "../../../models/Budget";
import Expense from "../../../models/Expense";

jest.mock("../../../models/Budget", () => ({
  findAll: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
}));

describe("BudgetController.getAll", () => {
  beforeEach(() => {
    (Budget.findAll as jest.Mock).mockReset();
    (Budget.findAll as jest.Mock).mockImplementation((options) => {
      const updatedBudgets = budgets.filter(
        (budget) => budget.userId === options.where.userId,
      );
      return Promise.resolve(updatedBudgets);
    });
  });

  it("Debería devolver 2 budgets para el usuario con id 1", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets",
      user: { id: 1 },
    });
    const res = createResponse();
    await BudgetController.getAll(req, res);
    const data = res._getJSONData();
    expect(data).toHaveLength(2);
    expect(res.statusCode).toBe(200);
    expect(res.status).not.toBe("404");
  });

  it("Debería devolver 1 budgets para el usuario con id 2", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets",
      user: { id: 2 },
    });
    const res = createResponse();
    await BudgetController.getAll(req, res);
    const data = res._getJSONData();
    expect(data).toHaveLength(1);
    expect(res.statusCode).toBe(200);
    expect(res.status).not.toBe("404");
  });

  it("Debería devolver 0 budgets para el usuario con id 10", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets",
      user: { id: 10 },
    });
    const res = createResponse();
    await BudgetController.getAll(req, res);
    const data = res._getJSONData();
    expect(data).toHaveLength(0);
    expect(res.statusCode).toBe(200);
    expect(res.status).not.toBe("404");
  });

  it("deberia devolver error cuando se hace fetching a los budgets", async () => {
    (Budget.findAll as jest.Mock).mockRejectedValue(new Error());
    const req = createRequest({
      method: "GET",
      url: "/api/budgets",
      user: { id: 1 },
    });
    const res = createResponse();
    await BudgetController.getAll(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toHaveProperty("message");
  });
});

describe("BudgetController.create", () => {
  it("deberia crear un nuevo budget y devolver status 201", async () => {
    const mockBudget = {
      save: jest.fn().mockResolvedValue(true),
    };
    (Budget.create as jest.Mock).mockResolvedValue(mockBudget);
    const req = createRequest({
      method: "POST",
      url: "/api/budgets",
      user: { id: 1 },
      body: {
        name: "Budget 1",
        amount: 1000,
      },
    });
    const res = createResponse();
    await BudgetController.create(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(201);
    expect(data).toBe("Presupuesto creado");
    expect(mockBudget.save).toHaveBeenCalled();
    expect(mockBudget.save).toHaveBeenCalledTimes(1);
    expect(Budget.create).toHaveBeenCalledWith(req.body);
    expect(res.status).not.toBe("404");
  });

  it("deberia devolver error cuando se crea un budget", async () => {
    const mockBudget = {
      save: jest.fn(),
    };
    (Budget.create as jest.Mock).mockRejectedValue(new Error());
    const req = createRequest({
      method: "POST",
      url: "/api/budgets",
      user: { id: 1 },
      body: {
        name: "Budget 1",
        amount: 1000,
      },
    });
    const res = createResponse();
    await BudgetController.create(req, res);
    const data = res._getJSONData();
    expect(mockBudget.save).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(data).toEqual({ message: "Error creando Presupuesto" });
  });
});

describe("BudgetController.getById", () => {
  beforeEach(() => {
    (Budget.findByPk as jest.Mock).mockReset();
    (Budget.findByPk as jest.Mock).mockImplementation((id) => {
      const budget = budgets.filter((budget) => budget.id === id)[0];
      return Promise.resolve(budget);
    });
  });
  it("deberia devolver un budget con id 1 y 3 expenses", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets/:id",
      budget: { id: 1 },
    });

    const res = createResponse();
    await BudgetController.getById(req, res);
    const data = res._getJSONData();

    expect(data.expenses).toHaveLength(3);
    expect(res.statusCode).toBe(200);

    expect(Budget.findByPk).toHaveBeenCalled();
    expect(Budget.findByPk).toHaveBeenCalledTimes(1);
    expect(Budget.findByPk).toHaveBeenCalledWith(req.budget.id, {
      include: [Expense],
    });
  });

  it("deberia devolver un budget con id 2 y 2 expenses", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets/:id",
      budget: { id: 2 },
    });

    const res = createResponse();
    await BudgetController.getById(req, res);
    const data = res._getJSONData();

    expect(data.expenses).toHaveLength(2);
    expect(res.statusCode).toBe(200);
  });

  it("deberia devolver un budget con id 3 y 0 expenses", async () => {
    const req = createRequest({
      method: "GET",
      url: "/api/budgets/:id",
      budget: { id: 3 },
    });

    const res = createResponse();
    await BudgetController.getById(req, res);
    const data = res._getJSONData();

    expect(data.expenses).toHaveLength(0);
    expect(res.statusCode).toBe(200);
  });
});

describe("BudgetController.update", () => {
  it("deberia actualizar el budget y retornar succes message", async () => {
    const budgetMock = {
      update: jest.fn().mockResolvedValue(true),
    };

    const req = createRequest({
      method: "PUT",
      url: "/api/budgets/:budgetId",
      budget: budgetMock,
      body: {
        name: "Budget Update",
        amount: 5000,
      },
    });

    const res = createResponse();
    await BudgetController.updateById(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toBe("Presupuesto actualizado");
    expect(budgetMock.update).toHaveBeenCalled()
    expect(budgetMock.update).toHaveBeenCalledTimes(1);
    expect(budgetMock.update).toHaveBeenCalledWith(req.body);
  });
});

describe("BudgetController.delete", () => {
  it("deberia eliminar el budget y retornar success message", async () => {
    const budgetMock = {
      destroy: jest.fn().mockResolvedValue(true),
    };

    const req = createRequest({
      method: "DELETE",
      url: "/api/budgets/:budgetId",
      budget: budgetMock,
    });

    const res = createResponse();
    await BudgetController.deleteById(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data).toBe("Presupuesto eliminado");
    expect(budgetMock.destroy).toHaveBeenCalled()
    expect(budgetMock.destroy).toHaveBeenCalledTimes(1);
  });
});
