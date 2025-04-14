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

  // Custom Bonuses and extra %
  // For damage you can use string like '3d6+1d4+5'
  const customDamage = 0; 
  const customAttack = 0; 
  const customBleed = 0; 
  const customStun = 0; 
  const customEffect1 = 0; 
  const customEffect2 = 0; 
  const customEffect3 = 0; 

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

    const {
      doctrineBonus,
      doctrineCritBonus,
      doctrineCritRangeBonus,
      doctrineStunBonus,
      doctrineBleedBonus
    } = await game.tos.getDoctrineBonuses(actor, weapon);
    console.log("Doctrine crit bonus", doctrineCritBonus);


    const {
      weaponSkillEffect,
      weaponSkillCrit,
      weaponSkillCritDmg,
      weaponSkillCritPen
    } = await game.tos.getWeaponSkillBonuses(actor, weapon);
  console.log("Weapon skill effect", weaponSkillEffect);

  // Calculate penetration (future expansion possible)
  const penetration = (weapon.system.penetration || 0) + 0;


  // ATTACK ROLL +  Critical success and failure thresholds
  const {
    attackRoll,
    critSuccess,
    critFailure,
    criticalSuccessThreshold,
    criticalFailureThreshold,
    rollName
  } = await game.tos.getAttackRolls(actor, weapon, doctrineBonus, doctrineCritBonus, weaponSkillCrit, customAttack);
  
   // Log thresholds value to confirm
   console.log("Crit thresholds for",selectedToken.actor.name,"Success", criticalSuccessThreshold,"Fail", criticalFailureThreshold);

  // DAMAGE ROLL
  const {
    damageRoll,
    damageTotal,
    breakthroughRollResult
  } = await game.tos.getDamageRolls(actor, weapon, customDamage);
  
 // EFFECTS ROLL
  const {
    allBleedRollResults,
    bleedChanceDisplay,
    effectsRollResults,
  } = await game.tos.getEffectRolls(actor, weapon, doctrineBleedBonus, doctrineStunBonus, weaponSkillEffect,
    customBleed, customStun, customEffect1, customEffect2, customEffect3 
  );
  
console.log("bleed, weaponSKill,DoctrineBleed", bleedChanceDisplay, weaponSkillEffect, doctrineBleedBonus);



  // CRITICAL SCORE ROLL (only in flavor text)
  const {
    critScore,
    critScoreResult,
    critBonusPenetration,
    critDamageTotal
  } = await game.tos.getCriticalRolls(actor, weapon, doctrineCritRangeBonus, attackRoll,
    weaponSkillCritDmg, weaponSkillCritPen, damageTotal, penetration
  );
  
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