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


    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);




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

  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

  // Make modifications to data here. For example:
    const systemData = actorData.system; //everything else
    // Loop through attribute scores, and add their modifiers to our sheet output.
        for (let [key, attribute] of Object.entries(systemData.attributes)) {
        attribute.total = attribute.value + attribute.bonus;
    }    
    for (let [key, attribute] of Object.entries(systemData.secondaryAttributes)) {
      // Calculate the attribute rating using ToS rules.
        attribute.total = attribute.value + (attribute.bonus ?? 0);
    }
    for (let [key, stat] of Object.entries(systemData.stats)) {
      // Calculate the attribute rating using ToS rules.
        stat.total = stat.max + (stat.bonus ?? 0);
    }
    for (let [key, attribute] of Object.entries(systemData.attributes)) {
      // Calculate the attribute rating using ToS rules.
      attribute.mod = Math.floor(15 + (attribute.bonus + attribute.value) * 10);
    }


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
    const attributeScore = Object.entries(systemData.attributes).map(([key, attribute]) => ({
      total: attribute.value + (attribute.bonus ?? 0), // Combine value and bonus
    }));
    

    // Iterate through skills
    for (let [key, skill] of Object.entries(systemData.skills)) {
      // Ensure skill type is valid and matches your criteria
      if (skill.type === 1) {
        // Use skill.id to find the corresponding attribute
        if(key === "athletics"){ skill.swimming += skillset1[skill.value] + (attributeScore[skill.id].total ) * 3 + skill.bonus;}
        skill.rating += skillset1[skill.value] + (attributeScore[skill.id].total )* 3 + skill.bonus;
      } else if (skill.type === 2) {
        skill.rating += skillset2[skill.value] + (attributeScore[skill.id].total ) * 3 + skill.bonus;
      } else if (skill.type === 3) {
        skill.rating += skillset3[skill.value] + (attributeScore[skill.id].total ) * 3 + skill.bonus;
      } else if (skill.type === 4) {
        skill.rating += skillset4[skill.value] + (attributeScore[skill.id].total ) * 3 + skill.bonus;
      } else if (skill.type === 5) {
        skill.rating += skillset5[skill.value] + (attributeScore[skill.id].total ) * 3 + skill.bonus;
      } else if (skill.type === 6) {
        skill.rating += skillset6[skill.value] + (attributeScore[skill.id].total ) * 6 + skill.bonus;
      } else if (skill.type === 7) {
        skill.rating += skillset7[skill.value] + (attributeScore[skill.id].total ) * 3 + skill.bonus;
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
            combat.finesseRating += rangerGroup[ranger] + attributeScore[1].total * 3 + combatSkill.bonus;
          } else {
            combat.finesseRating += combatset1[melee] + attributeScore[1].total * 3 + combatSkill.bonus;
          }
        } 
        if (combatSkill === combat){ 
            // Apply ranger bonus if applicable
         if (ranger > 0) { 
          combatSkill.rating += rangerGroup[ranger] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
        } else {
          combatSkill.rating += combatset1[melee] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
        }
      }
        if (combatSkill === rangeddef) {
          if(archery.value > combat.value && archery.value != 0 ) {combatSkill.rating += rangedDefenseSet[archery.value] }
          else if (ranger > 0) {combatSkill.rating += rangedDefenseSet[ranger] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;}
          else{combatSkill.rating += rangedDefenseSet[combat.value]}
        }  

        if (combatSkill === archery){
          if(ranger > 0){archery.rating += combatset1[ranger] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;}
          else {archery.rating += combatset1[archery.value] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
          }  
        }
      

      // Assuming steelGrip and predatorySenses are properties directly on the actor
      if (combatSkill === systemData.combatSkills.meleeDefense) {
      // Check if the actor has steelGrip enabled
        if (systemData.steelGrip) {
       combatSkill.rating += combatset1[melee] + attributeScore[0].total * 3 + combatSkill.bonus;
       }
       // Check if the actor has predatorySenses enabled
         else if (systemData.predatorySenses) {
        combatSkill.rating += combatset1[melee] + attributeScore[6].total * 3 + combatSkill.bonus;
         } else if (ranger > 0) { 
          combatSkill.rating += rangerGroup[ranger] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
        } else {
          combatSkill.rating += combatset1[melee] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
        }





        }

      }
      if (combatSkill.type === 1) {
        //setting ratings for dodge
        combatSkill.rating += dodge[systemData.skills.acrobacy.value] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
     
      }
      if (combatSkill.type === 2) {
        combatSkill.rating += throwing[combat.value] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
        if (hasFinesse && attributeScore[6] <= attributeScore[1]) {
        combatSkill.finesseRating = throwing[combat.value] + attributeScore[1].total * 3 + combatSkill.bonus;
        }
      }
      if (combatSkill.type === 3) {
        if(combatSkill.lindar){
          combatSkill.rating += channeling2[combatSkill.value] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
        } else {
        combatSkill.rating += channeling1[combatSkill.value] + attributeScore[combatSkill.id].total * 3 + combatSkill.bonus;
      }
      }

    }


    // Prepare secondary attributes and stat calculations
    const secAttribute = systemData.secondaryAttributes;
    const stat = systemData.stats;
    const attribute = systemData.attributes;
    const str = attribute.str.total;
    const dex = attribute.dex.total;
    const end = attribute.end.total;
    const int = attribute.int.total;
    const wil = attribute.wil.total;
    const per = attribute.per.total;

    
    // Calculate initiative
    const calcIni = [0,0,0,1,2,3,4,5,5,5,5];
    secAttribute.ini.total = calcIni[per] + (systemData.initiativeBonus || 0) + secAttribute.ini.value + secAttribute.ini.bonus;


    // Calculate speed
     const calcSpd = [0,3,3,4,4,4,5,5,6,6,6];
     secAttribute.spd.total = stat.fatigue.value >= 5 
     ? 1 
     : (calcSpd[dex] + secAttribute.spd.value + secAttribute.spd.bonus - (stat.fatigue.value >= 3 ? 1 : 0));
     // Calculate resolve from endurance and will
     const calcResEnd = [0,0,0,1,1,1,2,3,3,3,3];
     const calcResWill = [0,0,0,1,2,2,3,3,3,3,3];
     secAttribute.res.total = calcResEnd[end] + calcResWill[wil] + secAttribute.res.value + secAttribute.res.bonus;
    // Calculate wounds
    const calcWounds = [0,0,0,0,1,1,1,2,2,2,2];
    stat.graveWounds.total = calcWounds[end] + stat.graveWounds.max + stat.graveWounds.bonus;
    // Calculate critRanges
    const calcCritRange = [0,0,0,0,1,1,2,3,3,3,3];
    systemData.critRangeMelee = calcCritRange[str] + calcCritRange[per];
    systemData.critRangeRanged = calcCritRange[per];
    systemData.critRangeCast = calcCritRange[int];
    // Calculate misc
    secAttribute.lck.total = secAttribute.lck.value + secAttribute.lck.bonus;
    secAttribute.vis.total = secAttribute.vis.value + secAttribute.vis.bonus;
    secAttribute.sin.total = secAttribute.sin.value + secAttribute.sin.bonus;
    secAttribute.fth.total = secAttribute.fth.value + secAttribute.fth.bonus;
    stat.corruption.total = stat.corruption.max + stat.corruption.bonus;
    stat.fatigue.total = stat.fatigue.max + stat.fatigue.bonus;
    if (systemData.priest){
    stat.holyEnergy.total = stat.holyEnergy.max + stat.holyEnergy.bonus + (secAttribute.fth.total * 5);
    stat.holyEnergy.power = secAttribute.fth.total + (stat.holyEnergy.power.bonus || 0);
    }
    
    stat.mind.total = wil + stat.mind.bonus + stat.mind.max;
    stat.insanity.total = wil + stat.insanity.bonus + stat.insanity.max;

    
    // Calculate Health, systemData.healthBonus comes from Armor
    systemData.stats.health.total =  ((end) * attribute.end.rank) + stat.health.max + stat.health.bonus + (str) + (systemData.healthBonus || 0);
    // Calculate toxicity
  systemData.stats.toxicity.total = ((end) * 2) + stat.toxicity.bonus + stat.toxicity.max;

    // Calculate stamina
   systemData.stats.stamina.total = ((end) * 5) + stat.stamina.bonus + stat.stamina.max + (2 * systemData.skills.athletics.value) - (5 * stat.fatigue.value);


    
 
    // Calculate mana
    if(systemData.magicPotential){
      const channeling = systemData.combatSkills.channeling.value;
      const calcCast = [0,0,3,6,9,9,9,9,9,9,9];
      const calcSchool =[0,0,0,1,1,1,1,1,1,1,1];
      let schoolBonus = 0;
      const spellPowerSchool = [0,0,1,2,3,4,4,5,5,6,8];
      for (const [key, school] of Object.entries(systemData.schools)) {
        if (key !== "blood") { 
            schoolBonus += calcSchool[school.value]; // Add based on school value
            school.spellPower = spellPowerSchool[school.value] + school.bonus;
        }
    }
      let magicDoctrine = systemData.doctrines;
      const maxValue = Math.max(
        magicDoctrine.elymas.value,
        magicDoctrine.incantator.value,
        magicDoctrine.veneficus.value,
        magicDoctrine.elementalist.value
      );
      const calcElymas = [1,2.5,2.5,2.5,3,3,3.5,3.5,4,4,4];
      const calcIncantator = [1,5,5,5,8,8,10,10,12,12,12];
      const calcElementalist = [1,2,2,2,2,4,4,6,6,6,8];
      const calcVeneficus = [1,1,1,1,1,1.5,1.5,1.5,1.5,1.5,1.5];
      
      if (magicDoctrine.elymas.value === maxValue && systemData.elymas) {
        systemData.stats.mana.total = 
        (calcCast[channeling] + int + wil + schoolBonus + stat.mana.bonus + stat.mana.max - (3 * stat.fatigue.value)) 
        * calcElymas[magicDoctrine.elymas.value]  ;

      }
      if (magicDoctrine.incantator.value === maxValue && systemData.incantator) {
        (calcCast[channeling] + int + wil + schoolBonus + stat.mana.bonus + stat.mana.max - (3 * stat.fatigue.value)) 
        * calcIncantator[magicDoctrine.incantator.value]  ;
      }
      if (magicDoctrine.elementalist.value === maxValue && systemData.elementalist) {
        systemData.stats.mana.total = 
        (calcCast[channeling] + int + wil + schoolBonus + stat.mana.bonus + stat.mana.max - (3 * stat.fatigue.value))
        * calcElementalist[magicDoctrine.elementalist.value]  ;
        

      }
      if (magicDoctrine.veneficus.value === maxValue && systemData.veneficus) {
        systemData.stats.mana.total = 
        (calcCast[melee] + int + wil + schoolBonus + stat.mana.bonus + stat.mana.max - (3 * stat.fatigue.value))
        * calcVeneficus[magicDoctrine.veneficus.value]  ;

      }
      // prevent mana to go below 0
      systemData.stats.mana.total = Math.max(systemData.stats.mana.total, systemData.stats.mana.min);

      

  }


    // Prevent current health exceed max
    systemData.stats.health.value = Math.min(systemData.stats.health.value, systemData.stats.health.total); 
    systemData.stats.stamina.value = Math.min(systemData.stats.stamina.value, systemData.stats.stamina.total);  
    systemData.stats.toxicity.value = Math.min(systemData.stats.toxicity.value, systemData.stats.toxicity.total);  
    systemData.stats.mana.value = Math.min(systemData.stats.mana.value, systemData.stats.mana.total);   

   // Define critical thresholds influenced by luck
    const luck = secAttribute.lck.value;
    const baseCriticalSuccess = 5; // Base critical success threshold
    const baseCriticalFailure = 96 - stat.fatigue.value; // Base critical failure threshold

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

    // Calculate thresholds for regular skills and combat skills and attributes
    calculateSkillThresholds(systemData.skills);
    calculateSkillThresholds(systemData.combatSkills);
    calculateSkillThresholds(systemData.attributes);

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
