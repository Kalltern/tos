// --- Helper for Dialogs (CSS Injection) ---
function _injectDialogCSS() {
  const css = `
        /* General Dialog styling */
        .spell-dialog .window-content {
            max-width: 400px; /* Increased max width for tabs */
            width: 100%;
        }
        .spell-dialog .window{
            width: auto;
        }

        /* List and selection styling */
        .spell-choice {
            position: relative;
            font-size: 16px;
            color: black;
            cursor: pointer;
            padding: 5px; 
            border-bottom: 1px solid #ccc;
        }
        .spell-choice:hover {
            color: black;
            text-shadow: 0 0 1px #888, 0 0 2px #888;
            background-color: #f0f0f0;
        }

        /* New Tabs styling */
        .spell-tabs { 
            border: 1px solid #7a7971; 
            border-radius: 4px;
            margin-top: 5px;
            background-color: #fff;
        }
        .tab-headers { 
            display: flex; 
            background: rgba(0, 0, 0, 0.1); 
            border-bottom: 1px solid #7a7971; 
            flex-wrap: wrap; /* Allow tabs to wrap if there are many */
        }
        .tab-headers .tab-item {
            flex-grow: 1;
            text-align: center;
            padding: 5px 8px;
            cursor: pointer;
            border-right: 1px solid #7a7971;
            font-weight: bold;
            font-size: 13px; /* Slightly smaller font for multiple tabs */
            min-width: 20%;
        }
        .tab-headers .tab-item:last-child {
            border-right: none;
        }
        .tab-headers .tab-item.active {
            background: #4a4944;
            color: white;
            text-shadow: none;
        }
        .tab-content {
            padding: 5px;
            max-height: 40vh; /* Limit height for scrollability */
            overflow-y: auto;
        }
        .tab-pane {
            display: none;
        }
        .tab-pane.active {
            display: block;
        }
    `;

  // Prevent re-injection if already present
  if (!document.getElementById("macro-spell-css")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "macro-spell-css";
    styleSheet.type = "text/css";
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);
  }
}

// --- 1. Spell/School Selection Dialog Flow ---

/**
 * Gathers all unique spell schools from the actor's owned spells.
 * @param {object} actor - The Foundry actor object.
 * @returns {Set<string>} - A Set of unique spell school names (e.g., {'earth', 'fire'}).
 */
export function getUniqueSpellSchools(actor) {
  const spellSchools = new Set();
  // Assuming spell school is stored in spell.system.type
  actor.items
    .filter((i) => i.type === "spell")
    .forEach((spell) => {
      if (spell.system.type) {
        spellSchools.add(spell.system.type);
      }
    });
  return spellSchools;
}

/**
 * Handles the complete dialog flow: School Selection -> Spell Selection (with Ranks/Tabs).
 * @param {object} actor - The Foundry actor object.
 * @returns {Promise<object | null>} - A promise that resolves with the selected spell item, or null if canceled.
 */
