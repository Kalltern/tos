const selectedToken = canvas.tokens.controlled[0];
if (!selectedToken) return ui.notifications.warn("Please select a token.");
const actor = selectedToken.actor;

const abilities = actor.items.filter(
  (i) => i.type === "ability" && i.system.type === "melee"
);

if (!abilities.length)
  return ui.notifications.warn(`No melee abilities found.`);

// ---- Inject CSS once (guarded to avoid duplicates) ----
if (!document.getElementById("tos-ability-dialog-styles")) {
  const css = `
      #ability-list .ability-choice {
        position: relative;
        font-size: 16px;
        color: black;
        cursor: pointer;
        padding: 5px;
        border-bottom: 1px solid #444;
      }

      #ability-list .ability-choice:hover {
        color: black;
        text-shadow: 0 0 1px red, 0 0 2px red;
      }

      .ability-dialog .window-content {
        max-width: 300px;
        width: 100%;
      }

      .ability-dialog .window {
        width: auto;
      }

      #keep-open-container {
        margin-bottom: 8px;
        font-size: 14px;
      }

      #keep-open {
        margin-right: 5px;
      }
    `;
  const styleSheet = document.createElement("style");
  styleSheet.id = "tos-ability-dialog-styles";
  styleSheet.type = "text/css";
  styleSheet.innerText = css;
  document.head.appendChild(styleSheet);
}

const abilityChoices = abilities.map((a, idx) => ({
  label: a.name,
  value: idx,
}));

// Create the Dialog
let abilityDialog = new Dialog({
  title: `Choose Ability`,
  content: `
      <form>
        <fieldset>
          <div id="keep-open-container">
            <label><input type="checkbox" id="keep-open" /> Keep this window open</label>
          </div>
          <ul id="ability-list" style="list-style: none; padding: 0; margin: 0;">
            ${abilityChoices
              .map(
                (c) =>
                  `<li class="ability-choice" data-value="${
                    c.value
                  }" tabindex="0" role="button" aria-pressed="false">
                <img src="${
                  abilities[c.value].img
                }" width="24" height="24" style="vertical-align: middle;" />
                    ${c.label}
                  </li>`
              )
              .join("")}
          </ul>
        </fieldset>
      </form>
    `,
  classes: ["ability-dialog"],
  buttons: {}, // No buttons: user clicks an item
  render: (html) => {
    const container = html instanceof HTMLElement ? html : html[0];

    const list = container.querySelector("#ability-list");
    if (!list) return;

    const items = Array.from(list.querySelectorAll(".ability-choice"));
    for (const li of items) {
      li.addEventListener("click", async (event) => {
        await _onChoose(event, container, abilities, abilityDialog, actor);
      });
    }
  },
});

abilityDialog.render(true);

// Helper function to handle selection (keeps outer scope clean)
async function _onChoose(
  event,
  container,
  abilities,
  abilityDialogInstance,
  actor
) {
  // event.currentTarget is the clicked <li>
  const el = event.currentTarget;
  const idx = Number(el.dataset.value);
  const ability = abilities[idx];
  if (!ability) return ui.notifications.error("Selected ability not found.");

  // Deduct cost and perform ability behavior
  try {
    await deductAbilityCost(actor, ability);

    if (ability.system && ability.system.weaponAbility) {
      await weaponSelectionFlow(actor, ability);
    } else {
      await game.tos.getNonWeaponAbility(actor, ability);
    }
  } catch (err) {
    console.error("Error using ability:", err);
    ui.notifications.error(
      "There was an error using that ability. See console."
    );
  }

  // Only close if checkbox is NOT checked
  const keepOpenCheckbox = container.querySelector("#keep-open");
  const keepOpen = keepOpenCheckbox ? keepOpenCheckbox.checked : false;
  if (!keepOpen && abilityDialogInstance?.close) {
    abilityDialogInstance.close();
  }
}

