import React from 'react';
import { prisma } from '../../lib/prisma';
import { approveDeveloper, rejectDeveloper, deleteDeveloper } from './actions';

export const dynamic = 'force-dynamic';

export default async function DevelopersDashboard() {
  const developers = await prisma.developer.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const pendingDevs = developers.filter((d: any) => d.status === 'pending');
  const otherDevs = developers.filter((d: any) => d.status !== 'pending');

  return (
    <div className="p-8 sm:p-12 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Developer Access Control</h1>
          <p className="text-zinc-400 text-sm">
            Review and provision secure dashboard workspaces for developers.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-lg font-medium text-white mb-4 border-b border-zinc-900 pb-2">Pending Applications ({pendingDevs.length})</h2>
        {pendingDevs.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm font-medium bg-zinc-950/30">
            No pending developer requests at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDevs.map((dev: any) => (
              <div key={dev.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white tracking-tight">{dev.name}</h3>
                  <a href={`mailto:${dev.email}`} className="text-xs text-blue-400 hover:text-blue-300 font-medium truncate block">{dev.email}</a>
                </div>
                
                <div className="bg-zinc-900/50 rounded-xl p-4 mb-6 border border-zinc-800/50 flex-grow">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 block">Reason for Access</span>
                  <p className="text-sm text-zinc-300 italic">"{dev.reason}"</p>
                </div>
                
                <span className="text-[10px] text-zinc-500 uppercase mb-4 block">Applied: {new Date(dev.createdAt).toLocaleDateString()}</span>
                
                <div className="flex gap-3 mt-auto pt-4 border-t border-zinc-900">
                  <form action={rejectDeveloper.bind(null, dev.id)} className="flex-1">
                    <button type="submit" className="w-full px-4 py-2 bg-zinc-900 text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-xl text-xs font-semibold hover:border-red-900/50 border border-zinc-800 transition-colors">
                      Reject
                    </button>
                  </form>
                  <form action={approveDeveloper.bind(null, dev.id)} className="flex-[2]">
                    <button type="submit" className="w-full px-6 py-2 bg-white text-black rounded-xl text-xs font-semibold hover:bg-zinc-200 transition-colors">
                      Approve Access
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium text-white mb-4 border-b border-zinc-900 pb-2">Processed Developers</h2>
        {otherDevs.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm font-medium bg-zinc-950/30">
            No processed developers yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950 shadow-sm">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-[10px] uppercase bg-zinc-900 text-zinc-500 border-b border-zinc-800 font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Email</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Active Since</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherDevs.map((dev: any, i: any) => (
                  <tr key={dev.id} className={`${i !== otherDevs.length - 1 ? 'border-b border-zinc-800/50' : ''} hover:bg-zinc-900/50 transition-colors`}>
                    <td className="px-6 py-4 font-medium text-white">{dev.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{dev.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                        dev.status === 'approved' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-red-950/30 text-red-500 border-red-900/50'
                      }`}>
                        {dev.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px]">{new Date(dev.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <form action={deleteDeveloper.bind(null, dev.id)}>
                        <button type="submit" className="text-red-400 hover:text-red-300 font-medium text-xs border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
