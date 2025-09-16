import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  session_id: string;
  data: any;
}

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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const currentSessionId = useRef<string | null>(null);

  const connect = useCallback((sessionId: string) => {
    try {
      // Close existing connection if any
      if (socket) {
        socket.close(1000, 'Connecting to new session');
      }

      currentSessionId.current = sessionId;
      const ws = new WebSocket(`${baseUrl}/ws/${sessionId}`);
      
      ws.onopen = () => {
        console.log(`WebSocket connected for session: ${sessionId}`);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          console.log('WebSocket message received:', message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);

        // Attempt to reconnect if not a manual close and we have a session ID
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && currentSessionId.current) {
          reconnectAttempts.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(currentSessionId.current!);
          }, reconnectDelay * reconnectAttempts.current);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [baseUrl, socket]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
    currentSessionId.current = null;
    setIsConnected(false);
    setSocket(null);
  }, [socket]);

  const sendMessage = useCallback((message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // Remove disconnect from dependencies to prevent infinite loop

  return {
    socket,
    isConnected,
    sendMessage,
    lastMessage,
    connect,
    disconnect
  };
};
