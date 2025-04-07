(async () => {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;
  const weapons = actor.items.filter(i => i.type === "weapon" && 
    ["axe", "sword", "blunt", "polearm"].includes(i.system.class) &&
    i.system.thrown !== true ); 
  if (!weapons.length) {
    ui.notifications.warn("This actor has no melee weapons.");
    return;
  }

  // Create a list of weapon options
  const weaponChoices = weapons.map((weapon, index) => {
    return {
      label: weapon.name, // The weapon name
      value: index, // Use the index to identify the weapon
    };
  });

  // Function to handle weapon selection and roll
  const handleWeaponSelection = async (weaponIndex) => {
    const weapon = weapons[weaponIndex];

    // Now you can use the selectedWeapon for the attack
    console.log(`You selected the weapon: ${weapon.name}`);

    
  // Calculate penetration (future expansion possible)
  const penetration = (weapon.system.penetration || 0) + 0;
  

  // Doctrine bonuses
  const doctrine = actor.system.doctrines;
  let doctrineBonus = 0;
  let doctrineCritBonus = 0;
  let doctrineCritRangeBonus = 0;
  let doctrineStunBonus = 0;
  let doctrineBleedBonus = 0;

    for(const [doctrineName, doctrineValue] of Object.entries(weapon.system.doctrines)){
      if (doctrineValue === true){
        if(doctrineName === "pikeman" && doctrine.pikeman.value >= 3){
           doctrineBonus = 10;
           if(doctrine.pikeman.value >= 7){
            doctrineBonus = 15;
            }
        }
        if(doctrineName === "swordsman" && doctrine.swordsman.value >= 3){
          doctrineBonus = 10;
          if(doctrine.swordsman.value >= 5){
            doctrineBleedBonus = 25;
            }
        }
        if(doctrineName === "reaver" && doctrine.reaver.value >= 2){
          doctrineBonus = 10;
          if(doctrine.reaver.value >= 4){
            doctrineCritRangeBonus = 2;
            }
          if(doctrine.reaver.value >= 7){
            doctrineBleedBonus = 15;
            doctrineStunBonus = 10;
            }
          if(doctrine.reaver.value >= 8){
            doctrineBonus = 15;
           }
        }

        if(doctrineName === "dimakerus" && doctrine.dimakerus.value >= 4){
          doctrineBleedBonus = 10;
          doctrineStunBonus = 5;   
          if(doctrine.dimakerus.value >= 9){
            doctrineBonus = 5;
           }
        }

        if(doctrineName === "duelist" && doctrine.duelist.value >= 4){
          doctrineBonus = 5;
          doctrineCritBonus = 2;
        }
        if(doctrineName === "monk" && doctrine.monk.value >= 1){
          doctrineBonus = 5;
          if(doctrine.monk.value >= 6){
            doctrineBonus = 8;
           }
        }
      }
    }
    console.log(`Doctrine Bonus: ${doctrineBonus}`);

  // weapon skill bonuses
  const weaponSkill = actor.system.weaponSkills;
  let weaponSkillEffect = 0;
  let weaponSkillCrit = 0;
  let weaponSkillCritDmg = 0;
  let weaponSkillCritPen = 0;
  
  for(const [skillName, skillValue] of Object.entries(weaponSkill)){
   // Match singular weapon class to plural skill name
  const className = weapon.system.class;
   // Does the weapon's class match this skill name (e.g. "axe" vs "axes")?
  const matches = skillName === className + "s";

    if(className === skillName && weaponSkill[skillName].value >= 5 || matches && weaponSkill[skillName].value >= 5){
      weaponSkillEffect = 10;
      weaponSkillCritDmg = 5;
      weaponSkillCritPen = 5;
      if(weaponSkill[skillName].value >= 7){
        weaponSkillCrit = 3;
      }
      if(weaponSkill[skillName].value >= 8){
        weaponSkillEffect = 20;
        weaponSkillCritDmg = 10;
        weaponSkillCritPen = 10;
    }
  }
}

console.log(`Weapon effect?: ${weaponSkillEffect}`);
  // Critical success and failure thresholds
  let criticalSuccessThreshold = actor.system.combatSkills.combat.criticalSuccessThreshold + (weapon.system.critChance + doctrineCritBonus || 0);
  let criticalFailureThreshold = actor.system.combatSkills.combat.criticalFailureThreshold - (weapon.system.critFail || 0);
   // Log thresholds value to confirm
  console.log("Crit thresholds for",selectedToken.actor.name,"Success", criticalSuccessThreshold,"Fail", criticalFailureThreshold);


  // ATTACK ROLL
  const finesse = actor.system.combatSkills.combat.finesseRating;
  const normalCombat = actor.system.combatSkills.combat.rating;
  const attackRollFormula = (finesse > normalCombat && weapon.system.finesse)
    ? `@combatSkills.combat.finesseRating + @weaponAttack + ${doctrineBonus} - 1d100`
    : `@combatSkills.combat.rating + @weaponAttack + ${doctrineBonus} - 1d100`;
  
  // Roll data setup
  const rollName = this.name;
  const rollData = {
    combatSkills: actor.system.combatSkills,
    weaponAttack: weapon.system.attack || 0,
    str: actor.system.attributes.str.total,
    dex: actor.system.attributes.dex.total,
  };
  
  const attackRoll = new Roll(attackRollFormula, rollData);
  await attackRoll.evaluate();
  const rollResult = attackRoll.dice[0].results[0].result;
  
  const critSuccess = rollResult <= criticalSuccessThreshold;
  const critFailure = rollResult >= criticalFailureThreshold;
  
  // DAMAGE ROLL
  let damageFormula = weapon.system.formula || "1d6";
  damageFormula = damageFormula.replace(/@(\w+\.\w+\.\w+|\w+)/g, (_, key) => rollData[key] || 0);
  
  const damageRoll = new Roll(damageFormula, actor.system);
  await damageRoll.evaluate();
  const damageTotal = damageRoll.total;

   // If the weapon has breakthrough, roll it
   let breakthroughRollResult = '';
   if (weapon.system.breakthrough) {
     const breakthroughFormula = weapon.system.breakthrough; // Example: "2d6" or "3d6"
     const breakthroughRoll = new Roll(breakthroughFormula, actor.system);
     await breakthroughRoll.evaluate();
     breakthroughRollResult = `${breakthroughRoll.total}`; // Customize as needed
   }
  
  // EFFECT ROLLS (Check sharpness and bleed effect)
  let effectsRollResults = "";
  const weaponEffects = weapon.system.effects || {};
  // Get actor effects modifiers (if any)
  const actorEffects = actor.system.effects || {};
  
  let totalBleeds = 0; // To count the total number of bleed stacks
  let regularBleedRolls = [];
  let sharpBleedRolls = [];
  
// Process each effect on the weapon, applying actor effect modifiers if present
for (const [effectName, effectValue] of Object.entries(weaponEffects)) {
  if (effectValue > 0) {
   // Get the modifier from actor's effects (if any)

   const modifier = actorEffects[effectName] || 0;
   let modifiedEffectValue = effectValue + modifier;
    if(effectName === "stun"){
      modifiedEffectValue = effectValue + modifier + doctrineStunBonus + weaponSkillEffect;
    }
    if(effectName === "bleed"){
      modifiedEffectValue = effectValue + modifier + doctrineBleedBonus + weaponSkillEffect;
    }
    
    // Roll a separate 1d100
    const d100Roll = new Roll("1d100");
    await d100Roll.evaluate();

    // Optionally use Math.floor if modifiedEffectValue might be non-integer
    const roundedModifiedValue = Math.floor(modifiedEffectValue);

// For non-bleed effects, add the result text normally.
if (effectName.toLowerCase() !== "bleed") {
  // Check if the d100 roll was lower or equal than the modified chance.
  const successText = d100Roll.total <= roundedModifiedValue ? " SUCCESS" : "";
  let effectResultText = `<p><b>${effectName}:</b> ${d100Roll.total}<${roundedModifiedValue}${successText}</p>`;
  effectsRollResults += effectResultText;
}
      
      // Process bleed effect
      if (effectName.toLowerCase() === "bleed") {
        // Calculate bleed stacks using the modified effect value
        const bleedBase = Math.floor(modifiedEffectValue / 100);       // Guaranteed bleed stacks (0 if modifiedEffectValue < 100)
        const bleedChance = modifiedEffectValue % 100;                   // Extra chance for an additional bleed stack
        const bleedRoll = new Roll("1d100");
        await bleedRoll.evaluate();
        const bleedRollResult = bleedRoll.total;
        
        let regularStacks = bleedBase;
        if (bleedRollResult <= bleedChance) regularStacks++;
        totalBleeds += regularStacks;
        regularBleedRolls.push(bleedRollResult);
      }
    }
  }
  
  // Handle Sharp Bleed Logic: If sharp is true and a bleed effect exists, do the same calculation again.
  let sharpBleedText = "";
  if (weapon.system.sharp && weaponEffects.bleed) {
    // Get the actor's modifier for bleed if it exists
    const modifier = actorEffects["bleed"] || 0;
    const modifiedBleedValue = weaponEffects.bleed + modifier + weaponSkillEffect + doctrineBleedBonus;
    const bleedChance = modifiedBleedValue % 100;
    const sharpBleedRoll = new Roll("1d100");
    await sharpBleedRoll.evaluate();
    const sharpRollResult = sharpBleedRoll.total;
    
    let sharpStacks = Math.floor(modifiedBleedValue / 100); // Guaranteed from sharp roll
    if (sharpRollResult <= bleedChance) sharpStacks++;
    totalBleeds += sharpStacks;
    sharpBleedRolls.push(sharpRollResult);
  }
  
  // Combine all Bleed Rolls (regular + sharp) into one message
  const bleedChanceDisplay = (weaponEffects.bleed || 0) + (actor.system.effects.bleed || 0) + (weaponSkillEffect || 0) + (doctrineBleedBonus || 0);
// Only display the message if bleedChanceDisplay is greater than 0
let allBleedRollResults = "";
if (bleedChanceDisplay > (weaponSkillEffect+doctrineBleedBonus)) {
  allBleedRollResults = `Bleed: ${[...regularBleedRolls, ...sharpBleedRolls].join(" | Sharp: ")} < ${bleedChanceDisplay}% |
    <i class="fa-regular fa-droplet fa-lg" style="color: #bd0000;"></i>  ${totalBleeds}`;
}
  // CRITICAL SCORE ROLL (only in flavor text)
  const failedAttack = attackRoll.total < 0 ? -5 : 0;
  const critRange = weapon.system.critRange + actor.system.critRangeMelee + doctrineCritRangeBonus + failedAttack  || 0;
  const critScoreRollFormula = `${critRange} + 1d20`;
  const critScoreRoll = new Roll(critScoreRollFormula);
  await critScoreRoll.evaluate();
  const critScoreResult = critScoreRoll.total;
  let critScore = 0;
  if (critScoreResult > 1) {
    if (critScoreResult <= 6) critScore = 1;
    else if (critScoreResult <= 12) critScore = 2;
    else if (critScoreResult <= 18) critScore = 3;
    else critScore = 4;
  }
  
  
  // Crit Damage Calculation:
  // Mapping crit scores to bonus damage: 0 → 0, 1 → 5, 2 → 5, 3 → 10, 4 → 20
  const perBonus = Number(actor.system.attributes.per.total) || 0;
  const critDamageMapping = [0, 5, 5, 10, 20];
  const critPenetrationMapping = [5, 5, 10, 10, 15];
  const critBonusDamage = critDamageMapping[critScore] + weaponSkillCritDmg || 0;
  const actorCritBonus = Number(actor.system.critDamage) || 0;
  const critBonusPenetration = critPenetrationMapping[critScore] + perBonus + actorCritBonus + penetration + weaponSkillCritPen || 0;
  let critDamageTotal = critBonusDamage + perBonus + actorCritBonus + damageTotal;
  
  
  // Send the chat message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    rolls: [attackRoll, damageRoll], // Only attack and damage rolls are graphical
    flavor: `
  <h2><img src="${weapon.img}" title="${weapon.name}" width="36" height="36" style="vertical-align: middle; margin-right: 8px;"> Melee attack</h2>
  <p style="text-align: center; font-size: 20px;"><b>
  ${critSuccess ? "Critical Success!" : critFailure ? "Critical Failure!" : ""}
  </b></p>
    <table style="width: 100%; text-align: center;font-size: 15px;">
    <tr>
      <th>Normal</th>
      <th>Crit</th>
      ${weapon.system.breakthrough ? "<th>Breakthrough</th>" : ""}
    </tr>
    <tr>
      <td>${damageTotal}</td>
      <td>${critDamageTotal}</td>
      <td>${breakthroughRollResult}</td>
    </tr>
  </table>
  <hr>
  <table style="width: 100%; text-align: center; font-size: 15px;">
    <tr>
      <th>Penetration | Critical </th>
      <th>Critical Score</th>
    </tr>
    <tr>
      <td>${penetration} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| ${critBonusPenetration}</td>
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
      criticalSuccessThreshold, // Store critical success threshold
      criticalFailureThreshold, // Store critical failure threshold
      },
  });
  
};

// Define the CSS styles to be injected
const css = `
  #weapon-list .weapon-choice {
    position: relative;
    font-size: 16px;
    color: black;  /* Ensure the text stays black */
  }
  
  #weapon-list .weapon-choice:hover {
    color: black;  /* Keep text color black */
    text-shadow: 0 0 1px red, 0 0 2px red;  /* Very subtle red glow */
  }

  /* Add custom width to the dialog and its content */
  .weapon-dialog .window-content {
    max-width: 300px;  /* Adjust to your preferred width */
    width: 100%;  /* Ensure it doesn't expand beyond the maximum width */
  }
  
  .weapon-dialog .window{
    width: auto;  /* Let the dialog adjust to content width */
  }
`;

// Inject the CSS into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = css;
document.head.appendChild(styleSheet);
// Prompt the user to select a weapon
const weaponDialog = new Dialog({
  title: "Select Weapon",
  content: `
  <form>
    <fieldset>
      <ul id="weapon-list" style="list-style: none; padding: 0;">
        ${weaponChoices.map(choice => 
          `<li class="weapon-choice" data-value="${choice.value}" style="cursor: pointer; padding: 5px; border-bottom: 1px solid #444;">
            ${choice.label}
          </li>`
        ).join('')}
      </ul>
    </fieldset>
  </form>
  `,
  buttons: {},
  resizable: true,
  width: 200,
  height: 100,
  render: (html) => {
       // Apply styles after dialog is rendered
       html.find(".weapon-dialog .window").css({
        "width": "auto",
        "max-width": "350px",
        "min-width": "300px"
      });
    html.find("#weapon-list li").click(async (event) => {
      const selectedValue = $(event.currentTarget).data("value");
      await handleWeaponSelection(selectedValue); // Execute roll on weapon selection
    });
  },
});

weaponDialog.render(true);
})();