export function showSpellSelectionDialogs(actor) {
  _injectDialogCSS();
  const schools = Array.from(getUniqueSpellSchools(actor));

  if (schools.length === 0) {
    ui.notifications.warn("This actor has no spells with defined schools.");
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    // --- Inner function to show the second (spell) dialog with Ranks as Tabs ---
    const showSpellDialog = (schoolName, schoolDialog) => {
      if (schoolDialog) schoolDialog.close();

      const allSpells = actor.items.filter(
        (i) => i.type === "spell" && i.system.type === schoolName
      );

      // Define Ranks (now lowercase) and Group Spells
      const RANK_ORDER = [
        "wild",
        "apprentice",
        "expert",
        "master",
        "grandmaster",
      ];
      const spellsByRank = {};

      // Initialize groups (to ensure order) and populate
      RANK_ORDER.forEach((rank) => (spellsByRank[rank] = []));
      allSpells.forEach((spell) => {
        // Ensure rank is lowercase and default to 'wild'
        const rank = (spell.system.rank || "wild").toLowerCase();
        if (RANK_ORDER.includes(rank)) {
          spellsByRank[rank].push(spell);
        } else {
          // Put unlisted ranks in 'wild' as a fallback
          spellsByRank["wild"].push(spell);
        }
      });

      // --- Generate Tab HTML ---
      let tabHeadersHtml = "";
      let tabContentHtml = "";

      RANK_ORDER.forEach((rank) => {
        const spells = spellsByRank[rank];
        if (spells && spells.length > 0) {
          const tabId = rank;

          // Tab Header (Capitalize the rank name for display)
          tabHeadersHtml += `<div class="tab-item" data-tab="${tabId}">
                        ${rank.charAt(0).toUpperCase() + rank.slice(1)} (${
            spells.length
          })
                    </div>`;

          // Tab Content (List of spells)
          const spellListHtml = spells
            .map(
              (spell) =>
                `<li class="spell-choice" data-spell-id="${spell.id}">${spell.name}</li>`
            )
            .join("");

          tabContentHtml += `
                        <div class="tab-pane" data-tab="${tabId}">
                            <ul style="list-style: none; padding: 0;">
                                ${spellListHtml}
                            </ul>
                        </div>
                    `;
        }
      });

      if (!tabHeadersHtml) {
        ui.notifications.warn(
          `No spells found in the selected school: ${schoolName}`
        );
        return;
      }

      const dialogContent = `
                <div class="spell-tabs">
                    <div class="tab-headers">${tabHeadersHtml}</div>
                    <div class="tab-content">${tabContentHtml}</div>
                </div>
            `;

      const spellDialog = new Dialog({
        title: `Select ${schoolName} Spell`,
        content: dialogContent,
        buttons: {},
        render: (html) => {
          // 1. Activate initial tab
          const firstTab = html.find(".tab-item").first();
          firstTab.addClass("active");
          html
            .find(`.tab-pane[data-tab="${firstTab.data("tab")}"]`)
            .addClass("active");

          // 2. Handle tab switching
          html.find(".tab-item").click(function () {
            const tab = $(this).data("tab");
            html.find(".tab-item").removeClass("active");
            $(this).addClass("active");
            html.find(".tab-pane").removeClass("active");
            html.find(`.tab-pane[data-tab="${tab}"]`).addClass("active");
          });

          // 3. Handle spell selection
          html.find(".spell-choice").click(async (event) => {
            const selectedId = $(event.currentTarget).data("spell-id");
            // Find the spell item object using its ID
            const selectedSpell = allSpells.find((s) => s.id === selectedId);

            spellDialog.close();
            resolve(selectedSpell); // Resolve the promise with the selected spell
          });
        },
        close: () => {
          // If the user closes the dialog, resolve with null
          if (!spellDialog.rendered) resolve(null);
        },
      });
      spellDialog.render(true);
    };

    // --- First Dialog (School Selection - Unchanged) ---
    const schoolDialog = new Dialog({
      title: "Select Spell School",
      content: `<form><fieldset><ul id="school-list" style="list-style: none; padding: 0;">
                ${schools
                  .map(
                    (school) =>
                      `<li class="spell-choice" data-value="${school}">
                        ${school.charAt(0).toUpperCase() + school.slice(1)}
                    </li>`
                  )
                  .join("")}
            </ul></fieldset></form>`,
      buttons: {},
      render: (html) => {
        html.find("#school-list li").click(async (event) => {
          const schoolName = $(event.currentTarget).data("value");
          // Move to the second dialog, passing the first dialog instance to close it
          showSpellDialog(schoolName, schoolDialog);
        });
      },
      close: () => {
        // If the user closes the dialog, resolve with null
        if (!schoolDialog.rendered) resolve(null);
      },
    });
    schoolDialog.render(true);
  });
}

// --- 2. Mana Deduction ---

/**
 * Checks mana cost, deducts it from the actor, and updates the actor sheet.
 * @param {object} actor - The Foundry actor object.
 * @param {object} spell - The selected spell item object.
 * @returns {Promise<boolean>} - True if mana was deducted successfully, false otherwise.
 */
export async function deductMana(actor, spell) {
  const spellCost = spell.system.cost || 0;
  let currentMana = actor.system.stats.mana.value;

  if (currentMana < spellCost) {
    ui.notifications.warn(
      `Not enough mana to cast ${spell.name} (Cost: ${spellCost}).`
    );
    return false;
  }

  currentMana -= spellCost;
  await actor.update({
    "system.stats.mana.value": currentMana,
  });
  return true;
}

// --- 3. Bonus Calculation (Scalable) ---

/**
 * Calculates and aggregates all relevant bonuses for the attack, damage, and effects.
 * This is the central function for making bonuses scalable.
 * NOTE: This function now accepts the spell object to allow for school-based bonuses.
 * @param {object} actor - The Foundry actor object.
 * @param {object} spell - The selected spell item object. (NEW)
 * @returns {object} - An object containing aggregated bonus values.
 */
