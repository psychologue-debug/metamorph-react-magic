import { useState } from 'react';
import { DivinityId, DIVINITIES } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Crown, Check } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

interface GodSelectionScreenProps {
  playerCount: number;
  onStartGame: (selectedGods: DivinityId[], playerNames: string[]) => void;
  onBack: () => void;
}

const ALL_GODS: DivinityId[] = ['apollon', 'venus', 'bacchus', 'minerve', 'diane', 'neptune', 'ceres'];

const GodSelectionScreen = ({ playerCount, onStartGame, onBack }: GodSelectionScreenProps) => {
  // In solo test mode, each "player" picks sequentially
  const [selections, setSelections] = useState<DivinityId[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(playerCount).fill(''));
  const currentPickingPlayer = selections.length; // 0-indexed
  const allPicked = selections.length >= playerCount;

  const handleSelectGod = (godId: DivinityId) => {
    if (selections.includes(godId)) return;
    if (allPicked) return;
    setSelections((prev) => [...prev, godId]);
  };

  const handleUndo = () => {
    setSelections((prev) => prev.slice(0, -1));
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <motion.div
        className="relative z-10 text-center max-w-5xl px-6 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Scroll className="w-8 h-8 text-ether mx-auto mb-2" />
        <h1 className="font-display text-3xl font-bold text-white tracking-wider mb-1">CHOIX DES DIVINITÉS</h1>
        <div className="w-20 h-0.5 mx-auto mb-3" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--ether)), transparent)' }} />

        {!allPicked ? (
          <p className="font-body text-lg text-white/80 mb-6">
            <span className="text-ether font-bold">Joueur {currentPickingPlayer + 1}</span>, choisissez votre divinité
          </p>
        ) : (
          <p className="font-body text-lg text-emerald-400 mb-6 font-bold">
            Tous les dieux sont choisis !
          </p>
        )}

        {/* God grid */}
        <div className="grid grid-cols-7 gap-3 mb-8">
          {ALL_GODS.map((godId) => {
            const god = DIVINITIES[godId];
            const pickedByIndex = selections.indexOf(godId);
            const isPicked = pickedByIndex !== -1;
            const isCurrentPick = pickedByIndex === currentPickingPlayer - 1; // last picked

            return (
              <motion.button
                key={godId}
                className={`relative rounded-xl p-4 border-2 transition-all flex flex-col items-center gap-2 ${
                  isPicked
                    ? 'border-white/20 opacity-40 cursor-not-allowed'
                    : 'border-border/50 hover:border-ether/60 cursor-pointer'
                }`}
                style={{
                  background: isPicked
                    ? 'hsl(0 0% 20% / 0.7)'
                    : `linear-gradient(180deg, hsl(${god.color} / 0.3), hsl(var(--card) / 0.9))`,
                }}
                whileHover={!isPicked ? { scale: 1.05, y: -4 } : {}}
                whileTap={!isPicked ? { scale: 0.97 } : {}}
                onClick={() => handleSelectGod(godId)}
                disabled={isPicked || allPicked}
              >
                {/* God avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold text-white border-2"
                  style={{
                    background: `linear-gradient(135deg, hsl(${god.color}), hsl(${god.color} / 0.6))`,
                    borderColor: isPicked ? 'transparent' : `hsl(${god.color})`,
                  }}
                >
                  {isPicked ? <Check className="w-7 h-7" /> : god.name.charAt(0)}
                </div>

                <span className="font-display text-sm font-bold text-white tracking-wide">{god.name}</span>
                <span className="font-body text-xs text-white/60 italic">{god.title}</span>

                {/* Player badge */}
                {isPicked && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ether flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <span className="text-xs font-bold text-white">J{pickedByIndex + 1}</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selection summary */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: playerCount }, (_, i) => {
            const godId = selections[i];
            const god = godId ? DIVINITIES[godId] : null;
            return (
              <div
                key={i}
                className={`px-4 py-2 rounded-lg border font-display text-sm ${
                  god
                    ? 'border-ether/50 text-white'
                    : i === currentPickingPlayer
                    ? 'border-ether/40 text-ether animate-pulse'
                    : 'border-border/30 text-white/30'
                }`}
                style={{
                  background: god
                    ? `hsl(${DIVINITIES[godId!].color} / 0.3)`
                    : 'hsl(var(--card) / 0.5)',
                }}
              >
                <span className="text-xs text-white/50">J{i + 1}:</span>{' '}
                {god ? god.name : '...'}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <motion.button
            className="px-6 py-3 rounded-xl font-display text-sm uppercase tracking-widest border border-border/50 text-white/70 hover:text-white hover:border-white/40 transition-all"
            style={{ background: 'hsl(var(--card) / 0.7)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={selections.length > 0 ? handleUndo : onBack}
          >
            {selections.length > 0 ? 'Annuler dernier choix' : 'Retour'}
          </motion.button>

          {allPicked && (
            <motion.button
              className="px-8 py-3 rounded-xl font-display text-sm font-bold uppercase tracking-widest text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--ether)), hsl(var(--ether-dim)))',
                boxShadow: '0 0 30px hsl(var(--ether) / 0.4)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px hsl(var(--ether) / 0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartGame(selections)}
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

export default GodSelectionScreen;
