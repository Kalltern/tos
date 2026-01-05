// Import document classes.
import { ToSActor } from "./documents/actor.mjs";
import { ToSItem } from "./documents/item.mjs";
import { ToSCombat } from "./documents/combat.mjs";
// Import sheet classes.
import { ToSActorSheet } from "./sheets/actor-sheet.mjs";
import { ToSItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { TOS } from "./helpers/config.mjs";
import { usePotion } from "./utils/usePotion.mjs";
import { defenseRoll } from "./utils/defense.mjs";
import { throwExplosive } from "./utils/throwExplosive.mjs";
import { castSpell } from "./utils/castSpell.mjs";
import { spellDefense } from "./utils/spellDefense.mjs";
import { meleeAttack } from "./utils/meleeAttack.mjs";
import { rangedAttack } from "./utils/rangedAttack.mjs";
import { throwingAttack } from "./utils/throwingAttack.mjs";
import { selectCombatAction } from "./utils/selectCombatAction.mjs";
import {
  delayInitiative,
  restAndRecover,
  longRest,
} from "./utils/otherActions.mjs";

import {
  getNonWeaponAbility,
  getDoctrineBonuses,
  getWeaponSkillBonuses,
  getAttackRolls,
  getDamageRolls,
  getEffectRolls,
  getCriticalRolls,
} from "./utils/combatSkillBonuses.mjs";
import {
  showSpellSelectionDialogs,
  deductMana,
  calculateAttackBonuses,
  performAttackRoll,
  finalizeRollsAndPostChat,
} from "./utils/magicSkillBonuses.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.tos = {
  documents: {
    ToSActor,
    ToSItem,
    ToSCombat,
  },
  applications: {
    ToSActorSheet,
    ToSItemSheet,
  },
  utils: {
    rollItemMacro,
  },
};

