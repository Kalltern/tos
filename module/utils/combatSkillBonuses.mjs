export async function getDoctrineBonuses(actor, weapon) {

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
    console.log(`Doctrine Bonus: ${doctrineBonus}, ${doctrineCritBonus}, ${doctrineCritRangeBonus}, ${doctrineStunBonus}, ${doctrineBleedBonus}`);
    
    return {
      doctrineBonus,
      doctrineCritBonus,
      doctrineCritRangeBonus,
      doctrineStunBonus,
      doctrineBleedBonus
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

  export async function getWeaponSkillBonuses(actor, weapon) {
  // Critical success and failure thresholds
  let criticalSuccessThreshold = actor.system.combatSkills.combat.criticalSuccessThreshold + (weapon.system.critChance + doctrineCritBonus || 0);
  let criticalFailureThreshold = actor.system.combatSkills.combat.criticalFailureThreshold - (weapon.system.critFail || 0);
   // Log thresholds value to confirm
    return {
  criticalSuccessThreshold,
  criticalFailureThreshold,
};
}
