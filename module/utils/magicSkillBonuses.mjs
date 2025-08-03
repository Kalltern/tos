export async function getDoctrineBonuses(actor, weapon) {
  // Doctrine bonuses
  const doctrine = actor.system.doctrines;
  let doctrineBonus = 0;
  let doctrineCritBonus = 0;
  let doctrineCritRangeBonus = 0;
  let doctrineStunBonus = 0;
  let doctrineBleedBonus = 0;
  let doctrineCritDefenseBonus = 0;
  let doctrineDefenseBonus = 0;
  let doctrineRangedDefenseBonus = 0;
  let doctrineCritDmg = 0;
  let doctrineSkillCritPen = 0;
  if (actor.type === "npc") {
    return {
      doctrineBonus: 0,
      doctrineCritBonus: 0,
      doctrineCritRangeBonus: 0,
      doctrineStunBonus: 0,
      doctrineBleedBonus: 0,
      doctrineCritDefenseBonus: 0,
      doctrineDefenseBonus: 0,
      doctrineRangedDefenseBonus: 0,
      doctrineCritDmg: 0,
      doctrineSkillCritPen: 0,
    };
  }
  for (const [doctrineName, doctrineValue] of Object.entries(
    weapon.system.doctrines
  )) {
    if (doctrineValue === true) {
      if (doctrineName === "pikeman" && doctrine.pikeman.value >= 3) {
        doctrineBonus = 10;
        if (doctrine.pikeman.value >= 7) {
          doctrineBonus = 15;
        }
      }
      if (doctrineName === "swordsman" && doctrine.swordsman.value >= 3) {
        doctrineBonus = 10;
        if (doctrine.swordsman.value >= 5) {
          doctrineBleedBonus = 25;
        }
      }
      if (doctrineName === "reaver" && doctrine.reaver.value >= 2) {
        doctrineBonus = 10;
        if (doctrine.reaver.value >= 4) {
          doctrineCritRangeBonus = 2;
        }
        if (doctrine.reaver.value >= 7) {
          doctrineBleedBonus = 15;
          doctrineStunBonus = 10;
        }
        if (doctrine.reaver.value >= 8) {
          doctrineBonus = 15;
        }
      }
      if (doctrineName === "shieldbearer" && doctrine.shieldbearer.value >= 3) {
        doctrineCritDefenseBonus = 3;
        if (doctrine.shieldbearer.value >= 7) {
          doctrineDefenseBonus = 5;
          doctrineRangedDefenseBonus = 10;
        }
      }
      if (doctrineName === "dimakerus" && doctrine.dimakerus.value >= 2) {
        doctrineDefenseBonus = 5;
        doctrineRangedDefenseBonus = 5;
        if (doctrine.dimakerus.value >= 4) {
          doctrineBleedBonus = 10;
          doctrineStunBonus = 5;
        }
        if (doctrine.dimakerus.value >= 7) {
          doctrineDefenseBonus = 10;
        }
        if (doctrine.dimakerus.value >= 9) {
          doctrineBonus = 5;
        }
      }

      if (doctrineName === "duelist" && doctrine.duelist.value >= 4) {
        doctrineBonus = 5;
        doctrineCritBonus = 2;
        if (doctrine.dimakerus.value >= 8) {
          doctrineCritDefenseBonus = 1;
        }
      }
      if (doctrineName === "monk" && doctrine.monk.value >= 1) {
        doctrineBonus = 5;
        doctrineDefenseBonus = 5;
        if (doctrine.monk.value >= 5) {
          doctrineCritDefenseBonus = 2;
        }
        if (doctrine.monk.value >= 6) {
          doctrineBonus = 8;
          doctrineDefenseBonus = 8;
        }
      }
      if (doctrineName === "archer" && doctrine.archer.value >= 1) {
        doctrineBonus = 10;
        if (doctrine.archer.value >= 4) {
          doctrineBleedBonus = 10;
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.archer.value >= 6) {
          doctrineCritBonus = 3;
        }
        if (doctrine.archer.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
      }
      if (doctrineName === "arbalest" && doctrine.arbalest.value >= 1) {
        doctrineBonus = 10;
        if (doctrine.arbalest.value >= 4) {
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.arbalest.value >= 6) {
          doctrineBleedBonus = 10;
          doctrineBonus = 15;
        }
        if (doctrine.arbalest.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
        if (doctrine.arbalest.value >= 8) {
          doctrineCritBonus = 5;
        }
      }
      if (doctrineName === "peltast" && doctrine.peltast.value >= 1) {
        doctrineBleedBonus = 20;
        doctrineStunBonus = 10;
        if (doctrine.peltast.value >= 4) {
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.peltast.value >= 6) {
          doctrineCritBonus = 3;
        }
        if (doctrine.peltast.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
        if (doctrine.peltast.value >= 9) {
          // add zatizeni stitu
          doctrineCritRangeBonus = 2;
        }
      }
      if (doctrineName === "juggler" && doctrine.juggler.value >= 3) {
        doctrineBonus = 5;
        if (doctrine.juggler.value >= 2) {
          doctrineCritBonus = 3;
        }
        if (doctrine.juggler.value >= 4) {
          doctrineBleedBonus = 10;
          doctrineSkillCritPen = 5;
          doctrineCritDmg = 5;
        }
        if (doctrine.juggler.value >= 7) {
          doctrineSkillCritPen = 10;
          doctrineCritDmg = 10;
        }
      }
    }
  }
  console.log(
    `Doctrine Bonus: ${doctrineBonus}, ${doctrineCritBonus}, ${doctrineCritRangeBonus}, ${doctrineStunBonus}, ${doctrineBleedBonus}`
  );

  return {
    doctrineBonus,
    doctrineCritBonus,
    doctrineCritRangeBonus,
    doctrineStunBonus,
    doctrineBleedBonus,
    doctrineRangedDefenseBonus,
    doctrineDefenseBonus,
    doctrineCritDefenseBonus,
    doctrineSkillCritPen,
    doctrineCritDmg,
  };
}

export async function getSpellSchool(actor) {
  const spells = actor.items.filter(
    (i) => i.type === "spell" && i.system.type === "earth"
  );
  if (!spells.length) {
    ui.notifications.warn("This actor has no earth spells.");
    return;
  }
}

export async function handleSpellSelection(actor, spells) {}
const customEffects = {
  stun: customStun,
  bleed: customBleed,
  extra1: customEffect1,
  extra2: customEffect2,
  extra3: customEffect3,
};
