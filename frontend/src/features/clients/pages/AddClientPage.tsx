import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

export const AddClientPage = () => {
  const { addClient, updateClient, clients } = useClients();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const editingClient = location.state?.client || clients.find(c => String(c.id) === id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name || '');
      setEmail(editingClient.email || '');
      setPhone(editingClient.phone || '');
      setAddress(editingClient.address || '');
      setCity(editingClient.city || '');
      setState(editingClient.state || '');
    }
  }, [editingClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const clientData = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined
    };

    if (editingClient) {
      await updateClient(editingClient.id, clientData);
    } else {
      await addClient(clientData);
    }

    navigate('/clients');
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Helmet>
        <title>Add New Client | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h1>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
              <input
                type="text"
                required
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
                <input
                  type="email"
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
                <input
                  type="tel"
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Address</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
              <input
                type="text"
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
                <input
                  type="text"
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Salt Lake City"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
                <input
                  type="text"
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="UT"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate('/clients')}>Cancel</Button>
          <Button type="submit">{editingClient ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </div>
  );
};