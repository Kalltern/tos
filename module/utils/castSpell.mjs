export async function castSpell() {
  const context = game.tos.selectToken({ notifyFallback: true });
  if (!context) return;

  const { actor, token } = context;
  const result = await game.tos.showSpellSelectionDialogs(actor);
  if (!result) {
    ui.notifications.info("Spell casting canceled.");
    return;
  }

  const { spell, freeCast, focusSpent, ignoreChanneling, maintainChanneling } =
    result;

  if (!freeCast) {
    const ok = await game.tos.deductMana(actor, spell);
    if (!ok) return;
  }

  const bonuses = game.tos.calculateAttackBonuses(actor, spell);

  const attackResults = await game.tos.performAttackRoll(
    actor,
    spell,
    bonuses.attackBonus,
    focusSpent,
    { ignoreChanneling },
  );

  await game.tos.finalizeRollsAndPostChat(
    actor,
    spell,
    bonuses,
    attackResults,
    {
      focusSpent,
      ignoreChanneling,
      maintainChanneling,
      freeCast,
    },
  );
}