async function weaponSelectionFlow(actor, ability) {
  const weapons = actor.items.filter(
    (i) =>
      i.type === "weapon" &&
      ["axe", "sword", "blunt", "polearm"].includes(i.system.class) &&
      i.system.thrown !== true
  );
  if (!weapons.length)
    return ui.notifications.warn("This actor has no valid weapons.");

  const weaponChoices = weapons.map((w, idx) => ({
    label: w.name,
    value: idx,
  }));

  const handleWeaponSelection = async (weaponIndex) => {
    const weapon = weapons[weaponIndex];
    const abilityDamage = ability.system.roll.diceBonus || 0;
    const abilityAttack = ability.system.attack || 0;
    const abilityBreakthrough = ability.system.breakthrough || 0;
    const abilityPenetration = ability.system.penetration || 0;
    const abilityAttributeTestName = ability.system.attributeTest || 0;
    const abilityTestModifier = ability.system.testModifier || 0;
    const abilityCritRange = ability.system.critRange || 0;
    const abilityCritChance = ability.system.critChance || 0;
    const abilityCritFail = ability.system.critFail || 0;

    await runAttackMacro(
      actor,
      weapon,
      ability,
      abilityDamage,
      abilityAttack,
      abilityBreakthrough,
      abilityPenetration,
      abilityAttributeTestName,
      abilityTestModifier,
      abilityCritRange,
      abilityCritChance,
      abilityCritFail
    );
  };

  const css = `
  #weapon-list .weapon-choice {
    position: relative;
    font-size: 16px;
    color: black;  /* Ensure the text stays black */
  }
  
  #weapon-list .weapon-choice:hover {
    color: black;  /* Keep text color black */
    text-shadow: 0 0 1px red, 0 0 2px red;  /* Subtle red glow on hover */
  }

  /* Add custom width to the dialog and its content */
  .weapon-dialog .window-content {
    max-width: 300px;
    width: 100%;
  }

  .weapon-dialog .window {
    width: auto;
  }
`;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = css;
  document.head.appendChild(styleSheet);

  const weaponDialog = new Dialog({
    title: `Select Weapon - ${ability.name}`,
    content: `
    <form>
  <p>Choose a macro to execute:</p>
  <div class="form-group">
    <label>Aim:</label><br>
    <div id="aim-selector">
      ${[0, 1, 2, 3, 4]
        .map(
          (n) => `
        <input type="radio" name="aim" id="aim-${n}" value="${n}" ${
            n === 0 ? "checked" : ""
          }>
        <label for="aim-${n}" class="aim-dot">${n === 0 ? "–" : n}</label>
      `
        )
        .join("")}
    </div>
  </div>
  <div class="form-group">
    <label>
      Sneak Attack <input type="checkbox" id="sneak-attack-checkbox" />
      Flanking <input type="checkbox" id="flanking-attack-checkbox" />
    </label>
  </div>
</form>

    
    <form>
    <fieldset>
    <ul id="weapon-list" style="list-style: none; padding: 0;">
      ${weaponChoices
        .map(
          (c) =>
            `<li class="weapon-choice" data-value="${c.value}" style="cursor: pointer; padding: 5px; border-bottom: 1px solid #444;">${c.label}</li>`
        )
        .join("")}
    </ul>
     </fieldset>
     </form>
  `,
    classes: ["weapon-dialog"],
    buttons: {},
    render: (html) => {
      html.find(".weapon-choice").click(async (event) => {
        const selectedValue = $(event.currentTarget).data("value");
        await updateCombatFlags(actor);
        await handleWeaponSelection(selectedValue);
      });
    },
  });

  weaponDialog.render(true);
}

async function updateCombatFlags(actor) {
  if (!actor) return;
  const aimValue = parseInt(
    document.querySelector('input[name="aim"]:checked')?.value || 0
  );
  const useSneak = document.querySelector("#sneak-attack-checkbox")?.checked;
  const useFlanking = document.querySelector(
    "#flanking-attack-checkbox"
  )?.checked;

  if (useSneak) {
    await actor.setFlag("tos", "useSneakAttack", true);
    await actor.setFlag("tos", "sneakAccessCounter", 0);
  } else {
    await actor.unsetFlag("tos", "useSneakAttack");
    await actor.unsetFlag("tos", "sneakAccessCounter");
  }

  if (useFlanking) {
    await actor.setFlag("tos", "useFlankingAttack", true);
  } else {
    await actor.unsetFlag("tos", "useFlankingAttack");
  }

  if (aimValue > 0) {
    await actor.setFlag("tos", "aimCount", aimValue);
  } else {
    await actor.unsetFlag("tos", "aimCount");
  }
}

async function deductAbilityCost(actor, ability) {
  const costType = ability.system.costType;
  const costValue = ability.system.cost;
  if (!costType || !costValue) return;

  const currentValue = actor.system.stats[costType]?.value ?? 0;
  const newValue = Math.max(currentValue - costValue, 0);

  await actor.update({
    [`system.stats.${costType}.value`]: newValue,
  });

  ui.notifications.info(
    `${ability.name} used ${costValue} ${costType}. Remaining: ${newValue}`
  );
}

