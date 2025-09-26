import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  Share2, 
  Mail, 
  MessageCircle,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { billingAPI } from '../services/api';
import toast from 'react-hot-toast';

const PrintPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [billData, setBillData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetchBillPreview();
  }, [id]);

  const fetchBillPreview = async () => {
    try {
      setIsLoading(true);
      const response = await billingAPI.getPreview(id);
      setBillData(response.data);
    } catch (error) {
      console.error('Error fetching bill preview:', error);
      toast.error('Failed to load bill preview');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(billData.html);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
      
      // Mark as printed on server
      billingAPI.print(id)
        .then(() => {
          toast.success('Bill printed successfully!');
        })
        .catch((error) => {
          console.error('Error marking as printed:', error);
        });
    }, 500);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsSharing(true);
      const response = await billingAPI.getPDF(id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-${billData.order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsSharing(false);
    }
  };

  const handleEmailShare = async () => {
    const email = prompt('Enter email address to send the bill:');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSharing(true);
      await billingAPI.shareEmail(id, email);
      toast.success('Bill sent via email successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      setIsSharing(true);
      const response = await billingAPI.getWhatsAppLink(id);
      window.open(response.data.whatsappLink, '_blank');
    } catch (error) {
      console.error('Error getting WhatsApp link:', error);
      toast.error('Failed to open WhatsApp');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bill not found</h2>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Printer className="mr-2" size={24} />
              Print Bill - {billData.order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Preview and print your bill
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="btn btn-primary"
        >
          {isPrinting ? (
            <div className="spinner w-4 h-4 mr-2"></div>
          ) : (
            <Printer size={16} className="mr-2" />
          )}
          Print Bill
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={isSharing}
          className="btn btn-secondary"
        >
          <Download size={16} className="mr-2" />
          Download PDF
        </button>

        <button
          onClick={handleEmailShare}
          disabled={isSharing}
          className="btn btn-secondary"
        >
          <Mail size={16} className="mr-2" />
          Email Bill
        </button>

        <button
          onClick={handleWhatsAppShare}
          disabled={isSharing}
          className="btn btn-secondary"
        >
          <MessageCircle size={16} className="mr-2" />
          WhatsApp
        </button>
      </div>

      {/* Bill Preview */}
      <div className="card">
        <div className="card-content">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Preview</h3>
            <p className="text-sm text-gray-600">
              This is how your bill will appear when printed
            </p>
          </div>

          {/* Thermal Print Preview */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mx-auto" style={{ maxWidth: '232px' }}>
            <div 
              className="thermal-print thermal-print-58mm"
              dangerouslySetInnerHTML={{ __html: billData.html }}
            />
          </div>

          {/* Print Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Print Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure your thermal printer is connected and ready</li>
              <li>• Use 58mm or 80mm thermal paper</li>
              <li>• Adjust printer settings for optimal quality</li>
              <li>• The bill is optimized for mobile thermal printers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bill Details Summary */}
      <div className="mt-6 card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Bill Summary</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-semibold">{billData.order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-semibold">
                {new Date(billData.order.createdAt).toLocaleDateString()} {' '}
                {new Date(billData.order.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold capitalize">{billData.order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-green-600">
                ₹{parseFloat(billData.order.grandTotal).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
