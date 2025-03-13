/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ToSActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as attribute modifiers rather than attribute scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.tos || {};

    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Calculate the attribute rating using ToS rules.
      attribute.mod = Math.floor(15 + (attribute.bonus + attribute.value) * 10);
    }
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);

    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Calculate the attribute rating using ToS rules.
      attribute.baseValue ??= attribute.value;
      attribute.value = attribute.baseValue + (attribute.bonus ?? 0);
    }
  
    for (let [key, attribute] of Object.entries(systemData.secondaryAttributes)) {
      // Calculate the attribute rating using ToS rules.
      attribute.baseValue ??= attribute.value;
      attribute.value = attribute.baseValue + (attribute.bonus ?? 0);
    }
    for (let [key, stat] of Object.entries(systemData.stats)) {
      // Calculate the attribute rating using ToS rules.
      stat.baseValue ??= stat.value;
      stat.value = stat.baseValue + (stat.bonus ?? 0);
    }
  

    systemData.armorTotal = 0;
    systemData.healthBonus = 0; 
    systemData.initiativeBonus = 0; 
    systemData.rerolls = {};
   
    // Iterate through gear
         for (const item of this.items) {
               if (item.type === "gear" && item.system.equipped) {
            let skill = systemData.skills;
            let combatSkill = systemData.combatSkills;
            

            systemData.armorTotal += item.system.armor.value;
            combatSkill.meleeDefense.critbonus += item.system.critDefense ?? 0;
            combatSkill.rangedDefense.critbonus += item.system.rangedCritDefense ?? 0;
            combatSkill.dodge.rating += item.system.dodgePenalty ?? 0;
            combatSkill.channeling.rating += item.system.castPenalty ?? 0;
            combatSkill.rangedDefense.rating += item.system.rangedDefense ?? 0;
            combatSkill.meleeDefense.rating += item.system.defense ?? 0;
            skill.acrobacy.rating += item.system.acroPenalty ?? 0;
            skill.athletics.swimming += item.system.swimPenalty ?? 0; // note : add swimming calculation to the skills 
            skill.stealth.rating += item.system.stealthPenalty ?? 0;

            systemData.initiativeBonus += item.system.iniPenalty ?? 0;
            systemData.secondaryAttributes.spd.max += item.system.maxSpeed ?? 0;
            systemData.healthBonus += item.system.healthBonus ?? 0; 
        }
      }


    // Iterate through gear (only helmets)
      for (const item of this.items) {
        let combatSkill = systemData.combatSkills;
        if (item.type === "gear" && item.system.equipped && item.system.helmet ) {
         combatSkill.archery.rating += item.system.archeryPenalty ?? 0;
         systemData.dodgePenalty += item.system.perPenalty ?? 0;
 }
}
    // Calculate initiative
    const calcIni = [0,0,0,1,2,3,4,5,5,5,5];
    systemData.secondaryAttributes.ini.value = calcIni[systemData.attributes.per.value] + systemData.initiativeBonus;
    // Calculate endurance and health
    const endurance = systemData.attributes.end.value; // Ensure endurance exists
    const enduranceHealth = endurance * 5;
    systemData.stats.health.max = systemData.healthBonus + enduranceHealth;
    systemData.stats.health.value = Math.min(systemData.stats.health.value, systemData.stats.health.max);  // Ensure current health doesn't exceed max






       // Define critical thresholds influenced by luck
const luck = systemData.secondaryAttributes.lck.value;
const baseCriticalSuccess = 5; // Base critical success threshold
const baseCriticalFailure = 96; // Base critical failure threshold

// Function to calculate thresholds for each skill type (e.g., skills, combatSkills)
function calculateSkillThresholds(skillsObject) {
  for (const [key, anySkill] of Object.entries(skillsObject)) {
    // Ensure skillData is defined and contains critical bonus properties
    const critBonus = anySkill.critbonus || 0;
    const critFailPenalty = anySkill.critfailpenalty || 0;

    // Calculate critical success threshold for each skill
    anySkill.criticalSuccessThreshold = Math.max(
      1,
      baseCriticalSuccess + Math.max(0, luck) + critBonus
    );

    // Calculate critical failure threshold for each skill
    anySkill.criticalFailureThreshold = Math.min(
      100,
      baseCriticalFailure - Math.max(0, -luck) - critFailPenalty
    );
  }
}

// Calculate thresholds for regular skills and combat skills
calculateSkillThresholds(systemData.skills);
calculateSkillThresholds(systemData.combatSkills);

// Global thresholds based on luck.value
this.criticalSuccessThreshold = Math.max(
  1,
  baseCriticalSuccess + Math.max(0, luck)
);

this.criticalFailureThreshold = Math.min(
  100,
  baseCriticalFailure - Math.max(0, -luck)
);

// Store thresholds in actor data if needed
actorData.criticalSuccessThreshold = this.criticalSuccessThreshold;
actorData.criticalFailureThreshold = this.criticalFailureThreshold;

