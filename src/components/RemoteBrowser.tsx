import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const RemoteBrowser = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState('Initializing browser...');
  const [isLoading, setIsLoading] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [urlInput, setUrlInput] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotRef = useRef<string | null>(null);

  // Reset loading state after timeout to prevent UI from getting stuck
  const setLoadingWithTimeout = (loading: boolean) => {
    setIsLoading(loading);
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    // Set a safety timeout to clear loading state
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        console.log('Loading timeout triggered - resetting loading state');
      }, 5000); // 5 second safety timeout
    }
  };

  // Initialize socket connection
  const connectSocket = useCallback(async () => {
    try {
      setStatus('Connecting to server...');
      // Call the API endpoint to ensure Socket.IO server is initialized
      await fetch('/api/browser-control');
      
      // Create socket connection
      const newSocket = io({
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 60000
      });
      
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setErrorMessage('');
        setStatus('Connected, starting browser...');
        setIsLoading(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setErrorMessage(`Connection error: ${err.message}`);
        setStatus('Connection failed');
        setIsLoading(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setStatus(`Disconnected: ${reason}`);
        setIsLoading(false);
      });

      newSocket.on('status', (data) => {
        console.log('Status update:', data);
        setStatus(data.message);
      });

      newSocket.on('heartbeat', (data) => {
        console.log('Heartbeat received:', data.timestamp);
        setLastHeartbeat(data.timestamp);
        // Send response back to server to keep the connection alive
        newSocket.emit('heartbeat-response');
      });

      // Handle URL changes sent from the server
      newSocket.on('urlChanged', (data) => {
        console.log('URL changed:', data.url);
        setCurrentUrl(data.url);
        setUrlInput(data.url);
      });

      newSocket.on('screenshot', (base64Image) => {
        console.log('Received screenshot at:', new Date().toISOString());
        const imageUrl = `data:image/png;base64,${base64Image}`;
        // Store the new screenshot in a ref to avoid React update issues
        screenshotRef.current = imageUrl;
        // Update the state to trigger a render
        setScreenshot(imageUrl);
        setIsLoading(false);
        // Clear any loading timeout when we get a response
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      });

      newSocket.on('error', (error) => {
        console.error('Received error:', error);
        setErrorMessage(error.message);
        setIsLoading(false);
        // Clear any loading timeout when we get an error
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      });

      return newSocket;
    } catch (error) {
      console.error('Socket initialization error:', error);
      setErrorMessage('Failed to connect to server');
      setStatus('Connection failed');
      setIsLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const initSocket = async () => {
      await connectSocket();
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Clear any loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [connectSocket]);

  // Add heartbeat status check
  useEffect(() => {
    if (!lastHeartbeat) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const lastBeat = lastHeartbeat;
      const seconds = Math.floor((now - lastBeat) / 1000);
      
      if (seconds > 60) {
        // If more than 60 seconds since last heartbeat, show warning
        setStatus(`Last server contact: ${seconds}s ago`);
      }
      
      if (seconds > 120) {
        // If more than 2 minutes, try to reconnect
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setIsLoading(false);
        connectSocket();
        clearInterval(interval);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [lastHeartbeat, connectSocket]);

  // Retry connection
  const handleRetryConnection = async () => {
    setErrorMessage('');
    setLoadingWithTimeout(true);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    await connectSocket();
  };

  // Handle clicks on the screenshot
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (socket && imageRef.current && !isLoading) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate the position relative to the actual browser viewport
      const scaleX = 1366 / imageRef.current.clientWidth;
      const scaleY = 768 / imageRef.current.clientHeight;
      
      const clickX = Math.round(x * scaleX);
      const clickY = Math.round(y * scaleY);
      
      setLoadingWithTimeout(true);
      setStatus(`Clicking at (${clickX}, ${clickY})...`);
      socket.emit('click', { x: clickX, y: clickY });
    }
  };

  // Navigate to a URL
  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && !isLoading && urlInput) {
      // Ensure URL has protocol
      let navigateUrl = urlInput;
      if (!navigateUrl.startsWith('http://') && !navigateUrl.startsWith('https://')) {
        navigateUrl = 'https://' + navigateUrl;
      }
      
      setLoadingWithTimeout(true);
      setStatus(`Navigating to ${navigateUrl}...`);
      socket.emit('navigate', navigateUrl);
    }
  };

  // Request a fresh screenshot
  const refreshScreenshot = () => {
    if (socket && !isLoading) {
      setLoadingWithTimeout(true);
      setStatus('Refreshing browser...');
      socket.emit('getScreenshot');
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Remote Browser</h1>
      
      {/* Connection status */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          Status: <span className={isConnected ? "text-green-500" : "text-red-500"}>
            {isConnected ? "Connected" : "Disconnected"} 
          </span>
          <span className="ml-2 text-sm text-gray-500">{status}</span>
        </div>
        <div className="flex gap-2">
          {!isConnected && (
            <button 
              onClick={handleRetryConnection}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            >
              Retry Connection
            </button>
          )}
          <button 
            onClick={refreshScreenshot}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:bg-gray-100 text-sm"
            disabled={!isConnected || isLoading}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-4 rounded">
          {errorMessage}
          <button 
            onClick={() => setErrorMessage('')} 
            className="ml-2 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Custom URL bar */}
      <form onSubmit={handleNavigate} className="mb-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL"
            className="flex-grow p-2 border border-gray-300 rounded shadow-sm font-mono text-sm"
            disabled={!isConnected || isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!isConnected || isLoading || !urlInput}
          >
            Go
          </button>
        </div>
      </form>
      
      {/* Browser window */}
      <div className="mb-4 relative shadow-2xl rounded overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10 rounded">
            <div className="bg-white p-3 rounded shadow-md">Loading...</div>
          </div>
        )}
        {screenshot ? (
          <div className="relative border rounded">
            <img 
              ref={imageRef}
              src={screenshot} 
              alt="Browser window" 
              className={`w-full cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
              onClick={handleImageClick}
              style={{ maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div className="bg-gray-100 h-96 flex items-center justify-center rounded">
            <p>Loading browser...</p>
          </div>
        )}
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>Click anywhere on the browser to interact.</p>
      </div>
    </div>
  );
};

export default RemoteBrowser; 