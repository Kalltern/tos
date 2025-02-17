// Import document classes.
import { ToSActor } from "./documents/actor.mjs";
import { ToSItem } from "./documents/item.mjs";
// Import sheet classes.
import { ToSActorSheet } from "./sheets/actor-sheet.mjs";
import { ToSItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { TOS } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.tos = {
  documents: {
    ToSActor,
    ToSItem,
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

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d12+5",
    decimals: 0,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = ToSActor;
  CONFIG.Item.documentClass = ToSItem;

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

Handlebars.registerHelper("hasValue", function(value) {
  return value !== null && value !== undefined && value !== "";
});


/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createDocMacro(data, slot));
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
Hooks.on("renderChatMessage", (message, html, data) => {
  // Check if the current user is the one who made the roll
  if (game.user.id === message.author.id) {
    // Add logic to check if the message is a roll message
    if (message.content.includes("rolled") || message.rolls.length > 0) {
      // Create a reroll button element
      const rerollButton = $(
        '<button class="d100-reroll-button">Re-Roll</button>'
      );

      // Append the reroll button to the chat message
      html.find(".message-content").append(rerollButton);

      // Add click event listener for the reroll button
      rerollButton.on("click", async (event) => {
        event.preventDefault();
        console.log("Re-roll button clicked");

        // Call your reroll logic here
        const rollFormula = message.rolls[0].formula;
        const roll = new Roll(rollFormula);
        await roll.evaluate();

        // Check if we have critical success or failure info to add
        let criticalMessage = "";
        if (message.system.rollType === "skill" || message.system.rollType === "cskill") {
          const skillKey = message.system.skillKey; // Assuming this is available in message.data
          const skillData = message.system.rollType === "skill"
            ? game.actors.get(message.speaker.actor).system.skills[skillKey]
            : game.actors.get(message.speaker.actor).system.cskills[skillKey];

          if (skillData) {
            criticalMessage = evaluateCriticalSuccess(
              roll.total, 
              skillData.criticalSuccessThreshold, 
              skillData.criticalFailureThreshold
            );
          }
        }

        // Send the new roll to chat or update the message as needed
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ user: game.user }),
          flavor: `[Re-Roll] ${message.flavor}`,
        });
      });
    }
  }
});
Hooks.once("ready", () => {
  $(document).on("click", ".action-btn", function (event) {
    event.preventDefault();
    console.log("Button clicked!");

    // Toggle visibility of skills and checkboxes
    $(".skill-entry").toggleClass("hidden-skill");  // Toggle skill visibility
    $(".toggle-label").toggleClass("hidden");  // Toggle checkbox visibility
  });

  // Listen for checkbox changes to update skill visibility
  $(document).on("change", ".toggle-skill-visibility", function () {
    let skillKey = $(this).attr("data-skill");
    let isChecked = $(this).prop("checked");

    console.log(`Toggling visibility for skill: ${skillKey}, Checked: ${isChecked}`);

    let skillEntry = $(`.skill-label[data-label="${skillKey}"]`).closest(".skill-entry");

    // Reverse the logic: if checked, hide the skill, else show the skill
    if (isChecked) {
      skillEntry.addClass("hidden-skill");
    } else {
      skillEntry.removeClass("hidden-skill");
    }
  

  });
  Hooks.on("updateActor", async (actor, data) => {
    if (data.system && data.system.combatSkills) {
      console.log("Updating actor with combatSkills data...");
  
      // Update the specific combatSkills data
      await actor.update({
        "system.combatSkills": data.system.combatSkills
      });
  
      // After the update, force a reflow for the config tab
      const sheet = actor.sheet;
      if (sheet) {
        // Find the config tab element
        const configTab = sheet.element.querySelector('[data-tab="config"]');
        if (configTab) {
          // Simulate a click to force the tab to refresh
          configTab.click();  // This forces a reflow or re-render when clicked
          console.log("Config tab clicked to force refresh");
        } else {
          console.error("Config tab not found");
        }
      }
    }
  });
  
  
  
  
  
});