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
      user: 'apikey', // This is literally the string 'apikey'
      pass: process.env.SENDGRID_API_KEY
    },
    secure: false,
    requireTLS: true
  });
};

/**
 * Generate email content based on booking status
 * @param {Object} bookingData - Contains booking details
 * @param {string} recipientType - 'user' or 'vendor'
 * @returns {Object} - Email subject and content
 */
const generateEmailContent = (bookingData, recipientType) => {
  const { status, serviceName, bookingDate, bookingTime, user, vendor, bookingId } = bookingData;
  const recipient = recipientType === 'user' ? user : vendor;
  const otherParty = recipientType === 'user' ? vendor : user;
  
  let statusColor, statusText, actionText, recipientSpecificText;
  
  switch (status) {
    case 'pending':
      statusColor = '#f59e0b'; // Amber
      statusText = 'Booking Pending';
      actionText = recipientType === 'user' 
        ? 'Your service booking is now pending vendor approval.' 
        : 'A new service booking requires your approval.';
      break;
    case 'accepted':
      statusColor = '#10b981'; // Green
      statusText = 'Booking Accepted';
      actionText = recipientType === 'user' 
        ? `Your booking has been accepted by ${otherParty.name}.` 
        : 'You have accepted this booking.';
      break;
    case 'completed':
      statusColor = '#3b82f6'; // Blue
      statusText = 'Booking Completed';
      actionText = recipientType === 'user' 
        ? `${otherParty.name} has marked this booking as completed.` 
        : 'You have marked this booking as completed.';
      break;
    case 'rejected':
      statusColor = '#ef4444'; // Red
      statusText = 'Booking Rejected';
      actionText = recipientType === 'user' 
        ? `We regret to inform you that ${otherParty.name} has rejected your booking.` 
        : 'You have rejected this booking.';
      break;
    case 'cancelled':
      statusColor = '#6b7280'; // Gray
      statusText = 'Booking Cancelled';
      actionText = recipientType === 'user' 
        ? 'You have cancelled this booking.' 
        : `${otherParty.name} has cancelled their booking.`;
      break;
    default:
      statusColor = '#3b82f6'; // Blue
      statusText = 'Booking Update';
      actionText = 'There has been an update to your booking.';
  }

  // Add recipient specific instructions
  if (recipientType === 'user') {
    if (status === 'accepted') {
      recipientSpecificText = 'Please be ready for your appointment at the scheduled time.';
    } else if (status === 'rejected') {
      recipientSpecificText = 'You may try booking another time slot or service provider.';
    }
  } else { // vendor
    if (status === 'pending') {
      recipientSpecificText = 'Please review and respond to this booking request at your earliest convenience.';
    } else if (status === 'accepted') {
      recipientSpecificText = 'Please ensure you are prepared for this appointment.';
    }
  }

  const formattedTime = bookingTime || '';
  const formattedDate = bookingDate || 'Not specified';
  const dateTimeDisplay = formattedTime ? `${formattedDate}, ${formattedTime}` : formattedDate;

  const subject = `${statusText} - SkillLink Service Booking #${bookingId}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
      <div style="background-color: ${statusColor}; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">${statusText}</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Hello ${recipient.name},</p>
        <p>${actionText}</p>
        
        ${recipientSpecificText ? `<p>${recipientSpecificText}</p>` : ''}
        
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd; width: 40%;"><strong>Booking ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">#${bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Service:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Date & Time:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${dateTimeDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>${recipientType === 'user' ? 'Service Provider' : 'Customer'}:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${otherParty.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                <span style="display: inline-block; padding: 3px 8px; background-color: ${statusColor}; color: white; border-radius: 3px;">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </td>
            </tr>
          </table>
        </div>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Thank you for using SkillLink!</p>
        
        <p style="margin-bottom: 0;">Best regards,<br>The SkillLink Team</p>
      </div>
      
      <div style="background-color: #e5e5e5; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px;">
        © 2025 SkillLink. All rights reserved.
      </div>
    </div>
  `;
  
  const text = `
    ${statusText}
    
    Hello ${recipient.name},
    
    ${actionText}
    
    ${recipientSpecificText || ''}
    
    BOOKING DETAILS
    ---------------
    Booking ID: #${bookingId}
    Service: ${serviceName}
    Date & Time: ${dateTimeDisplay}
    ${recipientType === 'user' ? 'Service Provider' : 'Customer'}: ${otherParty.name}
    Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
    
    If you have any questions or need assistance, please contact our support team.
    
    Thank you for using SkillLink!
    
    Best regards,
    The SkillLink Team
  `;
  
  return { subject, html, text };
};

/**
 * Send booking status notification emails to both user and vendor
 * @param {Object} bookingData - Contains booking details
 * @param {string} bookingData.status - Status of the booking (pending, accepted, completed, rejected, cancelled)
 * @param {string} bookingData.serviceName - Name of the service booked
 * @param {string} bookingData.bookingId - Unique identifier for the booking
 * @param {string} bookingData.bookingDate - Date of the service booking
 * @param {string} bookingData.bookingTime - Time of the service booking
 * @param {Object} bookingData.user - User details
 * @param {string} bookingData.user.name - Name of the user
 * @param {string} bookingData.user.email - Email of the user
 * @param {Object} bookingData.vendor - Vendor details
 * @param {string} bookingData.vendor.name - Name of the vendor/service provider
 * @param {string} bookingData.vendor.email - Email of the vendor/service provider
 * @returns {Promise<boolean>} - Returns true if emails sent successfully
 */