export function calculateAttackBonuses(actor, spell) {
  let attackBonus = 0;
  let damageBonus = 0;
  let effectModifiers = {};

  // --- Temperament Bonus (Conditional) ---
  const temperamentBonusMap = {
    Melancholic: "earth",
    Choleric: "fire",
    Sanguine: "air",
    Phlegmatic: "water",
    // Add more temperaments and their associated spell schools here
  };

  const spellSchool = spell.system.type; // Get the school of the spell being cast

  // Check if the actor has a matching temperament for the spell's school
  for (const [temperamentName, requiredSchool] of Object.entries(
    temperamentBonusMap
  )) {
    // Find the item by name AND check if the spell's school matches the required school
    if (
      actor.items.find((i) => i.name === temperamentName) &&
      spellSchool === requiredSchool
    ) {
      // Apply +5 bonus to the attack roll formula
      attackBonus += 5;
      break; // Assuming only one temperament bonus applies
    }
  }

  // --- Future Addon Example: "Focus" Trait ---
  // if (actor.items.find(i => i.name === "Focus")) {
  //     // Add +10 to all damage rolls (flat number)
  //     damageBonus += 10;
  //     // Add +10 to the 'stun' effect check
  //     effectModifiers['stun'] = (effectModifiers['stun'] || 0) + 10;
  // }

  // --- Future Addon Example: "Bonus Damage" Field ---
  // damageBonus += actor.system.bonusDamage || 0;

  // Combine actor's base effects modifiers (which are always applied)
  const actorEffects = actor.system.effects || {};
  for (const [key, value] of Object.entries(actorEffects)) {
    if (typeof value === "number" && value !== 0) {
      effectModifiers[key] = (effectModifiers[key] || 0) + value;
    }
  }

  return {
    attackBonus,
    damageBonus,
    effectModifiers,
  };
}

// --- 4. Attack Roll ---

/**
 * Performs the magic attack roll.
 * @param {object} actor - The Foundry actor object.
 * @param {object} spell - The selected spell item object.
 * @param {number} bonus - The calculated total bonus for the attack roll formula.
 * @returns {Promise<{attackRoll: object, critSuccess: boolean, critFailure: boolean}>}
 */
export async function performAttackRoll(actor, spell, bonus) {
  const critSuccessThreshold =
    actor.system.combatSkills.channeling.criticalSuccessThreshold;
  const critFailureThreshold =
    actor.system.combatSkills.channeling.criticalFailureThreshold;

  const attackRollFormula = `@combatSkills.channeling.rating + @difficulty + ${bonus} - 1d100`;

  const rollData = {
    combatSkills: actor.system.combatSkills,
    difficulty: spell.system.difficulty,
    // The bonus is now integrated into the formula string
  };

  const attackRoll = new Roll(attackRollFormula, rollData);
  await attackRoll.evaluate();
  const rollResult = attackRoll.dice[0].results[0].result;

  const critSuccess = rollResult <= critSuccessThreshold;
  const critFailure = rollResult >= critFailureThreshold;

  return {
    attackRoll,
    critSuccess,
    critFailure,
  };
}

// --- 5. Final Roll and Chat Posting (Centralized) ---

/**
 * Performs Damage, Crit Score, and Effect rolls, and posts the final chat message.
 * @param {object} actor - The Foundry actor object.
 * @param {object} spell - The selected spell item object.
 * @param {object} bonuses - The results from calculateAttackBonuses.
 * @param {object} attackResults - The results from performAttackRoll.
 */
