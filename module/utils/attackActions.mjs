export async function attackActions() {
  const actor = canvas.tokens.controlled[0]?.actor;
  if (!actor) {
    ui.notifications.warn("No actor selected.");
    return;
  }

  const hasThrownWeapon = actor.items.some(
    (i) => i.type === "weapon" && i.system.thrown === true,
  );

  const hasExplosive = actor.items.some(
    (i) => i.type === "consumable" && i.system.option === "explosive",
  );
  const actions = {};

  if (actor.type === "character") {
    // Characters: single smart attack
    actions["Attack"] = "autoAttack";
  } else {
    // NPCs: explicit intent
    actions["Melee attack"] = "meleeAttack";
    actions["Ranged attack"] = "rangedAttack";
  }

  if (hasThrownWeapon) {
    actions["Throwing"] = "throwingAttack";
  }

  if (hasExplosive) {
    actions["Throw explosive"] = "throwExplosive";
  }

  const isCharacter = actor.type === "character";
  const hasActiveSet = isCharacter && actor.system.combat?.activeWeaponSet;

  const activeSetPreview = hasActiveSet
    ? renderWeaponLoadoutsDialog(actor)
    : "";

  const content = `
<form>
  ${activeSetPreview}

  <hr>

  <p>Choose a macro to execute:</p>

  <div class="form-group">
    <label>Aim:</label><br>
    <div id="aim-selector">
      ${[0, 1, 2, 3, 4]
        .map(
          (n) => `
          <input type="radio" name="aim" value="${n}" ${n === 0 ? "checked" : ""}>
          <label class="aim-dot">${n === 0 ? "–" : n}</label>
        `,
        )
        .join("")}
    </div>
  </div>

  <div class="form-group">
    <label>
      Sneak Attack <input type="checkbox" id="sneak-attack-checkbox" />
      Flanking <input type="checkbox" id="flanking-attack-checkbox" />
    </label>
  </div>
</form>
`;

  const buttons = {};

  for (const [label, fnName] of Object.entries(actions)) {
    buttons[label] = {
      label,
      callback: async (html) => {
        const useSneak = html.find("#sneak-attack-checkbox")[0]?.checked;
        const useFlanking = html.find("#flanking-attack-checkbox")[0]?.checked;
        const aimValue =
          parseInt(html.find('input[name="aim"]:checked').val()) || 0;

        // ─── Flags ───
        useSneak
          ? await actor.setFlag("tos", "useSneakAttack", true)
          : await actor.unsetFlag("tos", "useSneakAttack");

        useFlanking
          ? await actor.setFlag("tos", "useFlankingAttack", true)
          : await actor.unsetFlag("tos", "useFlankingAttack");

        aimValue > 0
          ? await actor.setFlag("tos", "aimCount", aimValue)
          : await actor.unsetFlag("tos", "aimCount");

        // ─── Weapon Resolution ───
        const attackTypeMap = {
          autoAttack: null, // resolved internally
          throwingAttack: "throwing",
        };

        const attackType = attackTypeMap[fnName];
        const weaponContext = attackType
          ? resolveActiveWeaponForAttack(actor, attackType)
          : null;

        await game.tos[fnName]({ weaponContext });
      },
    };
  }

  const dialog = new Dialog({
    title: "Select Attack Action",
    content,
    buttons,
    default: Object.keys(buttons)[0],
    render: (html) => {
      html.find(".weapon-set-toggle").on("click", async () => {
        const next = actor.system.combat.activeWeaponSet === 1 ? 2 : 1;

        await actor.update({
          "system.combat.activeWeaponSet": next,
        });

        dialog.close();
        attackActions(); // re-open with updated preview
      });
    },
  });

  dialog.render(true);
}

