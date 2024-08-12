import nodemailer from "nodemailer";

export const sendEmail = async (
  email: string[],
  subject: string,
  message: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST as string,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SERVER_USER,
      to: email,
      subject,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.log("Error sending email", error);
    return { success: false };
  }
};
