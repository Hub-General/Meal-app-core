import { mailTransporter } from "../config/emailConfig";

export const mailService = {
    sendNotificationEmail: async (
        to: string,
        recipientName: string,
        subject: string,
        message: string
    ): Promise<boolean> => {
        try {
            const firstName = recipientName ? recipientName.split(" ")[0] : "there";
            await mailTransporter.sendMail({
                from: `"Meal App" <${process.env.MAIL_FROM}>`,
                to,
                subject,
                html: `
                    <div style="width:100%; background:#f5f5f5; padding:40px 0; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                        <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px; margin:0 auto;">
                            <tr>
                                <td style="background:#ffffff; border-radius:12px; padding:30px; text-align:center;">
                                    <img src="https://rqjzrmhpyhuzbgcxeuhc.supabase.co/storage/v1/object/public/MealAppImages/BellIcon.png" width="120" alt="Meal App" style="margin-bottom:15px;"/>
                                    <h2 style="margin:0 0 15px 0; font-size:22px; color:#333;">
                                        ${subject}
                                    </h2>
                                    <p style="margin:0 0 15px 0; font-size:16px; color:#444; line-height:1.5;">
                                        Hello ${firstName},
                                    </p>
                                    <div style="background:#f8faf8; border-left:4px solid #4CAF50; border-radius:6px; padding:15px; text-align:left; margin:20px 0; font-size:15px; color:#222; line-height:1.5;">
                                        ${message}
                                    </div>
                                    <p style="margin:20px 0 0 0; font-size:13px; color:#888;">
                                        Meal App Notification
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </div>
                `
            });
            return true;
        } catch (error) {
            console.error("Failed to send notification email to " + to + ":", error);
            return false;
        }
    },

    sendSelectionNotification: async (
        to: string,
        recipientName: string,
        subject: string,
        message: string
    ) => {
        try {
            await mailTransporter.sendMail({
                from: `"Meal App" <${process.env.MAIL_FROM}>`,
                to,
                subject,
                html: `<p>Hello ${recipientName.split(" ")[0]},</p><p>${message}</p>`
            });
        } catch (error) {
            console.error("Failed to send selection notification:", error);
        }
    },
    // Throws if the email can't be sent
    sendOnboardingEmail: async (to: string, name: string ,token: string) => {
        const firstName = name.split(' ')[0];
        const info = await mailTransporter.sendMail({
                from: `"Meal App" <${process.env.MAIL_FROM}>`,
                to,
                subject: "Join the Meal App!",
                html: `
                    <div style="width:100%; background:#f5f5f5; padding:40px 0; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, sans-serif;">
                        <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                            <tr>
                            <table role="presentation" align="center" cellpadding="0" cellspacing="15px" 
                                    style="background:#ffffff; border-radius:12px; padding:30px; width:100%; max-width:480px; text-align:center;">

                                    <tr>
                                        <td style="text-align:center;">

                                            
                                            <img src="https://rqjzrmhpyhuzbgcxeuhc.supabase.co/storage/v1/object/public/MealAppImages/BellIcon.png" width="200" alt="Meal App Logo" style="padding: 20px;"/>
                                            
                                            <h1 style="margin:0 0 0 0; font-size:28px; color:#333; padding:0 0 20px 0">
                                                Hello ${firstName} 👋, 
                                                <br/>
                                                Welcome To The Meal App
                                            </h1>
                                            <table role="presentation" cellpadding="0" cellspacing="15" align="center">
                                            <tr>
                                                <td style="
                                                border:2px dashed #4CAF50;
                                                border-radius:8px;
                                                background:#f8faf8;
                                                padding:15px 35px;
                                                text-align:center;
                                                font-size:24px;
                                                font-weight:700;
                                                letter-spacing:4px;
                                                color:#333333;
                                                ">
                                                    ${token}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                            <p style="margin:0 0 10px 0; font-size:14px; color:#666; text-align:center;">
                                                This Verification Code Expires in 25 Minutes. Please copy it into your sign-up form.
                                            </p>
                                                </td>
                                            </tr>
                                    </table>
                                    

                                        </td>
                                    </tr>
                                    
                                    <tr >
                                        <td style="text-align: center; background:#f8faf8; padding:30px 40px; border-radius:5px;">
                                            <p style="margin:0 0 20px 0; font-size:14px; color:#3e584a;">
                                                Contact your administrator if you are not supposed to be receiving this Mail
                                            </p>
                                            <img src="https://rqjzrmhpyhuzbgcxeuhc.supabase.co/storage/v1/object/public/MealAppImages/HmdhIcon.png" width="100" alt="Meal App Logo" />

                                        </td>
                                    </tr>
                                </table>
                            </tr>
                            <tr>

                            </tr>
                        </table>

                    </div>
                `
            });
        console.log("[MAIL] Onboarding code sent", { to, messageId: info.messageId });
    },

    // Throws if the email can't be sent
    sendPasswordResetMail: async(to:string, name: string, token: string)=>{
        const firstName = name.split(' ')[0];
        const info = await mailTransporter.sendMail({
            from: `"Meal App" <${process.env.MAIL_FROM}>`,
            to,
            subject: "Oops! You Forgot Your Password",
            html: `
                <div style="width:100%; background:#f5f5f5; padding:40px 0; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, sans-serif;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                        <tr>
                        <table role="presentation" align="center" cellpadding="0" cellspacing="15px" 
                                style="background:#ffffff; border-radius:12px; padding:30px; width:100%; max-width:480px; text-align:center;">

                                <tr>
                                    <td style="text-align:center;">

                                        
                                        <img src="https://rqjzrmhpyhuzbgcxeuhc.supabase.co/storage/v1/object/public/MealAppImages/BellIcon.png" width="200" alt="Meal App Logo" style="padding: 20px;"/>
                                        
                                        <h1 style="margin:0 0 0 0; font-size:28px; color:#333; padding:0 0 20px 0">
                                            Hello ${firstName} 👋, 
                                            <br/>
                                            Seems You Forgot Your Password
                                        </h1>
                                        <table role="presentation" cellpadding="0" cellspacing="15" align="center">
                                        <tr>
                                            <td style="
                                            border:2px dashed #4CAF50;
                                            border-radius:8px;
                                            background:#f8faf8;
                                            padding:15px 35px;
                                            text-align:center;
                                            font-size:24px;
                                            font-weight:700;
                                            letter-spacing:4px;
                                            color:#333333;
                                            ">
                                                ${token}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                        <p style="margin:0 0 10px 0; font-size:14px; color:#666; text-align:center;">
                                            This Reset Token Expires in 25 Minutes. Please copy it into your password reset form.
                                        </p>
                                            </td>
                                        </tr>
                                </table>
                                

                                    </td>
                                </tr>
                                
                                <tr >
                                    <td style="text-align: center; background:#f8faf8; padding:30px 40px; border-radius:5px;">
                                        <p style="margin:0 0 20px 0; font-size:14px; color:#3e584a;">
                                            Contact your administrator if you are not supposed to be receiving this Mail
                                        </p>
                                        <img src="https://rqjzrmhpyhuzbgcxeuhc.supabase.co/storage/v1/object/public/MealAppImages/HmdhIcon.png" width="100" alt="Meal App Logo" />

                                    </td>
                                </tr>
                            </table>
                        </tr>
                        <tr>

                        </tr>
                    </table>

                </div>
            `
        });
        console.log("[MAIL] Password reset code sent", { to, messageId: info.messageId });
    }
};

