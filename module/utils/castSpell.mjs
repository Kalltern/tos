export async function castSpell() {
  // --- 1. Token Selection and Initial Checks ---
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;

  // --- 2. School / Spell Selection ---
  // Returns the selected spell or null if canceled
  const spell = await game.tos.showSpellSelectionDialogs(actor);
  if (!spell) {
    ui.notifications.info("Spell casting canceled.");
    return;
  }

  // --- 3. Mana Deduction ---
  const manaDeducted = await game.tos.deductMana(actor, spell);
  if (!manaDeducted) {
    return;
  }

  // --- 4. Bonus Calculation (Scalable) ---
  const bonuses = game.tos.calculateAttackBonuses(actor, spell);

  // --- 5. Attack Roll ---
  const attackResults = await game.tos.performAttackRoll(
    actor,
    spell,
    bonuses.attackBonus
  );

  // --- 6. Finalization ---
  await game.tos.finalizeRollsAndPostChat(actor, spell, bonuses, attackResults);
}
