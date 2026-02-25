import { createRequest, createResponse } from "node-mocks-http";
import {
  hasAccessToBudget,
  validateBudgetExist,
} from "../../../middleware/budget";
import Budget from "../../../models/Budget";
import { budgets } from "../../mocks/budgets";

jest.mock("../../../models/Budget", () => ({
  findOne: jest.fn(),
}));

describe("budget - validateBudgetExists", () => {
  it("should handle non-existent budget", async () => {
    (Budget.findOne as jest.Mock).mockResolvedValueOnce(null);
    const req = createRequest({
      params: {
        budgetId: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await validateBudgetExist(req, res, next);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(404);
    expect(data.message).toBe("Presupuesto no encontrado");
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle non-existent budget", async () => {
    (Budget.findOne as jest.Mock).mockRejectedValue(new Error());
    const req = createRequest({
      params: {
        budgetId: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await validateBudgetExist(req, res, next);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data.message).toBe("Error obteniendo el Presupuesto");
    expect(next).not.toHaveBeenCalled();
  });

  it("should proceed to next middleware if budget exists", async () => {
    (Budget.findOne as jest.Mock).mockResolvedValueOnce(budgets[0]);
    const req = createRequest({
      params: {
        budgetId: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await validateBudgetExist(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.budget).toBe(budgets[0]);
  });
});

describe("budget - hasAccessToBudget", () => {
  it("should call next() if user has acces to budget", async () => {
    const req = createRequest({
      budget: budgets[0],
      user: {
        id: 1,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    hasAccessToBudget(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

    it("should return error if userID does not match budget", async () => {
    const req = createRequest({
      budget: budgets[0],
      user: {
        id: 2,
      },
    });
    const res = createResponse();
    const next = jest.fn();

    hasAccessToBudget(req, res, next);
    
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(res._getJSONData().message).toBe("No tienes acceso a este Presupuesto");
  });
});
