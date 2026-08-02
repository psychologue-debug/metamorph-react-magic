import { Player, GameState, DIVINITIES, SpellCard, Mortal } from '@/types/game';
import { InteractionMode, canPlayCard } from '@/hooks/useGameLogic';
import { getEffectiveCardCost, getEffectiveMetamorphosisCost } from '@/engine/costModifiers';
import { hasActivatedEffect, getActivatedEffect } from '@/engine/activatedEffects';
import EtherCounter from './EtherCounter';
import MortalTooltip from './MortalTooltip';
import PortalTooltip from './PortalTooltip';
import ActionBubble, { BubbleAction } from './ActionBubble';
import CeresLayout from './CeresLayout';
import VenusLayout from './VenusLayout';
import ApollonLayout from './ApollonLayout';
import NeptuneLayout from './NeptuneLayout';
import MinerveLayout from './MinerveLayout';
import DianeLayout from './DianeLayout';
import BacchusLayout from './BacchusLayout';
import GameCard from './GameCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sword, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface OwnPlayerBoardProps {
  player: Player;
  gameState: GameState;
  interactionMode: InteractionMode;
  onDiscardReaction?: (cardId: string) => void;
  onTargetMortalClick?: (mortalId: string) => void;
  /** When set, only these mortal IDs are clickable; the others are visually grayed. */
  eligibleMortalIds?: Set<string>;
  /** Optional banner shown above the board (e.g. inline targeting prompt). */
  targetingBanner?: string | null;
  /** True when it is the local player's turn (actions allowed). */
  isOwnTurn?: boolean;
  /** True when a reaction window is open — all normal actions are locked. */
  actionsLocked?: boolean;
  onRequestMetamorphoseMortal?: (mortalId: string) => void;
  onRequestActivateMortal?: (mortalId: string) => void;
  onRequestPlaySpell?: (cardId: string) => void;
  onRequestPlaceReaction?: (cardId: string) => void;
}

type MenuState =
  | { kind: 'mortal'; mortal: Mortal; x: number; y: number }
  | { kind: 'card'; card: SpellCard; x: number; y: number }
  | null;

