function calculateStats(form, iAtk, iDef, iSta, lvl) {
  let cpm = pokedex.cpMultipliers[(lvl-1)*2];
  let result = {};
  result.level = lvl;
  result.iv = {
    attack:  iAtk,
    defense: iDef,
    hp:      iSta
  };
  result.stats = {
    attack:  (form.baseStats.attack + iAtk) * cpm,
    defense: (form.baseStats.defense + iDef) * cpm,
    hp:      Math.floor((form.baseStats.stamina + iSta) * cpm)
  };
  result.stats.product = Math.round(result.stats.attack * result.stats.defense * result.stats.hp);
  result.cp = Math.floor(((form.baseStats.attack + iAtk)
            * Math.sqrt(form.baseStats.defense + iDef)
            * Math.sqrt(form.baseStats.stamina + iSta)
            * Math.pow(cpm, 2)) * 0.1);
  if (result.cp < 10) result.cp = 10;
  return result;
}

function calculateOptimalStats(form, iAtk, iDef, iSta, cpCap, startLvl) {
  if (startLvl === undefined) startLvl = 20;

  if (cpCap == 0)
    return calculateStats(form, iAtk,iDef,iSta, 40);

  cpCap += 0.001;

  let p = calculateStats(form, iAtk,iDef,iSta, startLvl);
  if (p.cp == cpCap)
    return p;

  else if (p.cp < cpCap) {
    let lp;
    for (; p.cp <= cpCap && p.level <= 40; p = calculateStats(form, iAtk,iDef,iSta, p.level + 0.5))
      lp = p;
    return lp;
  }

  else {
    for (; p.cp >= cpCap && p.level >= 0; p = calculateStats(form, iAtk,iDef,iSta, p.level - 0.5));
    return p;
  }

  return result;
}

function listOptimalStatsForCPCap(form, cpCap) {
  let list = [];
  let lastLvl = 20;
  for (let iAtk = 15; iAtk >= (form.pokemon.tradeable ? 0 : 10); --iAtk) {
    for (let iDef = 15; iDef >= (form.pokemon.tradeable ? 0 : 10); --iDef) {
      for (let iSta = 15; iSta >= (form.pokemon.tradeable ? 0 : 10); --iSta) {
        let iPokemon = calculateOptimalStats(form, iAtk,iDef,iSta, cpCap, lastLvl);
        list.push(iPokemon);
        lastLvl = iPokemon.level;
      }
    }
  }

  return {
    minStats: {
      attack:   d3.min(list.map(s => s.stats.attack)),
      defense:  d3.min(list.map(s => s.stats.defense)),
      hp:       d3.min(list.map(s => s.stats.hp)),
      product:  d3.min(list.map(s => s.stats.product))
    },
    maxStats: {
      attack:   d3.max(list.map(s => s.stats.attack)),
      defense:  d3.max(list.map(s => s.stats.defense)),
      hp:       d3.max(list.map(s => s.stats.hp)),
      product:  d3.max(list.map(s => s.stats.product))
    },
    list: list
  };
}

function sortByAttack(list) {
  list.sort(function(a,b) {
    let atk = b.stats.attack - a.stats.attack;
    if (atk != 0) return atk;

    let sTot = b.stats.product - a.stats.product;
    if (sTot != 0) return sTot;

    let cp = b.cp - a.cp;
    if (cp != 0) return cp;

    let def = b.stats.defense - a.stats.defense;
    if (def != 0) return def;

    let sta = b.stats.hp - a.stats.hp;
    return sta;
  });
  return list;
}

function sortByDefense(list) {
  list.sort(function(a,b) {
    let def = b.stats.defense - a.stats.defense;
    if (def != 0) return def;

    let sTot = b.stats.product - a.stats.product;
    if (sTot != 0) return sTot;

    let cp = b.cp - a.cp;
    if (cp != 0) return cp;

    let atk = b.stats.attack - a.stats.attack;
    if (atk != 0) return atk;

    let sta = b.stats.hp - a.stats.hp;
    return sta;
  });
  return list;
}

function sortByHP(list) {
  list.sort(function(a,b) {
    let sta = b.stats.hp - a.stats.hp;
    if (sta != 0) return sta;

    let sTot = b.stats.product - a.stats.product;
    if (sTot != 0) return sTot;

    let cp = b.cp - a.cp;
    if (cp != 0) return cp;

    let atk = b.stats.attack - a.stats.attack;
    if (atk != 0) return atk;

    let def = b.stats.defense - a.stats.defense;
    return def;
  });
  return list;
}

function sortByStatProduct(list) {
  list.sort(function(a,b) {
    let sTot = b.stats.product - a.stats.product;
    if (sTot != 0) return sTot;

    let cp = b.cp - a.cp;
    if (cp != 0) return cp;

    let atk = b.stats.attack - a.stats.attack;
    if (atk != 0) return atk;

    let def = b.stats.defense - a.stats.defense;
    if (def != 0) return def;

    let sta = b.stats.hp - a.stats.hp;
    return sta;
  });
  return list;
}

function sortByCP(list) {
  list.sort(function(a,b) {
    let cp = b.cp - a.cp;
    if (cp != 0) return cp;

    let sTot = b.stats.product - a.stats.product;
    if (sTot != 0) return sTot;

    let atk = b.stats.attack - a.stats.attack;
    if (atk != 0) return atk;

    let def = b.stats.defense - a.stats.defense;
    if (def != 0) return def;

    let sta = b.stats.hp - a.stats.hp;
    return sta;
  });
  return list;
}
