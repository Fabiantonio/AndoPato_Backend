import { Router } from "express";
import { body, param } from "express-validator";
import { AuthController } from "../controllers/AuthController";
import { handleInputErrors } from "../middleware/validation";
import { limiter } from "../config/limiter";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(limiter);

router.post(
  "/create-account",
  body("name").notEmpty().withMessage("El nombre es obligatorio"),
  body("email").isEmail().withMessage("Email no válido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres"),
  handleInputErrors,
  AuthController.createAccount,
);

router.post(
  "/confirm-account",
  body("token")
    .isLength({ min: 6, max: 6 })
    .withMessage("El token debe tener 6 caracteres"),
  handleInputErrors,
  AuthController.confirmAccount,
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Email no válido"),
  body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  handleInputErrors,
  AuthController.login,
);

router.post(
  "/forgot-password",
  body("email").isEmail().withMessage("Email no válido"),
  handleInputErrors,
  AuthController.forgotPassword,
);

router.post(
  "/validate-token",
  body("token")
    .notEmpty()
    .withMessage("El token es obligatorio")
    .isLength({ min: 6, max: 6 })
    .withMessage("El token debe tener 6 caracteres"),
  handleInputErrors,
  AuthController.validateToken,
);

router.post(
  "/reset-password/:token",
  param("token")
    .notEmpty()
    .withMessage("El token es obligatorio")
    .isLength({ min: 6, max: 6 })
    .withMessage("El token debe tener 6 caracteres"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres"),
  handleInputErrors,
  AuthController.resetPassword,
);

router.get("/user", authenticate, AuthController.getUser);

router.post(
  "/update-password",
  authenticate,
  body("current_password")
    .notEmpty()
    .withMessage("La contraseña actual es obligatoria"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La contraseña nueva debe tener al menos 8 caracteres"),
  handleInputErrors,
  AuthController.updateCurrentUserPassword,
);

router.post(
  "/check-password",
  authenticate,
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria"),
  handleInputErrors,
  AuthController.checkPassword,
);

export default router;
