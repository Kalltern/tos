(async () => {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }
  const actor = selectedToken.actor;

  const spells = actor.items.filter((i) => i.type === "spell");
  if (!spells.length) {
    ui.notifications.warn("This actor has no spells.");
    return;
  }

  // Pretty names for schools
  const SCHOOL_NAMES = {
    fire: "Fire Magic",
    water: "Water Magic",
    air: "Air Magic",
    earth: "Earth Magic",
    spirit: "Spirit Magic",
    body: "Body Magic",
    darkness: "Darkness Magic",
    blood: "Blood Magic",
    gnosis: "Gnosis Magic",
  };

  // Unique, recognized schools only
  const schools = [...new Set(spells.map((s) => s.system?.type))]
    .filter((k) => k && SCHOOL_NAMES[k])
    .sort((a, b) => SCHOOL_NAMES[a].localeCompare(SCHOOL_NAMES[b]));

  if (!schools.length) {
    ui.notifications.warn("This actor has no recognized spell schools.");
    return;
  }

  // ---- Shared CSS (fixed selectors) ----
  if (!document.getElementById("custom-spell-dialog-css")) {
    const style = document.createElement("style");
    style.id = "custom-spell-dialog-css";
    style.textContent = `
      /* Applies to both dialogs via classes option */
      .custom-dialog .window-content {
        max-width: 360px;
        width: 100%;
      }
      .custom-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .custom-list .choice {
        position: relative;
        font-size: 16px;
        color: black;
        cursor: pointer;
        padding: 6px 8px;
        border-bottom: 1px solid #444;
      }
      .custom-list .choice:hover {
        color: black;
        text-shadow: 0 0 1px red, 0 0 2px red;
      }
    `;
    document.head.appendChild(style);
  }

  // ---- Spell resolution / chat output ----
  const handleSpellSelection = async (selectedSpell) => {
    // Your helper expects the Item, actor, and full spells list
    const canCast = await game.tos.handleManaCost(selectedSpell, actor, spells);
    if (!canCast) return;
    const {
      attackRoll,
      critSuccess,
      rollName,
      critFailure,
      rollData,
      criticalSuccessThreshold,
      criticalFailureThreshold,
    } = await game.tos.getMagicAttackRolls(actor, selectedSpell);

    const {
      effectsRollResults,
      damageRoll,
      damageTotal,
      critDamageTotal,
      penetration,
    } = await game.tos.getMagicDamageRolls(actor, selectedSpell, rollData);

    const { renderedDescription } = await game.tos.handleSpellSelection(
      rollData,
      selectedSpell
    );

    const attack =
      (attackRoll.total || 0) +
      (actor.system?.combatSkills?.channeling?.attack || 0);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      rolls: [attackRoll, damageRoll],
      flavor: `
        <h2>
          <img src="${selectedSpell.img}" title="${selectedSpell.name}"
               width="36" height="36"
               style="vertical-align: middle; margin-right: 8px;">
          ${selectedSpell.name}
        </h2>
        <table style="width: 100%; text-align: center; font-size: 15px;">
          <tr><th>Description:</th></tr>
          <tr>
            <td>|${selectedSpell.system?.spellClass} spell|<br>
                Difficulty: ${rollData.difficulty}<br>
                ${renderedDescription}
            </td>
          </tr>
          <tr>
            <td>Magic attack: ${attack} &nbsp; Range: ${
        selectedSpell.system?.range ?? "—"
      }</td>
          </tr>
          <tr><td>Damage types:</td></tr>
          <tr>
            <td>
              ${selectedSpell.system?.dmgType1 ?? ""} ${
        selectedSpell.system?.bool2 ?? ""
      }
              ${selectedSpell.system?.dmgType2 ?? ""} ${
        selectedSpell.system?.bool3 ?? ""
      }
              ${selectedSpell.system?.dmgType3 ?? ""} ${
        selectedSpell.system?.bool4 ?? ""
      }
              ${selectedSpell.system?.dmgType4 ?? ""}
            </td>
          </tr>
        </table>
        <p style="text-align: center; font-size: 20px;"><b>
          ${
            critSuccess
              ? "Critical Success!"
              : critFailure
              ? "Critical Failure!"
              : ""
          }
        </b></p>
        <table style="width: 100%; text-align: center; font-size: 15px;">
          <tr><th>Normal</th><th>Crit</th></tr>
          <tr><td>${damageTotal}</td><td>${critDamageTotal}</td></tr>
        </table>
        <hr>
        ${penetration ?? ""}
        <table style="width: 100%; text-align: center; font-size: 15px;">
          <tr><th>Effects</th></tr>
          <tr><td>${effectsRollResults}</td></tr>
        </table>
        <hr>
      `,
      flags: {
        rollName,
        criticalSuccessThreshold,
        criticalFailureThreshold,
      },
    });
  };

  // ---- Step 2: Spell picker for the chosen school ----
  const showSpellDialog = (schoolKey) => {
    const filteredSpells = spells.filter((s) => s.system?.type === schoolKey);
    if (!filteredSpells.length) {
      ui.notifications.warn(`No spells found for ${SCHOOL_NAMES[schoolKey]}.`);
      return;
    }

    const spellDialog = new Dialog({
      title: `${SCHOOL_NAMES[schoolKey]} — Select Spell`,
      content: `
        <form>
          <fieldset>
            <ul id="spell-list" class="custom-list">
              ${filteredSpells
                .map(
                  (spell, idx) => `
                    <li class="choice" data-idx="${idx}">
                      ${spell.name}
                    </li>`
                )
                .join("")}
            </ul>
          </fieldset>
        </form>
      `,
      buttons: {},
      classes: ["custom-dialog"],
      width: 360,
      render: (html) => {
        html[0].querySelectorAll("#spell-list .choice").forEach((li) => {
          li.addEventListener("click", async (ev) => {
            const idx = parseInt(ev.currentTarget.dataset.idx, 10);
            const selectedSpell = filteredSpells[idx];
            spellDialog.close();
            await handleSpellSelection(selectedSpell);
          });
        });
      },
    });

    spellDialog.render(true);
  };

  // ---- Step 1: School picker (same styling) ----
  const schoolDialog = new Dialog({
    title: "Select Spell School",
    content: `
      <form>
        <fieldset>
          <ul id="school-list" class="custom-list">
            ${schools
              .map(
                (k) => `
                  <li class="choice" data-school="${k}">
                    ${SCHOOL_NAMES[k]}
                  </li>`
              )
              .join("")}
          </ul>
        </fieldset>
      </form>
    `,
    buttons: {},
    classes: ["custom-dialog"],
    width: 360,
    render: (html) => {
      html[0].querySelectorAll("#school-list .choice").forEach((li) => {
        li.addEventListener("click", (ev) => {
          const schoolKey = ev.currentTarget.dataset.school;
          schoolDialog.close();
          showSpellDialog(schoolKey);
        });
      });
    },
  });

  schoolDialog.render(true);
})();
