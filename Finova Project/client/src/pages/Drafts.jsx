import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Edit2, 
  Trash2, 
  Calendar,
  Phone,
  IndianRupee,
  Clock
} from 'lucide-react';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Drafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.getAll({ status: 'draft' });
      setDrafts(response.data.orders);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDraft = async (orderId) => {
    try {
      await ordersAPI.delete(orderId);
      setDrafts(prev => prev.filter(draft => draft.id !== orderId));
      setDeleteConfirm(null);
      toast.success('Draft deleted successfully!');
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const calculateDraftTotal = (orderItems) => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  };

  const DraftCard = ({ draft }) => {
    const total = calculateDraftTotal(draft.orderItems);
    
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-900">{draft.orderNumber}</h3>
                <span className="badge badge-warning">Draft</span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
                </div>
                
                {draft.customerPhone && (
                  <div className="flex items-center space-x-1">
                    <Phone size={14} />
                    <span>{draft.customerPhone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <span>{draft.orderItems.length} item(s)</span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center space-x-1">
                  <IndianRupee size={16} className="text-green-600" />
                  <span className="font-bold text-lg text-green-600">
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link
                to={`/add-order/${draft.id}`}
                className="btn btn-sm btn-primary"
              >
                <Edit2 size={14} />
              </Link>
              <button
                onClick={() => setDeleteConfirm(draft)}
                className="btn btn-sm btn-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          {/* Order Items Preview */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-1">
              {draft.orderItems.slice(0, 3).map(orderItem => (
                <div key={orderItem.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {orderItem.item.name} x{orderItem.quantity}
                  </span>
                  <span className="font-medium">
                    ₹{parseFloat(orderItem.totalPrice).toFixed(2)}
                  </span>
                </div>
              ))}
              {draft.orderItems.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{draft.orderItems.length - 3} more items
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmation = ({ draft }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Delete Draft
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete draft "{draft.orderNumber}"? This action cannot be undone.
        </p>
        
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="confirmDelete"
            className="rounded border-gray-300"
          />
          <label htmlFor="confirmDelete" className="text-sm text-gray-700">
            I understand this action cannot be undone
          </label>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleDeleteDraft(draft.id)}
            disabled={!document.getElementById('confirmDelete')?.checked}
            className="btn btn-danger flex-1"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Draft
          </button>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Clock className="mr-2" size={24} />
          Draft Bills
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your saved draft orders
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : (
        <>
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No draft bills yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first order and save it as a draft to get started
              </p>
              <Link
                to="/add-order"
                className="btn btn-primary"
              >
                Create New Order
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map(draft => (
                <DraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && <DeleteConfirmation draft={deleteConfirm} />}
    </div>
  );
};

export default Drafts;
