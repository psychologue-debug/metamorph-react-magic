import { useState } from 'react';
import { DivinityId, DIVINITIES } from '@/types/game';
import { LobbyState, LobbyPlayer } from '@/hooks/useMultiplayer';
import { motion } from 'framer-motion';
import { Crown, Check, Copy, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';

const ALL_GODS: DivinityId[] = ['apollon', 'venus', 'bacchus', 'minerve', 'diane', 'neptune', 'ceres'];

interface LobbyScreenProps {
  lobby: LobbyState;
  playerId: string;
  isHost: boolean;
  myPlayer: LobbyPlayer | null;
  onSelectDivinity: (divinity: DivinityId) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeave: () => void;
}

const LobbyScreen = ({
  lobby,
  playerId,
  isHost,
  myPlayer,
  onSelectDivinity,
  onToggleReady,
  onStartGame,
  onLeave,
}: LobbyScreenProps) => {
  const takenDivinities = lobby.players.filter(p => p.divinity).map(p => p.divinity!);
  const allReady = lobby.players.length >= 2 && lobby.players.every(p => p.divinity && p.ready);

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.gameCode);
    toast.success('Code copié !');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        className="relative z-10 text-center max-w-5xl px-6 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Game code banner */}
        <div className="mb-6">
          <p className="text-white/60 font-display text-sm uppercase tracking-widest mb-2">Code de la partie</p>
          <div className="flex items-center justify-center gap-3">
            <span
              className="font-display text-5xl font-bold tracking-[0.3em] px-6 py-3 rounded-xl border-2"
              style={{
                color: 'hsl(var(--ether))',
                borderColor: 'hsl(var(--ether) / 0.4)',
                background: 'hsl(var(--card) / 0.8)',
                textShadow: '0 0 20px hsl(var(--ether) / 0.5)',
              }}
            >
              {lobby.gameCode}
            </span>
            <motion.button
              className="p-3 rounded-lg border border-border/50 text-white/70 hover:text-white transition-colors"
              style={{ background: 'hsl(var(--card) / 0.7)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={copyCode}
            >
              <Copy className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-white/40 text-sm mt-2 font-body">
            Partagez ce code avec vos amis pour qu'ils rejoignent
          </p>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-5 h-5 text-ether" />
            <span className="font-display text-lg text-white">
              {lobby.players.length} / {lobby.maxPlayers} joueurs
            </span>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {lobby.players.map((player) => {
              const god = player.divinity ? DIVINITIES[player.divinity] : null;
              const isMe = player.id === playerId;
              return (
                <motion.div
                  key={player.id}
                  className={`px-4 py-3 rounded-xl border-2 min-w-[140px] flex flex-col items-center gap-2 ${
                    isMe ? 'border-ether/60' : 'border-border/40'
                  }`}
                  style={{
                    background: god
                      ? `linear-gradient(180deg, hsl(${god.color} / 0.3), hsl(var(--card) / 0.9))`
                      : 'hsl(var(--card) / 0.7)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {/* Avatar */}
                  {god ? (
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden border-2"
                      style={{ borderColor: `hsl(${god.color})` }}
                    >
                      <img src={god.image} alt={god.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted/30 border-2 border-dashed border-border/50 flex items-center justify-center text-white/30 text-lg">
                      ?
                    </div>
                  )}

                  <span className="font-display text-sm font-bold text-white">{player.name}</span>
                  {god && <span className="font-body text-xs text-white/60">{god.name}</span>}
                  
                  {player.isHost && (
                    <span className="text-[10px] font-display uppercase tracking-wider text-ether flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Hôte
                    </span>
                  )}

                  {player.ready ? (
                    <span className="text-xs font-display text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Prêt
                    </span>
                  ) : (
                    <span className="text-xs font-display text-white/40">En attente...</span>
                  )}
                </motion.div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: lobby.maxPlayers - lobby.players.length }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="px-4 py-3 rounded-xl border-2 border-dashed border-border/20 min-w-[140px] flex flex-col items-center justify-center gap-2 opacity-30"
                style={{ background: 'hsl(var(--card) / 0.3)' }}
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-border/30" />
                <span className="font-display text-sm text-white/30">Libre</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divinity selection for current player */}
        <div className="mb-6">
          <p className="font-display text-sm text-white/60 uppercase tracking-wider mb-3">
            Choisissez votre divinité
          </p>
          <div className="grid grid-cols-7 gap-2 max-w-3xl mx-auto">
            {ALL_GODS.map((godId) => {
              const god = DIVINITIES[godId];
              const isTaken = takenDivinities.includes(godId);
              const isMyPick = myPlayer?.divinity === godId;
              const takenBy = lobby.players.find(p => p.divinity === godId);
              const isTakenByOther = isTaken && !isMyPick;

              return (
                <motion.button
                  key={godId}
                  className={`relative rounded-lg p-2 border-2 flex flex-col items-center gap-1 transition-all ${
                    isMyPick
                      ? 'border-ether ring-2 ring-ether/30'
                      : isTakenByOther
                      ? 'border-border/20 opacity-30 cursor-not-allowed'
                      : 'border-border/40 hover:border-ether/50 cursor-pointer'
                  }`}
                  style={{
                    background: isMyPick
                      ? `linear-gradient(180deg, hsl(${god.color} / 0.4), hsl(var(--card) / 0.9))`
                      : 'hsl(var(--card) / 0.6)',
                  }}
                  whileHover={!isTakenByOther ? { scale: 1.05 } : {}}
                  whileTap={!isTakenByOther ? { scale: 0.95 } : {}}
                  onClick={() => !isTakenByOther && onSelectDivinity(godId)}
                  disabled={isTakenByOther}
                >
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden border"
                    style={{ borderColor: `hsl(${god.color})` }}
                  >
                    <img src={god.image} alt={god.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-display text-[11px] font-bold text-white">{god.name}</span>
                  {isTakenByOther && takenBy && (
                    <span className="text-[9px] text-white/40">{takenBy.name}</span>
                  )}
                  {isMyPick && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ether flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <motion.button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-sm uppercase tracking-widest border border-border/50 text-white/70 hover:text-white transition-all"
            style={{ background: 'hsl(var(--card) / 0.7)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLeave}
          >
            <ArrowLeft className="w-4 h-4" />
            Quitter
          </motion.button>

          {myPlayer?.divinity && (
            <motion.button
              className={`px-6 py-2.5 rounded-xl font-display text-sm font-bold uppercase tracking-widest transition-all ${
                myPlayer.ready
                  ? 'border-2 border-emerald-500 text-emerald-400'
                  : 'text-white'
              }`}
              style={{
                background: myPlayer.ready
                  ? 'hsl(var(--card) / 0.8)'
                  : 'linear-gradient(135deg, hsl(160 50% 40%), hsl(160 50% 30%))',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleReady}
            >
              {myPlayer.ready ? '✓ Prêt !' : 'Je suis prêt'}
            </motion.button>
          )}

          {isHost && allReady && (
            <motion.button
              className="px-8 py-2.5 rounded-xl font-display text-sm font-bold uppercase tracking-widest text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
                boxShadow: '0 0 30px hsl(var(--ether) / 0.4)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px hsl(var(--ether) / 0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartGame}
            >
              <Crown className="w-5 h-5 inline mr-2" />
              Lancer la partie
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LobbyScreen;
