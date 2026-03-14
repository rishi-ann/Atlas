'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Editor, { OnChange } from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { 
  FolderIcon, 
  FileCodeIcon, 
  ChevronRightIcon, 
  ChevronDownIcon, 
  PlayIcon, 
  SaveIcon, 
  RefreshCwIcon,
  PlusIcon,
  FolderPlusIcon,
  Trash2Icon,
  TerminalIcon as TermIcon,
  FileIcon,
  SearchIcon,
  XIcon,
  UploadIcon
} from 'lucide-react';

type FileNode = {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
};

export default function PlaygroundClient({ 
  token,
  developer 
}: { 
  token: string;
  developer: { id: string; name: string }
}) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [terminalVisible, setTerminalVisible] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Initialize Socket
  useEffect(() => {
    const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4001';
    let socket: Socket;

    try {
      socket = io(CHAT_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 5, timeout: 5000 });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('playground_get_tree');
        socket.emit('terminal_init');
      });

      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', () => setConnected(false));

      socket.on('playground_tree', (newTree: FileNode[]) => {
        setTree(newTree);
      });

      socket.on('playground_file_content', ({ path, content }: { path: string, content: string }) => {
        if (path === activeFile) {
          setCode(content);
        }
      });

      socket.on('playground_code_update', ({ path, content }: { path: string, content: string }) => {
        if (path === activeFile) {
          setCode(content);
        }
      });

      socket.on('playground_file_saved', ({ path }: { path: string }) => {
        // Potentially show a toast
      });

      socket.on('terminal_output', (data: string) => {
        xtermRef.current?.write(data);
      });

      socket.on('playground_error', (msg: string) => {
        console.error('Playground Error:', msg);
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.error('Playground connection error:', err);
      setConnected(false);
      return () => {};
    }
  }, [token, activeFile]);

  // Initialize Terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#09090b',
        foreground: '#e4e4e7',
        cursor: '#f43f5e',
        selectionBackground: 'rgba(244, 63, 94, 0.3)',
      },
      fontSize: 12,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.onData((data) => {
      socketRef.current?.emit('terminal_input', data);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openFile = (path: string) => {
    setActiveFile(path);
    socketRef.current?.emit('playground_read_file', path);
  };

  const handleCodeChange: OnChange = (value) => {
    const newCode = value || '';
    setCode(newCode);
    if (activeFile) {
      socketRef.current?.emit('playground_code_change', { path: activeFile, content: newCode });
    }
  };

  const saveFile = () => {
    if (!activeFile) return;
    setIsSaving(true);
    socketRef.current?.emit('playground_save_file', { path: activeFile, content: code });
    setTimeout(() => setIsSaving(false), 500);
  };

  const refreshTree = () => {
    socketRef.current?.emit('playground_get_tree');
  };

  const createItem = (type: 'file' | 'directory') => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;
    const path = activeFile ? `${activeFile.split('/').slice(0, -1).join('/')}/${name}` : name;
    socketRef.current?.emit('playground_create_item', { path, type });
  };

  const deleteItem = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${path}?`)) {
      socketRef.current?.emit('playground_delete_item', path);
      if (activeFile === path) {
        setActiveFile(null);
        setCode('');
      }
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSaving(true);
    const fileData: { path: string, content: string }[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = file.webkitRelativePath;
        const content = await file.text();
        fileData.push({ path, content });
      }
      socketRef.current?.emit('playground_upload_batch', fileData);
    } catch (err) {
      console.error('Folder upload failed:', err);
    } finally {
      setIsSaving(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCodeIcon size={14} className="text-blue-400" />;
    if (name.endsWith('.css')) return <FileCodeIcon size={14} className="text-pink-400" />;
    if (name.endsWith('.json')) return <FileCodeIcon size={14} className="text-yellow-400" />;
    if (name.endsWith('.md')) return <FileIcon size={14} className="text-zinc-400" />;
    return <FileIcon size={14} className="text-zinc-500" />;
  };

  const renderTree = (nodes: FileNode[]) => {
    return nodes.map((node) => (
      <div key={node.path} className="select-none">
        {node.type === 'directory' ? (
          <div>
            <div 
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer text-zinc-400 hover:text-white transition-colors group relative"
            >
              {expandedFolders.has(node.path) ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
              <FolderIcon size={14} className="text-rose-500/70 group-hover:text-rose-500" />
              <span className="text-xs font-medium truncate">{node.name}</span>
              
              <button 
                onClick={(e) => deleteItem(e, node.path)}
                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
              >
                <Trash2Icon size={12} />
              </button>
            </div>
            {expandedFolders.has(node.path) && node.children && (
              <div className="pl-4 border-l border-zinc-800 ml-3.5 mt-0.5 space-y-0.5">
                {renderTree(node.children)}
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => openFile(node.path)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors group relative ${activeFile === node.path ? 'bg-rose-500/10 text-rose-400' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
          >
            <div className="w-3.5 flex justify-center" />
            {getFileIcon(node.name)}
            <span className="text-xs font-medium truncate">{node.name}</span>

            <button 
              onClick={(e) => deleteItem(e, node.path)}
              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
            >
              <Trash2Icon size={12} />
            </button>
          </div>
        )}
      </div>
    ));
  };

  const getLanguage = (filename: string | null) => {
    if (!filename) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.html')) return 'html';
    return 'javascript';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] m-4 gap-4 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-950/80 backdrop-blur-xl border border-white/5 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <FileCodeIcon size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Atlas Playground</h1>
              <p className="text-[10px] text-zinc-500 font-medium">Real-time collaborative workspace</p>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-1 bg-zinc-900/50 px-2.5 py-1.5 rounded-lg border border-white/5">
             <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{connected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={folderInputRef} 
            onChange={handleFolderUpload} 
            className="hidden" 
            // @ts-ignore
            webkitdirectory="" 
            directory="" 
            multiple 
          />
          <button 
            onClick={() => folderInputRef.current?.click()}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30"
          >
            <UploadIcon size={14} />
            <span className="text-xs font-semibold">Import Folder</span>
          </button>
          <button 
            onClick={saveFile}
            disabled={!activeFile || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-30"
          >
            {isSaving ? <RefreshCwIcon size={14} className="animate-spin" /> : <SaveIcon size={14} />}
            <span className="text-xs font-semibold">Save</span>
          </button>
          <button 
            onClick={() => socketRef.current?.emit('terminal_input', 'npm start\n')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
          >
            <PlayIcon size={14} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider">Run</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar Explorer */}
        <div className="w-64 shrink-0 bg-zinc-950/80 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Workspace Explorer</h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => createItem('file')}
                title="New File"
                className="p-1 hover:bg-white/5 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <PlusIcon size={12} />
              </button>
              <button 
                onClick={() => createItem('directory')}
                title="New Folder"
                className="p-1 hover:bg-white/5 rounded-md text-zinc-500 hover:text-white transition-colors"
              >
                <FolderPlusIcon size={12} />
              </button>
              <button onClick={refreshTree} className="p-1 hover:bg-white/5 rounded-md text-zinc-500 hover:text-white transition-colors">
                <RefreshCwIcon size={12} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {tree.length > 0 ? renderTree(tree) : (
              <div className="flex flex-col items-center justify-center h-40 opacity-20 gap-2">
                <SearchIcon size={24} />
                <p className="text-[10px] font-bold">No files found</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor & Terminal Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Monaco Editor Wrapper */}
          <div className="flex-1 bg-zinc-950/80 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col overflow-hidden relative group">
            <div className="px-4 py-2 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                {activeFile ? (
                  <>
                    {getFileIcon(activeFile)}
                    <span className="text-[10px] font-bold text-zinc-400 truncate">{activeFile}</span>
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-600 italic">Select a file to edit</span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="w-2 h-2 rounded-full bg-zinc-800" />
                 <div className="w-2 h-2 rounded-full bg-zinc-800" />
                 <div className="w-2 h-2 rounded-full bg-zinc-800" />
              </div>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={getLanguage(activeFile)}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'all',
                }}
                loading={<div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">Loading Editor...</div>}
              />
            </div>
          </div>

          {/* Terminal */}
          {terminalVisible && (
            <div className="h-64 bg-zinc-950/90 backdrop-blur-2xl border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
              <div className="px-4 py-2 bg-zinc-900/60 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TermIcon size={14} className="text-rose-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Interactive Terminal</span>
                </div>
                <button 
                  onClick={() => setTerminalVisible(false)}
                  className="p-1 hover:bg-white/5 rounded-md text-zinc-500 hover:text-white transition-colors"
                >
                  <XIcon size={12} />
                </button>
              </div>
              <div ref={terminalRef} className="flex-1 p-2 overflow-hidden" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
