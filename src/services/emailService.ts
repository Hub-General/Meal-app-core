import { mailTransporter } from "../config/emailConfig";

export const mailService = {
    sendOnboardingEmail: async (to: string, name: string ,token: string) => {
        try{
        const firstName = name.split(' ')[0];
        
            await mailTransporter.sendMail({
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
            console.log("===== SEND EMAIL FINISHED =====");
        }catch(error){
            console.error("Failed to send mail:", error)
        }
    },
    sendPasswordResetMail: async(to:string, name: string, token: string)=>{
        try{
        const firstName = name.split(' ')[0];
        await mailTransporter.sendMail({
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
        }catch(error){
            console.error("Failed to send PasswordReset Mail")
        }
    }
};

