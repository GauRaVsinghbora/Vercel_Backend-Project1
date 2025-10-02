import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, otp) => {
  // transporter (using Gmail here, but you can use any SMTP service)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS   
        }
    });

    const mailOptions = {
        from: `"MyApp Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Verification Code",
        text: `Your verification code is: ${otp}`,
        html: `<p>Your verification code is: <b>${otp}</b></p>`
    };

    await transporter.sendMail(mailOptions);
};