const OwnPlayerBoard = ({
  player,
  gameState,
  interactionMode,
  onDiscardReaction,
  onTargetMortalClick,
  eligibleMortalIds,
  targetingBanner,
  isOwnTurn = false,
  actionsLocked = false,
  onRequestMetamorphoseMortal,
  onRequestActivateMortal,
  onRequestPlaySpell,
  onRequestPlaceReaction,
}: OwnPlayerBoardProps) => {
  const divinity = DIVINITIES[player.divinity];
  const [reactionToManage, setReactionToManage] = useState<SpellCard | null>(null);
  const [hoveredMortal, setHoveredMortal] = useState<Mortal | null>(null);
  const [hoveredSpell, setHoveredSpell] = useState<SpellCard | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [menu, setMenu] = useState<MenuState>(null);

  const blockedReason = actionsLocked
    ? 'Fenêtre de réaction en cours'
    : !isOwnTurn
    ? "Ce n'est pas votre tour"
    : null;

  /** Build the legal actions for a mortal of the local player. */
  const buildMortalActions = (mortal: Mortal): BubbleAction[] => {
    const actions: BubbleAction[] = [];
    const isRetired = mortal.status === 'retired';
    const isIncap = mortal.status === 'incapacite';

    if (!mortal.isMetamorphosed) {
      const cost = getEffectiveMetamorphosisCost(mortal, player, gameState);
      let reason: string | null = blockedReason;
      if (!reason && isRetired) reason = 'Ce mortel est retiré du jeu';
      else if (!reason && isIncap) reason = 'Ce mortel est en Torpeur';
      else if (!reason && player.cannotMetamorphose) reason = 'Métamorphose interdite ce tour';
      else if (!reason && player.metamorphosesThisTurn >= player.maxMetamorphosesThisTurn)
        reason = 'Métamorphose déjà effectuée ce tour';
      else if (!reason && player.ether < cost) reason = `Éther insuffisant (${player.ether}/${cost})`;

      actions.push({
        key: 'metamorphose',
        label: `Métamorphoser — ${cost} Éther`,
        hint: `${mortal.nameRecto} → ${mortal.nameVerso}`,
        disabled: !!reason,
        reason: reason || undefined,
        onClick: () => onRequestMetamorphoseMortal?.(mortal.id),
      });
      return actions;
    }

    // Metamorphosed mortal → possible activated ability
    if (hasActivatedEffect(mortal)) {
      const result = getActivatedEffect(mortal, player, gameState);
      let reason: string | null = blockedReason;
      if (!reason && isRetired) reason = 'Ce mortel est retiré du jeu';
      else if (!reason && isIncap) reason = 'Ce mortel est en Torpeur';
      else if (!reason && (!result || result.type === 'error'))
        reason = result?.errorMessage || 'Effet indisponible';

      actions.push({
        key: 'activate',
        label: 'Activer le mortel',
        hint: mortal.effectPermanent || mortal.effectOnMetamorphose || undefined,
        disabled: !!reason,
        reason: reason || undefined,
        onClick: () => onRequestActivateMortal?.(mortal.id),
      });
    }
    return actions;
  };

  const buildCardActions = (card: SpellCard): BubbleAction[] => {
    const actions: BubbleAction[] = [];
    if (card.type === 'reaction') {
      let reason: string | null = blockedReason;
      if (!reason && player.reactions.length >= 2) reason = 'Maximum 2 Réactions posées';
      actions.push({
        key: 'place',
        label: 'Poser face cachée',
        hint: `Coût à l'activation : ${card.cost} Éther`,
        disabled: !!reason,
        reason: reason || undefined,
        onClick: () => onRequestPlaceReaction?.(card.id),
      });
      return actions;
    }

    const cost = getEffectiveCardCost(card, player);
    let reason: string | null = blockedReason;
    if (!reason && player.ether < cost) reason = `Éther insuffisant (${player.ether}/${cost})`;
    else if (!reason && !canPlayCard(card, player, gameState))
      reason = card.activationCondition ? `Condition non remplie : ${card.activationCondition}` : 'Conditions non remplies';

    actions.push({
      key: 'play',
      label: `Jouer le sortilège — ${cost} Éther`,
      hint: card.description,
      disabled: !!reason,
      reason: reason || undefined,
      onClick: () => onRequestPlaySpell?.(card.id),
    });
    return actions;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Player info header */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b shrink-0" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div
          className="w-8 h-10 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center border-2 overflow-hidden shrink-0"
          style={{
            borderColor: `hsl(${divinity.color})`,
            background: `linear-gradient(135deg, hsl(${divinity.color} / 0.2), hsl(var(--card)))`,
          }}
        >
          {divinity.image ? (
            <img src={divinity.image} alt={divinity.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-sm sm:text-lg font-bold text-foreground">{player.avatar}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base sm:text-xl font-bold text-foreground truncate">{player.name}</h2>
        </div>
        <EtherCounter amount={player.ether} size="sm" />
        <div className="flex items-center gap-1">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-ether" />
          <span className="font-display text-sm sm:text-lg font-bold text-foreground">{player.metamorphosedCount}/10</span>
        </div>
      </div>

      {/* Inline targeting banner (for non-modal effects like BAC-02 metamorphose_extra) */}
      {targetingBanner && (
        <div className="px-2 sm:px-3 py-1 sm:py-2 text-center font-display text-xs sm:text-base font-semibold shrink-0"
          style={{ background: 'hsl(var(--ether) / 0.15)', color: 'hsl(var(--ether))' }}>
          🐬 {targetingBanner}
        </div>
      )}

      {/* Mortals grid + tooltip zone */}
      <div
        className="flex-1 relative overflow-hidden"
        onMouseEnter={() => setHoveredSpell(null)}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/textures/marble-white.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {(() => {
            const handleMortalTokenClick = (mortalId: string) => {
              // Targeting has priority over the contextual action bubble
              if (onTargetMortalClick) {
                if (eligibleMortalIds && !eligibleMortalIds.has(mortalId)) return;
                onTargetMortalClick(mortalId);
                return;
              }
              const mortal = player.mortals.find((m) => m.id === mortalId);
              if (!mortal) return;
              setMenu({ kind: 'mortal', mortal, x: mousePos.x, y: mousePos.y });
            };

            const layoutProps = {
              mortals: player.mortals,
              owner: player,
              gameState: gameState,
              selectable: true,
              onMortalClick: handleMortalTokenClick,
              onMortalHover: setHoveredMortal,
            };
            const layouts: Record<string, React.FC<any>> = {
              ceres: CeresLayout, venus: VenusLayout, apollon: ApollonLayout,
              neptune: NeptuneLayout, minerve: MinerveLayout, diane: DianeLayout, bacchus: BacchusLayout,
            };
            const Layout = layouts[player.divinity] || CeresLayout;
            return <Layout {...layoutProps} />;
          })()}

          {/* Overlay: subtle tint when an eligibility set is provided */}
          {eligibleMortalIds && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{ background: 'hsl(var(--background) / 0.05)' }} />
            </div>
          )}
        </div>

        {/* Tooltip rendered in a portal so it's never clipped and always on top */}
        {hoveredMortal && !menu && (
          <PortalTooltip x={mousePos.x} y={mousePos.y}>
            <MortalTooltip mortal={hoveredMortal} owner={player} gameState={gameState} />
          </PortalTooltip>
        )}
      </div>

      {/* Hand + Reactions row */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-t shrink-0 relative" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
        <div className="flex items-start gap-2 sm:gap-4">
          {/* Hand */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
              <Sword className="w-3 h-3 sm:w-4 sm:h-4" /> Main ({player.hand.length}/2)
              <span className="ml-1 hidden sm:inline normal-case tracking-normal">— cliquez une carte pour agir</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {player.hand.map((card) => (
                <div
                  key={card.id}
                  className="relative transition-all rounded-lg hover:ring-1 hover:ring-divine/50"
                  onMouseEnter={() => setHoveredSpell(card)}
                  onMouseLeave={() => setHoveredSpell(null)}
                  onClick={(e) => {
                    setHoveredSpell(null);
                    setMenu({ kind: 'card', card, x: e.clientX, y: e.clientY });
                  }}
                >
                  <GameCard
                    card={card}
                    effectiveCost={getEffectiveCardCost(card, player)}
                    small
                    onClick={() => {}}
                  />
                </div>
              ))}
              {player.hand.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Vide</p>
              )}
            </div>
          </div>

          {/* Reactions */}
          <div className="shrink-0 relative">
            <div className="text-xs sm:text-sm text-muted-foreground font-display mb-1 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-reaction" /> <span className="hidden sm:inline">Réactions</span> ({player.reactions.length}/2)
            </div>
            <div className="flex gap-2">
              {player.reactions.map((card) => (
                <div key={card.id} className="relative">
                  <GameCard
                    card={card}
                    faceDown
                    small
                    onClick={() => setReactionToManage(card)}
                  />
                </div>
              ))}
              {player.reactions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">—</p>
              )}
            </div>

            <AnimatePresence>
              {reactionToManage && (
                <motion.div
                  className="absolute bottom-full right-0 mb-4 z-[99999] rounded-xl p-4 shadow-2xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', minWidth: '200px' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="font-display text-base font-bold text-foreground mb-1">{reactionToManage.name}</div>
                  <div className="text-sm font-display font-bold text-ether mb-1">Coût : {reactionToManage.cost} ⚡</div>
                  <div className="text-sm text-muted-foreground mb-3">{reactionToManage.description}</div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-1.5 rounded-lg font-display text-sm font-bold text-foreground border border-destructive/50 hover:bg-destructive/20 transition-colors"
                      onClick={() => { onDiscardReaction?.(reactionToManage.id); setReactionToManage(null); }}
                    >
                      Défausser
                    </button>
                    <button
                      className="flex-1 px-3 py-1.5 rounded-lg font-display text-sm font-bold text-foreground border border-border/50 hover:bg-secondary/50 transition-colors"
                      onClick={() => setReactionToManage(null)}
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed spell tooltip — top-right of hand section, above hand bar */}
        <AnimatePresence>
          {hoveredSpell && !hoveredMortal && !menu && (
            <div className="absolute bottom-full right-2 mb-2 z-[99999] pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl px-4 py-3 shadow-2xl"
                style={{
                  minWidth: '260px',
                  maxWidth: '340px',
                  background: 'hsl(var(--card))',
                  border: `1px solid hsl(var(--${hoveredSpell.type === 'reaction' ? 'reaction' : 'divine'}) / 0.5)`,
                  boxShadow: `0 0 20px hsl(var(--${hoveredSpell.type === 'reaction' ? 'reaction' : 'divine'}) / 0.2)`,
                }}
              >
                <div className="font-display text-lg font-bold text-foreground mb-1">{hoveredSpell.name}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-display text-ether font-bold">{getEffectiveCardCost(hoveredSpell, player)} Éther</span>
                  <span className="text-sm text-muted-foreground uppercase">{hoveredSpell.type === 'reaction' ? 'Réaction' : 'Sortilège'}</span>
                </div>
                <p className="text-base text-foreground leading-relaxed">{hoveredSpell.description}</p>
                {hoveredSpell.activationCondition && (
                  <p className="text-sm mt-1.5 italic" style={{ color: 'hsl(30 80% 60%)' }}>Condition : {hoveredSpell.activationCondition}</p>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Contextual action bubble */}
      {menu && menu.kind === 'mortal' && (
        <ActionBubble
          x={menu.x}
          y={menu.y}
          title={menu.mortal.isMetamorphosed ? menu.mortal.nameVerso : menu.mortal.nameRecto}
          subtitle={menu.mortal.isMetamorphosed ? 'Mortel métamorphosé' : 'Mortel'}
          actions={buildMortalActions(menu.mortal)}
          emptyMessage={
            menu.mortal.isMetamorphosed
              ? "Ce mortel n'a pas d'effet activable."
              : 'Aucune action possible sur ce mortel.'
          }
          onClose={() => setMenu(null)}
        />
      )}
      {menu && menu.kind === 'card' && (
        <ActionBubble
          x={menu.x}
          y={menu.y}
          title={menu.card.name}
          subtitle={menu.card.type === 'reaction' ? 'Réaction' : 'Sortilège'}
          actions={buildCardActions(menu.card)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
};

export default OwnPlayerBoard;
