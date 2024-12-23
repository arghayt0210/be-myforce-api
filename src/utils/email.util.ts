import transporter from '@config/email.config';
import logger from '@/utils/logger.util';

interface EmailTemplate {
  subject: string;
  html: string;
}

interface EmailData {
  userName: string;
  otp?: string;
  resetToken?: string;
  interests?: string[];
}

type EmailTemplateFunction = (data: EmailData) => EmailTemplate;

interface EmailTemplates {
  [key: string]: EmailTemplateFunction;
}

const emailTemplates: EmailTemplates = {
  welcome: (data: EmailData): EmailTemplate => ({
    subject: 'Welcome to BeMyForce! 🚀',
    html: `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
       <h2>Welcome to BeMyForce! 🎉</h2>
       <p>Hi ${data.userName},</p>
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
  verifyEmail: (data: EmailData): EmailTemplate => ({
    subject: 'Verify Your Email - BeMyForce',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hi ${data.userName},</p>
        <p>Your email verification OTP is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <div style="background-color: #f4f4f4; padding: 12px 20px; 
                      font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${data.otp}
          </div>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>The BeMyForce Team</p>
      </div>
    `,
  }),
  resetPassword: (data: EmailData): EmailTemplate => ({
    subject: 'Reset Your Password - BeMyForce',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${data.userName},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password/${data.resetToken}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                    text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>The BeMyForce Team</p>
      </div>
    `,
  }),
  passwordChanged: (data: EmailData): EmailTemplate => ({
    subject: 'Password Changed Successfully - BeMyForce',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed Successfully</h2>
        <p>Hi ${data.userName},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The BeMyForce Team</p>
      </div>
    `,
  }),
  onboardingComplete: (data: EmailData): EmailTemplate => ({
    subject: 'Welcome to BeMyForce - Onboarding Complete! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Onboarding Complete! 🎉</h2>
        <p>Hi ${data.userName},</p>
        <p>Thank you for completing your profile setup!</p>
        <p>You're all set to start exploring BeMyForce! Here are some things you can do:</p>
        <ul>
          <li>Connect with others who share your interests</li>
          <li>Explore content related to your interests</li>
          <li>Start sharing your own content</li>
        </ul>
        <p>Best regards,<br>The BeMyForce Team</p>
      </div>
    `,
  }),
};

interface SendEmailParams {
  to: string;
  template: keyof typeof emailTemplates;
  data: EmailData;
}

export const sendEmail = async ({ to, template, data }: SendEmailParams) => {
  try {
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
