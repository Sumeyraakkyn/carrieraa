'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let globalSocket: Socket | null = null;

/**
 * Uygulama genelinde tek bir Socket.io bağlantısı yönetir.
 * Kullanıcı giriş yaptıktan sonra userId ile register eder.
 *
 * @param onNotification - Yeni bildirim geldiğinde çağrılır
 */
export function useSocket(onNotification?: (notification: any) => void) {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) return;

    // Bağlantı yoksa kur
    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      globalSocket.on('connect', () => {
        console.log('[socket] Bağlandı:', globalSocket?.id);
        globalSocket?.emit('register', userId);
      });

      globalSocket.on('disconnect', () => {
        console.log('[socket] Bağlantı kesildi');
      });
    } else {
      // Zaten bağlıysa sadece register et
      globalSocket.emit('register', userId);
    }

    // Bildirim dinleyicisi
    function handleNotification(notification: any) {
      handlerRef.current?.(notification);
    }

    globalSocket.on('notification', handleNotification);

    return () => {
      globalSocket?.off('notification', handleNotification);
    };
  }, []);

  return globalSocket;
}