function buildWeaponSetView(actor) {
  const sets = actor.system.combat.weaponSets;
  const result = {};

  for (const setId of [1, 2]) {
    const slots = sets?.[setId] ?? {};
    const main = slots.main ? actor.items.get(slots.main) : null;
    const off = slots.off ? actor.items.get(slots.off) : null;

    const mainIsTwoHanded = main
      ? main.system.type === "heavy" ||
        ["crossbow", "box"].includes(main.system.class) ||
        main.system.gripMode === "two"
      : false;

    const offIsShield = !!off?.system?.shield;

    result[setId] = {
      main,
      off,
      mainIsTwoHanded,
      offIsShield,
    };
  }

  return result;
}
function renderWeaponLoadoutsDialog(actor) {
  const weaponSets = buildWeaponSetView(actor);
  const activeSet = actor.system.combat.activeWeaponSet;

  return `
<section class="weapon-loadouts horizontal active-set-${activeSet}">

  ${[1, 2]
    .map((setId) => {
      const ws = weaponSets[setId];

      return `
<div class="weapon-set-block">
  <div class="weapon-loadout-label">Set ${setId}</div>

  <div class="weapon-slot-row">

    <!-- MAIN -->
    <div class="weapon-slot main ${ws.main ? "filled" : "empty"}"
         data-set="${setId}" data-slot="main">
      ${
        ws.main
          ? `<img src="${ws.main.img}" title="${ws.main.name}">`
          : `<span>Main</span>`
      }
    </div>

    <!-- OFF -->
    <div class="weapon-slot off
      ${ws.mainIsTwoHanded ? "blocked" : ws.off ? "filled" : "empty"}
      ${ws.offIsShield ? "shield" : ""}"
      data-set="${setId}" data-slot="off">

      ${
        ws.mainIsTwoHanded
          ? `
            <div class="two-handed-ghost">
              <img src="${ws.main.img}"
                   title="${ws.main.name} (Two-handed)"
                   width="44" height="44">
            </div>
          `
          : ws.off
            ? `<img src="${ws.off.img}" title="${ws.off.name}" width="44" height="44">`
            : `<span>Off</span>`
      }

    </div>

  </div>
</div>
`;
    })
    .join("")}

  <div class="weapon-set-switcher">
    <button type="button"
      class="weapon-set-toggle set-${activeSet}"
      title="Switch Weapon Set">
      <i class="fa-sharp fa-regular fa-arrows-repeat"></i>
    </button>
  </div>

</section>
`;
}

function resolveActiveWeaponForAttack(actor, attackType) {
  if (actor.type !== "character") return null;

  const activeSet = actor.system.combat?.activeWeaponSet;
  if (!activeSet) return null;

  const set = actor.system.combat.weaponSets?.[activeSet];
  if (!set?.main) return null;

  const weapon = actor.items.get(set.main);
  if (!weapon || weapon.type !== "weapon") return null;

  let category = "melee";
  if (["bow", "crossbow"].includes(weapon.system.class)) category = "ranged";
  else if (weapon.system.thrown === true) category = "throwing";

  if (category !== attackType) return null;

  const offItem = set.off ? actor.items.get(set.off) : null;
  const hasShield = !!offItem?.system?.shield;

  return { weapon, hasShield };
}

export async function autoAttack(options = {}) {
  const actor = canvas.tokens.controlled[0]?.actor;
  if (!actor) return;

  // ─── NPCs → ALWAYS old logic ───
  if (actor.type !== "character") {
    return game.tos.meleeAttack(); // ❗ no weaponContext
  }

  const activeSet = actor.system.combat?.activeWeaponSet;
  const set = actor.system.combat.weaponSets?.[activeSet];

  // ─── No active weapon set → old logic ───
  if (!set?.main) {
    return game.tos.meleeAttack(); // ❗ no weaponContext
  }

  const weapon = actor.items.get(set.main);
  if (!weapon) {
    return game.tos.meleeAttack(); // ❗ no weaponContext
  }

  // ─── Resolve weapon category ───
  const isRanged = ["bow", "crossbow"].includes(weapon.system.class);
  const isThrown = weapon.system.thrown === true;

  // ─── Throwing is explicit ───
  if (isThrown) {
    return game.tos.throwingAttack({
      weaponContext: { weapon },
    });
  }

  // ─── Auto-route melee / ranged ───
  if (isRanged) {
    return game.tos.rangedAttack({
      weaponContext: { weapon },
    });
  }

  return game.tos.meleeAttack({
    weaponContext: { weapon },
  });
}
