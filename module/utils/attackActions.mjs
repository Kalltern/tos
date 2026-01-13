export async function attackActions() {
  const actor = canvas.tokens.controlled[0]?.actor;
  if (!actor) {
    ui.notifications.warn("No actor selected.");
    return;
  }

  const actions = {
    "Melee attack": "meleeAttack",
    "Ranged attack": "rangedAttack",
    Throwing: "throwingAttack",
    "Throw explosive": "throwExplosive",
  };

  let content = `
<form>
  <p>Choose a macro to execute:</p>

  <div class="form-group">
    <label>Aim:</label><br>
    <div id="aim-selector">
      ${[0, 1, 2, 3, 4]
        .map(
          (n) => `
        <input type="radio" name="aim" id="aim-${n}" value="${n}" ${
            n === 0 ? "checked" : ""
          }>
        <label for="aim-${n}" class="aim-dot">${n === 0 ? "–" : n}</label>
      `
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

  let buttons = {};

  for (const [label, fnName] of Object.entries(actions)) {
    buttons[label] = {
      label,
      callback: async (html) => {
        const useSneak = html.find("#sneak-attack-checkbox")[0].checked;
        const useFlanking = html.find("#flanking-attack-checkbox")[0].checked;
        const aimValue =
          parseInt(html.find('input[name="aim"]:checked').val()) || 0;

        // ─── Sneak ───
        if (useSneak) {
          await actor.setFlag("tos", "useSneakAttack", true);
          await actor.setFlag("tos", "sneakAccessCounter", 0);
        } else {
          await actor.unsetFlag("tos", "useSneakAttack");
          await actor.unsetFlag("tos", "sneakAccessCounter");
        }

        // ─── Flanking ───
        if (useFlanking) {
          await actor.setFlag("tos", "useFlankingAttack", true);
        } else {
          await actor.unsetFlag("tos", "useFlankingAttack");
        }

        // ─── Aim ───
        if (aimValue > 0) {
          await actor.setFlag("tos", "aimCount", aimValue);
        } else {
          await actor.unsetFlag("tos", "aimCount");
        }

        // ✅ Macro-equivalent execution boundary
        await game.tos[fnName]();
      },
    };
  }

  new Dialog({
    title: "Select Combat Action",
    content,
    buttons,
    default: Object.keys(buttons)[0],
  }).render(true);
}
