import nodemailer from "nodemailer";

const sendEmail = async (email, link) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: "lazyCustomer <ashut3103@gmail.com>",
            to: email,
            subject: "lazyCustomer - login verification",
            html: `Click on the link for login <a href="${link}">${link}</a>`,
        });
    } catch (error) {
        throw new AppError(500, error);
    }
};

export default sendEmail;
