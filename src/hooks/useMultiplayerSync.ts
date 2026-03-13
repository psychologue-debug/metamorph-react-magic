import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState } from '@/types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseMultiplayerSyncProps {
  sessionId: string | null;
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  onGameStartedFromRemote?: () => void;
}

/**
 * Syncs gameState to/from the DB via Realtime.
 * - Writes gameState to DB after local changes (debounced)
 * - Receives gameState updates from other players via Realtime
 */
export function useMultiplayerSync({
  sessionId,
  gameState,
  setGameState,
  onGameStartedFromRemote,
}: UseMultiplayerSyncProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isRemoteUpdate = useRef(false);
  const lastWrittenRef = useRef<string>('');

  // Write gameState to DB when it changes locally
  useEffect(() => {
    if (!sessionId || !gameState) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const serialized = JSON.stringify(gameState);
    // Skip if same as last write (avoid loops)
    if (serialized === lastWrittenRef.current) return;
    lastWrittenRef.current = serialized;

    // Debounce writes
    const timer = setTimeout(async () => {
      await supabase
        .from('game_sessions')
        .update({ game_state: gameState as any })
        .eq('id', sessionId);
    }, 100);

    return () => clearTimeout(timer);
  }, [sessionId, gameState]);

  // Subscribe to Realtime changes
  useEffect(() => {
    if (!sessionId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`game-sync-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as any;

          // If game just started (status changed to 'playing' and game_state appeared)
          if (row.status === 'playing' && row.game_state) {
            const remoteState = row.game_state as GameState;
            const remoteSerialized = JSON.stringify(remoteState);

            if (remoteSerialized !== lastWrittenRef.current) {
              isRemoteUpdate.current = true;
              lastWrittenRef.current = remoteSerialized;
              setGameState(remoteState);
              onGameStartedFromRemote?.();
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, setGameState, onGameStartedFromRemote]);

  // Load initial game state if joining a game already in progress
  const loadGameState = useCallback(async () => {
    if (!sessionId) return;

    const { data } = await supabase
      .from('game_sessions')
      .select('game_state, status')
      .eq('id', sessionId)
      .single();

    if (data?.status === 'playing' && data.game_state) {
      isRemoteUpdate.current = true;
      const state = data.game_state as GameState;
      lastWrittenRef.current = JSON.stringify(state);
      setGameState(state);
      onGameStartedFromRemote?.();
    }
  }, [sessionId, setGameState, onGameStartedFromRemote]);

  return { loadGameState };
}
