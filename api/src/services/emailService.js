const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create SendGrid transporter using Nodemailer
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey', // This is the string 'apikey'
      pass: process.env.SENDGRID_API_KEY
    },
    secure: false,
    requireTLS: true
  });
};

// Send verification email function
const sendVerificationEmail = async (email, code) => {
  try {
    // Log detailed sending information
    console.log('Sending Verification Email:', {
      to: email,
      code: code,
      from: process.env.SENDGRID_FROM_EMAIL
    });

    // Create transporter
    const transporter = createTransporter();

    // Mail options
    const mailOptions = {
      from: {
        name: 'SkillLink Verification',
        address: process.env.SENDGRID_FROM_EMAIL
      },
      to: email,
      subject: 'Your SkillLink Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0;">SkillLink Verification</h1>
          </div>
          <div style="padding: 20px; background-color: #f4f4f4;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="background-color: white; padding: 15px; text-align: center; border-radius: 5px;">
              <h1 style="color: #3b82f6; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; margin-top: 15px;">
              This code will expire in 10 minutes. 
              If you did not request this verification, please ignore this email.
            </p>
          </div>
          <div style="background-color: #e5e5e5; padding: 10px; text-align: center; font-size: 12px;">
            © ${new Date().getFullYear()} SkillLink. All rights reserved.
          </div>
        </div>
      `,
      text: `Your SkillLink verification code is: ${code}`
    };

    // Send email with comprehensive error handling
    const info = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Detailed Email Sending Error:', {
            error: err,
            errorName: err.name,
            errorMessage: err.message,
            errorCode: err.code,
            errorStack: err.stack
          });
          reject(err);
        } else {
          console.log('Email Sent Successfully:', {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response
          });
          resolve(info);
        }
      });
    });

    return true;
  } catch (error) {
    console.error('Comprehensive Email Sending Error:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

// Alternative method using SendGrid's API directly
const sendVerificationEmailSendGrid = async (email, code) => {
  try {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SkillLink Verification'
      },
      subject: 'Your SkillLink Email Verification Code',
      text: `Your SkillLink verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0;">SkillLink Verification</h1>
          </div>
          <div style="padding: 20px; background-color: #f4f4f4;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="background-color: white; padding: 15px; text-align: center; border-radius: 5px;">
              <h1 style="color: #3b82f6; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; margin-top: 15px;">
              This code will expire in 10 minutes. 
              If you did not request this verification, please ignore this email.
            </p>
          </div>
          <div style="background-color: #e5e5e5; padding: 10px; text-align: center; font-size: 12px;">
            © ${new Date().getFullYear()} SkillLink. All rights reserved.
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log('Email sent successfully using SendGrid API');
    return true;
  } catch (error) {
    console.error('SendGrid API Error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Transporter is ready to send messages');
    return true;
  } catch (error) {
    console.error('Transporter Verification Failed:', {
      error: error,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

// Verify transporter on module load
verifyTransporter().catch(console.error);

module.exports = {
  sendVerificationEmail,
  sendVerificationEmailSendGrid, // Export both methods
  verifyTransporter
};