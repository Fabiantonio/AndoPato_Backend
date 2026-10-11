import request from "supertest";
import server, { connectDB } from "../../server";
import { AuthController } from "../../controllers/AuthController";
import User from "../../models/User";
import * as authUtils from "../../utils/auth";
import * as jwtUtils from "../../utils/jwt";

describe("Authentication - Create Account", () => {
  it("should display validation errors when form is empty", async () => {
    const res = await request(server).post("/api/auth/create-account").send({});
    const createAccountMock = jest.spyOn(AuthController, "createAccount");
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(201);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(3);
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("should return status code 400 when the email is invalid", async () => {
    const res = await request(server).post("/api/auth/create-account").send({
      name: "Test User",
      email: "invalid-email",
      password: "12345678",
    });
    const createAccountMock = jest.spyOn(AuthController, "createAccount");
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(201);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(1);
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("should return status code 400 when the password lenght is invalid", async () => {
    const res = await request(server).post("/api/auth/create-account").send({
      name: "Test User",
      email: "correo@correo.cl",
      password: "123456",
    });
    const createAccountMock = jest.spyOn(AuthController, "createAccount");
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(201);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].msg).toBe(
      "La contraseña debe tener al menos 8 caracteres",
    );
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("should register a new user successfully", async () => {
    const userData = {
      name: "Test User",
      email: "correo@correo.cl",
      password: "12345678",
    };
    const res = await request(server)
      .post("/api/auth/create-account")
      .send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.statusCode).not.toBe(400);
    expect(res.body).not.toHaveProperty("errors");
  });

  it("should return status code 409 when a user already exists", async () => {
    const userData = {
      name: "Test User",
      email: "correo@correo.cl",
      password: "12345678",
    };
    const res = await request(server)
      .post("/api/auth/create-account")
      .send(userData);
    expect(res.statusCode).toBe(409);
    expect(res.statusCode).not.toBe(400);
    expect(res.statusCode).not.toBe(201);
    expect(res.body).not.toHaveProperty("errors");
    expect(res.body.message).toBe("El usuario ya existe");
  });
});

describe("Authentication - Account Confirmation With Token", () => {
  it("should display error if token is empty or toke is not valid", async () => {
    const res = await request(server).post("/api/auth/confirm-account").send({
      token: "not_valid",
    });
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].msg).toBe("El token debe tener 6 caracteres");
  });

  it("should display error if token doesnt exists", async () => {
    const res = await request(server).post("/api/auth/confirm-account").send({
      token: "123456",
    });
    expect(res.statusCode).toBe(401);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Token no válido");
  });

  it("should confirm account with a valid token", async () => {
    const res = await request(server).post("/api/auth/confirm-account").send({
      token: globalThis.andoPatoConfirmationToken,
    });
    expect(res.statusCode).toBe(200);
    expect(res.statusCode).not.toBe(401);
    expect(res.body).toBe("Cuenta confirmada");
  });
});

describe("Authentication - Login", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("should display validation errors when form is empty", async () => {
    const res = await request(server).post("/api/auth/login").send({});
    const loginMock = jest.spyOn(AuthController, "login");
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(2);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("should return 400 bad request when the email is invalid", async () => {
    const res = await request(server).post("/api/auth/login").send({
      email: "invalid-email",
      password: "12345678",
    });
    const loginMock = jest.spyOn(AuthController, "login");
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].msg).toBe("Email no válido");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("should return 404 error if the user not found", async () => {
    const res = await request(server).post("/api/auth/login").send({
      email: "user@notfound.com",
      password: "12345678",
    });
    expect(res.statusCode).toBe(404);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Usuario no encontrado");
  });

  it("should return 403 error if the user account is not confirmed", async () => {
    (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValueOnce({
      id: 1,
      confirmed: false,
      password: "hashed_password",
      email: "user@notconfirmed.com",
    });

    const res = await request(server).post("/api/auth/login").send({
      email: "user@notconfirmed.com",
      password: "12345678",
    });
    expect(res.statusCode).toBe(403);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Usuario no confirmado");
  });

  it("should return 403 error if the user account is not confirmed", async () => {
    const userData = {
      name: "Test",
      email: "user@notconfirmed.com",
      password: "12345678",
    };

    await request(server).post("/api/auth/create-account").send(userData);

    const res = await request(server).post("/api/auth/login").send({
      email: userData.email,
      password: userData.password,
    });
    expect(res.statusCode).toBe(403);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Usuario no confirmado");
  });

  it("should return 401 error if the password is incorrect", async () => {
    const findOne = (
      jest.spyOn(User, "findOne") as jest.Mock
    ).mockResolvedValueOnce({
      id: 1,
      confirmed: true,
      password: "hashed_password",
    });

    const checkPassword = jest
      .spyOn(authUtils, "checkPassword")
      .mockResolvedValueOnce(false);

    const res = await request(server).post("/api/auth/login").send({
      email: "user@notconfirmed.com",
      password: "12345678",
    });
    expect(res.statusCode).toBe(401);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Contraseña incorrecta");

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(checkPassword).toHaveBeenCalledTimes(1);
  });

  it("should return 401 error if the password is incorrect", async () => {
    const findOne = (
      jest.spyOn(User, "findOne") as jest.Mock
    ).mockResolvedValueOnce({
      id: 1,
      confirmed: true,
      password: "hashed_password",
    });

    const checkPassword = jest
      .spyOn(authUtils, "checkPassword")
      .mockResolvedValueOnce(true);

    const generateJWT = jest
      .spyOn(jwtUtils, "generateJWT")
      .mockReturnValueOnce("mocked_jwt_token");

    const res = await request(server).post("/api/auth/login").send({
      email: "user@notconfirmed.com",
      password: "hashed_password",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ token: "mocked_jwt_token" });

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(checkPassword).toHaveBeenCalledTimes(1);
    expect(generateJWT).toHaveBeenCalledTimes(1);
  });
});

let jwt: string;

async function authenticateUser() {
  const res = await request(server).post("/api/auth/login").send({
    email: "correo@correo.cl",
    password: "12345678",
  });

  jwt = res.body.token;

  expect(res.statusCode).toBe(200);
}

describe("GET /api/budgets", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    await authenticateUser();
  });

  it("should reject unauthenticated access to budges without a jwt token", async () => {
    const res = await request(server).get("/api/budgets");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("No autorizado");
  });

  it("should reject unauthenticated access to budges without a valid jwt token", async () => {
    const res = await request(server)
      .get("/api/budgets")
      .auth("invalid_token", { type: "bearer" });
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Token no valido");
  });

  it("should allow authenticated access to budges with a jwt token", async () => {
    const res = await request(server)
      .get("/api/budgets")
      .auth(jwt, { type: "bearer" });
    expect(res.statusCode).not.toBe(401);
    expect(res.body).not.toHaveProperty("message");
    expect(res.body.message).not.toBe("No autorizado");
  });
});

