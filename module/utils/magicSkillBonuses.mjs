export async function getDoctrineBonuses(actor, weapon) {
  // Doctrine bonuses
  const doctrine = actor.system.doctrines;
  let doctrineBonus = 0;
  let doctrineCritBonus = 0;
  let doctrineCritRangeBonus = 0;
  let doctrineStunBonus = 0;
  let doctrineBleedBonus = 0;
  let doctrineCritDefenseBonus = 0;
  let doctrineDefenseBonus = 0;
  let doctrineRangedDefenseBonus = 0;
  let doctrineCritDmg = 0;
  let doctrineSkillCritPen = 0;
  if (actor.type === "npc") {
    return {
      doctrineBonus: 0,
      doctrineCritBonus: 0,
      doctrineCritRangeBonus: 0,
      doctrineStunBonus: 0,
      doctrineBleedBonus: 0,
      doctrineCritDefenseBonus: 0,
      doctrineDefenseBonus: 0,
      doctrineRangedDefenseBonus: 0,
      doctrineCritDmg: 0,
      doctrineSkillCritPen: 0,
    };
  }
  for (const [doctrineName, doctrineValue] of Object.entries(
    weapon.system.doctrines
  )) {
    if (doctrineValue === true) {
      if (doctrineName === "pikeman" && doctrine.pikeman.value >= 3) {
        doctrineBonus = 10;
        if (doctrine.pikeman.value >= 7) {
          doctrineBonus = 15;
        }
      }
      if (doctrineName === "swordsman" && doctrine.swordsman.value >= 3) {
        doctrineBonus = 10;
        if (doctrine.swordsman.value >= 5) {
          doctrineBleedBonus = 25;
        }
      }
      if (doctrineName === "reaver" && doctrine.reaver.value >= 2) {
        doctrineBonus = 10;
        if (doctrine.reaver.value >= 4) {
          doctrineCritRangeBonus = 2;
        }
        if (doctrine.reaver.value >= 7) {
          doctrineBleedBonus = 15;
          doctrineStunBonus = 10;
        }
        if (doctrine.reaver.value >= 8) {
          doctrineBonus = 15;
        }
      }
      if (doctrineName === "shieldbearer" && doctrine.shieldbearer.value >= 3) {
        doctrineCritDefenseBonus = 3;
        if (doctrine.shieldbearer.value >= 7) {
          doctrineDefenseBonus = 5;
          doctrineRangedDefenseBonus = 10;
        }
      }
      if (doctrineName === "dimakerus" && doctrine.dimakerus.value >= 2) {
        doctrineDefenseBonus = 5;
        doctrineRangedDefenseBonus = 5;
        if (doctrine.dimakerus.value >= 4) {
          doctrineBleedBonus = 10;
          doctrineStunBonus = 5;
        }
        if (doctrine.dimakerus.value >= 7) {
          doctrineDefenseBonus = 10;
        }
        if (doctrine.dimakerus.value >= 9) {
          doctrineBonus = 5;
        }
      }

      if (doctrineName === "duelist" && doctrine.duelist.value >= 4) {
        doctrineBonus = 5;
        doctrineCritBonus = 2;
        if (doctrine.dimakerus.value >= 8) {
          doctrineCritDefenseBonus = 1;
        }
      }
      if (doctrineName === "monk" && doctrine.monk.value >= 1) {
        doctrineBonus = 5;
        doctrineDefenseBonus = 5;
        if (doctrine.monk.value >= 5) {
          doctrineCritDefenseBonus = 2;
        }
        if (doctrine.monk.value >= 6) {
          doctrineBonus = 8;
          doctrineDefenseBonus = 8;
        }
      }
      if (doctrineName === "archer" && doctrine.archer.value >= 1) {
        doctrineBonus = 10;
        if (doctrine.archer.value >= 4) {
          doctrineBleedBonus = 10;
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.archer.value >= 6) {
          doctrineCritBonus = 3;
        }
        if (doctrine.archer.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
      }
      if (doctrineName === "arbalest" && doctrine.arbalest.value >= 1) {
        doctrineBonus = 10;
        if (doctrine.arbalest.value >= 4) {
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.arbalest.value >= 6) {
          doctrineBleedBonus = 10;
          doctrineBonus = 15;
        }
        if (doctrine.arbalest.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
        if (doctrine.arbalest.value >= 8) {
          doctrineCritBonus = 5;
        }
      }
      if (doctrineName === "peltast" && doctrine.peltast.value >= 1) {
        doctrineBleedBonus = 20;
        doctrineStunBonus = 10;
        if (doctrine.peltast.value >= 4) {
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.peltast.value >= 6) {
          doctrineCritBonus = 3;
        }
        if (doctrine.peltast.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
        if (doctrine.peltast.value >= 9) {
          // add zatizeni stitu
          doctrineCritRangeBonus = 2;
        }
      }
      if (doctrineName === "juggler" && doctrine.juggler.value >= 3) {
        doctrineBonus = 5;
        if (doctrine.juggler.value >= 2) {
          doctrineCritBonus = 3;
        }
        if (doctrine.juggler.value >= 4) {
          doctrineBleedBonus = 10;
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.juggler.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
      }
    }
  }
  console.log(
    `Doctrine Bonus: ${doctrineBonus}, ${doctrineCritBonus}, ${doctrineCritRangeBonus}, ${doctrineStunBonus}, ${doctrineBleedBonus}`
  );

  return {
    doctrineBonus,
    doctrineCritBonus,
    doctrineCritRangeBonus,
    doctrineStunBonus,
    doctrineBleedBonus,
    doctrineRangedDefenseBonus,
    doctrineDefenseBonus,
    doctrineCritDefenseBonus,
    doctrineSkillCritPen,
    doctrineCritDmg,
  };
}

export async function getSpellSchool(actor) {
  const spells = actor.items.filter((i) => i.type === "spell");
  if (!spells.length) {
    ui.notifications.warn("This actor has no spells.");
    return;
  }
  const schools = [...new Set(spells.map((s) => s.system.type))];
  if (!schools.length) {
    ui.notifications.warn("This actor has no spell schools.");
    return;
  }
}

export async function handleManaCost(selectedSpell, actor, spells) {
  console.log(spells);
  console.log(actor);
  console.log(selectedSpell);
  const spellCost = selectedSpell.system.cost || 0;
  let currentMana = actor.system.stats.mana.value;
  if (currentMana < spellCost) {
    ui.notifications.warn(`Not enough mana to cast ${selectedSpell.name}.`);
    return false;
  }
  // Decrease mana by the spell cost
  currentMana -= selectedSpell.system.cost;
  await actor.update({
    "system.stats.mana.value": currentMana,
  });
  return true;
}
export async function getMagicAttackRolls(actor, selectedSpell) {
  // Critical success and failure thresholds
  let criticalSuccessThreshold =
    actor.system.combatSkills.channeling.criticalSuccessThreshold;
  let criticalFailureThreshold =
    actor.system.combatSkills.channeling.criticalFailureThreshold;
  // Log thresholds value to confirm
  console.log(
    "Crit thresholds for",
    actor.name,
    "Success",
    criticalSuccessThreshold,
    "Fail",
    criticalFailureThreshold
  );
  // ATTACK ROLL
  let temperament = actor.items.find((i) => i.name === "Melancholic");
  let temperamentBonus = temperament ? 5 : 0; // Apply bonus if item is found
  const attackRollFormula = `@combatSkills.channeling.rating + @difficulty + ${temperamentBonus} - 1d100`;
  // Roll data setup
  const rollName = this.name;
  const rollData = {
    combatSkills: actor.system.combatSkills,
    int: actor.system.attributes.int.total,
    wil: actor.system.attributes.wil.total,
    difficulty: selectedSpell.system.difficulty,
    spellPower: actor.system.schools.earth.spellPower,
  };

  const attackRoll = new Roll(attackRollFormula, rollData);
  await attackRoll.evaluate();
  const rollResult = attackRoll.dice[0].results[0].result;

  const critSuccess = rollResult <= criticalSuccessThreshold;
  const critFailure = rollResult >= criticalFailureThreshold;
  return {
    attackRoll,
    critSuccess,
    rollName,
    critFailure,
    rollData,
    criticalSuccessThreshold,
    criticalFailureThreshold,
  };
}

export async function getMagicDamageRolls(actor, selectedSpell, rollData) {
  // DAMAGE ROLL
  let damageFormula = selectedSpell.system.formula || "1d6";
  damageFormula = damageFormula.replace(
    /@(\w+\.\w+\.\w+|\w+)/g,
    (_, key) => rollData[key] || 0
  );

  const damageRoll = new Roll(damageFormula, actor.system);
  await damageRoll.evaluate();
  const damageTotal = damageRoll.total;

  // EFFECT ROLLS (Check sharpness and bleed effect)
  let effectsRollResults = "";
  const spellEffects = selectedSpell.system.effects || {};
  // Get actor effects modifiers (if any)
  const actorEffects = actor.system.effects || {};

  // Process each effect on the spell, applying actor effect modifiers if present
  for (const [effectName, effectValue] of Object.entries(spellEffects)) {
    if (effectValue > 0) {
      // Get the modifier from actor's effects (if any)
      const modifier = actorEffects[effectName] || 0;
      const modifiedEffectValue = Math.floor(effectValue + modifier);

      // Roll a separate 1d100
      const d100Roll = new Roll("1d100");
      await d100Roll.evaluate();

      const successText =
        d100Roll.total < modifiedEffectValue ? " SUCCESS" : "";
      let effectResultText = `<p><b>${effectName}:</b> ${d100Roll.total}<${modifiedEffectValue}${successText}</p>`;
      effectsRollResults += effectResultText;
    }
  }

  // CRITICAL SCORE ROLL (only in flavor text)
  const critScoreRollFormula = `1d20`;
  const critScoreRoll = new Roll(critScoreRollFormula);
  await critScoreRoll.evaluate();
  const critScoreResult = critScoreRoll.total + actor.system.critRangeCast;
  let critScore = 0;
  if (critScoreResult > 1) {
    if (critScoreResult <= 6) critScore = 1;
    else if (critScoreResult <= 12) critScore = 2;
    else if (critScoreResult <= 18) critScore = 3;
    else critScore = 4;
  }

  // Crit Damage Calculation:
  // Mapping crit scores to bonus damage: 0 → 0, 1 → 5, 2 → 5, 3 → 10, 4 → 20
  const critDamageMapping = [0, 5, 5, 10, 20];
  const critBonusDamage = critDamageMapping[critScore] || 0;
  const actorCritBonus = Number(actor.system.critDamage) || 0;
  let critDamageTotal = critBonusDamage + actorCritBonus + damageTotal;

  // Calculate penetration and prepare the crit scores for the message
  const penetration =
    selectedSpell.system.penetration > 0
      ? `<table style="width: 100%; text-align: center; font-size: 15px;"><tr>
        <th>Penetration</th>
        <th>Critical Score</th>
      </tr>
      <tr>
        <td>${selectedSpell.system.penetration}</td>
        <td>${critScore} (D20: ${critScoreResult})</td>
      </tr></table><hr>`
      : `<table style="width: 100%; text-align: center; font-size: 15px;"><tr>
        <th>Critical Score</th>
      </tr>
      <tr>
        <td>${critScore} (D20: ${critScoreResult})</td>
      </tr></table><hr>`;
  return {
    effectsRollResults,
    damageRoll,
    damageTotal,
    critDamageTotal,
    penetration,
  };
}

export async function handleSpellSelection(rollData, selectedSpell) {
  const rawTemplate = selectedSpell.system.description;
  // 2. Compile it using Handlebars
  const compiled = Handlebars.compile(rawTemplate);
  // 3. Render with your custom data (e.g., rollData)
  const renderedDescription = compiled(rollData);
  return { renderedDescription };
}
/*
const customEffects = {
  stun: customStun,
  bleed: customBleed,
  extra1: customEffect1,
  extra2: customEffect2,
  extra3: customEffect3,
}();

/*
        "fire",
        "water",
        "air",
        "earth",
        "spirit",
        "body",
        "darkness",
        "blood",
        "gnosis"


        async () => {
    const token = canvas.tokens.controlled[0];
    if (!token) {
      ui.notifications.warn("Please select a token.");
      return;
    }

    const actor = token.actor;
    const spells = actor.items.filter((i) => i.type === "spell");
    if (!spells.length) {
      ui.notifications.warn("This actor has no spells.");
      return;
    }

    // --- Collect unique schools
    const schools = [...new Set(spells.map((s) => s.system.type))];
    if (!schools.length) {
      ui.notifications.warn("This actor has no spell schools.");
      return;
    }

    // --- First dialog: pick school
    const chosenSchool = await new Promise((resolve) => {
      const schoolDialog = new Dialog({
        title: "Choose a School",
        content: `
        <div>
          ${schools
            .map((s) => `<button data-school="${s}">${s}</button>`)
            .join("<br>")}
        </div>
      `,
        buttons: {},
        render: (html) => {
          html.find("button[data-school]").on("click", (ev) => {
            const school = ev.currentTarget.dataset.school;
            schoolDialog.close(); // ✅ close the dialog instance
            resolve(school); // return school to Promise
          });
        },
      });
      schoolDialog.render(true);
    });

    if (!chosenSchool) return;

    // --- Filter spells of that school
    const schoolSpells = spells.filter((s) => s.system.type === chosenSchool);
    if (!schoolSpells.length) {
      ui.notifications.warn(`No spells found for ${chosenSchool}.`);
      return;
    }

    // --- Second dialog: pick spell
    const chosenSpell = await new Promise((resolve) => {
      const spellDialog = new Dialog({
        title: `Choose a ${chosenSchool} Spell`,
        content: `
        <div>
          ${schoolSpells
            .map((s) => `<button data-spell="${s.id}">${s.name}</button>`)
            .join("<br>")}
        </div>
      `,
        buttons: {},
        render: (html) => {
          html.find("button[data-spell]").on("click", (ev) => {
            const spellId = ev.currentTarget.dataset.spell;
            spellDialog.close(); // ✅ close this dialog instance
            resolve(spellId); // return spellId to Promise
          });
        },
      });
      spellDialog.render(true);
    });

    if (!chosenSpell) return;

    // --- Find the spell Item
    const spell = actor.items.get(chosenSpell);

    // TODO: Your casting logic here
    ui.notifications.info(`You selected spell: ${spell.name}`);
  }
*/
