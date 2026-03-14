'use client';

import React, { useState, useEffect } from 'react';
import { createClient, updateClient, deleteClient } from './actions';
import { Edit2, Trash2, Plus, X, Building2, User, Mail, Phone, MapPin, Info } from 'lucide-react';

type Developer = { id: string; name: string; email: string };
type Client = { 
  id: string; 
  clientRef: string; 
  name: string; 
  emails: string[]; 
  company: string | null; 
  companyType: string | null;
  description: string | null;
  authorizedName: string | null;
  phones: string[]; 
  address: string | null; 
  developer?: { name: string } | null; 
  developerId?: string | null;
  createdAt: Date 
};

export default function ClientManager({ developers, clients }: { developers: Developer[], clients: Client[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // State for dynamic multi-input fields
  const [emailInputs, setEmailInputs] = useState<string[]>(['']);
  const [phoneInputs, setPhoneInputs] = useState<string[]>(['']);

  useEffect(() => {
    if (editingClient) {
      setEmailInputs(editingClient.emails.length > 0 ? editingClient.emails : ['']);
      setPhoneInputs(editingClient.phones.length > 0 ? editingClient.phones : ['']);
    } else {
      setEmailInputs(['']);
      setPhoneInputs(['']);
    }
  }, [editingClient]);

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    // emails and phones are handled by same name inputs
    
    let res;
    if (editingClient) {
      res = await updateClient(editingClient.id, formData);
    } else {
      res = await createClient(formData);
    }
    
    if (res?.error) {
      setError(res.error);
    } else {
      (e.target as HTMLFormElement).reset();
      setEditingClient(null);
      setEmailInputs(['']);
      setPhoneInputs(['']);
    }
    
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
     if (confirm('Are you sure you want to remove this client? This will delete all associated data.')) {
       await deleteClient(id);
     }
  };

  const addEmailField = () => {
    if (emailInputs.length < 6) setEmailInputs([...emailInputs, '']);
  };

  const addPhoneField = () => {
    if (phoneInputs.length < 6) setPhoneInputs([...phoneInputs, '']);
  };

  const removeEmailField = (index: number) => {
    if (emailInputs.length > 1) {
      const newInputs = [...emailInputs];
      newInputs.splice(index, 1);
      setEmailInputs(newInputs);
    }
  };

  const removePhoneField = (index: number) => {
    if (phoneInputs.length > 1) {
      const newInputs = [...phoneInputs];
      newInputs.splice(index, 1);
      setPhoneInputs(newInputs);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newInputs = [...emailInputs];
    newInputs[index] = value;
    setEmailInputs(newInputs);
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newInputs = [...phoneInputs];
    newInputs[index] = value;
    setPhoneInputs(newInputs);
  };

  return (
    <div className="p-4 sm:p-12 w-full flex flex-col min-h-screen bg-black">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-900 pb-10 mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Client ecosystems</h1>
          <p className="text-zinc-500 font-medium text-sm">
            Configure multi-point contact channels and provision project infrastructure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Form Panel */}
        <div className="lg:col-span-5 h-fit sticky top-12">
          <div className="bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Building2 className="w-12 h-12 text-zinc-500" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2.5">
              {editingClient ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
              {editingClient ? 'Redefine Client' : 'Initialize Client'}
            </h2>

            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Contact Identity</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input 
                      name="name" 
                      type="text" 
                      required 
                      defaultValue={editingClient?.name || ''}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all" 
                      placeholder="Principal Contact Name" 
                    />
                  </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2.5 ml-1">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Connective Emails ({emailInputs.length}/6)</label>
                        {emailInputs.length < 6 && (
                            <button type="button" onClick={addEmailField} className="text-[10px] font-bold text-blue-500 hover:text-white uppercase tracking-tighter transition-colors">Add Mail +</button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {emailInputs.map((email, idx) => (
                            <div key={idx} className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                <input 
                                    name="emails" 
                                    type="email" 
                                    required={idx === 0}
                                    value={email}
                                    onChange={(e) => handleEmailChange(idx, e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all" 
                                    placeholder={idx === 0 ? "primary@enterprise.com" : `Additional endpoint ${idx + 1}`} 
                                />
                                {idx > 0 && (
                                    <button type="button" onClick={() => removeEmailField(idx)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-red-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Entity Name</label>
                    <input 
                      name="company" 
                      type="text" 
                      defaultValue={editingClient?.company || ''}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all" 
                      placeholder="Organization" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Structure</label>
                    <select 
                      name="companyType" 
                      defaultValue={editingClient?.companyType || ''}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 appearance-none transition-all"
                    >
                      <option value="">Select Type</option>
                      <option value="Startup">Startup</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Agency">Agency</option>
                      <option value="Non-Profit">Non-Profit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Operational Summary</label>
                  <textarea 
                    name="description" 
                    rows={3} 
                    defaultValue={editingClient?.description || ''}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 resize-none transition-all" 
                    placeholder="Brief description of the company goals or project scope..." 
                  />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2.5 ml-1">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Connective Lines ({phoneInputs.length}/6)</label>
                        {phoneInputs.length < 6 && (
                            <button type="button" onClick={addPhoneField} className="text-[10px] font-bold text-emerald-500 hover:text-white uppercase tracking-tighter transition-colors">Add Line +</button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {phoneInputs.map((phone, idx) => (
                            <div key={idx} className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                <input 
                                    name="phones" 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(idx, e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all" 
                                    placeholder={idx === 0 ? "Primary mobile" : `Additional line ${idx + 1}`} 
                                />
                                {idx > 0 && (
                                    <button type="button" onClick={() => removePhoneField(idx)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-red-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Technical Handler</label>
                  <select 
                    name="developerId" 
                    defaultValue={editingClient?.developerId || ''}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 appearance-none transition-all"
                  >
                    <option value="">Unassigned (Infrastructure Pool)</option>
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.id}>{dev.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Legal Representative</label>
                  <input 
                    name="authorizedName" 
                    type="text" 
                    defaultValue={editingClient?.authorizedName || ''}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all" 
                    placeholder="Authorized Signatory" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Address Infrastructure</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-zinc-700" />
                    <textarea 
                      name="address" 
                      rows={2} 
                      defaultValue={editingClient?.address || ''}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 resize-none transition-all" 
                      placeholder="Registered Office Headquarters..." 
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest text-center">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                {editingClient && (
                  <button 
                    type="button" 
                    onClick={() => setEditingClient(null)} 
                    className="flex-1 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={`flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 ${editingClient ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white text-black hover:bg-zinc-200'}`}
                >
                  {loading ? 'Processing...' : editingClient ? 'Update Infrastructure' : 'Authorize Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-7 space-y-6">
           {clients.length === 0 ? (
             <div className="bg-zinc-950/20 border-2 border-zinc-900 border-dashed rounded-[2.5rem] p-24 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6">
                    <Building2 className="w-8 h-8 text-zinc-600" />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Ecosystem is empty</h3>
                 <p className="text-zinc-500 text-sm font-medium max-w-xs">No project clients have been provisioned in the current environment.</p>
             </div>
           ) : (
             clients.map(client => (
               <div key={client.id} className="bg-zinc-950/30 border border-zinc-900 rounded-[2.5rem] p-4 group transition-all hover:border-zinc-800 hover:bg-zinc-900/20">
                 <div className="bg-zinc-900/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-8">
                    
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold text-white tracking-tight">{client.name}</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black tracking-widest uppercase">{client.clientRef}</span>
                                </div>
                                <p className="text-sm font-bold text-zinc-500 tracking-tight">{client.company || 'Private Entity'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setEditingClient(client)} 
                                className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-600 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(client.id)} 
                                className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-600 hover:text-red-500 hover:border-red-500/20 transition-all flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {client.description && (
                        <div className="px-6 py-4 bg-zinc-950 rounded-2xl border border-zinc-900">
                             <div className="flex items-center gap-2 mb-2">
                                <Info className="w-3 h-3 text-zinc-600" />
                                <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">System Overview</h4>
                             </div>
                             <p className="text-xs text-zinc-400 font-medium leading-relaxed">{client.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Connective Endpoints
                                </h4>
                                <div className="space-y-1.5">
                                    {client.emails.map((email, i) => (
                                        <p key={i} className="text-xs text-zinc-300 font-bold tracking-tight truncate group-hover:text-white transition-colors">
                                            {email}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> Voice Channels
                                </h4>
                                <div className="space-y-1.5">
                                    {client.phones.length > 0 ? client.phones.map((phone, i) => (
                                        <p key={i} className="text-xs text-zinc-300 font-bold tracking-tight">
                                            {phone}
                                        </p>
                                    )) : <p className="text-xs text-zinc-700 font-bold tracking-tight">Encrypted</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Execution Handler
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${client.developer ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-800'}`}></div>
                                    <p className="text-sm font-bold text-white tracking-tight">{client.developer ? client.developer.name : 'Infrastructure Pool'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {(client.address || client.authorizedName) && (
                        <div className="pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {client.authorizedName && (
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Legal Identity</h4>
                                    <p className="text-xs text-white font-bold">{client.authorizedName}</p>
                                </div>
                            )}
                            {client.address && (
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Registered Infrastructure</h4>
                                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">{client.address}</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
               </div>
             ))
           )}
        </div>

      </div>
    </div>
  );
}
