import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateUUID } from '@/lib/uuid';
import { DivinityId } from '@/types/game';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LobbyPlayer {
  id: string;
  name: string;
  divinity: DivinityId | null;
  ready: boolean;
  isHost: boolean;
}

export interface LobbyState {
  sessionId: string;
  gameCode: string;
  hostId: string;
  maxPlayers: number;
  status: 'lobby' | 'playing' | 'finished';
  players: LobbyPlayer[];
}

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('metamorphoses_player_id');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('metamorphoses_player_id', id);
  }
  return id;
}

export function useMultiplayer() {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [playerId] = useState(() => getOrCreatePlayerId());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to realtime changes on the session
  const subscribeToSession = useCallback((sessionId: string) => {
    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`game-session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as any;
          setLobby({
            sessionId: row.id,
            gameCode: row.game_code,
            hostId: row.host_id,
            maxPlayers: row.max_players,
            status: row.status,
            players: (row.players as LobbyPlayer[]) || [],
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // Create a new game session
  const createSession = useCallback(async (maxPlayers: number, playerName: string) => {
    setLoading(true);
    setError(null);

    const gameCode = generateGameCode();
    const hostPlayer: LobbyPlayer = {
      id: playerId,
      name: playerName,
      divinity: null,
      ready: false,
      isHost: true,
    };

    const { data, error: dbError } = await supabase
      .from('game_sessions')
      .insert({
        game_code: gameCode,
        host_id: playerId,
        max_players: maxPlayers,
        players: [hostPlayer] as any,
      })
      .select()
      .single();

    setLoading(false);

    if (dbError || !data) {
      setError('Impossible de créer la session');
      toast.error('Erreur lors de la création de la partie');
      return null;
    }

    const lobbyState: LobbyState = {
      sessionId: data.id,
      gameCode: data.game_code,
      hostId: data.host_id,
      maxPlayers: data.max_players,
      status: data.status as any,
      players: data.players as any as LobbyPlayer[],
    };

    setLobby(lobbyState);
    subscribeToSession(data.id);
    return lobbyState;
  }, [playerId, subscribeToSession]);

  // Join an existing session by code
  const joinSession = useCallback(async (gameCode: string, playerName: string) => {
    setLoading(true);
    setError(null);

    // Find the session
    const { data: session, error: fetchError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game_code', gameCode.toUpperCase())
      .single();

    if (fetchError || !session) {
      setLoading(false);
      setError('Partie introuvable');
      toast.error('Code de partie invalide');
      return null;
    }

    if (session.status !== 'lobby') {
      setLoading(false);
      setError('La partie a déjà commencé');
      toast.error('Cette partie a déjà commencé');
      return null;
    }

    const currentPlayers = (session.players as any as LobbyPlayer[]) || [];

    // Check if already in the session
    const existing = currentPlayers.find(p => p.id === playerId);
    if (existing) {
      // Rejoin — just refresh state
      const lobbyState: LobbyState = {
        sessionId: session.id,
        gameCode: session.game_code,
        hostId: session.host_id,
        maxPlayers: session.max_players,
        status: session.status as any,
        players: currentPlayers,
      };
      setLobby(lobbyState);
      subscribeToSession(session.id);
      setLoading(false);
      return lobbyState;
    }

    if (currentPlayers.length >= session.max_players) {
      setLoading(false);
      setError('La partie est pleine');
      toast.error('La partie est pleine');
      return null;
    }

    const newPlayer: LobbyPlayer = {
      id: playerId,
      name: playerName,
      divinity: null,
      ready: false,
      isHost: false,
    };

    const updatedPlayers = [...currentPlayers, newPlayer];

    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers as any })
      .eq('id', session.id);

    setLoading(false);

    if (updateError) {
      setError('Impossible de rejoindre');
      toast.error('Erreur lors de la connexion');
      return null;
    }

    const lobbyState: LobbyState = {
      sessionId: session.id,
      gameCode: session.game_code,
      hostId: session.host_id,
      maxPlayers: session.max_players,
      status: session.status as any,
      players: updatedPlayers,
    };

    setLobby(lobbyState);
    subscribeToSession(session.id);
    return lobbyState;
  }, [playerId, subscribeToSession]);

  // Select a divinity in the lobby
  const selectDivinity = useCallback(async (divinity: DivinityId) => {
    if (!lobby) return;

    const updatedPlayers = lobby.players.map(p =>
      p.id === playerId ? { ...p, divinity } : p
    );

    // Check uniqueness
    const divinities = updatedPlayers.filter(p => p.divinity).map(p => p.divinity);
    if (new Set(divinities).size !== divinities.length) {
      toast.error('Cette divinité est déjà prise !');
      return;
    }

    await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers as any })
      .eq('id', lobby.sessionId);
  }, [lobby, playerId]);

  // Toggle ready state
  const toggleReady = useCallback(async () => {
    if (!lobby) return;

    const updatedPlayers = lobby.players.map(p =>
      p.id === playerId ? { ...p, ready: !p.ready } : p
    );

    await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers as any })
      .eq('id', lobby.sessionId);
  }, [lobby, playerId]);

  // Leave the lobby
  const leaveSession = useCallback(async () => {
    if (!lobby) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const updatedPlayers = lobby.players.filter(p => p.id !== playerId);

    if (updatedPlayers.length === 0) {
      // Delete session if empty
      await supabase.from('game_sessions').delete().eq('id', lobby.sessionId);
    } else {
      // If host leaves, transfer host
      if (lobby.hostId === playerId && updatedPlayers.length > 0) {
        updatedPlayers[0].isHost = true;
        await supabase
          .from('game_sessions')
          .update({
            players: updatedPlayers as any,
            host_id: updatedPlayers[0].id,
          })
          .eq('id', lobby.sessionId);
      } else {
        await supabase
          .from('game_sessions')
          .update({ players: updatedPlayers as any })
          .eq('id', lobby.sessionId);
      }
    }

    setLobby(null);
  }, [lobby, playerId]);

  // Start the game (host only)
  const startMultiplayerGame = useCallback(async () => {
    if (!lobby) return false;
    if (lobby.hostId !== playerId) {
      toast.error("Seul l'hôte peut lancer la partie");
      return false;
    }

    // Validate all players have a divinity and are ready
    const allReady = lobby.players.every(p => p.divinity && p.ready);
    if (!allReady) {
      toast.error('Tous les joueurs doivent choisir une divinité et être prêts');
      return false;
    }

    if (lobby.players.length < 2) {
      toast.error('Il faut au moins 2 joueurs');
      return false;
    }

    await supabase
      .from('game_sessions')
      .update({ status: 'playing' })
      .eq('id', lobby.sessionId);

    return true;
  }, [lobby, playerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const isHost = lobby?.hostId === playerId;
  const myPlayer = lobby?.players.find(p => p.id === playerId) || null;

  return {
    lobby,
    playerId,
    isHost,
    myPlayer,
    loading,
    error,
    createSession,
    joinSession,
    selectDivinity,
    toggleReady,
    leaveSession,
    startMultiplayerGame,
  };
}