async function runAttackMacro(
  actor,
  weapon,
  ability,
  abilityDamage,
  abilityAttack,
  abilityBreakthrough,
  abilityPenetration,
  abilityAttributeTestName,
  abilityTestModifier,
  abilityCritRange,
  abilityCritChance,
  abilityCritFail
) {
  let {
    doctrineBonus,
    doctrineCritBonus,
    doctrineCritRangeBonus,
    doctrineStunBonus,
    doctrineSkillCritPen,
    doctrineCritDmg,
    doctrineBleedBonus,
  } = await game.tos.getDoctrineBonuses(actor, weapon);
  console.log("Doctrine crit bonus", doctrineCritBonus);

  doctrineBonus += abilityCritChance;
  doctrineCritRangeBonus += abilityCritRange;

  const {
    weaponSkillEffect,
    weaponSkillCrit,
    weaponSkillCritDmg,
    weaponSkillCritPen,
  } = await game.tos.getWeaponSkillBonuses(actor, weapon);
  console.log("Weapon skill effect", weaponSkillEffect);

  // Calculate penetration (future expansion possible)
  const penetration = (weapon.system.penetration || 0) + abilityPenetration;
  console.log("Ablity penetration", abilityPenetration);
  // ATTACK ROLL +  Critical success and failure thresholds
  const {
    attackRoll,
    rollName,
    critSuccess,
    critFailure,
    criticalSuccessThreshold,
    criticalFailureThreshold,
  } = await game.tos.getAttackRolls(
    actor,
    weapon,
    doctrineBonus,
    doctrineCritBonus,
    weaponSkillCrit,
    abilityAttack,
    abilityCritFail
  );

  // Log thresholds value to confirm
  console.log(
    "Crit thresholds for",
    actor.name,
    "Success",
    criticalSuccessThreshold,
    "Fail",
    criticalFailureThreshold
  );

  // DAMAGE ROLL
  const { damageRoll, damageTotal, breakthroughRollResult } =
    await game.tos.getDamageRolls(
      actor,
      weapon,
      abilityDamage,
      abilityBreakthrough
    );

  // CRITICAL SCORE ROLL (only in flavor text)
  const { critScore, critScoreResult, critBonusPenetration, critDamageTotal } =
    await game.tos.getCriticalRolls(
      actor,
      weapon,
      doctrineCritRangeBonus,
      attackRoll,
      weaponSkillCritDmg,
      weaponSkillCritPen,
      damageTotal,
      penetration,
      doctrineCritDmg,
      doctrineSkillCritPen
    );

  // EFFECTS ROLL
  const { allBleedRollResults, bleedChanceDisplay, effectsRollResults } =
    await game.tos.getEffectRolls(
      actor,
      weapon,
      doctrineBleedBonus,
      doctrineStunBonus,
      weaponSkillEffect,
      critScore,
      critSuccess,
      ability
    );

  console.log(
    "bleed, weaponSKill,DoctrineBleed",
    bleedChanceDisplay,
    weaponSkillEffect,
    doctrineBleedBonus
  );

  const attributeMap = {
    strength: "str",
    endurance: "end",
    dexterity: "dex",
    intelligence: "int",
    wisdom: "wis",
    charisma: "cha",
  };

  // Only run the attribute roll if a valid test is selected
  let concatRollAndDescription;
  if (
    abilityAttributeTestName &&
    abilityAttributeTestName !== "-- Select a Type --"
  ) {
    const shortKey =
      attributeMap[abilityAttributeTestName.toLowerCase()] ??
      abilityAttributeTestName;

    let selectedAttributeModifier = actor.system.attributes[shortKey]?.mod ?? 0;
    if (actor.type === "npc") {
      selectedAttributeModifier = actor.system.attributes[shortKey]?.value ?? 0;
    }

    const attributeRoll = new Roll(
      `(${selectedAttributeModifier + abilityTestModifier}) - 1d100`
    );
    await attributeRoll.evaluate({ async: true });

    const attributeRollTotal = attributeRoll.total;
    const attributeString = `
    |${abilityAttributeTestName} Test ${
      selectedAttributeModifier + abilityTestModifier
    }%|<br>
    Margin of Success: ${attributeRollTotal}<br>
  `;

    concatRollAndDescription = ability.system.description + attributeString;
  } else {
    concatRollAndDescription = ability.system.description;
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    rolls: [attackRoll, damageRoll],
    flavor: `
    <div style="display:flex; align-items:center; justify-content:left; gap:8px; font-size:1.3em; font-weight:bold;">
  <img src="${ability.img}" title="${ability.name}" width="36" height="36">
  <span>${ability.name} with ${weapon.name}</span>
</div>
<table style="width: 100%; text-align: center;font-size: 15px;">
    <tr>
      <th>Description:</th>
    </tr>
    <td>${concatRollAndDescription}</td>
 <p style="text-align: center; font-size: 20px;"><b>
  ${critSuccess ? "Critical Success!" : critFailure ? "Critical Failure!" : ""}
  </b></p>    
</table>
<table style="width: 100%; text-align: center;font-size: 15px;">
      <th>Normal</th>
      <th>Crit</th>
      ${weapon.system.breakthrough ? "<th>Breakthrough</th>" : ""}
      
    <tr>
      <td>${damageTotal}</td>
      <td>${critDamageTotal}</td>
       ${weapon.system.breakthrough ? `<td>${breakthroughRollResult}</td>` : ""}
    </tr>
</table>
 
  <hr>
  <table style="width: 100%; text-align: center; font-size: 15px;">
    <tr>
      <th>Penetration</th>
      <th>Critical Score</th>
    </tr>
    <tr>
      <td>${penetration} | ${critBonusPenetration}</td>
      <td>${critScore} (D20: ${critScoreResult})</td>
    </tr>
  </table>
   <hr>
  <table style="width: 100%; text-align: center;font-size: 15px;">
    <tr>
      <th>Effects</th>
    </tr>
    <tr>
      <td><b>${allBleedRollResults}</b> ${effectsRollResults} 

      </td>
    </tr>
  </table>
   <hr>

    `,
    flags: {
      rollName,
      criticalSuccessThreshold,
      criticalFailureThreshold,
    },
  });
}
