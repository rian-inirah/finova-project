import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Upload,
  Image as ImageIcon,
  IndianRupee
} from 'lucide-react';
import { itemsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Items = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd },
  } = useForm();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: errorsEdit },
  } = useForm();

  useEffect(() => {
    fetchItems();
  }, [searchTerm]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const response = await itemsAPI.getAll({ search: searchTerm });
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('price', data.price);
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await itemsAPI.create(formData);
      setItems(prev => [response.data.item, ...prev]);
      setIsAddingItem(false);
      resetAdd();
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('price', data.price);
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await itemsAPI.update(editingItem.id, formData);
      setItems(prev => prev.map(item => 
        item.id === editingItem.id ? response.data.item : item
      ));
      setEditingItem(null);
      resetEdit();
      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await itemsAPI.delete(itemId, true);
      setItems(prev => prev.filter(item => item.id !== itemId));
      setDeleteConfirm(null);
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setEditValue('name', item.name);
    setEditValue('price', item.price);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    resetEdit();
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const AddItemForm = () => (
    <div className="card mb-6">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Add New Item</h3>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmitAdd(handleAddItem)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                {...registerAdd('name', { required: 'Item name is required' })}
                type="text"
                className={`input ${errorsAdd.name ? 'border-red-500' : ''}`}
                placeholder="Enter item name"
              />
              {errorsAdd.name && (
                <p className="text-red-500 text-xs mt-1">{errorsAdd.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...registerAdd('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input pl-8 ${errorsAdd.price ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errorsAdd.price && (
                <p className="text-red-500 text-xs mt-1">{errorsAdd.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <label className="btn btn-secondary w-full cursor-pointer">
                <Upload size={16} className="mr-2" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...registerAdd('image')}
                />
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <button type="submit" className="btn btn-primary">
              <Save size={16} className="mr-2" />
              Add Item
            </button>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="btn btn-secondary"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ItemCard = ({ item }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center space-x-4">
          {/* Item Image */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="text-gray-400" size={24} />
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <p className="text-lg font-bold text-green-600">
              ₹{parseFloat(item.price).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Added: {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => startEditing(item)}
              className="btn btn-sm btn-secondary"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeleteConfirm(item)}
              className="btn btn-sm btn-danger"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditItemForm = ({ item }) => (
    <div className="card mb-4 border-blue-200 bg-blue-50">
      <div className="card-content">
        <h3 className="font-semibold text-blue-900 mb-4">Edit Item</h3>
        <form onSubmit={handleSubmitEdit(handleEditItem)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                {...registerEdit('name', { required: 'Item name is required' })}
                type="text"
                className={`input ${errorsEdit.name ? 'border-red-500' : ''}`}
                placeholder="Enter item name"
              />
              {errorsEdit.name && (
                <p className="text-red-500 text-xs mt-1">{errorsEdit.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...registerEdit('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input pl-8 ${errorsEdit.price ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errorsEdit.price && (
                <p className="text-red-500 text-xs mt-1">{errorsEdit.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Image
              </label>
              <label className="btn btn-secondary w-full cursor-pointer">
                <Upload size={16} className="mr-2" />
                Choose New Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...registerEdit('image')}
                />
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <button type="submit" className="btn btn-primary">
              <Save size={16} className="mr-2" />
              Update Item
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="btn btn-secondary"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteConfirmation = ({ item }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Deletion
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{item.name}"? This action cannot be undone.
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
            onClick={() => handleDeleteItem(item.id)}
            disabled={!document.getElementById('confirmDelete')?.checked}
            className="btn btn-danger flex-1"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Item
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="mr-2" size={24} />
              Items Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your menu items and prices
            </p>
          </div>
          <button
            onClick={() => setIsAddingItem(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <Plus size={16} className="mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Add Item Form */}
      {isAddingItem && <AddItemForm />}

      {/* Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {editingItem && <EditItemForm item={editingItem} />}
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No items found' : 'No items yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first item'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="btn btn-primary"
                >
                  <Plus size={16} className="mr-2" />
                  Add Your First Item
                </button>
              )}
            </div>
          ) : (
            filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && <DeleteConfirmation item={deleteConfirm} />}
    </div>
  );
};

export default Items;
