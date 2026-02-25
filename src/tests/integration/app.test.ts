import request from "supertest";
import server, { connectDB } from "../../server";
import { AuthController } from "../../controllers/AuthController";

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
  it('should display error if token is empty or toke is not valid', async () => {
    const res = await request(server).post("/api/auth/confirm-account").send({
      token: "not_valid",
    });
    expect(res.statusCode).toBe(400);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].msg).toBe("El token debe tener 6 caracteres");
  })

   it('should display error if token doesnt exists', async () => {
    const res = await request(server).post("/api/auth/confirm-account").send({
      token: "123456",
    });
    expect(res.statusCode).toBe(401);
    expect(res.statusCode).not.toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("Token no válido");
  })

     it('should confirm account with a valid token', async () => {
    const res = await request(server).post("/api/auth/confirm-account").send({
      token: globalThis.andoPatoConfirmationToken,
    });
    expect(res.statusCode).toBe(200);
    expect(res.statusCode).not.toBe(401);
    expect(res.body).toBe("Cuenta confirmada");
  })
})