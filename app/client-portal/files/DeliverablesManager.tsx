'use client';

import React, { useState } from 'react';
import { FileDown, FileText, Image as ImageIcon, File as FileIcon, Upload, CheckCircle2, Cloud } from 'lucide-react';
import { uploadDeliverable } from './actions';

type Deliverable = {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: string | null;
  createdAt: Date;
};

export default function DeliverablesManager({ initialDeliverables }: { initialDeliverables: Deliverable[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Note: In a real app, you'd upload the actual file to S3/Cloudinary first
    // For this prototype, we're simulating the URL/Metadata submission
    
    const res = await uploadDeliverable(formData);

    if (res?.error) setError(res.error);
    else (e.target as HTMLFormElement).reset();

    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'paper': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default: return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="p-12 sm:p-16 max-w-5xl">
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Project deliverables</h1>
        <p className="text-zinc-500 font-medium text-sm max-w-xl">
          Securely submit artifacts, documentation, and research papers. Every update is automatically synchronized with your assigned technical handler.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Submission Form */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] p-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-blue-500" />
              Submit Artifact
            </h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Title</label>
                <input name="title" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20" placeholder="e.g. Q1 Growth Strategy" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Type</label>
                  <select name="fileType" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 appearance-none">
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="paper">Research Paper</option>
                  </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Size (Approx)</label>
                    <input name="fileSize" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20" placeholder="2.4 MB" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2.5 block ml-1">Asset URL / Reference</label>
                <input name="fileUrl" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-white/20" placeholder="https://..." />
                <input type="hidden" name="fileName" value="External Reference" />
              </div>

              {error && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}
              
              <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                {loading ? 'Processing...' : 'Authorize Submission'}
              </button>
            </form>
          </div>
        </div>

        {/* Deliverables List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em]">History</h3>
            <span className="text-[10px] font-bold text-zinc-500">{initialDeliverables.length} Items Syncing</span>
          </div>

          {initialDeliverables.length === 0 ? (
            <div className="py-20 border border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-50">
                <FileIcon className="w-10 h-10 text-zinc-800 mb-4" />
                <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">No artifacts found</p>
            </div>
          ) : (
            initialDeliverables.map(file => (
              <div key={file.id} className="bg-zinc-950/30 border border-zinc-900 rounded-[2rem] p-6 hover:border-zinc-800 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
                    {getIcon(file.fileType)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{file.title}</h4>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-0.5">
                      {file.fileType} · {file.fileSize || 'N/A'} · {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a href={file.fileUrl} target="_blank" className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 hover:text-white transition-all">
                  <FileDown className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
