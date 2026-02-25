import { Request, Response } from "express";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/auth";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    //Revisar si el usuario existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }
    try {
      const user = await User.create(req.body);
      user.password = await hashPassword(password);
      const token = generateToken();
      user.token = token;

      if (process.env.NODE_ENV !== "production") {
        globalThis.andoPatoConfirmationToken = token
      }

      await user.save();

      await AuthEmail.sendConfirmationEmail({
        name: user.name,
        email: user.email,
        token: user.token,
      });

      res.status(201).json("Cuenta creada");
    } catch (error) {
      res.status(500).json({ message: "Error creando la cuenta" });
    }
  };

  static confirmAccount = async (req: Request, res: Response) => {
    const { token } = req.body;
    const user = await User.findOne({ where: { token } });
    if (!user) {
      return res.status(401).json({ message: "Token no válido" });
    }
    try {
      user.confirmed = true;
      user.token = "";
      await user.save();
      res.status(200).json("Cuenta confirmada");
    } catch (error) {
      res.status(500).json({ message: "Error confirmando la cuenta" });
    }
  };

  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    //Revisar si el usuario existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    //Revisar si el usuario está confirmado
    if (!user.confirmed) {
      return res.status(403).json({ message: "Usuario no confirmado" });
    }
    //Revisar si la contraseña es correcta
    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    //Generar JWT
    const token = generateJWT(user.id);
    res.status(200).json({ token });
  };

  static forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    //Revisar si el usuario existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    user.token = generateToken();
    await user.save();

    await AuthEmail.sendPasswordResetToken({
      name: user.name,
      email: user.email,
      token: user.token,
    });
    res.json({ message: "Token enviado revisa tu email" });
  };

  static validateToken = async (req: Request, res: Response) => {
    const { token } = req.body;
    const tokenExists = await User.findOne({ where: { token } });
    if (!tokenExists) {
      return res.status(404).json({ message: "Token no válido" });
    }
    res.json({ message: "Token válido" });
  };

  static resetPassword = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({ where: { token } });
    if (!user) {
      return res.status(404).json({ message: "Token no válido" });
    }
    //asignar nuevo password
    user.password = await hashPassword(password);
    user.token = "";
    await user.save();
    res.status(200).json("Contraseña restablecida");
  };

  static getUser = async (req: Request, res: Response) => {
    res.json(req.user);
  };

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body;
    const { id } = req.user;
    const user = await User.findByPk(id);
    const isPasswordCorrect = await checkPassword(
      current_password,
      user.password,
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    //asignar nuevo password
    user.password = await hashPassword(password);
    await user.save();
    res.status(200).json("Contraseña actualizada");
  };

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body;
    const { id } = req.user;
    const user = await User.findByPk(id);
    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    res.status(200).json({ message: "Contraseña correcta" });
  };
}
