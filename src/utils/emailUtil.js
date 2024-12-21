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
  // Add more email templates here
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
