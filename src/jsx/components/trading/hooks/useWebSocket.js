import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useWebSocket
 * Hook robusto para manejar una conexión WebSocket con:
 *  - Reconexión exponencial (backoff + jitter)
 *  - Suscripciones lógicas a "topics"
 *  - Heartbeat (ping) opcional
 *  - Envío de mensajes JSON seguro
 *
 * API:
 * const {
 *   status,           // 'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'error'
 *   lastMessage,      // último mensaje parseado
 *   sendJson,         // (obj) => void
 *   subscribe,        // (topic) => void
 *   unsubscribe,      // (topic) => void
 *   topics,           // string[] (activos + pendientes)
 *   disconnect,       // () => void
 *   reconnect         // () => void
 * } = useWebSocket(url, options)
 */
export function useWebSocket(url, options = {}) {
  const {
    autoConnect = true,
    maxRetries = 8,
    backoffBaseMs = 500,
    heartbeatIntervalMs = 25000,
    buildSubscribeMessage = (t) => ({ op: 'subscribe', topic: t }),
    buildUnsubscribeMessage = (t) => ({ op: 'unsubscribe', topic: t }),
    buildPingMessage = () => ({ op: 'ping', ts: Date.now() }),
    parseMessage = (event) => {
      try { return JSON.parse(event.data); } catch { return event.data; }
    },
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  // Refs para mantener valores en callbacks sin re-renders constantes
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const heartbeatRef = useRef(null);
  const pendingTopicsRef = useRef(new Set()); // temas solicitados antes de abrir
  const activeTopicsRef = useRef(new Set());  // temas realmente suscritos

  const [status, setStatus] = useState('idle');
  const [lastMessage, setLastMessage] = useState(null);
  // Disparamos re-render al cambiar topics simplemente usando un contador interno.
  const [, forceTopicsUpdate] = useState(0);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (!heartbeatIntervalMs) return;
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.send(JSON.stringify(buildPingMessage())); } catch { /* ignore */ }
      }
    }, heartbeatIntervalMs);
  }, [heartbeatIntervalMs, buildPingMessage, clearHeartbeat]);

  const internalSubscribeAll = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (pendingTopicsRef.current.size === 0) return;
    pendingTopicsRef.current.forEach(topic => {
      try { wsRef.current.send(JSON.stringify(buildSubscribeMessage(topic))); } catch { /* ignore */ }
      activeTopicsRef.current.add(topic);
    });
    pendingTopicsRef.current.clear();
    forceTopicsUpdate();
  }, [buildSubscribeMessage]);

  // scheduleReconnect implementado con ref para evitar dependencia circular
  const scheduleReconnectRef = useRef(() => {});

  const connect = useCallback(() => {
    if (!url) return;
    if (wsRef.current || status === 'connecting' || status === 'open') return;
    setStatus('connecting');
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (ev) => {
        setStatus('open');
        retryRef.current = 0; // reset reconexiones
        internalSubscribeAll();
        startHeartbeat();
        onOpen && onOpen(ev);
      };

      ws.onmessage = (event) => {
        const parsed = parseMessage(event);
        setLastMessage(parsed);
        onMessage && onMessage(parsed);
      };

      ws.onerror = (err) => {
        // No cerramos aquí; esperamos al close para reconectar.
        setStatus(prev => (prev === 'open' ? 'error' : prev));
        onError && onError(err);
      };

      ws.onclose = (ev) => {
        clearHeartbeat();
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        setStatus('closed');
        onClose && onClose(ev);
        scheduleReconnectRef.current();
      };
    } catch (err) {
      setStatus('error');
      onError && onError(err);
      scheduleReconnectRef.current();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, status, parseMessage, onOpen, onMessage, onError, onClose, internalSubscribeAll, startHeartbeat]);

  // Definimos la lógica de reconexión y la guardamos en el ref
  useEffect(() => {
    scheduleReconnectRef.current = () => {
      if (retryRef.current >= maxRetries) return;
      const attempt = retryRef.current;
      const delay = (backoffBaseMs * Math.pow(2, attempt)) + (Math.random() * 150);
      retryRef.current += 1;
      setTimeout(() => {
        if (!wsRef.current) {
          connect();
        }
      }, delay);
    };
  }, [backoffBaseMs, maxRetries, connect]);

  const disconnect = useCallback(() => {
    retryRef.current = maxRetries; // impedir futuras reconexiones
    if (wsRef.current) {
      setStatus('closing');
      try { wsRef.current.close(); } catch { /* ignore */ }
    }
  }, [maxRetries]);

  const sendJson = useCallback((obj) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    try {
      wsRef.current.send(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }, []);

  const subscribe = useCallback((topic) => {
    if (!topic) return;
    if (activeTopicsRef.current.has(topic) || pendingTopicsRef.current.has(topic)) return; // ya solicitado
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify(buildSubscribeMessage(topic))); } catch { /* ignore */ }
      activeTopicsRef.current.add(topic);
    } else {
      pendingTopicsRef.current.add(topic);
    }
    forceTopicsUpdate();
  }, [buildSubscribeMessage]);

  const unsubscribe = useCallback((topic) => {
    if (!topic) return;
    if (pendingTopicsRef.current.has(topic)) {
      pendingTopicsRef.current.delete(topic);
      forceTopicsUpdate();
      return;
    }
    if (activeTopicsRef.current.has(topic) && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify(buildUnsubscribeMessage(topic))); } catch { /* ignore */ }
      activeTopicsRef.current.delete(topic);
      forceTopicsUpdate();
    }
  }, [buildUnsubscribeMessage]);

  // Auto-conexión
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      clearHeartbeat();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
        wsRef.current = null;
      }
    };
  }, [autoConnect, connect, clearHeartbeat]);

  const topics = Array.from(new Set([...pendingTopicsRef.current, ...activeTopicsRef.current]));

  return {
    status,
    lastMessage,
    sendJson,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect: () => { if (!wsRef.current) connect(); },
    topics,
  };
}

export default useWebSocket;
