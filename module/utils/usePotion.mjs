export async function usePotion() {
  const selectedToken = canvas.tokens.controlled[0];

  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;
  const consumables = actor.items.filter(
    (i) => i.type === "consumable" && i.system.option === "potion"
  );
  if (!consumables.length) {
    ui.notifications.warn("This actor has no potions.");
    return;
  }

  const potionChoices = consumables.map((c, i) => ({
    label: c.name,
    value: i,
  }));

  const applyConsumableEffects = async (consumable, roll, drinkingRoll) => {
    let effectResults = "";
    const toxicityIncrease = consumable.system.toxicity || 0;
    const finalToxicity =
      drinkingRoll.total >= 0
        ? Math.floor(toxicityIncrease / 2)
        : toxicityIncrease;

    await actor.update({
      "system.stats.toxicity.value":
        (actor.system.stats.toxicity.value || 0) + finalToxicity,
    });
    effectResults += `<p><b>Toxicity:</b> Increased by ${finalToxicity}</p>`;

    const applyStat = async (statKey, label) => {
      const amount = roll.total || 0;
      await actor.update({
        [`system.stats.${statKey}.value`]:
          (actor.system.stats[statKey].value || 0) + amount,
      });
      effectResults += `<p><b>${label}:</b> Increased by ${amount}</p>`;
    };

    if (consumable.system.type === "health")
      await applyStat("health", "Health");
    if (consumable.system.type === "stamina")
      await applyStat("stamina", "Stamina");
    if (consumable.system.type === "mana") await applyStat("mana", "Mana");

    if (consumable.system.bleed) {
      const bleedRoll = await new Roll("1d100").evaluate();
      const result = consumable.system.bleed > bleedRoll.total ? "SUCCESS" : "";
      effectResults += `<p><b>Stop bleed:</b> ${consumable.system.bleed} > ${bleedRoll.total} ${result}</p>`;
    }

    if (consumable.system.quantity > 0) {
      const newQty = consumable.system.quantity - 1;
      newQty > 0
        ? await consumable.update({ "system.quantity": newQty })
        : await consumable.delete();
    }

    return effectResults;
  };

  const handlePotionSelection = async (index) => {
    const consumable = consumables[index];
    const rollData = actor.getRollData();
    const roll = await new Roll(consumable.system.formula, rollData).evaluate();
    const drinkingRoll = await new Roll(
      "@skills.drinking.rating - 1d100",
      rollData
    ).evaluate();

    const effectResults = await applyConsumableEffects(
      consumable,
      roll,
      drinkingRoll
    );

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      rolls: [roll, drinkingRoll],
      flavor: `
    <span style="display:inline-flex; align-items:center;">
      <img src="${consumable.img}" title="${consumable.name}" width="36" height="36" style="margin-right:8px;">
      <strong style="font-size:20px;">Drinking ${consumable.name}</strong>
    </span>
        <table style="width: 100%; text-align: center; font-size: 15px;">
          <tr><th>Potion Effects</th></tr>
          <tr><td><b>${effectResults}</b></td></tr>
        </table>
      `,
    });
  };

  const css = `
    #potion-list .potion-choice {
      font-size: 16px;
      color: black;
    }
    #potion-list .potion-choice:hover {
      color: black;
      text-shadow: 0 0 1px green, 0 0 2px green;
    }
    .potion-dialog .window-content {
      max-width: 300px;
      width: 100%;
    }
  `;
  const style = document.createElement("style");
  style.type = "text/css";
  style.innerText = css;
  document.head.appendChild(style);

  new Dialog({
    title: "Select Potion",
    content: `
      <form>
        <fieldset>
          <ul id="potion-list" style="list-style: none; padding: 0;">
            ${potionChoices
              .map(
                (choice) =>
                  `<li class="potion-choice" data-value="${choice.value}" style="cursor: pointer; padding: 5px; border-bottom: 1px solid #444;">
                ${choice.label}
              </li>`
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
      html.find("#potion-list li").click(async (event) => {
        const selectedValue = parseInt(event.currentTarget.dataset.value);
        await handlePotionSelection(selectedValue);
      });
    },
  }).render(true);
}
