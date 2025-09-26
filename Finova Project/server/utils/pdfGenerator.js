const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const generateBillPDF = async (billData, businessDetails) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Generate HTML content for the bill
    const htmlContent = generateBillHTML(billData, businessDetails);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF with thermal printer dimensions
    const pdfBuffer = await page.pdf({
      width: '58mm',
      height: 'auto',
      printBackground: true,
      margin: {
        top: '5mm',
        right: '3mm',
        bottom: '5mm',
        left: '3mm'
      }
    });

    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
};

const generateBillHTML = (billData, businessDetails) => {
  const { order, items } = billData;
  const moment = require('moment');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bill - ${order.orderNumber}</title>
      <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
          color: #000;
          background: white;
          width: 58mm;
          max-width: 58mm;
          word-wrap: break-word;
        }
        
        .header {
          text-align: center;
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
        }
        
        .business-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .business-address {
          font-size: 9px;
          margin-bottom: 2px;
        }
        
        .business-phone {
          font-size: 9px;
          margin-bottom: 4px;
        }
        
        .order-info {
          margin-bottom: 8px;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
        }
        
        .order-info div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .customer-info {
          margin-bottom: 8px;
        }
        
        .items-table {
          width: 100%;
          margin-bottom: 8px;
        }
        
        .items-table th {
          text-align: left;
          font-weight: bold;
          padding: 2px 0;
          border-bottom: 1px solid #000;
        }
        
        .items-table td {
          padding: 1px 0;
          font-size: 9px;
        }
        
        .items-table .item-name {
          width: 40%;
        }
        
        .items-table .item-qty {
          width: 15%;
          text-align: center;
        }
        
        .items-table .item-rate {
          width: 20%;
          text-align: right;
        }
        
        .items-table .item-amount {
          width: 25%;
          text-align: right;
        }
        
        .totals {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-bottom: 8px;
        }
        
        .totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .grand-total {
          font-weight: bold;
          font-size: 11px;
          border-top: 1px solid #000;
          padding-top: 4px;
          margin-top: 4px;
        }
        
        .footer {
          text-align: center;
          margin-top: 8px;
          border-top: 1px dashed #000;
          padding-top: 8px;
        }
        
        .thank-you {
          margin-bottom: 4px;
          font-weight: bold;
        }
        
        .company-info {
          font-size: 8px;
          margin-bottom: 2px;
        }
        
        .contact-info {
          font-size: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${businessDetails.businessName || 'Finova'}</div>
        ${businessDetails.businessAddress ? `<div class="business-address">${businessDetails.businessAddress}</div>` : ''}
        ${businessDetails.phoneNumber ? `<div class="business-phone">${businessDetails.phoneNumber}</div>` : ''}
      </div>
      
      <div class="order-info">
        <div>
          <span>Order #:</span>
          <span>${order.orderNumber}</span>
        </div>
        <div>
          <span>Date:</span>
          <span>${moment(order.createdAt).format('DD/MM/YYYY')}</span>
        </div>
        <div>
          <span>Time:</span>
          <span>${moment(order.createdAt).format('HH:mm')}</span>
        </div>
      </div>
      
      ${order.customerPhone ? `
        <div class="customer-info">
          <div>
            <span>Customer:</span>
            <span>${order.customerPhone}</span>
          </div>
        </div>
      ` : ''}
      
      <table class="items-table">
        <thead>
          <tr>
            <th class="item-name">Item</th>
            <th class="item-qty">Qty</th>
            <th class="item-rate">Rate</th>
            <th class="item-amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td class="item-name">${item.item.name}</td>
              <td class="item-qty">${item.quantity}</td>
              <td class="item-rate">₹${item.unitPrice.toFixed(2)}</td>
              <td class="item-amount">₹${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div>
          <span>Sub Total:</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        ${businessDetails.gstPercentage > 0 ? `
          <div>
            <span>CGST (${(businessDetails.gstPercentage / 2).toFixed(1)}%):</span>
            <span>₹${order.cgst.toFixed(2)}</span>
          </div>
          <div>
            <span>SGST (${(businessDetails.gstPercentage / 2).toFixed(1)}%):</span>
            <span>₹${order.sgst.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="grand-total">
          <span>Grand Total:</span>
          <span>₹${order.grandTotal.toFixed(2)}</span>
        </div>
        <div style="margin-top: 4px;">
          <span>Payment:</span>
          <span>${order.paymentMethod === 'cash' ? 'Cash' : 'Online'}</span>
        </div>
      </div>
      
      <div class="footer">
        <div class="thank-you">Thank you, visit again!</div>
        <div class="company-info">@Finova by SmartStack Technologies</div>
        <div class="contact-info">+91 8870305577</div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateBillPDF,
  generateBillHTML
};
