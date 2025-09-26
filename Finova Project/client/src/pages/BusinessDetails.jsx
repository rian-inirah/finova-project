import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Building2, Phone, MapPin, Hash, Percent, Lock } from 'lucide-react';
import { businessAPI } from '../services/api';
import toast from 'react-hot-toast';

const BusinessDetails = () => {
  const [businessDetails, setBusinessDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinValue, setPinValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const watchedGstPercentage = watch('gstPercentage');

  useEffect(() => {
    fetchBusinessDetails();
  }, []);

  const fetchBusinessDetails = async () => {
    try {
      const response = await businessAPI.getDetails();
      const data = response.data.businessDetails;
      
      if (data) {
        setBusinessDetails(data);
        // Set form values
        Object.keys(data).forEach(key => {
          if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
            setValue(key, data[key]);
          }
        });
        
        if (data.businessLogo) {
          setLogoPreview(data.businessLogo);
        }
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Append all form data
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      const response = await businessAPI.updateDetails(formData);
      setBusinessDetails(response.data.businessDetails);
      
      // Handle logo preview if uploaded
      if (data.businessLogo && data.businessLogo[0]) {
        setLogoPreview(URL.createObjectURL(data.businessLogo[0]));
      }
      
      toast.success('Business details saved successfully!');
    } catch (error) {
      console.error('Error saving business details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPin = async () => {
    if (!pinValue || pinValue.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    try {
      await businessAPI.setReportsPin(pinValue);
      toast.success('Reports PIN set successfully!');
      setPinValue('');
      setIsSettingPin(false);
    } catch (error) {
      console.error('Error setting PIN:', error);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Building2 className="mr-2" size={24} />
          Business Details
        </h1>
        <p className="text-gray-600 mt-1">
          Configure your business information for billing and reports
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Logo */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Business Logo</h3>
          </div>
          <div className="card-content">
            <div className="flex items-center space-x-4">
              {logoPreview && (
                <div className="w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="Business Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <label className="btn btn-secondary">
                  <Upload size={16} className="mr-2" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    {...register('businessLogo')}
                    onChange={handleLogoChange}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 200x200px, Max 2MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  {...register('businessName', { required: 'Business name is required' })}
                  type="text"
                  className={`input ${errors.businessName ? 'border-red-500' : ''}`}
                  placeholder="Enter business name"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-xs mt-1">{errors.businessName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Category
                </label>
                <input
                  {...register('businessCategory')}
                  type="text"
                  className="input"
                  placeholder="e.g., Restaurant, Retail, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={16} className="inline mr-1" />
                Business Address
              </label>
              <textarea
                {...register('businessAddress')}
                rows={3}
                className="input resize-none"
                placeholder="Enter complete business address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone size={16} className="inline mr-1" />
                Phone Number
              </label>
              <input
                {...register('phoneNumber')}
                type="tel"
                className="input"
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Tax Information</h3>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash size={16} className="inline mr-1" />
                  GSTIN Number
                </label>
                <input
                  {...register('gstinNumber')}
                  type="text"
                  className="input"
                  placeholder="12ABCDE1234F1Z5"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Slab
                </label>
                <select
                  {...register('gstSlab')}
                  className="input"
                >
                  <option value="">Select GST Slab</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Percent size={16} className="inline mr-1" />
                GST Percentage (Custom)
              </label>
              <input
                {...register('gstPercentage', {
                  min: { value: 0, message: 'GST percentage must be positive' },
                  max: { value: 100, message: 'GST percentage cannot exceed 100%' }
                })}
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`input ${errors.gstPercentage ? 'border-red-500' : ''}`}
                placeholder="e.g., 12.00"
              />
              {errors.gstPercentage && (
                <p className="text-red-500 text-xs mt-1">{errors.gstPercentage.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if you don't want to calculate GST on bills
              </p>
            </div>
          </div>
        </div>

        {/* FSSAI Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">FSSAI Information</h3>
          </div>
          <div className="card-content">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FSSAI Number
              </label>
              <input
                {...register('fssaiNumber')}
                type="text"
                className="input"
                placeholder="FSSAI registration number"
              />
            </div>
          </div>
        </div>

        {/* Reports PIN */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <Lock size={20} className="mr-2" />
              Reports Security
            </h3>
          </div>
          <div className="card-content">
            <p className="text-sm text-gray-600 mb-4">
              Set a 4-digit PIN to protect access to reports and analytics
            </p>
            
            {!isSettingPin ? (
              <button
                type="button"
                onClick={() => setIsSettingPin(true)}
                className="btn btn-secondary"
              >
                Set Reports PIN
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="input w-40"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={handleSetPin}
                  className="btn btn-primary"
                >
                  Set PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingPin(false);
                    setPinValue('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary btn-lg"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="spinner w-4 h-4 mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Business Details
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessDetails;
