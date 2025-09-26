import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  IndianRupee,
  Package,
  BarChart3
} from 'lucide-react';
import { reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ItemReports = () => {
  const [reports, setReports] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: format(new Date(), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await reportsAPI.getItemReports({
        fromDate: filters.fromDate,
        toDate: filters.toDate
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
      toDate: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const exportToCSV = () => {
    if (!reports || !reports.itemReports) return;

    const csvData = [
      ['Item Name', 'Total Quantity', 'Total Amount', 'Average Price', 'Order Count'],
      ...reports.itemReports.map(item => [
        item.itemName,
        item.totalQuantity,
        item.totalAmount,
        item.averagePrice,
        item.orderCount
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `item-reports-${filters.fromDate}-to-${filters.toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!');
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
                {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
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
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Average Price:</span>
            <span className="font-medium">
              ₹{parseFloat(item.averagePrice).toFixed(2)}
            </span>
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
          Item Reports
        </h1>
        <p className="text-gray-600 mt-1">
          Analyze item-wise sales performance
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package className="text-blue-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{reports.summary.totalItems}</h3>
              <p className="text-sm text-gray-600">Items Sold</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="text-green-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{reports.summary.totalQuantity}</h3>
              <p className="text-sm text-gray-600">Total Quantity</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <IndianRupee className="text-purple-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{parseFloat(reports.summary.totalAmount || 0).toFixed(2)}
              </h3>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      {reports && reports.itemReports && reports.itemReports.length > 0 && (
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

      {/* Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : (
        <>
          {!reports || !reports.itemReports || reports.itemReports.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No item sales found
              </h3>
              <p className="text-gray-600">
                No items were sold in the selected date range
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.itemReports.map((item, index) => (
                <ItemCard key={item.itemId} item={item} index={index} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ItemReports;
