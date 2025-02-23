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
  
    if (this.system.roll) {
      const { diceNum, diceSize, diceBonus } = this.system.roll;
  
      // Default to Strength
      let attr = "str";
  
      if (this.actor) {
        let str = this.actor.system.attributes.str.value;
        let dex = this.actor.system.attributes.dex.value;
  
        // Retrieve STUN & BLEED from the weapon
        const stun = this.system.roll?.effects.stun || 0;   // Default to 0 if undefined
        const bleed = this.system.roll?.effects.bleed || 0; // Default to 0 if undefined
  
        // Check if the actor owns an item named "Finesse"
        const hasFinesse = this.actor.items.some(item => item.name.toLowerCase() === "finesse");
  
        // Check if *this* weapon has finesse
        if (this.system.weapon?.finesse === true && hasFinesse && str <= dex) {
          attr = "dex";  // Use Dexterity if all conditions are met
        }
  
        // Define the formula (without stun/bleed effects)
        let formula = `${diceNum}d${diceSize} + @${attr} ${diceBonus ? `+${diceBonus}` : ''}`;
  
        // Store the main formula for the main roll
        this.system.formula = formula;
  
        // Store stun and bleed rolls separately for later use
        this.system.effectRolls = {
          stun: stun > 0 ? `${stun} - 1d100` : null,
          bleed: bleed > 0 ? `${bleed} - 1d100` : null
        };
      }
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
    rollData.str = this.actor.system.attributes.str.value;
    rollData.dex = this.actor.system.attributes.dex.value;
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
