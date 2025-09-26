import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  IndianRupee,
  Package,
  BarChart3,
  Clock
} from 'lucide-react';
import { psgAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PSG = () => {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDateTime: format(new Date(), 'yyyy-MM-dd') + 'T00:00',
    toDateTime: format(new Date(), 'yyyy-MM-dd') + 'T23:59'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await psgAPI.getReports({
        fromDateTime: filters.fromDateTime,
        toDateTime: filters.toDateTime
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching PSG reports:', error);
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
    const today = format(new Date(), 'yyyy-MM-dd');
    setFilters({
      fromDateTime: today + 'T00:00',
      toDateTime: today + 'T23:59'
    });
  };

  const exportToCSV = () => {
    if (!reports || !reports.psgItems) return;

    const csvData = [
      ['Item Name', 'Total Quantity', 'Total Amount', 'Order Count'],
      ...reports.psgItems.map(item => [
        item.itemName,
        item.totalQuantity,
        item.totalAmount,
        item.orders.length
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `psg-reports-${filters.fromDateTime}-to-${filters.toDateTime}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('PSG report exported successfully!');
  };

  const ItemCard = ({ item, index }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-sm">#{index + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{item.itemName}</h3>
              <p className="text-sm text-gray-600">
                {item.orders.length} order{item.orders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">{item.totalQuantity}</span>
              <span className="text-sm text-gray-500">units</span>
            </div>
            <div className="flex items-center space-x-1">
              <IndianRupee size={16} className="text-green-600" />
              <span className="font-bold text-lg text-green-600">
                {parseFloat(item.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Order Details */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Order Details:</h4>
            {item.orders.slice(0, 3).map(order => (
              <div key={order.orderId} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                <div>
                  <span className="font-medium">{order.orderNumber}</span>
                  <span className="text-gray-500 ml-2">x{order.quantity}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">₹{parseFloat(order.amount).toFixed(2)}</span>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.orderDate), 'dd/MM HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            {item.orders.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{item.orders.length - 3} more orders
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
          <TrendingUp className="mr-2" size={24} />
          PSG Reports
        </h1>
        <p className="text-gray-600 mt-1">
          Product Sales Group analytics for marked orders
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <Filter className="mr-2" size={20} />
            Time Range Filter
          </h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date & Time
              </label>
              <input
                type="datetime-local"
                value={filters.fromDateTime}
                onChange={(e) => handleFilterChange('fromDateTime', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date & Time
              </label>
              <input
                type="datetime-local"
                value={filters.toDateTime}
                onChange={(e) => handleFilterChange('toDateTime', e.target.value)}
                className="input"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                Generate Report
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
                <BarChart3 className="text-blue-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{reports.summary.totalOrders}</h3>
              <p className="text-sm text-gray-600">PSG Orders</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package className="text-green-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{reports.summary.totalItems}</h3>
              <p className="text-sm text-gray-600">Unique Items</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{reports.summary.totalQuantity}</h3>
              <p className="text-sm text-gray-600">Total Quantity</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <IndianRupee className="text-orange-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(reports.summary.totalAmount || 0).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      {reports && reports.psgItems && reports.psgItems.length > 0 && (
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

      {/* PSG Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : (
        <>
          {!reports || !reports.psgItems || reports.psgItems.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No PSG data found
              </h3>
              <p className="text-gray-600">
                No orders were marked for PSG in the selected time range
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.psgItems.map((item, index) => (
                <ItemCard key={item.itemId} item={item} index={index} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">ℹ</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              About PSG Reports
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              PSG (Product Sales Group) reports show aggregated sales data only for orders that were marked with the PSG checkbox during billing. 
              This helps track specific product sales across different time periods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PSG;
