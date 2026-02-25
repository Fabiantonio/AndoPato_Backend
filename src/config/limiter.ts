import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 5 : 100, // Limite cada IP a 5 solicitudes por ventanaMs
  message: { message: "Demasiadas solicitudes, por favor intenta de nuevo más tarde" },
});