'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { createTask, moveTask, deleteTask } from './actions';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

export default function KanbanClient({ initialTasks, token }: { initialTasks: Task[], token: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4001';
    const socket = io(CHAT_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [token]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<string>('todo');

  const columns = [
    { id: 'todo', label: 'To Do', border: 'border-zinc-800/40', headerBg: 'bg-zinc-900/40', countBg: 'bg-zinc-800/80 text-zinc-400' },
    { id: 'in_progress', label: 'In Progress', border: 'border-sky-900/30', headerBg: 'bg-sky-950/20', countBg: 'bg-sky-900/40 text-sky-400' },
    { id: 'done', label: 'Completed', border: 'border-emerald-900/30', headerBg: 'bg-emerald-950/10', countBg: 'bg-emerald-900/40 text-emerald-400' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: newStatus } : t));
    
    // Server action
    await moveTask(draggedTaskId, newStatus);
    const task = tasks.find(t => t.id === draggedTaskId);
    if (task && socketRef.current) {
      socketRef.current.emit('task_update', { title: task.title, action: 'moved' });
    }
    setDraggedTaskId(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('status', activeColumn);
    
    // Add temp optimistic task
    const tempId = Math.random().toString();
    const newTask = {
      id: tempId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: activeColumn
    };
    
    setTasks(prev => [...prev, newTask]);
    setIsModalOpen(false);

    const res = await createTask(formData);
    if (res.error) {
      // Revert if error
      setTasks(prev => prev.filter(t => t.id !== tempId));
      alert(res.error);
    } else {
      if (socketRef.current) {
        socketRef.current.emit('task_update', { title: newTask.title, action: 'created' });
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await deleteTask(taskId);
  };

  return (
    <div className="p-8 sm:p-12 w-full h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Project Tasks</h1>
          <p className="text-zinc-400 text-sm">
            Drag and drop tasks to organize your workflow pipeline securely.
          </p>
        </div>
        <button 
          onClick={() => { setActiveColumn('todo'); setIsModalOpen(true); }}
          className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          New Task
        </button>
      </div>

      <div className="flex gap-6 flex-grow overflow-x-auto pb-4 snap-x">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div 
              key={col.id}
              className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-3xl border bg-zinc-950/50 shadow-sm ${col.border} snap-center`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`px-5 py-4 flex items-center justify-between border-b border-zinc-800/50 rounded-t-3xl ${col.headerBg}`}>
                <h3 className="font-semibold text-white tracking-tight">{col.label}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.countBg}`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3 flex-grow overflow-y-auto">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="group relative flex flex-col rounded-2xl border border-zinc-800/40 bg-zinc-900/30 backdrop-blur-md p-5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] cursor-grab active:cursor-grabbing hover:border-zinc-700/60 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-all"
                  >
                    <button 
                      onClick={() => handleDelete(task.id)}
                      className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <h4 className="font-medium text-zinc-200 pr-6 leading-tight mb-2">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed max-h-16 overflow-hidden line-clamp-3">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))}

                <button 
                  onClick={() => { setActiveColumn(col.id); setIsModalOpen(true); }}
                  className="mt-2 w-full py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Add Card
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
        
        <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl overflow-y-auto transition-transform duration-300 transform ${isModalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 h-full flex flex-col">
            <h2 className="text-2xl font-semibold text-white mb-2">Create Task</h2>
            <p className="text-sm text-zinc-400 mb-8">Define a new work item to add to your board.</p>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-5 flex-grow">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Task Title</label>
                <input type="text" name="title" required placeholder="e.g. Upgrade Database Indexes" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Description (Optional)</label>
                <textarea name="description" placeholder="Add extra context, links, or subtasks..." rows={5} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none" />
              </div>

              <div className="flex gap-4 mt-auto pt-6 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors flex-1">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex-[2]">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
