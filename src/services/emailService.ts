import { mailTransporter } from "../config/emailConfig";

export const mailService = {
    sendOnboardingEmail: async (to: string, token: string) => {
        const link = `https://meal-app-core.com/onboarding?token=${token}`;

        await mailTransporter.sendMail({
            from: `"Meal App" <${process.env.SMTP_USER}>`,
            to,
            subject: "Join the Meal App!",
            html: `
                <div style="width:100%; background:#f5f5f5; padding:40px 0; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, sans-serif;">

                    <table role="presentation" align="center" cellpadding="0" cellspacing="15px" 
                        style="background:#ffffff; border-radius:12px; padding:30px; width:100%; max-width:480px; text-align:center;">

                        <tr>
                            <td style="text-align:center;">

                                
                                <img src="cid:meal-app-logo" width="230" alt="Meal App Logo" style="padding: 0; margin:-10px"/>
                                <h1 style="margin:0 0 10px 0; font-size:24px; color:#333;">
                                    Welcome To The Meal App 👋
                                </h1>

                                <p style="margin:0 0 10px 0; font-size:14px; color:#666;">
                                    Click below to continue onboarding:
                                </p>

                                <a href="${link}" 
                                    style="
                                        display:inline-block;
                                        padding:12px 18px;
                                        background:#4CAF50;
                                        color:#ffffff;
                                        text-decoration:none;
                                        border-radius:6px;
                                        font-size:14px;
                                        font-weight:600;
                                        margin: 0 0 10px 0;
                                    ">
                                    Continue Onboarding
                                </a>

                            </td>
                        </tr>
                        
                        <tr >
                            <td style="text-align: center; background:#f8faf8; padding:30px 40px; border-radius:5px;">
                                <p style="margin:0 0 20px 0; font-size:14px; color:#3e584a;">
                                    Contact your administrator if you are not supposed to be receiving this Mail
                                </p>
                                <img src="cid:HMDH-logo" width="100" alt="Meal App Logo" />

                            </td>
                        </tr>
                    </table>

                </div>
            `,
            attachments:[
                {
                    filename: "BellIcon.png",
                    cid: "meal-app-logo",
                    path:"src/assets/BellIcon.png"

                },
                {
                    filename: "HmdhIcon.png",
                    cid: "HMDH-logo",
                    path:"src/assets/HmdhIcon.png"

                },

            ]
        });
    },
};