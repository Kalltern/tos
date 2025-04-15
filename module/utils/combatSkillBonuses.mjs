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
        if(doctrineName === "shieldbearer" && doctrine.shieldbearer.value >= 3){
          doctrineCritDefenseBonus = 3;
          if(doctrine.shieldbearer.value >= 7){
            doctrineDefenseBonus = 5;
            doctrineRangedDefenseBonus = 10;
            }
        }
        if(doctrineName === "dimakerus" && doctrine.dimakerus.value >= 2){
          doctrineDefenseBonus = 5;
          doctrineRangedDefenseBonus = 5;
          if(doctrine.dimakerus.value >= 4){
            doctrineBleedBonus = 10;
            doctrineStunBonus = 5;  
           }
           if(doctrine.dimakerus.value >= 7){
            doctrineDefenseBonus = 10;
           }
          if(doctrine.dimakerus.value >= 9){
            doctrineBonus = 5;
           }
        }

        if(doctrineName === "duelist" && doctrine.duelist.value >= 4){
          doctrineBonus = 5;
          doctrineCritBonus = 2;
          if(doctrine.dimakerus.value >= 8){
            doctrineCritDefenseBonus = 1;
           }
        }
        if(doctrineName === "monk" && doctrine.monk.value >= 1){
          doctrineBonus = 5;
          doctrineDefenseBonus = 5;
          if(doctrine.monk.value >= 5){
            doctrineCritDefenseBonus = 2;
           }
          if(doctrine.monk.value >= 6){
            doctrineBonus = 8;
            doctrineDefenseBonus = 8;
           }
        }
        if(doctrineName === "archer" && doctrine.archer.value >= 1){
          doctrineBonus = 10;
          if(doctrine.archer.value >= 4){
            doctrineBleedBonus = 10;
            doctrineSkillCritPen = 5;
            doctrineCritDmg = 5;
            }
            if(doctrine.archer.value >= 6){
              doctrineCritBonus = 3;
              }
              if(doctrine.archer.value >= 7){
                doctrineSkillCritPen = 10;
                doctrineCritDmg = 10;
                }                          
        }
        if(doctrineName === "crossbowman" && doctrine.crossbowman.value >= 1){
          doctrineBonus = 10;
          if(doctrine.crossbowman.value >= 4){
            doctrineSkillCritPen = 5;
            doctrineCritDmg = 5;
            }
            if(doctrine.crossbowman.value >= 6){
              doctrineBleedBonus = 10;
              doctrineBonus = 15;
              }
              if(doctrine.crossbowman.value >= 7){
                doctrineSkillCritPen = 10;
                doctrineCritDmg = 10;
                }                       
                if(doctrine.crossbowman.value >= 8){
                  doctrineCritBonus = 5;
                  }                                       
        }
        if(doctrineName === "peltast" && doctrine.peltast.value >= 1){
          doctrineBleedBonus = 20;
          doctrineStunBonus = 10;
          if(doctrine.peltast.value >= 4){
            doctrineSkillCritPen = 5;
            doctrineCritDmg = 5;
            }
            if(doctrine.peltast.value >= 6){
              doctrineCritBonus = 3;
              }            
              if(doctrine.peltast.value >= 7){
                doctrineSkillCritPen = 10;
                doctrineCritDmg = 10;
                }   
                if(doctrine.peltast.value >= 9){
         // add zatizeni stitu
                doctrineCritRangeBonus = 2;
                  }                                        
        }
        if(doctrineName === "juggler" && doctrine.juggler.value >= 3){
          doctrineBonus = 5;
          if(doctrine.juggler.value >= 2){
            doctrineCritBonus = 3;
           }           
             if(doctrine.juggler.value >= 4){
              doctrineBleedBonus = 10;
              doctrineSkillCritPen = 5;
              doctrineCritDmg = 5;
           }
           if(doctrine.juggler.value >= 7){
            doctrineSkillCritPen = 10;
            doctrineCritDmg = 10;
         }
        }
      }
    }
    console.log(`Doctrine Bonus: ${doctrineBonus}, ${doctrineCritBonus}, ${doctrineCritRangeBonus}, ${doctrineStunBonus}, ${doctrineBleedBonus}`);
    
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
      doctrineCritDmg
    };
  }

  export async function getWeaponSkillBonuses(actor, weapon) {
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
return {
  weaponSkillEffect,
  weaponSkillCrit,
  weaponSkillCritDmg,
  weaponSkillCritPen
};

}


