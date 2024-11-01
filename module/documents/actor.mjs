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
   * (such as ability modifiers rather than ability scores) and should be
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
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Calculate the ability rating using ToS rules.
      ability.mod = Math.floor(15 + ability.value * 10);
    }
    // Debugging: Log the abilities
    console.log(systemData.abilities);
    // Calculate endurance
    const endurance = systemData.abilities.end.value; // Ensure endurance exists
    console.log("Endurance value:", endurance); // Log endurance value
    // Set health correctly under stats
    systemData.stats.health.max += endurance * 5; // Set health based on endurance

    //Loop through skill groups and add their ratings depending on their level and ability score
    const skillset1 = [0, 15, 25, 30, 35, 45, 50, 55, 65, 75, 85];
    const skillset2 = [0, 5, 10, 15, 20, 30]; // muscles, nimbleness
    const skillset3 = [0, 25, 40, 55, 70, 85]; //riding and sailing
    const skillset4 = [0, 40, 65, 90]; //dancing, meditation
    const skillset5 = [0, 10, 20, 30, 40, 50]; //drinking
    const skillset6 = [0, 5, 10, 15, 20, 25]; //social
    const skillset7 = [0, 20, 30, 40, 50, 60]; //survival
    const abilityScore = Object.keys(systemData.abilities).map(
      (key) => systemData.abilities[key].value
    );

    // Iterate through skills
    for (let [key, skill] of Object.entries(systemData.skills)) {
      // Ensure skill type is valid and matches your criteria
      if (skill.type === 1) {
        // Use skill.id to find the corresponding ability
        skill.rating += skillset1[skill.value] + abilityScore[skill.id] * 3;
      } else if (skill.type === 2) {
        skill.rating += skillset2[skill.value] + abilityScore[skill.id] * 3;
      } else if (skill.type === 3) {
        skill.rating += skillset3[skill.value] + abilityScore[skill.id] * 3;
      } else if (skill.type === 4) {
        skill.rating += skillset4[skill.value] + abilityScore[skill.id] * 3;
      } else if (skill.type === 5) {
        skill.rating += skillset5[skill.value] + abilityScore[skill.id] * 3;
      } else if (skill.type === 6) {
        skill.rating += skillset6[skill.value] + abilityScore[skill.id] * 6;
      } else if (skill.type === 7) {
        skill.rating += skillset7[skill.value] + abilityScore[skill.id] * 3;
      }
    }

    // Debugging: Log the skills
    console.log("Updated Skills:", systemData.skills);
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

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
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
