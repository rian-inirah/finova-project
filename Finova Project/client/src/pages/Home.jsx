import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Receipt,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isPSGVisible } = useAuth();

  const quickActions = [
    {
      name: 'Add Item',
      description: 'Add new items to your menu',
      href: '/items',
      icon: Plus,
      color: 'bg-black hover:bg-gray-800',
    },
    {
      name: 'Manage Items',
      description: 'View and edit your items',
      href: '/items',
      icon: Package,
      color: 'bg-gray-800 hover:bg-gray-700',
    },
    {
      name: 'Add Order',
      description: 'Create a new bill',
      href: '/add-order',
      icon: ShoppingCart,
      color: 'bg-gray-600 hover:bg-gray-500',
    },
    {
      name: 'Draft Bills',
      description: 'View and edit draft bills',
      href: '/drafts',
      icon: Clock,
      color: 'bg-gray-700 hover:bg-gray-600',
    },
  ];

  const reports = [
    {
      name: 'Order Reports',
      description: 'View sales and order analytics',
      href: '/reports/orders',
      icon: BarChart3,
      color: 'bg-black hover:bg-gray-800',
    },
    {
      name: 'Item Reports',
      description: 'Analyze item-wise sales',
      href: '/reports/items',
      icon: TrendingUp,
      color: 'bg-gray-800 hover:bg-gray-700',
    },
  ];

  // Add PSG report only for Modern user
  if (isPSGVisible()) {
    reports.push({
      name: 'PSG Reports',
      description: 'Product Sales Group analytics',
      href: '/psg',
      icon: Receipt,
      color: 'bg-gray-600 hover:bg-gray-500',
    });
  }

  const ActionCard = ({ action }) => {
    const Icon = action.icon;
    
    return (
      <Link
        to={action.href}
        className={`${action.color} text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Icon size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{action.name}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-black mb-2">Welcome to Finova</h1>
        <p className="text-gray-600">Your complete POS billing solution</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <ActionCard key={index} action={action} />
          ))}
        </div>
      </div>

      {/* Reports Section */}
      <div>
        <h2 className="text-xl font-semibold text-black mb-4">Reports & Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, index) => (
            <ActionCard key={index} action={report} />
          ))}
        </div>
      </div>

      {/* Business Setup Reminder */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-black font-semibold text-sm">!</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">
              Complete Your Business Setup
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Make sure to add your business details to generate proper bills with your company information.
            </p>
            <Link
              to="/business-details"
              className="inline-block mt-2 text-sm font-medium text-black hover:text-gray-800 underline"
            >
              Go to Business Details →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Easy Billing</h3>
            </div>
            <p className="text-sm text-gray-600">
              Create and print professional bills with GST calculation and thermal printer support.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Smart Reports</h3>
            </div>
            <p className="text-sm text-gray-600">
              Get detailed analytics on sales, items, and payments with PIN-protected access.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Item Management</h3>
            </div>
            <p className="text-sm text-gray-600">
              Manage your menu items with images, prices, and easy search functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
