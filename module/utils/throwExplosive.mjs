export async function throwExplosive() {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;
  const consumables = actor.items.filter(
    (i) => i.type === "consumable" && i.system.option === "explosive"
  );

  if (!consumables.length) {
    ui.notifications.warn("This actor has no explosives.");
    return;
  }

  const explosiveChoices = consumables.map((consumable, index) => ({
    label: consumable.name,
    value: index,
  }));

  const applyConsumableEffects = async (consumable) => {
    let effectResults = "";

    const effects = {
      burn: { color: "darkorange", label: "Burn" },
      freeze: { color: "teal", label: "Freeze" },
      stun: { color: "yellow", label: "Stun" },
    };

    for (const [effect, { color, label }] of Object.entries(effects)) {
      if (consumable.system[effect]) {
        const roll = new Roll("1d100");
        await roll.evaluate();

        const chance = consumable.system[effect];
        const result = roll.total;

        const displayLabel =
          chance >= result
            ? `<span style="color:${color}; font-weight:bold;">${label}</span>`
            : label;

        effectResults += `<p><b>${displayLabel}:</b> ${chance} > ${result}</p>`;
      }
    }

    if (consumable.system.penetration) {
      effectResults += `<p><b>Penetration:</b> ${consumable.system.penetration}</p>`;
    }

    if (consumable.system.quantity > 0) {
      const newQty = consumable.system.quantity - 1;
      if (newQty > 0) {
        await consumable.update({ "system.quantity": newQty });
      } else {
        await consumable.delete();
      }
    }

    return effectResults;
  };

  const handleExplosiveSelection = async (index) => {
    const consumable = consumables[index];

    let rollResult = null;
    let attackRoll = null;

    if (consumable.system.aimed) {
      const finesse = actor.system.combatSkills.throwing.finesseRating;
      const normal = actor.system.combatSkills.throwing.rating;

      const formula =
        finesse > normal
          ? "@combatSkills.throwing.finesseRating - 1d100"
          : "@combatSkills.throwing.rating - 1d100";

      attackRoll = new Roll(formula, actor.getRollData());
      await attackRoll.evaluate();
      rollResult = attackRoll.dice[0].results[0].result;
    }

    const criticalSuccessThreshold =
      actor.system.combatSkills.throwing.criticalSuccessThreshold;
    const criticalFailureThreshold =
      actor.system.combatSkills.throwing.criticalFailureThreshold;

    const critSuccess =
      rollResult !== null && rollResult <= criticalSuccessThreshold;
    const critFailure =
      rollResult !== null && rollResult >= criticalFailureThreshold;

    const damageRoll = new Roll(consumable.system.formula || "1d6");
    await damageRoll.evaluate();
    const damageTotal = Math.floor(damageRoll.total);

    const effectResults = await applyConsumableEffects(consumable);
    const rollName = `Threw ${consumable.name}`;
    const flavor = `
<div style="display:flex; align-items:center; gap:8px; font-size:1.3em; font-weight:bold;">
  <img src="${consumable.img}" width="36" height="36">
  <span>${rollName}</span>
</div>

<p style="text-align:center; font-size:20px;"><b>
  ${
    attackRoll
      ? critSuccess
        ? "Critical Success!"
        : critFailure
        ? "Critical Failure!"
        : "Damage"
      : ""
  }
</b></p>

<table style="width:100%; text-align:center; font-size:15px;">
  <tr>
    <th>Explosive Effects</th>
    <td>${effectResults}</td>
  </tr>
</table>
`;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      rolls: attackRoll ? [attackRoll, damageRoll] : [damageRoll],
      flavor,

      flags: {
        tos: {
          rollName,
          criticalSuccessThreshold,
          criticalFailureThreshold,
        },

        attack: {
          type: "attack",
          normal: {
            damage: damageTotal,
            penetration: penetration,
          },
        },
      },
    });
  };

  // Inject CSS (once per call)
  const style = document.createElement("style");
  style.textContent = `
    #explosive-list .explosive-choice {
      font-size: 16px;
      cursor: pointer;
      padding: 5px;
      border-bottom: 1px solid #444;
    }

    #explosive-list .explosive-choice:hover {
      text-shadow: 0 0 2px red;
    }

    .explosive-dialog .window-content {
      max-width: 300px;
    }
  `;
  document.head.appendChild(style);

  new Dialog({
    title: "Select Explosive",
    content: `
      <ul id="explosive-list" style="list-style:none; padding:0;">
        ${explosiveChoices
          .map(
            (c) =>
              `<li class="explosive-choice" data-value="${c.value}">${c.label}</li>`
          )
          .join("")}
      </ul>
    `,
    buttons: {},
    render: (html) => {
      html.find(".explosive-choice").each((_, el) => {
        el.addEventListener("click", async () => {
          await handleExplosiveSelection(Number(el.dataset.value));
        });
      });
    },
  }).render(true);
}