const sendBookingStatusNotification = async (bookingData) => {
  try {
    // Validate required fields
    if (!bookingData.bookingId || !bookingData.status || !bookingData.serviceName) {
      console.error('Missing required fields for notification:', {
        bookingId: bookingData.bookingId,
        status: bookingData.status,
        serviceName: bookingData.serviceName
      });
      throw new Error('Missing required fields for notification');
    }
    
    if (!bookingData.user?.email || !bookingData.vendor?.email) {
      console.error('Missing email addresses for notification:', {
        userEmail: bookingData.user?.email,
        vendorEmail: bookingData.vendor?.email
      });
      throw new Error('Missing email addresses for notification');
    }

    console.log(`[2025-03-15 18:41:46] Sending ${bookingData.status} booking notifications for booking #${bookingData.bookingId}`);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Generate and send user email
    const userEmailContent = generateEmailContent(bookingData, 'user');
    const userMailOptions = {
      from: {
        name: 'SkillLink Bookings',
        address: process.env.SENDGRID_FROM_EMAIL
      },
      to: bookingData.user.email,
      subject: userEmailContent.subject,
      html: userEmailContent.html,
      text: userEmailContent.text
    };
    
    // Generate and send vendor email
    const vendorEmailContent = generateEmailContent(bookingData, 'vendor');
    const vendorMailOptions = {
      from: {
        name: 'SkillLink Bookings',
        address: process.env.SENDGRID_FROM_EMAIL
      },
      to: bookingData.vendor.email,
      subject: vendorEmailContent.subject,
      html: vendorEmailContent.html,
      text: vendorEmailContent.text
    };
    
    console.log(`[2025-03-15 18:41:46] Prepared emails for booking #${bookingData.bookingId}:`, {
      userEmail: bookingData.user.email,
      vendorEmail: bookingData.vendor.email
    });
    
    // Send both emails
    const sendPromises = [
      new Promise((resolve, reject) => {
        transporter.sendMail(userMailOptions, (err, info) => {
          if (err) {
            console.error(`[2025-03-15 18:41:46] User Email Sending Error:`, {
              error: err.message,
              stack: err.stack
            });
            reject(err);
          } else {
            console.log(`[2025-03-15 18:41:46] User email sent successfully for booking #${bookingData.bookingId}`);
            resolve(info);
          }
        });
      }),
      new Promise((resolve, reject) => {
        transporter.sendMail(vendorMailOptions, (err, info) => {
          if (err) {
            console.error(`[2025-03-15 18:41:46] Vendor Email Sending Error:`, {
              error: err.message,
              stack: err.stack
            });
            reject(err);
          } else {
            console.log(`[2025-03-15 18:41:46] Vendor email sent successfully for booking #${bookingData.bookingId}`);
            resolve(info);
          }
        });
      })
    ];
    
    await Promise.all(sendPromises);
    console.log(`[2025-03-15 18:41:46] All notifications sent successfully for booking #${bookingData.bookingId}`);
    return true;
  } catch (error) {
    console.error(`[2025-03-15 18:41:46] Booking Notification Error:`, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      bookingId: bookingData.bookingId
    });
    throw error;
  }
};

/**
 * Alternative method using SendGrid's API directly
 */
const sendBookingStatusNotificationSendGrid = async (bookingData) => {
  try {
    console.log(`[2025-03-15 18:41:46] Sending ${bookingData.status} booking notifications via SendGrid API for booking #${bookingData.bookingId}`);
    
    // Generate user email content
    const userEmailContent = generateEmailContent(bookingData, 'user');
    const userMsg = {
      to: bookingData.user.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SkillLink Bookings'
      },
      subject: userEmailContent.subject,
      text: userEmailContent.text,
      html: userEmailContent.html
    };
    
    // Generate vendor email content
    const vendorEmailContent = generateEmailContent(bookingData, 'vendor');
    const vendorMsg = {
      to: bookingData.vendor.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'SkillLink Bookings'
      },
      subject: vendorEmailContent.subject,
      text: vendorEmailContent.text,
      html: vendorEmailContent.html
    };
    
    // Send both emails
    await Promise.all([
      sgMail.send(userMsg),
      sgMail.send(vendorMsg)
    ]);
    
    console.log(`[2025-03-15 18:41:46] Booking notification emails sent successfully using SendGrid API`);
    return true;
  } catch (error) {
    console.error(`[2025-03-15 18:41:46] SendGrid API Booking Notification Error:`, {
      errorName: error.name,
      errorMessage: error.message,
    });
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

module.exports = {
  sendBookingStatusNotification,
  sendBookingStatusNotificationSendGrid
};