Hooks.once("init", function () {
  // Add custom constants for configuration.
  CONFIG.TOS = TOS;

  game.tos = game.tos || {};
  game.tos.delayInitiative = delayInitiative;
  game.tos.restAndRecover = restAndRecover;
  game.tos.longRest = longRest;
  game.tos.spellDefense = spellDefense;
  game.tos.selectCombatAction = selectCombatAction;
  game.tos.meleeAttack = meleeAttack;
  game.tos.rangedAttack = rangedAttack;
  game.tos.throwingAttack = throwingAttack;
  game.tos.castSpell = castSpell;
  game.tos.throwExplosive = throwExplosive;
  game.tos.usePotion = usePotion;
  game.tos.getNonWeaponAbility = getNonWeaponAbility;
  game.tos.getDoctrineBonuses = getDoctrineBonuses;
  game.tos.getWeaponSkillBonuses = getWeaponSkillBonuses;
  game.tos.getAttackRolls = getAttackRolls;
  game.tos.getDamageRolls = getDamageRolls;
  game.tos.getEffectRolls = getEffectRolls;
  game.tos.getCriticalRolls = getCriticalRolls;
  game.tos.showSpellSelectionDialogs = showSpellSelectionDialogs;
  game.tos.deductMana = deductMana;
  game.tos.calculateAttackBonuses = calculateAttackBonuses;
  game.tos.performAttackRoll = performAttackRoll;
  game.tos.finalizeRollsAndPostChat = finalizeRollsAndPostChat;
  game.tos.defenseRoll = defenseRoll;
  registerDynamicInitiative();
  /**
   * Set an initiative formula for the system
   * @type {String}
   */

  /*CONFIG.Combat.initiative = {
    formula:
      "1d12 + @secondaryAttributes.ini.total + @secondaryAttributes.spd.total",
    decimals: 0,
  };
*/
  // Define custom Document classes
  (CONFIG.Actor.documentClass = ToSActor);
  CONFIG.Item.documentClass = ToSItem;
  CONFIG.Combat.documentClass = ToSCombat;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("tos", ToSActorSheet, {
    makeDefault: true,
    label: "TOS.SheetLabels.Actor",
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("tos", ToSItemSheet, {
    makeDefault: true,
    label: "TOS.SheetLabels.Item",
  });
});

/* -------------------------------------------- */
/*  ToS Specific Game settings                  */
/* -------------------------------------------- */
function registerDynamicInitiative() {
  game.settings.register("tos", "registerDynamicInitiative", {
    config: true,
    scope: "world",
    name: "TOS.Config.Initiative.name",
    hint: "TOS.Config.Initiative.label",
    type: Boolean,
    default: false,
  });
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper("toLowerCase", function (str) {
  return str.toLowerCase();
});
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});
Handlebars.registerHelper(
  "filterSkillsByAbility",
  function (skills, abilityId) {
    return Object.entries(skills).filter(
      ([key, skill]) => skill.id === abilityId
    );
  }
);
Handlebars.registerHelper("range", function (start, end) {
  var range = [];
  for (var i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
});

Handlebars.registerHelper("gt", function (a, b) {
  return a > b;
});

Handlebars.registerHelper("hasValue", function (value) {
  return value !== null && value !== undefined && value !== "";
});
Handlebars.registerHelper("array-lookup", function (array, index) {
  return array && array[index] !== undefined ? array[index] : false;
});
Handlebars.registerHelper("math", function (left, operator, right) {
  left = parseFloat(left);
  right = parseFloat(right);
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right !== 0 ? left / right : 0;
    case "%":
      return left % right;
    default:
      return 0;
  }
});
Handlebars.registerHelper("groupSpellsBySchool", function (spells) {
  const grouped = {};

  for (const spell of spells) {
    // Only include spells where system.option is "magic" but it does not work
    if (spell.system.option === "magic") {
      const school = spell.system?.type;

      // Ensure school is defined and not empty
      if (school) {
        if (!grouped[school]) {
          grouped[school] = [];
        }

        grouped[school].push(spell);
      }
    }
  }

  console.log("Final grouped spells:", grouped);

  // Return grouped spells as an array of objects with school and spells
  return Object.entries(grouped).map(([school, spells]) => ({
    school,
    spells,
  }));
});

Handlebars.registerHelper("groupBySchool", function (spells, options) {
  const schools = {};

  // Group spells by school type
  spells.forEach((spell) => {
    const school = spell.system.type; // Assuming `type` is the school field
    if (!schools[school]) {
      schools[school] = [];
    }
    schools[school].push(spell);
  });

  // Convert into an array to loop over in Handlebars
  return Object.entries(schools).map(([school, spells]) => ({
    school,
    spells,
  }));
});

Handlebars.registerHelper("groupByRank", function (spells, options) {
  if (!Array.isArray(spells)) spells = []; // safeguard
  const ranks = ["wild", "apprentice", "expert", "master", "grandmaster"];
  // Map each rank to an object containing the spells of that rank
  return ranks.map((rank) => ({
    rank,
    spells: spells.filter((s) => s.system?.rank === rank),
  }));
});

Handlebars.registerHelper("healthPercentage", function (current, max) {
  if (max === 0) return 0; // Avoid division by zero
  return (current / max) * 100;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createDocMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hooks for Dynamic initiative if enabled     */
/* -------------------------------------------- */

Hooks.on("ready", () => {
  const SYS_ID = "tos";
  const SETTING_KEY = "registerDynamicInitiative";
  const isDynamicInitEnabled = () => game.settings.get(SYS_ID, SETTING_KEY);

  //Next Round Wrapper - Reroll Initiative
  if (
    typeof Combat.prototype.nextRound === "function" &&
    !Combat.prototype.nextRound.hasOwnProperty("_wrapped_by_" + SYS_ID)
  ) {
    const originalNextRound = Combat.prototype.nextRound;
    originalNextRound["_wrapped_by_" + SYS_ID] = true;

    Combat.prototype.nextRound = async function () {
      if (isDynamicInitEnabled()) {
        try {
          const combat = this;

          const combatantUpdates = combat.combatants.map((c) => ({
            _id: c.id,
            flags: { [SYS_ID]: { PreviousRoundInitiative: c.initiative } },
          }));

          await Combatant.updateDocuments(combatantUpdates, { parent: combat });
          await combat.resetAll();
          await combat.rollAll();
        } catch (err) {
          // Translate permission error for players
          if (!game.user.isGM) {
            ui.notifications.warn(
              "Dynamic Initiative: the GM must advance to the next round."
            );
            return;
          }

          // Preserve original error behavior for GM / unexpected cases

          throw err;
        }
      }

      return originalNextRound.call(this);
    };
  }

  //Previous Round Wrapper - Restore Initiative
  if (
    typeof Combat.prototype.previousRound === "function" &&
    !Combat.prototype.previousRound.hasOwnProperty("_wrapped_by_" + SYS_ID)
  ) {
    const originalPreviousRound = Combat.prototype.previousRound;
    originalPreviousRound["_wrapped_by_" + SYS_ID] = true;

    Combat.prototype.previousRound = async function () {
      if (isDynamicInitEnabled()) {
        try {
          const combat = this;
          const combatantUpdates = [];

          for (const combatant of combat.combatants) {
            const previousInit = combatant.getFlag(
              SYS_ID,
              "PreviousRoundInitiative"
            );

            if (previousInit !== undefined && previousInit !== null) {
              combatantUpdates.push({
                _id: combatant.id,
                initiative: previousInit,
              });

              combatant.unsetFlag(SYS_ID, "PreviousRoundInitiative");
            }
          }

          if (combatantUpdates.length > 0) {
            await Combatant.updateDocuments(combatantUpdates, {
              parent: combat,
            });
          }

          await combat.update({ turn: combat.turns.length - 1 });
        } catch (err) {
          // Translate permission error for players
          if (!game.user.isGM) {
            ui.notifications.warn(
              "Dynamic Initiative: the GM must move to the previous round."
            );
            return;
          }

          throw err;
        }
      }

      //Call original function to decrement the round
      return originalPreviousRound.call(this);
    };
  }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */

async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items"
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.tos.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "tos.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: "Item",
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

Hooks.on("createChatMessage", async (message) => {
  try {
    if (!message.isRoll) return;
    if (!game.user.isGM && message.user.id !== game.user.id) return;
    const flavor = message.flavor ?? "";

    // Read existing rollName from flags.tos (macro or previous messages)
    const existing = message.getFlag("tos", "rollName");

    let shouldSet = !existing;

    // If complex HTML (macro message), just use the macro-provided rollName
    if (/<(div|table|img|hr)/i.test(flavor)) {
      if (existing) {
        console.log("Macro Roll Name:", existing); // Already set by macro
      }
      shouldSet = false;
      // don’t try to infer
    }

    // If no existing rollName, infer from flavor or first roll formula
    if (shouldSet) {
      let rollName = "Roll";

      if (flavor.trim()) {
        rollName = flavor.replace(/<[^>]*>/g, "").trim();
      } else if (message.rolls?.length) {
        rollName = message.rolls[0].formula;
      }

      await message.setFlag("tos", "rollName", rollName);
    }

    // Determine rollName to use (macro flag or inferred)
    const rollNameToUse =
      existing || (await message.getFlag("tos", "rollName"));
    console.log("Roll Name:", rollNameToUse);
  } catch (err) {
    console.error("ToS rollName hook error", err);
  }
});

Hooks.on("renderChatMessage", (message, html, data) => {
  // Check if the current user is the one who made the roll
  if (game.user.id === message.author.id) {
    // Add logic to check if the message is a roll message and create a reroll button
    if (message.content.includes("rolled") || message.rolls.length > 0) {
      const rerollButton = $(
        '<button class="d100-reroll-button">Re-Roll</button>'
      );

      // Check if a button container already exists, if not, create one
      let buttonContainer = html.find(".button-container");

      if (buttonContainer.length === 0) {
        buttonContainer = $('<div class="button-container"></div>');
        html.find(".message-content").append(buttonContainer);
      }

      // Append the reroll button to the container
      buttonContainer.append(rerollButton);
      // Add click event listener for the reroll button
      rerollButton.on("click", async (event) => {
        event.preventDefault();
        console.log("Re-roll button clicked");

        const rollFormula = message.rolls[0].formula;
        const roll = new Roll(rollFormula);
        await roll.evaluate();
        const d100Result = roll.dice[0]?.total; // Extract the d100 result
        const criticalSuccessThreshold =
          message.flags.tos.criticalSuccessThreshold;
        const criticalFailureThreshold =
          message.flags.tos.criticalFailureThreshold;
        const deflectChance = message.flags.deflectChance;
        const critSuccess = d100Result <= criticalSuccessThreshold;
        const rollName = message.getFlag("tos", "rollName");

        let flavorText = "";

        if (critSuccess) {
          flavorText = "Critical Success!";
        } else if (d100Result >= criticalFailureThreshold) {
          flavorText = "Critical Failure!";
        } else if (!critSuccess && d100Result <= deflectChance) {
          flavorText = "Deflect!";
        } else {
          flavorText = "";
        }

        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ user: game.user }),
          flavor: `<p style="text-align: center; font-size: 20px;"><b><i class="fa-light fa-dice-d20"></i> ${rollName} <i class="fa-light fa-dice-d20"></i><hr></b></p>
          <p style="text-align: center; font-size: 20px;"><b>${flavorText}</b></p>`,
          flags: {
            tos: {
              rollName,
              deflectChance,
              criticalSuccessThreshold, // Store critical success threshold
              criticalFailureThreshold, // Store critical failure threshold
            },
          },
        });
      });
    }
  }
});

Hooks.once("ready", () => {
  // Listen for checkbox changes to update skill visibility
  $(document).on("change", ".toggle-skill-visibility", function () {
    let skillKey = $(this).attr("data-skill");
    let isChecked = $(this).prop("checked");

    console.log(
      `Toggling visibility for skill: ${skillKey}, Checked: ${isChecked}`
    );

    // Target the specific skill entry
    let skillEntry = $(`.skill-entry[data-skill="${skillKey}"]`); // Ensure uniqueness with section-based targeting

    // Reverse the logic: if checked, hide the skill, else show the skill
    if (isChecked) {
      skillEntry.addClass("hidden-skill");
    } else {
      skillEntry.removeClass("hidden-skill");
    }
  });
});