export async function getAttackRolls(actor, weapon, 
  doctrineBonus, doctrineCritBonus, weaponSkillCrit, customAttack
) {

  let criticalSuccessThreshold = 0;
  let criticalFailureThreshold = 0;
  const finesse = actor.system.combatSkills.combat.finesseRating;
  const normalCombat = actor.system.combatSkills.combat.rating;
  let attackRollFormula = 0;

if(weapon.system.class === 'bow' || weapon.system.class === 'crossbow'){
  // Critical success and failure thresholds
  criticalSuccessThreshold = actor.system.combatSkills.archery.criticalSuccessThreshold + doctrineCritBonus + (weapon.system.critChance || 0);
  criticalFailureThreshold = actor.system.combatSkills.archery.criticalFailureThreshold - (weapon.system.critFail || 0);
  // ATTACK ROLL
  attackRollFormula =  `@combatSkills.archery.rating + @weaponAttack + ${doctrineBonus} - 1d100`;
  
} else {
  // Critical success and failure thresholds
  criticalSuccessThreshold = actor.system.combatSkills.combat.criticalSuccessThreshold + (weapon.system.critChance + doctrineCritBonus + weaponSkillCrit|| 0);
  criticalFailureThreshold = actor.system.combatSkills.combat.criticalFailureThreshold - (weapon.system.critFail || 0);
// ATTACK ROLL
attackRollFormula = (finesse > normalCombat && weapon.system.finesse)
  ? `@combatSkills.combat.finesseRating + @weaponAttack + ${doctrineBonus} - 1d100`
  : `@combatSkills.combat.rating + @weaponAttack + ${doctrineBonus} - 1d100`;
if(customAttack){
  attackRollFormula = (finesse > normalCombat && weapon.system.finesse)
  ? `@combatSkills.combat.finesseRating + @weaponAttack + ${doctrineBonus} + ${customAttack} - 1d100`
  : `@combatSkills.combat.rating + @weaponAttack + ${doctrineBonus} + ${customAttack} - 1d100`;
}


}


  
  // Roll data setup
  const rollName = this.name;
  const rollData = {
    combatSkills: actor.system.combatSkills,
    weaponAttack: weapon.system.attack || 0,
    str: actor.system.attributes.str.total,
    dex: actor.system.attributes.dex.total,
    per: actor.system.attributes.per.total,
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
    criticalSuccessThreshold,
    criticalFailureThreshold

  };
}


export async function getDamageRolls(actor, weapon, customDamage) {
  const rollData = {
    combatSkills: actor.system.combatSkills,
    weaponAttack: weapon.system.attack || 0,
    str: actor.system.attributes.str.total,
    dex: actor.system.attributes.dex.total,
    per: actor.system.attributes.per.total,
  };
  
  // DAMAGE ROLL
  let damageFormula = `${weapon.system.formula}`.replace(/\s*\+\s*$/, '');
  if(customDamage){damageFormula = `${weapon.system.formula} + ${customDamage}`.replace(/\s*\+\s*$/, '');}
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
   return {
    damageRoll,
    damageTotal,
    breakthroughRollResult
  };
}

export async function getCriticalRolls(actor, weapon, doctrineCritRangeBonus, attackRoll,
  weaponSkillCritDmg, weaponSkillCritPen, damageTotal, penetration, doctrineCritDmg, doctrineSkillCritPen
) {

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
    const critBonusPenetration = critPenetrationMapping[critScore] + perBonus + actorCritBonus + penetration + weaponSkillCritPen + doctrineSkillCritPen || 0;
    let critDamageTotal = critBonusDamage + perBonus + actorCritBonus + damageTotal + doctrineCritDmg;

    return {
      critScore,
      critScoreResult,
      critBonusPenetration,
      critDamageTotal
    };
}



export async function getEffectRolls(actor, weapon, doctrineBleedBonus, doctrineStunBonus, weaponSkillEffect,
  customBleed, customStun, customEffect1, customEffect2, customEffect3  
) {
  // EFFECT ROLLS (Check sharpness and bleed effect)
  let effectsRollResults = "";
  const weaponEffects = weapon.system.effects || {};
  // Get actor effects modifiers (if any)
  const actorEffects = actor.system.effects || {};
  
  let totalBleeds = 0; // To count the total number of bleed stacks
  let regularBleedRolls = [];
  let sharpBleedRolls = [];

  const customEffects = {
    "stun": customStun,
    "bleed": customBleed,
    "extra1": customEffect1,
    "extra2": customEffect2,
    "extra3": customEffect3
  };  
// Process each effect on the weapon, applying actor effect modifiers if present
for (const [effectName, effectValue] of Object.entries(weaponEffects)) {
  if (effectValue > 0) {
   // Get the modifier from actor's effects (if any)

   const modifier = actorEffects[effectName] || 0;
   const customBonus = customEffects[effectName] || 0;

   let modifiedEffectValue = effectValue + modifier + customBonus;
    if(effectName === "stun"){
      modifiedEffectValue = effectValue + modifier + customBonus + doctrineStunBonus + weaponSkillEffect;
    }
    if(effectName === "bleed"){
      modifiedEffectValue = effectValue + modifier + customBonus + doctrineBleedBonus + weaponSkillEffect;
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
  const bleedChanceDisplay = (weaponEffects.bleed || 0) + (actor.system.effects.bleed || 0)
  + (customBleed || 0)  + (weaponSkillEffect || 0) + (doctrineBleedBonus || 0);
// Only display the message if bleedChanceDisplay is greater than 0
let allBleedRollResults = "";
if (bleedChanceDisplay > (weaponSkillEffect+doctrineBleedBonus+customBleed)) {
  allBleedRollResults = `Bleed: ${[...regularBleedRolls, ...sharpBleedRolls].join(" | Sharp: ")} < ${bleedChanceDisplay}% |
    <i class="fa-regular fa-droplet fa-lg" style="color: #bd0000;"></i>  ${totalBleeds}`;
}

return {
  allBleedRollResults,
  bleedChanceDisplay,
  effectsRollResults
};
}