(async () => {
  // --- 1. Token Selection and Initial Checks ---
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }
  const actor = selectedToken.actor;

  // --- 2. School/Spell Selection Dialog ---
  // This function returns the selected spell when the user clicks it.
  const spell = await game.tos.showSpellSelectionDialogs(actor);

  // If the user closed the dialog without selecting, stop.
  if (!spell) {
    ui.notifications.info("Spell casting canceled.");
    return;
  }

  // --- 3. Mana Deduction ---
  const manaDeducted = await game.tos.deductMana(actor, spell);
  if (!manaDeducted) {
    return; // Stop if mana check failed.
  }

  // --- 4. Bonus Calculation (Scalable) ---
  const bonuses = game.tos.calculateAttackBonuses(actor, spell);

  // --- 5. Attack Roll ---
  const attackResults = await game.tos.performAttackRoll(
    actor,
    spell,
    bonuses.attackBonus
  );

  // --- 6. Finalization (Damage, Crit Score, Effects, Chat Post) ---
  // This final function takes all the results and posts the message.
  await game.tos.finalizeRollsAndPostChat(actor, spell, bonuses, attackResults);

  console.log(`Successfully cast and posted results for: ${spell.name}`);
})();
