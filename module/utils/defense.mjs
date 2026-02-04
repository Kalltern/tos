export async function defenseRoll({ actor, weapon, ability = null } = {}) {
  const selectedToken = canvas.tokens.controlled[0];

  if (!actor) {
    if (!selectedToken) {
      ui.notifications.warn("Please select a token.");
      return;
    }
    actor = selectedToken.actor;
  }

  /* -------------------------------------------- */
  /*  SHARED CSS                                  */
  /* -------------------------------------------- */

  const css = `
  #weapon-list .weapon-choice {
    position: relative;
    font-size: 16px;
    color: black;
  }

  #weapon-list .weapon-choice:hover {
    color: black;
    text-shadow: 0 0 1px red, 0 0 2px red;
  }

  .weapon-dialog .window-content {
    max-width: 300px;
    width: 100%;
  }

  .weapon-dialog .window {
    width: auto;
  }
  `;

  if (!document.getElementById("tos-defense-css")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "tos-defense-css";
    styleSheet.type = "text/css";
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);
  }

  /* -------------------------------------------- */
  /*  Overwrite the logic if the ability is given */
  /* -------------------------------------------- */
  if (ability) {
    if (ability.system?.rangedDefense != null) {
      return rangedDefense({ ability, weapon });
    }

    if (ability.system?.dodge != null) {
      return dodgeDefense({ ability, weapon });
    }

    if (ability.system?.defense != null) {
      return meleeDefense({ ability, weapon });
    }
  }

  /* -------------------------------------------- */
  /*  DEFENSE SELECTOR                            */
  /* -------------------------------------------- */
  if (!ability) {
    new Dialog({
      title: "Select Defense Type",
      content: "<p>Choose defense:</p>",
      buttons: {
        melee: {
          label: "Melee Defense",
          callback: () => meleeDefense({}),
        },
        ranged: {
          label: "Ranged Defense",
          callback: () => rangedDefense({}),
        },
        dodge: {
          label: "Dodge",
          callback: () => dodgeDefense({}),
        },
      },
      default: "melee",
    }).render(true);
  }

  /* -------------------------------------------- */
  /*  WEAPON DIALOG                               */
  /* -------------------------------------------- */

  function showWeaponDialog(weapons, onSelect) {
    new Dialog({
      title: "Select Weapon",
      content: `
      <form>
        <fieldset>
          <ul id="weapon-list" style="list-style:none;padding:0;">
            ${weapons
              .map(
                (weapon, index) => `
                <li class="weapon-choice"
                    data-value="${index}"
                    style="cursor:pointer;padding:5px;border-bottom:1px solid #444;">
                  ${weapon.name}
                </li>`,
              )
              .join("")}
          </ul>
        </fieldset>
      </form>
      `,
      buttons: {},
      resizable: true,
      width: 200,
      height: 100,
      render: (html) => {
        html.find("#weapon-list li").click(async (event) => {
          const index = Number(event.currentTarget.dataset.value);
          await onSelect(index);
        });
      },
    }).render(true);
  }
  /* -------------------------------------------- */
  /*  MELEE DEFENSE                               */
  /* -------------------------------------------- */

  async function meleeDefense({ ability = null, weapon = null } = {}) {
    const resolveWithWeapon = async (weapon) => {
      const rollName = `Defense with ${weapon.name}`;

      const { doctrineCritDefenseBonus, doctrineDefenseBonus } =
        await game.tos.getDoctrineBonuses(actor, weapon);

      const defense = actor.system.combatSkills.meleeDefense;
      const defenseRating = defense.rating;
      const abilityDefense = ability?.system?.defense ?? 0;

      const criticalSuccessThreshold =
        defense.criticalSuccessThreshold +
        weapon.system.critDefense +
        doctrineCritDefenseBonus;

      const criticalFailureThreshold = defense.criticalFailureThreshold;

      const rollData = {
        defenseRating,
        weaponDefense: weapon.system.defense ?? 0,
        doctrineDefenseBonus,
        abilityDefense,
      };

      const roll = new Roll(
        "@defenseRating + @weaponDefense + @doctrineDefenseBonus + @abilityDefense - 1d100",
        rollData,
      );

      await roll.evaluate();

      await createDefenseChatMessage(
        roll,
        weapon,
        rollName,
        criticalSuccessThreshold,
        criticalFailureThreshold,
      );
    };

    /* -------------------------------------------- */
    /*  IF WEAPON ALREADY KNOWN → SKIP DIALOG       */
    /* -------------------------------------------- */
    if (weapon) {
      return resolveWithWeapon(weapon);
    }

    /* -------------------------------------------- */
    /*  OTHERWISE → ASK PLAYER                     */
    /* -------------------------------------------- */
    const weapons = actor.items.filter(
      (i) =>
        i.type === "weapon" &&
        ["axe", "sword", "blunt", "polearm"].includes(i.system.class) &&
        i.system.thrown !== true,
    );

    if (!weapons.length) {
      ui.notifications.warn("This actor has no melee weapons.");
      return;
    }

    showWeaponDialog(weapons, async (index) => {
      await resolveWithWeapon(weapons[index]);
    });
  }

  /* -------------------------------------------- */
  /*  RANGED DEFENSE                              */
  /* -------------------------------------------- */

  async function rangedDefense({ ability = null, weapon = null } = {}) {
    const resolveWithWeapon = async (weapon) => {
      const rollName = `Ranged defense with ${weapon.name}`;

      const { doctrineCritDefenseBonus, doctrineRangedDefenseBonus } =
        await game.tos.getDoctrineBonuses(actor, weapon);

      const defense = actor.system.combatSkills.rangedDefense;
      const abilityDefense = ability?.system?.rangedDefense ?? 0;

      const criticalSuccessThreshold =
        defense.criticalSuccessThreshold + doctrineCritDefenseBonus;

      const criticalFailureThreshold = defense.criticalFailureThreshold;

      const rollData = {
        defenseRating: defense.rating,
        doctrineRangedDefenseBonus,
        abilityDefense,
      };

      const roll = new Roll(
        "@defenseRating + @doctrineRangedDefenseBonus + @abilityDefense - 1d100",
        rollData,
      );

      await roll.evaluate();

      await createDefenseChatMessage(
        roll,
        weapon,
        rollName,
        criticalSuccessThreshold,
        criticalFailureThreshold,
      );
    };

    /* -------------------------------------------- */
    /*  IF WEAPON ALREADY KNOWN → SKIP DIALOG       */
    /* -------------------------------------------- */
    if (weapon) {
      return resolveWithWeapon(weapon);
    }

    /* -------------------------------------------- */
    /*  OTHERWISE → ASK PLAYER                     */
    /* -------------------------------------------- */
    const weapons = actor.items.filter((i) => i.type === "weapon");

    if (!weapons.length) {
      ui.notifications.warn("This actor has no weapons.");
      return;
    }

    showWeaponDialog(weapons, async (index) => {
      await resolveWithWeapon(weapons[index]);
    });
  }

  /* -------------------------------------------- */
  /*  DODGE DEFENSE                               */
  /* -------------------------------------------- */

  async function dodgeDefense({ ability = null, weapon = null } = {}) {
    const resolveWithWeapon = async (weapon) => {
      const rollName = `Dodge with ${weapon.name}`;

      const dodge = actor.system.combatSkills.dodge;
      const abilityDefense = ability?.system?.dodge ?? 0;

      const criticalSuccessThreshold =
        dodge.criticalSuccessThreshold + weapon.system.critDodge;

      const criticalFailureThreshold = dodge.criticalFailureThreshold;

      const staminaCost = 4;
      const stamina = actor.system.stats.stamina.value ?? 0;

      if (stamina < staminaCost) {
        ui.notifications.warn("Not enough stamina!");
        return;
      }

      await actor.update({
        "system.stats.stamina.value": stamina - staminaCost,
      });

      const rollData = {
        dodgeRating: dodge.rating,
        weaponDodge: weapon.system.dodge ?? 0,
        abilityDefense,
      };

      const roll = new Roll(
        "@dodgeRating + @weaponDodge + @abilityDefense - 1d100",
        rollData,
      );

      await roll.evaluate();

      await createDefenseChatMessage(
        roll,
        weapon,
        rollName,
        criticalSuccessThreshold,
        criticalFailureThreshold,
      );
    };

    /* -------------------------------------------- */
    /*  IF WEAPON ALREADY KNOWN → SKIP DIALOG       */
    /* -------------------------------------------- */
    if (weapon) {
      return resolveWithWeapon(weapon);
    }

    /* -------------------------------------------- */
    /*  OTHERWISE → ASK PLAYER                     */
    /* -------------------------------------------- */
    const weapons = actor.items.filter((i) => i.type === "weapon");

    if (!weapons.length) {
      ui.notifications.warn("This actor has no weapons.");
      return;
    }

    showWeaponDialog(weapons, async (index) => {
      await resolveWithWeapon(weapons[index]);
    });
  }

  /* -------------------------------------------- */
  /*  CHAT MESSAGE                                */
  /* -------------------------------------------- */

  async function createDefenseChatMessage(
    roll,
    weapon,
    rollName,
    criticalSuccessThreshold,
    criticalFailureThreshold,
  ) {
    const rollResult = roll.dice[0].results[0].result;

    const critSuccess = rollResult <= criticalSuccessThreshold;
    const critFailure = rollResult >= criticalFailureThreshold;

    const armor = actor.system.armor;

    const armorRows = [
      ["Armor", armor.total],
      ["Acid Armor", armor.acid.total],
      ["Fire Armor", armor.fire.total],
      ["Frost Armor", armor.frost.total],
      ["Lightning Armor", armor.lightning.total],
      ["Magic Armor", armor.magic.total],
    ].filter(([, value]) => value > 0);

    const armorTable = `
      <table style="width:100%;text-align:center;font-size:15px;">
        <tr><th>Type</th><th>Value</th></tr>
        ${armorRows
          .map(
            ([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`,
          )
          .join("")}
      </table>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      rolls: [roll],
      flavor: `
        <div style="display:flex;align-items:center;gap:8px;font-size:1.3em;font-weight:bold;">
          <img src="${weapon.img}" width="36" height="36">
          <span>${rollName}</span>
        </div>
        <hr>
        <p style="text-align:center;font-size:20px;"><b>
          ${
            critSuccess
              ? "Critical Success!"
              : critFailure
                ? "Critical Failure!"
                : ""
          }
        </b></p>
        ${armorTable}        
      `,
      flags: {
        tos: {
          rollName,
          criticalSuccessThreshold,
          criticalFailureThreshold,
        },
      },
    });
  }
}
