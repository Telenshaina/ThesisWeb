import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

// NOTE ON CDN IMPORTS: 
// We use these imports to force Vite to load the required JavaScript files into the browser.
// The objects (Terminal, FitAddon, monaco) are then accessed as global properties (window.Terminal, window.monaco) 
// inside the useEffect hooks after the browser finishes downloading and executing the script.

// Load Xterm.js base styles dynamically since we cannot use a direct CSS import in this format.
const XTERM_CSS = `
  /* Use the main Xterm CSS file from a CDN for full styling */
  @import url('https://cdnjs.cloudflare.com/ajax/libs/xterm/5.5.0/xterm.min.css');
  
  /* Custom styles to ensure proper height and overflow */
  .xterm .xterm-viewport {
    overflow-y: auto !important;
  }
  .xterm {
    padding: 8px;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }
`;

// Inject Xterm CSS once when the component is defined
(() => {
  if (typeof document !== 'undefined') {
    if (!document.getElementById('xterm-custom-style')) {
      const style = document.createElement('style');
      style.id = 'xterm-custom-style';
      style.textContent = XTERM_CSS;
      document.head.appendChild(style);
    }
  }
})();

// This is the main application component for the simulated compiler interface
const App = () => {
  // State for the code editor's content
  const [code, setCode] = useState('print("Hello, NEUDev!")\n\n# Your code analysis model will integrate here later!\n');
  const [isReady, setIsReady] = useState(false); // Controls the "Run" button state
  const [isLoading, setIsLoading] = useState(true); // Controls the initial loading screen
  
  // Refs for the containers
  const editorRef = useRef(null);
  const terminalRef = useRef(null);
  
  // Refs for the library instances
  const terminalInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);


  // --- Library Check and Initialization ---

  // CRITICAL STEP: Polls the window object until the global libraries are loaded
  useEffect(() => {
    let checkInterval;
    if (typeof window !== 'undefined') {
      checkInterval = setInterval(() => {
        // Check if the global objects exposed by the CDNs are available
        if (window.monaco && window.Terminal && window.FitAddon) {
          clearInterval(checkInterval);
          setIsLoading(false); // Libraries are loaded, stop loading screen
        }
      }, 200); // Check every 200ms
    }

    return () => clearInterval(checkInterval);
  }, []); // Only runs once on mount


  // --- Utility Functions for Xterm.js (Terminal) ---

  const initTerminal = useCallback(() => {
    // Only proceed if loading is complete and the container ref is available
    if (terminalRef.current && !terminalInstanceRef.current && !isLoading) {
      try {
        // Access global objects exposed by CDN
        const Terminal = window.Terminal;
        const FitAddon = window.FitAddon;

        if (!Terminal || !FitAddon) {
             console.error("Xterm dependencies not found globally.");
             return;
        }

        const term = new Terminal({
          cursorBlink: true,
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: 14,
          theme: {
            background: '#1f2937', // Tailwind bg-gray-800
            foreground: '#f3f4f6', // Tailwind text-gray-100
            cursor: '#f3f4f6',
          }
        });
        terminalInstanceRef.current = term;

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        // Initial welcome message
        writeToTerminal('NEUDev Compiler Simulation Initializing...', false);

        // Handle window resize to keep terminal fit
        const handleResize = () => {
          fitAddon.fit();
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          term.dispose();
        };
      } catch (e) {
        console.error("Failed to initialize Xterm.js:", e);
      }
    }
    return () => {}; // Return a no-op cleanup function if initialization fails
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // Reruns when isLoading changes to false


  const writeToTerminal = useCallback((text, clear = true) => {
    const term = terminalInstanceRef.current;
    if (term) {
      if (clear) {
        term.clear();
        term.write('\x1b[32;1mNEUDev Compiler Simulation Ready...\x1b[0m\r\n'); // Welcome message (green)
        term.write('----------------------------------------\r\n\n');
      }

      // Convert newlines for terminal display
      const lines = text.split('\n');
      lines.forEach(line => {
        term.write(line + '\r\n');
      });
    }
  }, []);

  // --- Initialization Effects ---

  // 1. Initialize Monaco Editor
  useEffect(() => {
    if (editorRef.current && !isReady && !isLoading) {
      try {
        // Access global object exposed by CDN
        const monaco = window.monaco; 

        if (!monaco) {
            console.error("Monaco dependency not found globally.");
            return;
        }

        const editor = monaco.editor.create(editorRef.current, {
          value: code,
          language: 'python', // Set language for syntax highlighting
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
          fontSize: 14,
        });

        editor.onDidChangeModelContent(() => {
          setCode(editor.getValue());
        });

        // Use a small timeout to ensure the editor has settled before setting ready state
        // This prevents the "Run" button from being enabled before the editor is fully visible
        setTimeout(() => {
            setIsReady(true);
        }, 500);
        
        return () => {
          editor.dispose();
        };
      } catch (e) {
        console.error("Failed to initialize Monaco Editor:", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isReady]);

  // 2. Initialize Xterm Terminal
  useEffect(() => {
    if (!isLoading) {
        const cleanup = initTerminal();
        return cleanup;
    }
  }, [initTerminal, isLoading]);


  // --- Run Logic (Simulated Compiler) ---

  const getSimulatedOutput = (inputCode) => {
    const lines = inputCode.split('\n');
    const printStatements = lines
      .filter(line => line.trim().startsWith('print(') && !line.trim().startsWith('#'))
      .map(line => {
        // Simple attempt to extract content inside quotes/parentheses for simulation
        const contentMatch = line.match(/print\s*\(([^)]+)\)/);
        if (contentMatch) {
            let content = contentMatch[1].trim();
            if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
                content = content.substring(1, content.length - 1);
            }
            return content;
        }
        return '...execution result...';
      });

    if (printStatements.length > 0) {
      return [
        '--- Execution Output (Parsed Print Statements) ---',
        ...printStatements
      ].join('\n');
    }

    // Default simulation output if no print statements are found
    return (
      '--- Execution Successful (Simulated) ---\n' +
      'No explicit print statements found in code.\n' +
      'This area will eventually display output from your cloud-based compiler.\n' +
      '---------------------------------------\n' +
      'Next Steps: Integrate AI Code Detector here.'
    );
  };

  // Handler for the "Run Code" button
  const handleRunCode = () => {
    if (!isReady) return;

    writeToTerminal(`Compiling and running code...\n\n`);

    // Simulate network delay for a more realistic feel (1 second)
    setTimeout(() => {
      const output = getSimulatedOutput(code);

      // Write the output to the terminal
      writeToTerminal(output, true);
    }, 1000);
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-lg font-medium">Loading Compiler Tools (Monaco & Xterm)...</p>
                <p className="text-sm text-gray-400">This may take a moment due to large external libraries.</p>
            </div>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
        <h1 className="text-2xl font-extrabold text-blue-700">
          NEUDev Compiler Sandbox <span className="text-sm text-gray-500 font-medium">(Simulated)</span>
        </h1>
        <button
          onClick={handleRunCode}
          disabled={!isReady}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isReady ? '▶ Run Code' : 'Initializing Editor...'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden p-4 space-x-4">
        {/* Code Editor Panel */}
        <div className="flex flex-col w-1/2 rounded-xl shadow-2xl overflow-hidden bg-white">
          <div className="p-3 bg-gray-700 text-white font-mono text-sm border-b border-gray-600">
            Code Editor (Python)
          </div>
          <div ref={editorRef} className="flex-1 min-h-[300px]">
            {/* Monaco Editor attaches here */}
          </div>
        </div>

        {/* Terminal Output Panel */}
        <div className="flex flex-col w-1/2 rounded-xl shadow-2xl overflow-hidden bg-gray-800">
          <div className="p-3 bg-gray-900 text-white font-mono text-sm border-b border-gray-700">
            Console Output (Xterm.js)
          </div>
          <div ref={terminalRef} className="flex-1 p-2">
            {/* Xterm.js Terminal attaches here */}
          </div>
        </div>
      </div>

      <footer className="p-2 text-center text-xs text-gray-500 bg-gray-100 border-t">
        Architecture Note: This interface uses ReactJS, Monaco Editor for code, and Xterm.js for simulated terminal output. The 'Run' button currently simulates execution; for real-world use, this would trigger an API call to a backend service like a Laravel or Python compiler environment.
      </footer>
    </div>
  );
};

export default App;

