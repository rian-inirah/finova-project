import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Search, 
  ShoppingCart, 
  Save, 
  Printer, 
  Phone,
  CreditCard,
  Banknote,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { itemsAPI, ordersAPI, billingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AddOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isPSGVisible } = useAuth();
  
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [psgMarked, setPsgMarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchItems();
    if (orderId) {
      fetchOrderForEdit();
      setIsEditing(true);
    }
  }, [orderId]);

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll();
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderForEdit = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      const order = response.data.order;
      
      setCustomerPhone(order.customerPhone || '');
      setPaymentMethod(order.paymentMethod || '');
      setPsgMarked(order.psgMarked || false);
      
      // Convert order items to selected items format
      const selectedItemsObj = {};
      order.orderItems.forEach(orderItem => {
        selectedItemsObj[orderItem.itemId] = {
          quantity: orderItem.quantity,
          item: orderItem.item
        };
      });
      setSelectedItems(selectedItemsObj);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order for editing');
      navigate('/drafts');
    }
  };

  const handleQuantityChange = (itemId, change) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || { quantity: 0 };
      const newQuantity = Math.max(0, current.quantity + change);
      
      if (newQuantity === 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: newQuantity,
          item: items.find(item => item.id === itemId)
        }
      };
    });
  };

  const getSelectedItemsList = () => {
    return Object.values(selectedItems).map(selected => ({
      itemId: selected.item.id,
      quantity: selected.quantity,
      unitPrice: selected.item.price,
      totalPrice: selected.quantity * selected.item.price
    }));
  };

  const calculateTotals = () => {
    const subtotal = Object.values(selectedItems).reduce(
      (sum, selected) => sum + (selected.quantity * selected.item.price), 0
    );
    
    // Note: GST calculation would be done on the server based on business details
    return {
      subtotal: subtotal,
      grandTotal: subtotal // Will be updated by server with GST
    };
  };

  const handleSaveDraft = async () => {
    const orderData = {
      items: getSelectedItemsList(),
      customerPhone: customerPhone || null,
      status: 'draft',
      psgMarked: psgMarked
    };

    try {
      setIsSaving(true);
      
      if (isEditing) {
        await ordersAPI.update(orderId, orderData);
        toast.success('Draft updated successfully!');
      } else {
        await ordersAPI.create(orderData);
        toast.success('Draft saved successfully!');
      }
      
      navigate('/drafts');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompleted = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const orderData = {
      items: getSelectedItemsList(),
      customerPhone: customerPhone || null,
      paymentMethod: paymentMethod,
      status: 'completed',
      psgMarked: psgMarked
    };

    try {
      setIsSaving(true);
      
      if (isEditing) {
        await ordersAPI.update(orderId, orderData);
        toast.success('Order completed successfully!');
      } else {
        await ordersAPI.create(orderData);
        toast.success('Order completed successfully!');
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintBill = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const orderData = {
      items: getSelectedItemsList(),
      customerPhone: customerPhone || null,
      paymentMethod: paymentMethod,
      status: 'completed',
      psgMarked: psgMarked
    };

    try {
      setIsSaving(true);
      
      let order;
      if (isEditing) {
        const response = await ordersAPI.update(orderId, orderData);
        order = response.data.order;
      } else {
        const response = await ordersAPI.create(orderData);
        order = response.data.order;
      }
      
      // Navigate to print preview
      navigate(`/print-preview/${order.id}`);
    } catch (error) {
      console.error('Error creating order for printing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
              <ShoppingCart className="mr-2" size={24} />
              {isEditing ? 'Edit Order' : 'Add Order'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Modify your draft order' : 'Create a new bill'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Selection */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Select Items</h3>
            </div>
            <div className="card-content">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="input pl-10"
                />
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map(item => {
                  const selected = selectedItems[item.id];
                  const quantity = selected ? selected.quantity : 0;

                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-gray-400 text-xs">No Image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-green-600 font-semibold">₹{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={quantity === 0}
                            className="btn btn-sm btn-secondary disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="btn btn-sm btn-primary"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        {quantity > 0 && (
                          <span className="text-sm font-semibold text-green-600">
                            ₹{(quantity * item.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'Add some items first'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center">
                <Phone size={20} className="mr-2" />
                Customer Details
              </h3>
            </div>
            <div className="card-content">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Customer phone number (optional)"
                className="input"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Payment Method *</h3>
            </div>
            <div className="card-content space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary-600"
                />
                <Banknote size={20} className="text-green-600" />
                <span className="font-medium">Cash</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary-600"
                />
                <CreditCard size={20} className="text-blue-600" />
                <span className="font-medium">Online Payment</span>
              </label>
            </div>
          </div>

          {/* PSG Mark (only for Modern user) */}
          {isPSGVisible() && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center">
                  <CheckCircle size={20} className="mr-2" />
                  PSG Mark
                </h3>
              </div>
              <div className="card-content">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={psgMarked}
                    onChange={(e) => setPsgMarked(e.target.checked)}
                    className="text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Mark this order for PSG reporting
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Order Summary</h3>
            </div>
            <div className="card-content">
              {Object.keys(selectedItems).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items selected</p>
              ) : (
                <div className="space-y-3">
                  {Object.values(selectedItems).map(selected => (
                    <div key={selected.item.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{selected.item.name}</span>
                        <span className="text-sm text-gray-500 ml-2">x{selected.quantity}</span>
                      </div>
                      <span className="font-semibold">₹{(selected.quantity * selected.item.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold text-lg">₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSaveDraft}
              disabled={Object.keys(selectedItems).length === 0 || isSaving}
              className="btn btn-secondary w-full"
            >
              <Save size={16} className="mr-2" />
              Save as Draft
            </button>
            
            <button
              onClick={handleSaveCompleted}
              disabled={Object.keys(selectedItems).length === 0 || !paymentMethod || isSaving}
              className="btn btn-success w-full"
            >
              <CheckCircle size={16} className="mr-2" />
              Save Bill (No Print)
            </button>
            
            <button
              onClick={handlePrintBill}
              disabled={Object.keys(selectedItems).length === 0 || !paymentMethod || isSaving}
              className="btn btn-primary w-full"
            >
              <Printer size={16} className="mr-2" />
              Print Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOrder;
