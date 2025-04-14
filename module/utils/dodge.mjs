(async () => {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;
  const weapons = actor.items.filter(i => i.type === "weapon"); 
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

    // Now you can use the selectedWeapon for the defense
    console.log(`You selected the weapon: ${weapon.name}`);


    
  // Critical success and failure thresholds
  let dodge = actor.system.combatSkills.dodge
  let criticalSuccessThreshold = dodge.criticalSuccessThreshold + (weapon.system.critDodge);
  let criticalFailureThreshold = dodge.criticalFailureThreshold;
   // Log thresholds value to confirm
  console.log("Crit thresholds for",selectedToken.actor.name,"Success", criticalSuccessThreshold,"Fail", criticalFailureThreshold);

  // Deduct stamina
let stamina = actor.system.stats.stamina.value ?? 0;
let staminaCost = 4;
// Check if the actor has enough stamina
if (stamina >= staminaCost) {
  let newStamina = stamina - staminaCost;
  actor.update({ "system.stats.stamina.value": newStamina });
} else {
  ui.notifications.warn("Not enough stamina!");
  return; 
}
let newStamina = Math.max(0, stamina - staminaCost);
actor.update({ "system.stats.stamina.value": newStamina });

  // Roll data setup
  const rollName = this.name;
  const rollData = {
    combatSkills: actor.system.combatSkills,
     dex: actor.system.attributes.dex.value,
      
   };
     // DEFENSE ROLL
  const defenseRollFormula = `@combatSkills.dodge.rating + @weaponDodge - 1d100`;
  
  const defenseRoll = new Roll(defenseRollFormula, rollData);
  await defenseRoll.evaluate();
  const rollResult = defenseRoll.dice[0].results[0].result;
  
  const critSuccess = rollResult <= criticalSuccessThreshold;
  const critFailure = rollResult >= criticalFailureThreshold;
  let deflectChance = 0;
  if (actor.system.dodgeDeflect) {
    deflectChance = criticalSuccessThreshold * 2
  }
  const deflect = !critSuccess && rollResult <= deflectChance || 0;
  const armor = actor.system.armorTotal;
  const acidArmor = actor.system.acidArmor;
  const fireArmor = actor.system.fireArmor;
  const frostArmor = actor.system.frostArmor;
  const lightningArmor = actor.system.lightningArmor;
  // Prepared for deflect
 
  
  // Prepare the armor details for display
  let armorText = `
    <table style="width: 100%; text-align: center; font-size: 15px;">
    <tr>
      <th>Type</th>
      <th>Value</th>
    </tr>
`;


// Add rows for each armor type if the value is greater than 0
if (armor >= 0) {
  armorText += `<tr><td>Armor</td><td>${armor}</td></tr>`;
}
if (acidArmor > 0) {
  armorText += `<tr><td>Acid Armor</td><td>${acidArmor}</td></tr>`;
}
if (fireArmor > 0) {
  armorText += `<tr><td>Fire Armor</td><td>${fireArmor}</td></tr>`;
}
if (frostArmor > 0) {
  armorText += `<tr><td>Frost Armor</td><td>${frostArmor}</td></tr>`;
}
if (lightningArmor > 0) {
  armorText += `<tr><td>Lightning Armor</td><td>${lightningArmor}</td></tr>`;
}
if (actor.system.dodgeDeflect) {
  armorText += `<tr><td>Deflect Chance</td><td>${deflectChance}</td></tr>`;
}

// Close the table tag
armorText += `</table>`;

  
  // Send the chat message
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    rolls: [defenseRoll], 
    flavor: `
    <h2>
      <img src="${weapon.img}" title="${weapon.name}" width="36" height="36" style="vertical-align: middle; margin-right: 8px;"> Dodge
    </h2>
    <p style="text-align: center; font-size: 20px;"><b>
      ${deflect && actor.system.dodgeDeflect  ? "Deflect" :critSuccess ? "Critical Success!" : critFailure ? "Critical Failure!" : ""}
    </b></p>
    ${armorText}
    <hr>
    `,
    flags: {
      rollName,
      deflectChance,
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