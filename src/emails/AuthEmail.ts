import { transport } from "../config/nodemailer";

type EmailType = {
  name: string;
  email: string;
  token: string;
};

export class AuthEmail {
  static sendConfirmationEmail = async (user: EmailType) => {
    const email = await transport.sendMail({
      from: "AndoPato <cuentas@ando-pato.com>",
      to: user.email,
      subject: "AndoPato - Confirma tu cuenta",
      html: `<p>Hola: ${user.name}, has creado tu cuenta en AndoPato, ya casi esta todo listo, solo debes confirmar tu cuenta</p>
        <p>Visita el siguiente enlace:</p>
        <a href="#">Confirmar cuenta</a>
        <p>E ingresa el código: <b>${user.token}</b></p>
        <p>Este token expira en 10 minutos</p>
      `,
    });
  };

  static sendPasswordResetToken = async (user: EmailType) => {
    const email = await transport.sendMail({
      from: "AndoPato <cuentas@ando-pato.com>",
      to: user.email,
      subject: "AndoPato - Restablece tu contraseña",
      html: `<p>Hola: ${user.name}, has solicitado restablecer tu contraseña en AndoPato</p>
        <p>Visita el siguiente enlace:</p>
        <a href="#">Restablecer contraseña</a>
        <p>E ingresa el código: <b>${user.token}</b></p>
        <p>Este token expira en 10 minutos</p>
      `,
    });
  };
}
