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
      // Calculate the attribute rating using ToS rules.
      attribute.mod = Math.floor(15 + attribute.value * 10);
    }
    // Debugging: Log the attributes
    console.log(systemData.attributes);
    // Calculate endurance
    const endurance = systemData.attributes.end.value; // Ensure endurance exists
    // Set health correctly under stats
    systemData.stats.health.max = endurance * 5; // Set health based on endurance

    //Loop through skill groups and add their ratings depending on their level and attribute score
    const skillset1 = [0, 15, 25, 30, 35, 45, 50, 55, 65, 75, 85];
    const skillset2 = [0, 5, 10, 15, 20, 30]; // muscles, nimbleness
    const skillset3 = [0, 25, 40, 55, 70, 85]; //riding and sailing
    const skillset4 = [0, 40, 65, 90]; //dancing, meditation
    const skillset5 = [0, 10, 20, 30, 40, 50]; //drinking
    const skillset6 = [0, 5, 10, 15, 20, 25]; //social
    const skillset7 = [0, 20, 30, 40, 50, 60]; //survival
    const combatset1 = [0, 20, 25, 30, 35, 45, 50, 60, 65, 75, 80];
    const attributeScore = Object.values(systemData.attributes).map(
      (attribute) => attribute.value
    );

    // Iterate through skills
    for (let [key, skill] of Object.entries(systemData.skills)) {
      // Ensure skill type is valid and matches your criteria
      if (skill.type === 1) {
        // Use skill.id to find the corresponding attribute

        skill.rating = skillset1[skill.value] + attributeScore[skill.id] * 3;
      } else if (skill.type === 2) {
        skill.rating = skillset2[skill.value] + attributeScore[skill.id] * 3;
      } else if (skill.type === 3) {
        skill.rating = skillset3[skill.value] + attributeScore[skill.id] * 3;
      } else if (skill.type === 4) {
        skill.rating = skillset4[skill.value] + attributeScore[skill.id] * 3;
      } else if (skill.type === 5) {
        skill.rating = skillset5[skill.value] + attributeScore[skill.id] * 3;
      } else if (skill.type === 6) {
        skill.rating = skillset6[skill.value] + attributeScore[skill.id] * 6;
      } else if (skill.type === 7) {
        skill.rating = skillset7[skill.value] + attributeScore[skill.id] * 3;
      }
    }
    // Iterate through combat skills
    for (let [key, combat_skill] of Object.entries(systemData.combat_skills)) {
      // Ensure skill type is valid and matches your criteria
      if (combat_skill.type === 1) {
        // Use skill.id to find the corresponding attribute

        combat_skill.rating =
          combatset1[combat_skill.value] + attributeScore[combat_skill.id] * 3;
      }
    }

    // Define critical thresholds influenced by luck
    const luck = systemData.secondaryAttributes.lck.value;
    const baseCriticalSuccess = 5; // Base critical success threshold
    const baseCriticalFailure = 96; // Base critical failure threshold

    // Function to calculate thresholds for each skill type (e.g., skills, combat_skills)
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

        // Debug output to verify each skill's calculated thresholds
        console.log(
          `Skill ${key}: Critical Success Threshold ${anySkill.criticalSuccessThreshold}, Critical Failure Threshold ${anySkill.criticalFailureThreshold}`
        );
      }
    }

    // Calculate thresholds for regular skills and combat skills
    console.log('Calling calculateSkillThresholds() for skills');
    calculateSkillThresholds(systemData.skills);
    calculateSkillThresholds(systemData.combat_skills);

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
    console.log(`After update: ${key} - Success Threshold: ${anySkill.criticalSuccessThreshold}, Failure Threshold: ${anySkill.criticalFailureThreshold}`);


    // Debugging: Log all skills and combat skills
    console.log("Updated Skills:", systemData.skills);
    console.log("Updated Combat Skills:", systemData.combat_skills);
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
