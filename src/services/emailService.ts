import { mailTransporter } from "../config/emailConfig";

export const mailService = {
    sendOnboardingEmail: async (to: string, token: string) => {
        const link = `https://meal-app-core.com/onboarding?token=${token}`;

        await mailTransporter.sendMail({
            from: `"Meal System" <${process.env.SMTP_USER}>`,
            to,
            subject: "Join the Meal App!",
            html: `
                <div>
                    <h2>Welcome To The Meal App👋</h2>
                    <p>Click below to continue onboarding:</p>
                    <a href="${link}" style="
                        padding:10px 15px;
                        background:#4CAF50;
                        color:white;
                        text-decoration:none;
                        border-radius:5px;
                    ">
                        Continue Onboarding
                    </a>
                </div>
            `,
        });
    },
};