export async function finalizeRollsAndPostChat(
  actor,
  spell,
  bonuses,
  attackResults
) {
  const { attackRoll, critSuccess, critFailure } = attackResults;
  const { damageBonus, effectModifiers } = bonuses;

  // --- Roll Data Setup (needed for Damage/Description) ---
  const rollData = {
    combatSkills: actor.system.combatSkills,
    difficulty: spell.system.difficulty,
    int: actor.system.attributes.int.total,
    wil: actor.system.attributes.wil.total,
    spellPower: actor.system.schools[spell.system.type]?.spellPower || 0,
  };

  // --- DAMAGE ROLL ---
  let damageFormula = spell.system.formula || "1d6";
  damageFormula = damageFormula.replace(
    /@(\w+\.\w+\.\w+|\w+)/g,
    (_, key) => rollData[key] || 0
  );

  const damageRoll = new Roll(damageFormula, actor.system);
  await damageRoll.evaluate();
  // Add the flat damage bonus from Function 3
  const damageTotal = damageRoll.total + damageBonus;

  // --- EFFECT ROLLS ---
  const spellEffects = spell.system.effects || {};
  let effectsRollResults = "";

  const spellSchool = spell.system.type;
  const actorEffects = actor.system.effects?.[spellSchool] || {};

  for (const [key, effectValue] of Object.entries(spellEffects)) {
    if (effectValue > 0) {
      let finalEffectName = "";

      // 1. Handle Built-in Effects (stun, bleed)
      if (key === "stun" || key === "bleed") {
        finalEffectName = key.charAt(0).toUpperCase() + key.slice(1);
      }

      // 2. Handle Customizable Slots (extra1, extra2, extra3)
      else if (key.startsWith("extra")) {
        const index = key.replace("extra", ""); // gets "1", "2", or "3"

        // Look for type in system.effectType#
        const typeValue = spell.system[`effectType${index}`] || "";

        if (typeValue.toLowerCase() === "custom") {
          // Look for custom name in system.effects.effectName#
          finalEffectName =
            spell.system.effects[`effectName${index}`] || `Custom ${index}`;
        } else {
          finalEffectName = typeValue;
        }
      }

      // Skip if we couldn't resolve a name or if it's an internal field (like effectName1)
      if (!finalEffectName || key.startsWith("effectName")) continue;

      // Add actor-specific bonus
      const actorBonus = actorEffects[finalEffectName] || 0;
      const totalEffectValue = effectValue + actorBonus;

      // Roll 1d100
      const d100Roll = new Roll("1d100");
      await d100Roll.evaluate();

      const successText = d100Roll.total <= totalEffectValue ? " SUCCESS" : "";

      effectsRollResults += `<p><b>${finalEffectName}:</b> ${d100Roll.total} < ${totalEffectValue}${successText}</p>`;
    }
  }

  console.log("Final effectsRollResults:", effectsRollResults);

  // --- CRITICAL SCORE ROLL ---
  const critScoreRoll = new Roll(`1d20`);
  await critScoreRoll.evaluate();
  const critScoreResult =
    critScoreRoll.total + (actor.system.critRangeCast || 0);

  let critScore = 0;
  if (critScoreResult > 1) {
    if (critScoreResult <= 6) critScore = 1;
    else if (critScoreResult <= 12) critScore = 2;
    else if (critScoreResult <= 18) critScore = 3;
    else critScore = 4;
  }

  const critDamageMapping = [0, 5, 5, 10, 20];
  const critBonusDamage = critDamageMapping[critScore] || 0;
  const actorCritBonus = Number(actor.system.critDamage) || 0;
  const critDamageTotal = critBonusDamage + actorCritBonus + damageTotal;

  // --- CHAT MESSAGE CONSTRUCTION ---
  const attack =
    attackRoll.total + (actor.system.combatSkills.channeling.attack || 0);
  const rawTemplate = spell.system.description;
  const compiled = Handlebars.compile(rawTemplate);
  const renderedDescription = compiled(rollData);
  let rollName = spell.name;
  const penetration =
    spell.system.penetration > 0
      ? `<table style="width: 100%; text-align: center; font-size: 15px;"><tr><th>Penetration</th><th>Critical Score</th></tr><tr><td>${spell.system.penetration}</td><td>${critScore} (D20: ${critScoreResult})</td></tr></tr></table><hr>`
      : `<table style="width: 100%; text-align: center; font-size: 15px;"><tr><th>Critical Score</th></tr><tr><td>${critScore} (D20: ${critScoreResult})</td></tr></table><hr>`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    rolls: [attackRoll, damageRoll],
    flavor: `
        <div style="display:flex; align-items:center; justify-content:left; gap:8px; font-size:1.3em; font-weight:bold;">
            <img src="${spell.img}" title="${
      spell.name
    }" width="36" height="36">
            <span>${spell.name}</span>
        </div>
        <hr>
        <table style="width: 100%; text-align: center;font-size: 15px;">
            <tr><th>Description:</th></tr>
            <tr><td>|${spell.system.spellClass} spell|<br>
                Difficulty:${rollData.difficulty}<br>${renderedDescription}</td>
            </tr>
            <tr><td>Magic attack: ${attack} Range: ${
      spell.system.range
    }</td></tr>
            <tr><td>Damage types:</td></tr>
            <tr><td>${spell.system.dmgType1} ${spell.system.bool2}
                ${spell.system.dmgType2} ${spell.system.bool3}
                ${spell.system.dmgType3} ${spell.system.bool4}
                ${spell.system.dmgType4}</td></tr>
        </table>
        <hr>
        <p style="text-align: center; font-size: 20px;"><b>
            ${
              critSuccess
                ? "Critical Success!"
                : critFailure
                ? "Critical Failure!"
                : ""
            }
        </b></p>
        <table style="width: 100%; text-align: center;font-size: 15px;">
            <tr><th>Normal</th><th>Crit</th></tr>
            <tr><td>${damageTotal}</td><td>${critDamageTotal}</td></tr>
        </table>
        <hr>
        ${penetration}
        <table style="width: 100%; text-align: center;font-size: 15px;">
            <tr><th>Effects</th></tr>
            <tr><td>${effectsRollResults}</td></tr>
        </table>
        <hr>`,
    flags: {
      tos: {
        rollName,
        criticalSuccessThreshold:
          actor.system.combatSkills.channeling.criticalSuccessThreshold,
        criticalFailureThreshold:
          actor.system.combatSkills.channeling.criticalFailureThreshold,
      },
    },
  });
}
