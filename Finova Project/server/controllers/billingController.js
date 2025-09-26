const db = require('../models');
const { generateBillPDF, generateBillHTML } = require('../utils/pdfGenerator');
const nodemailer = require('nodemailer');
const path = require('path');

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const generateBillPreview = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with items
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get business details
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    // Generate HTML content
    const htmlContent = generateBillHTML(order, businessDetails);

    res.json({
      message: 'Bill preview generated successfully',
      html: htmlContent,
      order: order
    });

  } catch (error) {
    console.error('Generate bill preview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const generateBillPDFFile = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with items
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get business details
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    // Generate PDF
    const { generateBillPDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateBillPDF(order, businessDetails);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${order.orderNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate bill PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const shareBillViaEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Get order with items
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id
      },
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get business details
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    // Generate PDF
    const { generateBillPDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateBillPDF(order, businessDetails);

    // Setup email transporter
    const transporter = createEmailTransporter();

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Bill - ${order.orderNumber} from ${businessDetails?.businessName || 'Finova'}`,
      text: `Please find attached the bill for order ${order.orderNumber}.`,
      attachments: [
        {
          filename: `bill-${order.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Bill sent via email successfully'
    });

  } catch (error) {
    console.error('Share bill via email error:', error);
    res.status(500).json({ error: 'Failed to send email. Please check email configuration.' });
  }
};

const getWhatsAppShareLink = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get business details
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    // Create a simple text message for WhatsApp
    const message = `Bill Details:
Order #: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Total: ₹${order.grandTotal.toFixed(2)}
Payment: ${order.paymentMethod === 'cash' ? 'Cash' : 'Online'}

${businessDetails?.businessName || 'Finova'}
${businessDetails?.phoneNumber || ''}

Thank you for your business!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp share link
    const whatsappLink = `https://wa.me/?text=${encodedMessage}`;

    res.json({
      message: 'WhatsApp share link generated successfully',
      whatsappLink: whatsappLink
    });

  } catch (error) {
    console.error('Get WhatsApp share link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const printBill = async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
    const order = await db.Order.findOne({
      where: {
        id: id,
        userId: req.user.id,
        status: 'completed'
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not completed' });
    }

    // Mark as printed
    await order.update({
      printed: true,
      printedAt: new Date()
    });

    // Get business details
    const businessDetails = await db.BusinessDetails.findOne({
      where: { userId: req.user.id }
    });

    // Get order with items for preview
    const completeOrder = await db.Order.findByPk(order.id, {
      include: [{
        model: db.OrderItem,
        as: 'orderItems',
        include: [{
          model: db.Item,
          as: 'item',
          attributes: ['id', 'name', 'price']
        }]
      }]
    });

    // Generate HTML content for printing
    const htmlContent = generateBillHTML(completeOrder, businessDetails);

    res.json({
      message: 'Bill printed successfully',
      html: htmlContent,
      order: completeOrder
    });

  } catch (error) {
    console.error('Print bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  generateBillPreview,
  generateBillPDFFile,
  shareBillViaEmail,
  getWhatsAppShareLink,
  printBill
};
