import transporter from '@config/email';
import logger from '@config/logger';

const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to BeMyForce! 🚀',
    html: `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2>Welcome to BeMyForce! 🎉</h2>
       <p>Hi ${userName},</p>
       <p>Thank you for joining BeMyForce! We're excited to have you on board.</p>
       <p>Here are a few things you can do to get started:</p>
       <ul>
         <li>Complete your profile</li>
         <li>Explore our features</li>
         <li>Connect with others</li>
       </ul>
       <p>If you have any questions, feel free to reach out to our support team.</p>
       <p>Best regards,<br>The BeMyForce Team</p>
     </div>
   `,
  }),
  verifyEmail: ({ userName, otp }) => ({
    subject: 'Verify Your Email - BeMyForce',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hi ${userName},</p>
        <p>Your email verification OTP is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <div style="background-color: #f4f4f4; padding: 12px 20px; 
                      font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>The BeMyForce Team</p>
      </div>
    `,
  }),
};

export const sendEmail = async ({ to, template, data }) => {
  try {
    if (!emailTemplates[template]) {
      throw new Error(`Email template '${template}' not found`);
    }
    const { subject, html } = emailTemplates[template](data);
    const mailOptions = {
      from: process.env.MAILTRAP_SMTP_FROM,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};
