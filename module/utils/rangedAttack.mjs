export async function rangedAttack() {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;
  const weapons = actor.items.filter(
    (i) => i.type === "weapon" && ["bow", "crossbow"].includes(i.system.class),
  );

  if (!weapons.length) {
    ui.notifications.warn("This actor has no ranged weapons.");
    return;
  }

  // ─── Custom Bonuses ───
  const customDamage = 0;
  const customAttack = 0;
  const customBleed = 0;
  const customStun = 0;
  const customEffect1 = 0;
  const customEffect2 = 0;
  const customEffect3 = 0;

  const weaponChoices = weapons.map((weapon, index) => ({
    label: weapon.name,
    value: index,
  }));

  const handleWeaponSelection = async (weaponIndex) => {
    const weapon = weapons[weaponIndex];

    const {
      doctrineBonus,
      doctrineCritBonus,
      doctrineSkillCritPen,
      doctrineCritDmg,
      doctrineBleedBonus,
      doctrineStunBonus,
      doctrineCritRangeBonus,
    } = await game.tos.getDoctrineBonuses(actor, weapon);

    const penetration = weapon.system.penetration || 0;

    let weaponSkillEffect = 0;
    let weaponSkillCritPen = 0;
    let weaponSkillCritDmg = 0;

    // ─── Attack Roll ───
    const {
      attackRoll,
      critSuccess,
      critFailure,
      criticalSuccessThreshold,
      criticalFailureThreshold,
      rollName,
    } = await game.tos.getAttackRolls(
      actor,
      weapon,
      doctrineBonus,
      doctrineCritBonus,
      0,
      customAttack,
    );

    // ─── Damage Roll ───
    const { damageRoll, damageTotal, breakthroughRollResult } =
      await game.tos.getDamageRolls(actor, weapon, customDamage);

    // ─── Critical Score Roll ───
    const {
      critScore,
      critScoreResult,
      critBonusPenetration,
      critDamageTotal,
    } = await game.tos.getCriticalRolls(
      actor,
      weapon,
      doctrineCritRangeBonus,
      attackRoll,
      weaponSkillCritDmg,
      weaponSkillCritPen,
      damageTotal,
      penetration,
      doctrineCritDmg,
      doctrineSkillCritPen,
    );

    // ─── Effects Roll ───
    const { allBleedRollResults, bleedChanceDisplay, effectsRollResults } =
      await game.tos.getEffectRolls(
        actor,
        weapon,
        doctrineBleedBonus,
        doctrineStunBonus,
        weaponSkillEffect,
        customBleed,
        customStun,
        customEffect1,
        customEffect2,
        customEffect3,
        critScore,
        critSuccess,
      );

    const damageLine = `
<div style="
  display:grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  font-size:16px;
  max-width: fit-content;
  margin: 0 auto;
" class="combat-grid">

  <!-- LEFT COLUMN : Normal -->
  <div style="
    display:grid;
    grid-template-columns: auto 1fr;
    column-gap: 8px;
  ">
    <div>Damage:</div>
    <div style="text-align:center;">
      ${damageTotal}
    </div>

    <div>Penetration:</div>
    <div style="text-align:center;">
      ${penetration}
    </div>

<div>&nbsp;</div>
<div>&nbsp;</div>

  </div>

  <!-- RIGHT COLUMN : Critical -->
  <div style="
    display:grid;
    grid-template-columns: auto 1fr;
    column-gap: 8px;
  ">

    <div>Crit Dmg:</div>
    <div style="text-align:center;">
      ${critDamageTotal}
    </div>

    <div>Crit Pen:</div>
    <div style="text-align:center;">
      ${critBonusPenetration}
    </div>

    <div>Crit score:</div>
    <div style="text-align:center;">
      <span
        title="Crit range result ${critScoreResult}"
        style="
          text-decoration: underline dotted;
          text-underline-offset: 2px;
          cursor: help;
        "
      >
        [ ${critScore} ]
      </span>
    </div>
  </div>
</div>
`;

    const attackHTML = await attackRoll.render();
    const damageHTML = await damageRoll.render();
    const content = `
<div class="dual-roll">

  <div class="roll-column">
    <div class="roll-label">Margin of Success</div>
    ${attackHTML}
  </div>

  <div class="roll-column">
    <div class="roll-label">Damage Roll</div>
    ${damageHTML}
  </div>

</div>
`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      content,
      rolls: [attackRoll, damageRoll],
      flavor: `
<span style="display:inline-flex; align-items:center;">
  <img src="${weapon.img}" width="36" height="36" style="margin-right:8px;">
  <strong style="font-size:20px;">Ranged attack</strong>
</span>

<hr>

<p style="text-align:center; font-size:20px;">
  <b>${
    critSuccess ? "Critical Success!" : critFailure ? "Critical Failure!" : ""
  }</b>
</p>

${damageLine}
<hr>

<table style="width:100%; text-align:center; font-size:15px;">
  <tr><th>Effects</th></tr>
  <tr>
    <td><b>${allBleedRollResults}</b> ${effectsRollResults}</td>
  </tr>
</table>
<hr>
`,
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

          critical: {
            damage: critDamageTotal,
            penetration: critBonusPenetration,
          },

          breakthrough: {
            damage: breakthroughRollResult,
          },
        },
      },
    });
  };

  // ─── Inject CSS ───
  const style = document.createElement("style");
  style.textContent = `
#weapon-list .weapon-choice {
  font-size: 16px;
  color: black;
}
#weapon-list .weapon-choice:hover {
  text-shadow: 0 0 2px red;
}
.weapon-dialog .window-content {
  max-width: 300px;
}
`;
  document.head.appendChild(style);

  new Dialog({
    title: "Select Weapon",
    content: `
<ul id="weapon-list" style="list-style:none; padding:0;">
  ${weaponChoices
    .map(
      (c) => `
<li class="weapon-choice"
    data-value="${c.value}"
    style="cursor:pointer; padding:5px; border-bottom:1px solid #444;">
  ${c.label}
</li>`,
    )
    .join("")}
</ul>
`,
    buttons: {},
    render: (html) => {
      html.find("#weapon-list li").each((_, el) => {
        el.addEventListener("click", async () => {
          await handleWeaponSelection(Number(el.dataset.value));
        });
      });
    },
  }).render(true);
}
