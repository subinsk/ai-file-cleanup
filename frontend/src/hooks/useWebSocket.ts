import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  session_id: string;
  data: any;
}

// Global connection singleton to handle React StrictMode double-mounting
class WebSocketSingleton {
  private connections = new Map<string, WebSocket>();
  private callbacks = new Map<string, Set<(message: WebSocketMessage) => void>>();
  private connectionPromises = new Map<string, Promise<WebSocket>>();

  async getConnection(sessionId: string, baseUrl: string): Promise<WebSocket> {
    // If connection already exists and is open, return it
    const existing = this.connections.get(sessionId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      console.log(`♻️ Reusing existing WebSocket connection for session: ${sessionId}`);
      return existing;
    }

    // If connection is connecting, wait for it
    if (this.connectionPromises.has(sessionId)) {
      console.log(`⏳ Waiting for existing connection promise for session: ${sessionId}`);
      return this.connectionPromises.get(sessionId)!;
    }

    // Clean up any stale connections
    if (existing) {
      console.log(`🧹 Cleaning up stale connection for session: ${sessionId}, state: ${existing.readyState}`);
      this.connections.delete(sessionId);
    }

    // Create new connection
    console.log(`🔌 Creating new WebSocket connection for session: ${sessionId}`);
    const connectionPromise = new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(`${baseUrl}/ws/${sessionId}`);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected for session: ${sessionId}`);
        this.connections.set(sessionId, ws);
        this.connectionPromises.delete(sessionId);
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error for session: ${sessionId}`, error);
        this.connectionPromises.delete(sessionId);
        reject(error);
      };

      ws.onclose = (event) => {
        console.log(`❌ WebSocket disconnected for session: ${sessionId}: ${event.code} - ${event.reason}`);
        this.connections.delete(sessionId);
        this.callbacks.delete(sessionId);
        this.connectionPromises.delete(sessionId);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const sessionCallbacks = this.callbacks.get(sessionId);
          if (sessionCallbacks) {
            sessionCallbacks.forEach(callback => {
              try {
                callback(message);
              } catch (error) {
                console.error('Error in message callback:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    });

    this.connectionPromises.set(sessionId, connectionPromise);
    return connectionPromise;
  }

  addCallback(sessionId: string, callback: (message: WebSocketMessage) => void) {
    if (!this.callbacks.has(sessionId)) {
      this.callbacks.set(sessionId, new Set());
    }
    this.callbacks.get(sessionId)!.add(callback);
    console.log(`📝 Added callback for session: ${sessionId}, total: ${this.callbacks.get(sessionId)!.size}`);
  }

  removeCallback(sessionId: string, callback: (message: WebSocketMessage) => void) {
    const sessionCallbacks = this.callbacks.get(sessionId);
    if (sessionCallbacks) {
      sessionCallbacks.delete(callback);
      console.log(`🗑️ Removed callback for session: ${sessionId}, remaining: ${sessionCallbacks.size}`);
      
      // If no more callbacks, close the connection
      if (sessionCallbacks.size === 0) {
        const connection = this.connections.get(sessionId);
        if (connection && connection.readyState === WebSocket.OPEN) {
          console.log(`🔌 Closing WebSocket connection for session: ${sessionId} (no more callbacks)`);
          connection.close(1000, 'No more callbacks');
        }
        this.connections.delete(sessionId);
        this.callbacks.delete(sessionId);
      }
    }
  }

  getExistingConnection(sessionId: string): WebSocket | null {
    return this.connections.get(sessionId) || null;
  }

  closeAll() {
    this.connections.forEach((ws, sessionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Page unload');
      }
    });
    this.connections.clear();
    this.callbacks.clear();
    this.connectionPromises.clear();
  }
}

const webSocketSingleton = new WebSocketSingleton();

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: string) => void;
  lastMessage: WebSocketMessage | null;
  connect: (sessionId: string) => void;
  disconnect: () => void;
}

export const useWebSocket = (baseUrl: string = 'ws://localhost:8000'): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const pingInterval = 30000; // 30 seconds
  const currentSessionId = useRef<string | null>(null);
  const messageCallback = useRef<(message: WebSocketMessage) => void>();

  const connect = useCallback(async (sessionId: string) => {
    try {
      console.log(`🎯 Connect called for session: ${sessionId}`);
      currentSessionId.current = sessionId;
      
      // Set up message callback for this hook instance
      messageCallback.current = (message: WebSocketMessage) => {
        if (message.type === 'pong') {
          console.log('WebSocket pong received');
          return;
        }
        setLastMessage(message);
        console.log('WebSocket message received:', message);
      };

      // Add our callback to the singleton
      webSocketSingleton.addCallback(sessionId, messageCallback.current);

      try {
        // Get or create connection using singleton
        const ws = await webSocketSingleton.getConnection(sessionId, baseUrl);
        setSocket(ws);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Start ping-pong mechanism if not already started
        if (!pingTimeoutRef.current) {
          const startPing = () => {
            if (pingTimeoutRef.current) {
              clearTimeout(pingTimeoutRef.current);
            }
            pingTimeoutRef.current = setTimeout(() => {
              const currentWs = webSocketSingleton.getExistingConnection(sessionId);
              if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                currentWs.send(JSON.stringify({
                  type: 'ping',
                  timestamp: Date.now()
                }));
                startPing(); // Schedule next ping
              }
            }, pingInterval);
          };
          startPing();
        }
        
      } catch (error) {
        console.error('❌ Failed to establish WebSocket connection:', error);
        setIsConnected(false);
        
        // Attempt to reconnect if not at max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`🔄 Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(sessionId);
          }, reconnectDelay * reconnectAttempts.current);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in connect function:', error);
      setIsConnected(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]); // Intentionally exclude socket to prevent infinite re-connections

  const disconnect = useCallback(() => {
    console.log(`🔌 Manually disconnecting WebSocket for session: ${currentSessionId.current}`);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
    
    // Remove our callback from the singleton
    if (currentSessionId.current && messageCallback.current) {
      webSocketSingleton.removeCallback(currentSessionId.current, messageCallback.current);
    }
    
    currentSessionId.current = null;
    reconnectAttempts.current = 0;
    setIsConnected(false);
    setSocket(null);
  }, []);

  const sendMessage = useCallback((message: string) => {
    const ws = currentSessionId.current ? webSocketSingleton.getExistingConnection(currentSessionId.current) : null;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally exclude disconnect to prevent cleanup issues

  // Global cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Close all connections via singleton
      webSocketSingleton.closeAll();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden, potentially being unloaded
        console.log('Page hidden, WebSocket connections may be affected');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    socket,
    isConnected,
    sendMessage,
    lastMessage,
    connect,
    disconnect
  };
};
