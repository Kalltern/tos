export async function meleeAttack() {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) {
    ui.notifications.warn("Please select a token.");
    return;
  }

  const actor = selectedToken.actor;
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
      doctrineCritRangeBonus,
      doctrineStunBonus,
      doctrineSkillCritPen,
      doctrineCritDmg,
      doctrineBleedBonus,
    } = await game.tos.getDoctrineBonuses(actor, weapon);

    const {
      weaponSkillEffect,
      weaponSkillCrit,
      weaponSkillCritDmg,
      weaponSkillCritPen,
    } = await game.tos.getWeaponSkillBonuses(actor, weapon);

    const penetration = weapon.system.penetration || 0;

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
      weaponSkillCrit,
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
    console.log("BreakthroughRollResult", breakthroughRollResult);
    const hasBreakthrough =
      typeof breakthroughRollResult === "string" &&
      breakthroughRollResult.trim() !== "";
    const damageTable =
      hasBreakthrough === true
        ? `<table style="width:100%; text-align:center; font-size:15px;">
            <tr>
            <th>Normal</th>
            <th>Crit</th>
            <th>Breakthrough</th>
            </tr>
            <tr>
              <td>${damageTotal}</td>
              <td>${critDamageTotal}</td>
              <td>${breakthroughRollResult}</td>
            </tr>
          </table>`
        : `<table style="width:100%; text-align:center; font-size:15px;">
            <tr>
              <th>Normal</th>
              <th>Crit</th>
            </tr>
            <tr>
              <td>${damageTotal}</td>
              <td>${critDamageTotal}</td>
            </tr>
          </table>`;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker(),
      rolls: [attackRoll, damageRoll],
      flavor: `
<span style="display:inline-flex; align-items:center;">
  <img src="${weapon.img}" width="36" height="36" style="margin-right:8px;">
  <strong style="font-size:20px;">Melee attack</strong>
</span>

<hr>

<p style="text-align:center; font-size:20px;">
  <b>${
    critSuccess ? "Critical Success!" : critFailure ? "Critical Failure!" : ""
  }</b>
</p>

${damageTable}

<hr>

<table style="width:100%; text-align:center; font-size:15px;">
  <tr>
    <th>Penetration</th>
    <th>Critical Score</th>
  </tr>
  <tr>
    <td>${penetration}/${critBonusPenetration}</td>
    <td title="Crit range result ${critScoreResult}">[${critScore}]</td>
  </tr>
</table>

<hr>

<table style="width:100%; text-align:center; font-size:15px;">
  <tr><th>Effects</th></tr>
  <tr>
    <td><b>${allBleedRollResults}</b> ${effectsRollResults}</td>
  </tr>
</table>

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
            penetration: penetration,
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
