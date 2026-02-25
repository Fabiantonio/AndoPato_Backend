import { createRequest, createResponse } from "node-mocks-http";
import { AuthController } from "../../../controllers/AuthController";
import User from "../../../models/User";
import { checkPassword, hashPassword } from "../../../utils/auth";
import { generateToken } from "../../../utils/token";
import { AuthEmail } from "../../../emails/AuthEmail";
import { generateJWT } from "../../../utils/jwt";

jest.mock("../../../models/User");
jest.mock("../../../utils/auth");
jest.mock("../../../utils/token");
jest.mock("../../../utils/jwt");

describe("AuthController.createAccount", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("should rturn a 409 status and an error message if the email is already register", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(true);
    const req = createRequest({
      method: "POST",
      url: "/api/auth/create-account",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });
    const res = createResponse();

    await AuthController.createAccount(req, res);
    expect(res.statusCode).toBe(409);
    expect(res._getJSONData()).toEqual({ message: "El usuario ya existe" });
    expect(User.create).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalledTimes(1);
  });

  it("should register a new user and return a success message", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/create-account",
      body: {
        email: "test@test.com",
        password: "123456",
        name: "Test User",
      },
    });
    const res = createResponse();

    const mockUser = {
      ...req.body,
      save: jest.fn(),
    };
    (User.create as jest.Mock).mockResolvedValue(mockUser);
    (hashPassword as jest.Mock).mockResolvedValue("hashedPassword");
    (generateToken as jest.Mock).mockReturnValue("token");
    jest
      .spyOn(AuthEmail, "sendConfirmationEmail")
      .mockImplementation(() => Promise.resolve());

    await AuthController.createAccount(req, res);

    expect(User.create).toHaveBeenCalledTimes(1);
    expect(User.create).toHaveBeenCalledWith(req.body);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(mockUser.save).toHaveBeenCalledWith();
    expect(mockUser.token).toBe("token");
    expect(mockUser.password).toBe("hashedPassword");
    expect(AuthEmail.sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(AuthEmail.sendConfirmationEmail).toHaveBeenCalledWith({
      name: mockUser.name,
      email: mockUser.email,
      token: mockUser.token,
    });
    expect(res.statusCode).toBe(201);
  });
});

describe("AuthController.login", () => {
  it("should return 404 if user is not found", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });
    const res = createResponse();

    await AuthController.login(req, res);
    const data = res._getJSONData().message;
    expect(res.statusCode).toBe(404);
    expect(data).toBe("Usuario no encontrado");
  });

  it("should return 403 if the account is not confirmed", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: "hashedPassword",
      confirmed: false,
    });
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });
    const res = createResponse();

    await AuthController.login(req, res);
    const data = res._getJSONData().message;
    expect(res.statusCode).toBe(403);
    expect(data).toBe("Usuario no confirmado");
  });

   it("should return 401 if the password is incorrect", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: "hashedPassword",
      confirmed: true,
    });
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });
    const res = createResponse();

    (checkPassword as jest.Mock).mockResolvedValue(false);

    await AuthController.login(req, res);
    const data = res._getJSONData().message;
    expect(res.statusCode).toBe(401);
    expect(data).toBe("Contraseña incorrecta");
    expect(checkPassword).toHaveBeenCalledWith(req.body.password, "hashedPassword");
    expect(checkPassword).toHaveBeenCalledTimes(1);
  });

  it("should return a JWT token if authentication is correct", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: "hashedPassword",
      confirmed: true,
    });
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });
    const res = createResponse();

    (checkPassword as jest.Mock).mockResolvedValue(true);
    (generateJWT as jest.Mock).mockReturnValue("jwttoken");

    await AuthController.login(req, res);
    const data = res._getJSONData().token
    expect(res.statusCode).toBe(200);
    expect(data).toEqual("jwttoken");
    expect(generateJWT).toHaveBeenCalledTimes(1);
    expect(generateJWT).toHaveBeenCalledWith(1);
  });
});