describe("POST /api/budgets", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  it("should reject unauthenticated post request to budges without a jwt token", async () => {
    const res = await request(server).post("/api/budgets");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("No autorizado");
  });

  it("should display validation when the form is submitted with invalid data", async () => {
    const res = await request(server)
      .post("/api/budgets")
      .auth(jwt, { type: "bearer" })
      .send({
        name: "",
        amount: -100,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(2);
  });

  it("should create a new budget successfully when the form is submitted with valid data", async () => {
    const res = await request(server)
      .post("/api/budgets")
      .auth(jwt, { type: "bearer" })
      .send({
        name: "Test Budget",
        amount: 1000,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual("Presupuesto creado");
  });
});

describe("GET /api/budgets/:id", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  it("should reject unauthenticated get request to budge by id without a jwt token", async () => {
    const res = await request(server).get("/api/budgets/1");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("No autorizado");
  });

  it("should return 400 bad request when the id is invalid", async () => {
    const res = await request(server)
      .get("/api/budgets/invalid_id")
      .auth(jwt, { type: "bearer" });
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.message).not.toBe("No autorizado");
  });

  it("should return 404 bad request when the id is not found", async () => {
    const res = await request(server)
      .get("/api/budgets/999")
      .auth(jwt, { type: "bearer" });
    expect(res.statusCode).toBe(404);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Presupuesto no encontrado");
    expect(res.body.message).not.toBe("No autorizado");
  });

  it("should return a single budget by id", async () => {
    const res = await request(server)
      .get("/api/budgets/1")
      .auth(jwt, { type: "bearer" });
    expect(res.statusCode).toBe(200);
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(404);
    expect(res.statusCode).not.toBe(400);
  });
});

describe("PUT /api/budgets/:id", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  it("should reject unauthenticated put request to budge by id without a jwt token", async () => {
    const res = await request(server).put("/api/budgets/1");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("No autorizado");
  });

  it("should display validation error when form is empty", async () => {
    const res = await request(server)
      .put("/api/budgets/1")
      .auth(jwt, { type: "bearer" })
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors).toHaveLength(4);
  });

  it("should update a budget by id a success message", async () => {
    const res = await request(server)
      .put("/api/budgets/1")
      .auth(jwt, { type: "bearer" })
      .send({ name: "Updated Budget", amount: 1000 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual("Presupuesto actualizado");
  });
});

describe("DELETE /api/budgets/:id", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  it("should reject unauthenticated delete request to budge by id without a jwt token", async () => {
    const res = await request(server).delete("/api/budgets/1");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("No autorizado");
  });

  it("should return 404 not found for non-existent budget", async () => {
    const res = await request(server)
      .delete("/api/budgets/999")
      .auth(jwt, { type: "bearer" });
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Presupuesto no encontrado");
  });

  it("should delete a budget by id and return a success message", async () => {
    const res = await request(server)
      .delete("/api/budgets/1")
      .auth(jwt, { type: "bearer" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual("Presupuesto eliminado");
  });
});
