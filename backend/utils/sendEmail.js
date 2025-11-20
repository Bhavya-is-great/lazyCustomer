import nodemailer from "nodemailer";


const sendEmail = async (email, link) => {
    try {

        const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
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
        console.error("Error sending email:", error);
        return null;
    }
};

export default sendEmail;
