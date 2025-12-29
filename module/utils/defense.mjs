/**
 * Executes a Defense Roll (Melee, Ranged, or Dodge).
 * * @param {object} actor - The actor performing the roll.
 * @param {object} weapon - The selected weapon item.
 * @param {string} type - The type of defense: 'melee', 'ranged', or 'dodge'.
 * @param {object} [ability=null] - The optional ability item (used only for 'melee' defense).
 */
export async function defenseRoll(actor, weapon, ability = null) {
  if (!actor || !weapon || !ability) {
    return ui.notifications.error(
      "Missing actor, weapon, or ability for roll."
    );
  }
  const type = ability.system.type;

  // --- 1. SETUP VARIABLES BASED ON DEFENSE TYPE ---
  let combatSkill,
    defenseBonus,
    critDefenseBonus,
    doctrineBonusKey,
    deflectFlagKey,
    staminaCost = 0;
  let rollName = "";

  // Determine the base skill and modifiers
  switch (type) {
    case "melee":
      rollName = ability ? ability.name : "Melee Defense";
      // Base defense is weapon defense + ability defense
      defenseBonus =
        (weapon.system.defense || 0) + (ability?.system.defense || 0);
      console.log(ability?.system.defense);
      critDefenseBonus =
        (weapon.system.critDefense || 0) + (ability?.system.critDefense || 0);
      combatSkill = actor.system.combatSkills.meleeDefense;
      // Melee defense has its own doctrine bonus key (assuming the existing function provides it)
      doctrineBonusKey = "doctrineDefenseBonus";
      deflectFlagKey = "defenseDeflect";
      break;

    case "ranged":
      rollName = "Ranged Defense";
      defenseBonus =
        (weapon.system.rangedDefense || 0) +
        (ability?.system.rangedDefense || 0);
      critDefenseBonus = 0;
      combatSkill = actor.system.combatSkills.rangedDefense;
      doctrineBonusKey = "doctrineRangedDefenseBonus";
      deflectFlagKey = "defenseDeflect";
      break;

    case "dodge":
      rollName = "Dodge";
      defenseBonus = 0 + (ability?.system.dodge || 0);
      critDefenseBonus = weapon.system.critDodge || 0;
      combatSkill = actor.system.combatSkills.dodge;
      deflectFlagKey = "dodgeDeflect";
      staminaCost = 4;
      break;

    default:
      return ui.notifications.error(`Invalid defense type: ${type}`);
  }

  // --- 2. GET DOCTRINE BONUSES (If applicable) ---
  // NOTE: This assumes getDoctrineBonuses returns ALL doctrine bonuses, and we extract what we need.
  let doctrineBonuses = {
    doctrineCritDefenseBonus: 0,
    doctrineDefenseBonus: 0,
    doctrineRangedDefenseBonus: 0,
  };
  if (game.tos?.getDoctrineBonuses) {
    doctrineBonuses = await game.tos.getDoctrineBonuses(actor, weapon);
  }

  const doctrineDefenseModifier = doctrineBonuses[doctrineBonusKey] || 0;
  const doctrineCritModifier = doctrineBonuses.doctrineCritDefenseBonus || 0; // Crit bonus seems to be shared

  // --- 3. DEDUCT COST (Only for Dodge) ---
  if (staminaCost > 0) {
    let stamina = actor.system.stats.stamina.value ?? 0;
    if (stamina < staminaCost) {
      ui.notifications.warn("Not enough stamina for Dodge!");
      return;
    }
    let newStamina = Math.max(0, stamina - staminaCost);
    await actor.update({ "system.stats.stamina.value": newStamina });
    ui.notifications.info(
      `${rollName} used ${staminaCost} Stamina. Remaining: ${newStamina}`
    );
  }

  // --- 4. CRITICAL THRESHOLDS ---
  let criticalSuccessThreshold =
    combatSkill.criticalSuccessThreshold +
    critDefenseBonus +
    doctrineCritModifier;
  let criticalFailureThreshold = combatSkill.criticalFailureThreshold;

  console.log(
    "Crit thresholds for",
    actor.name,
    "Success",
    criticalSuccessThreshold,
    "Fail",
    criticalFailureThreshold
  );

  // --- 5. ROLL DATA AND FORMULA ---

  // We combine all applicable additive bonuses into a single roll data key for clean formula string substitution
  const totalRollBonus = defenseBonus + doctrineDefenseModifier;

  // NOTE: The Ranged Defense formula in your code was different:
  // Ranged: @combatSkills.rangedDefense.rating - 1d100 + ${doctrineRangedDefenseBonus}
  // Melee: @combatSkills.meleeDefense.rating + @finalDefenseBonus + ${doctrineDefenseBonus} - 1d100
  // Dodge: @combatSkills.dodge.rating + @weaponDodge - 1d100

  // We must respect the unique formulas.
  let defenseRollFormula;

  const rollData = {
    combatSkills: actor.system.combatSkills,
    totalRollBonus: totalRollBonus, // Used for Melee, potentially Dodge
    weaponDodge: weapon.system.dodge || 0, // Assuming weapon.system.dodge is the correct key for Dodge bonus
    str: actor.system.attributes.str.value,
    dex: actor.system.attributes.dex.value,
    per: actor.system.attributes.per.value,
  };

  if (type === "ranged") {
    defenseRollFormula = `@combatSkills.rangedDefense.rating + @totalRollBonus - 1d100`;
  } else if (type === "dodge") {
    // Assuming your provided formula uses @weaponDodge from the rollData for the bonus
    defenseRollFormula = `@combatSkills.dodge.rating + @weaponDodge - 1d100`;
  } else {
    // 'melee'
    // Melee uses the combined bonus (weapon.defense + ability.defense) and the doctrine bonus
    defenseRollFormula = `@combatSkills.meleeDefense.rating + @totalRollBonus - 1d100`;
  }

  const defenseRoll = new Roll(defenseRollFormula, rollData);
  await defenseRoll.evaluate();
  const rollResult = defenseRoll.dice[0].results[0].result;

  // --- 6. ROLL RESULT ANALYSIS (Deflect) ---
  const critSuccess = rollResult <= criticalSuccessThreshold;
  const critFailure = rollResult >= criticalFailureThreshold;

  let deflectChance = 0;
  if (actor.system[deflectFlagKey]) {
    deflectChance = criticalSuccessThreshold * 2;
  }
  const deflect = (!critSuccess && rollResult <= deflectChance) || 0;

  // --- 7. ARMOR AND CHAT MESSAGE CONSTRUCTION ---
  const armor = actor.system.armor.total;
  const acidArmor = actor.system.armor.acidArmor;
  const fireArmor = actor.system.armor.fireArmor;
  const frostArmor = actor.system.armor.frostArmor;
  const lightningArmor = actor.system.armor.lightningArmor;

  let armorText = `
        <table style="width: 100%; text-align: center; font-size: 15px;">
        <tr>
          <th>Type</th>
          <th>Value</th>
        </tr>
    `;

  // Add rows for each armor type if the value is greater than 0
  if (armor >= 0) armorText += `<tr><td>Armor</td><td>${armor}</td></tr>`;
  if (acidArmor > 0)
    armorText += `<tr><td>Acid Armor</td><td>${acidArmor}</td></tr>`;
  if (fireArmor > 0)
    armorText += `<tr><td>Fire Armor</td><td>${fireArmor}</td></tr>`;
  if (frostArmor > 0)
    armorText += `<tr><td>Frost Armor</td><td>${frostArmor}</td></tr>`;
  if (lightningArmor > 0)
    armorText += `<tr><td>Lightning Armor</td><td>${lightningArmor}</td></tr>`;

  // Use the determined deflect flag
  if (actor.system[deflectFlagKey]) {
    armorText += `<tr><td>Deflect Chance</td><td>${deflectChance}</td></tr>`;
  }
  armorText += `</table>`;

  // Ability Description Block (ONLY for Melee Defense Abilities)
  let abilityChatMessage = "";
  if (type === "melee" && ability) {
    const abilityDescription =
      ability.system.description || "No description provided.";
    abilityChatMessage = `
        <div style="font-size: 14px; margin-bottom: 8px; padding: 5px; background: rgba(0,0,0,0.05); border: 1px solid #ccc; border-radius: 3px;">
            ${abilityDescription}
        </div>`;
  }

  // Send the chat message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    rolls: [defenseRoll],
    flavor: `
<div style="display:flex; align-items:center; justify-content:left; gap:8px; font-size:1.3em; font-weight:bold;">
  <img src="${ability?.img || weapon.img}" title="${
      ability?.name || weapon.name
    }" width="36" height="36">
  <span>${rollName}</span>
</div>
    ${abilityChatMessage}
    <p style="text-align: center; font-size: 20px;"><b>
      ${
        deflect && actor.system[deflectFlagKey]
          ? "Deflect"
          : critSuccess
          ? "Critical Success!"
          : critFailure
          ? "Critical Failure!"
          : ""
      }
    </b></p>
    ${armorText}
    <hr>
    `,
    flags: {
      tos: {
        rollName,
        criticalSuccessThreshold, // Store critical success threshold
        criticalFailureThreshold, // Store critical failure threshold
      },
    },
  });
}
