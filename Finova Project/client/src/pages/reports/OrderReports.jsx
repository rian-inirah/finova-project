import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Filter,
  IndianRupee,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OrderReports = () => {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: format(new Date(), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    paymentType: 'all'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await reportsAPI.getOrderReports({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        paymentType: filters.paymentType
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchReports();
  };

  const resetFilters = () => {
    setFilters({
      fromDate: format(new Date(), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd'),
      paymentType: 'all'
    });
  };

  const exportToCSV = () => {
    if (!reports || !reports.orders) return;

    const csvData = [
      ['Order Number', 'Date', 'Customer Phone', 'Payment Method', 'Subtotal', 'GST', 'Grand Total', 'Status'],
      ...reports.orders.map(order => [
        order.orderNumber,
        format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
        order.customerPhone || 'N/A',
        order.paymentMethod || 'N/A',
        order.subtotal,
        order.gstAmount,
        order.grandTotal,
        order.status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-reports-${filters.fromDate}-to-${filters.toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!');
  };

  const OrderCard = ({ order }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
              <span className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {order.status}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              
              {order.customerPhone && (
                <div className="flex items-center space-x-1">
                  <span>Customer: {order.customerPhone}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <span>Payment: {order.paymentMethod || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              <IndianRupee size={16} className="text-green-600" />
              <span className="font-bold text-lg text-green-600">
                {parseFloat(order.grandTotal).toFixed(2)}
              </span>
            </div>
            {order.gstAmount > 0 && (
              <div className="text-xs text-gray-500">
                GST: ₹{parseFloat(order.gstAmount).toFixed(2)}
              </div>
            )}
          </div>
        </div>
        
        {/* Order Items */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-1">
            {order.orderItems.slice(0, 3).map(orderItem => (
              <div key={orderItem.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {orderItem.item.name} x{orderItem.quantity}
                </span>
                <span className="font-medium">
                  ₹{parseFloat(orderItem.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}
            {order.orderItems.length > 3 && (
              <div className="text-xs text-gray-500">
                +{order.orderItems.length - 3} more items
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="mr-2" size={24} />
          Order Reports
        </h1>
        <p className="text-gray-600 mt-1">
          Analyze your sales and order data
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <Filter className="mr-2" size={20} />
            Filters
          </h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type
              </label>
              <select
                value={filters.paymentType}
                onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                className="input"
              >
                <option value="all">All Payments</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="btn btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reports && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="text-blue-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{reports.summary.totalOrders}</h3>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <IndianRupee className="text-green-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(reports.summary.totalAmount || 0).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(reports.summary.totalGST || 0).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-600">Total GST</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="text-orange-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(reports.summary.totalSubtotal || 0).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-600">Subtotal</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Breakdown */}
      {reports && reports.paymentBreakdown && reports.paymentBreakdown.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Payment Breakdown</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.paymentBreakdown.map(payment => (
                <div key={payment.paymentMethod} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{payment.paymentMethod}</span>
                    <p className="text-sm text-gray-600">{payment.count} orders</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">₹{parseFloat(payment.amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      {reports && reports.orders && reports.orders.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={exportToCSV}
            className="btn btn-secondary"
          >
            <Download size={16} className="mr-2" />
            Export to CSV
          </button>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : (
        <>
          {!reports || !reports.orders || reports.orders.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600">
                No orders match your current filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reports.orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderReports;