// Debugging: Log all skills and combat skills
console.log("Updated Skills:", systemData.skills);
console.log("Updated Combat Skills:", systemData.combatSkills);

  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

    // Make modifications to data here. For example:
    const systemData = actorData.system; //everything else
    // Loop through attribute scores, and add their modifiers to our sheet output.

    // Debugging: Log the attributes
    console.log(systemData.attributes);


    //Loop through skill groups and add their ratings depending on their level and attribute score
    const skillset1 = [0, 15, 25, 30, 35, 45, 50, 55, 65, 75, 85];
    const skillset2 = [0, 5, 10, 15, 20, 30]; // muscles, nimbleness
    const skillset3 = [0, 25, 40, 55, 70, 85]; //riding and sailing
    const skillset4 = [0, 40, 65, 90]; //dancing, meditation
    const skillset5 = [0, 10, 20, 30, 40, 50]; //drinking
    const skillset6 = [0, 5, 10, 15, 20, 25]; //social
    const skillset7 = [0, 20, 30, 40, 50, 60]; //survival
    const combatset1 = [0, 20, 25, 30, 35, 45, 50, 60, 65, 75, 80];
    const channeling1 = [0, 20, 25, 30, 35, 45, 50, 55, 65, 70, 80];
    const channeling2 = [0, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70];
    const throwing = [0, 20, 25, 30, 35, 40, 45, 50, 55, 65, 70];
    const dodge = [0, 20, 25, 35, 40, 50, 55, 60, 65, 75, 85];
    const rangedDefenseSet = [0, 10, 20, 25, 30, 35, 40, 45, 50, 55, 60];
    const rangerGroup = [0, 20, 24, 28, 32, 42, 46, 51, 55, 65, 75];
    const ranger = systemData.combatSkills.ranger.value;
    const hasFinesse = systemData.finesse;
    const rangeddef = systemData.combatSkills.rangedDefense;
    const archery = systemData.combatSkills.archery;
    const combat = systemData.combatSkills.combat;
    const melee = systemData.combatSkills.combat.value; //Adding melee skill for better calculation of defense/throw/ranged defense
    const attributeScore = Object.values(systemData.attributes).map(
      (attribute) => attribute.value
    );

    // Iterate through skills
    for (let [key, skill] of Object.entries(systemData.skills)) {
      // Ensure skill type is valid and matches your criteria
      if (skill.type === 1) {
        // Use skill.id to find the corresponding attribute
        if(key === "athletics"){ skill.swimming += skillset1[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;}
        skill.rating += skillset1[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;
      } else if (skill.type === 2) {
        skill.rating += skillset2[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;
      } else if (skill.type === 3) {
        skill.rating += skillset3[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;
      } else if (skill.type === 4) {
        skill.rating += skillset4[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;
      } else if (skill.type === 5) {
        skill.rating += skillset5[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;
      } else if (skill.type === 6) {
        skill.rating += skillset6[skill.value] + attributeScore[skill.id] * 6 + skill.bonus;
      } else if (skill.type === 7) {
        skill.rating += skillset7[skill.value] + attributeScore[skill.id] * 3 + skill.bonus;
      }
    }
    // Iterate through combat skills
    for (let [key, combatSkill] of Object.entries(systemData.combatSkills)) {
      // Ensure skill type is valid and matches your criteria
      if (combatSkill.type === 0) {
        

      // Looking for finesse=true to use dexterity, otherwise use strength      
      // looking for ranger=true to use ranger skills instead of classic skills      
        if (hasFinesse && attributeScore[0] <= attributeScore[1]) {
          if (ranger > 0) {
            combat.finesseRating += rangerGroup[ranger] + attributeScore[1] * 3 + combatSkill.bonus;
          } else {
            combat.finesseRating += combatset1[melee] + attributeScore[1] * 3 + combatSkill.bonus;
          }
        } 
        if (combatSkill === combat){ 
            // Apply ranger bonus if applicable
         if (ranger > 0) { 
          combatSkill.rating += rangerGroup[ranger] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
        } else {
          combatSkill.rating += combatset1[melee] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
        }
      }
        if (combatSkill === rangeddef) {
          if(archery.value > combat.value && archery.value != 0 ) {combatSkill.rating += rangedDefenseSet[archery.value] }
          else if (ranger > 0) {combatSkill.rating += rangedDefenseSet[ranger] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;}
          else{combatSkill.rating += rangedDefenseSet[combat.value]}
        }  

        if (combatSkill === archery){
          if(ranger > 0){archery.rating += combatset1[ranger] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;}
          else {archery.rating += combatset1[archery.value] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
          }  
        }
      

      // Assuming steelGrip and predatorySenses are properties directly on the actor
      if (combatSkill === systemData.combatSkills.meleeDefense) {
      // Check if the actor has steelGrip enabled
        if (systemData.steelGrip) {
       combatSkill.rating += combatset1[melee] + attributeScore[0] * 3 + combatSkill.bonus;
       }
       // Check if the actor has predatorySenses enabled
         else if (systemData.predatorySenses) {
        combatSkill.rating += combatset1[melee] + attributeScore[6] * 3 + combatSkill.bonus;
         } else if (ranger > 0) { 
          combatSkill.rating += rangerGroup[ranger] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
        } else {
          combatSkill.rating += combatset1[melee] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
        }





        }

      }
      if (combatSkill.type === 1) {
        //setting ratings for dodge
        combatSkill.rating += dodge[systemData.skills.acrobacy.value] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
     
      }
      if (combatSkill.type === 2) {
        combatSkill.rating += throwing[combat.value] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
        if (hasFinesse && attributeScore[6] <= attributeScore[1]) {
        combatSkill.finesseRating = throwing[combat.value] + attributeScore[1] * 3 + combatSkill.bonus;
        }
      }
      if (combatSkill.type === 3) {
        if(combatSkill.lindar){
          combatSkill.rating += channeling2[combatSkill.value] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
        } else {
        combatSkill.rating += channeling1[combatSkill.value] + attributeScore[combatSkill.id] * 3 + combatSkill.bonus;
      }
      }

    }

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== "character") return;

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== "npc") return;

    // Process additional NPC data here.
  }
}
