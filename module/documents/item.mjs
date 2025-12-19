/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ToSItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Only initialize effectTypes for relevant items (e.g., spells, consumables)
    if (
      (this.type === "spell" ||
        this.type === "ability" ||
        this.type === "weapon") &&
      Array.isArray(this.system.effectTypes)
    ) {
      const defaultEffects = [
        "bleeding",
        "burning",
        "chain",
        "disorientation",
        "dispell",
        "flammable",
        "frozen",
        "concussion",
        "paralyzed",
        "poisoned",
        "rooted",
        "slowed",
        "stun",
        "vulnerable",
        "weakened",
        "custom",
        "wet",
      ];

      // Add any missing default effects without duplicating existing ones
      for (const effect of defaultEffects) {
        if (!this.system.effectTypes.includes(effect)) {
          this.system.effectTypes.push(effect);
        }
      }
    }

    if (this.system.roll) {
      const { diceNum, diceSize, diceBonus } = this.system.roll;

      let formula = "";

      if (this.type === "consumable" || this.type === "spell") {
        // Define a unique formula for consumables
        formula = `${diceNum}d${diceSize} ${diceBonus ? `+${diceBonus}` : ""}`;
      } else {
        // Default to Strength
        let attr = "str";

        if (this.actor) {
          let str = this.actor.system.attributes.str.total;
          let dex = this.actor.system.attributes.dex.total;
          let per = this.actor.system.attributes.per.total;

          // Check if the actor owns an item named "Finesse"
          const hasFinesse = this.actor.items.some(
            (item) => item.name.toLowerCase() === "finesse"
          );
          // Check if the actor owns an item named "Finesse"
          const hasGiant = this.actor.items.some(
            (item) => item.name.toLowerCase() === "giant"
          );

          // Check if *this* weapon has finesse
          if (this.system.finesse === true && hasFinesse && str <= dex) {
            attr = "dex"; // Use Dexterity if all conditions are met
          }

          // Check if *this* weapon is bow or crossbow
          if (this.system.class === "crossbow" || this.system.class === "bow") {
            attr = "per"; // Use Perception if ranged weapon
          }

          // Check if *this* weapon is throwing and compare str with per
          if (this.system.thrown && str <= per) {
            attr = "per";
            // Check if *this* weapon has finesse
            if (
              this.system.finesse === true &&
              hasFinesse &&
              str <= dex &&
              str <= per
            ) {
              attr = "dex"; // Use Dexterity if all conditions are met
            }
          }
          if (
            hasGiant &&
            this.system.class !== "crossbow" &&
            this.system.class !== "bow"
          ) {
            formula = `${diceNum}d${diceSize} + 1d4 ${
              diceBonus ? `+${diceBonus} + @${attr} ` : ""
            }`;
          } else {
            formula = `${diceNum}d${diceSize} ${
              diceBonus ? `+${diceBonus} + @${attr} ` : ""
            }`;
          }
          if (this.actor.type === "npc") {
            formula = `${diceNum}d${diceSize}  ${
              diceBonus ? `+${diceBonus}` : ""
            } + ${this.actor.system.combatSkills.damageBonus.value}`;
          }
        }
      }

      // Store the formula in system.formula
      this.system.formula = formula;

      // Potentially possible to add roll.total and roll.toMessage
    }
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;
    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    // Check if the item is owned by an actor
    if (this.actor) {
      rollData.actor = this.actor.getRollData();

      // Include specific actor attributes in rollData
      rollData.str = this.actor.system.attributes.str.total;
      rollData.dex = this.actor.system.attributes.dex.total;
    }

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(event) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? "",
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();
      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
