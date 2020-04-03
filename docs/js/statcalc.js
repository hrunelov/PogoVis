/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
const CPM = {
  1.0  : 0.094,
  1.5  : 0.1351374318,
  2.0  : 0.16639787,
  2.5  : 0.192650919,
  3.0  : 0.21573247,
  3.5  : 0.2365726613,
  4.0  : 0.25572005,
  4.5  : 0.2735303812,
  5.0  : 0.29024988,
  5.5  : 0.3060573775,
  6.0  : 0.3210876,
  6.5  : 0.3354450362,
  7.0  : 0.34921268,
  7.5  : 0.3624577511,
  8.0  : 0.3752356,
  8.5  : 0.387592416,
  9.0  : 0.39956728,
  9.5  : 0.4111935514,
  10.0 : 0.4225,
  10.5 : 0.4329264091,
  11.0 : 0.44310755,
  11.5 : 0.4530599591,
  12.0 : 0.4627984,
  12.5 : 0.472336093,
  13.0 : 0.48168495,
  13.5 : 0.4908558003,
  14.0 : 0.49985844,
  14.5 : 0.508701765,
  15.0 : 0.51739395,
  15.5 : 0.5259425113,
  16.0 : 0.5343543,
  16.5 : 0.5426357375,
  17.0 : 0.5507927,
  17.5 : 0.5588305862,
  18.0 : 0.5667545,
  18.5 : 0.5745691333,
  19.0 : 0.5822789,
  19.5 : 0.5898879072,
  20.0 : 0.5974,
  20.5 : 0.6048236651,
  21.0 : 0.6121573,
  21.5 : 0.6194041216,
  22.0 : 0.6265671,
  22.5 : 0.6336491432,
  23.0 : 0.64065295,
  23.5 : 0.6475809666,
  24.0 : 0.65443563,
  24.5 : 0.6612192524,
  25.0 : 0.667934,
  25.5 : 0.6745818959,
  26.0 : 0.6811649,
  26.5 : 0.6876849038,
  27.0 : 0.69414365,
  27.5 : 0.70054287,
  28.0 : 0.7068842,
  28.5 : 0.7131691091,
  29.0 : 0.7193991,
  29.5 : 0.7255756136,
  30.0 : 0.7317,
  30.5 : 0.7347410093,
  31.0 : 0.7377695,
  31.5 : 0.7407855938,
  32.0 : 0.74378943,
  32.5 : 0.7467812109,
  33.0 : 0.74976104,
  33.5 : 0.7527290867,
  34.0 : 0.7556855,
  34.5 : 0.7586303683,
  35.0 : 0.76156384,
  35.5 : 0.7644860647,
  36.0 : 0.76739717,
  36.5 : 0.7702972656,
  37.0 : 0.7731865,
  37.5 : 0.7760649616,
  38.0 : 0.77893275,
  38.5 : 0.7817900548,
  39.0 : 0.784637,
  39.5 : 0.7874736075,
  40.0 : 0.7903
};

function calculateStats(pokemon, iAtk, iDef, iSta, lvl) {
  let result = {};
  result.level = lvl;
  result.attackIV = iAtk;
  result.defenseIV = iDef;
  result.hpIV = iSta;
  result.attack = (pokemon.stats.baseAttack + iAtk) * CPM[lvl];
  result.defense = (pokemon.stats.baseDefense + iDef) * CPM[lvl];
  result.hp = (pokemon.stats.baseStamina + iSta) * CPM[lvl];
  result.statProduct = Math.round(result.attack * result.defense * Math.floor(result.hp));
  result.cp = Math.floor(((pokemon.stats.baseAttack + iAtk)
            * Math.sqrt(pokemon.stats.baseDefense + iDef)
            * Math.sqrt(pokemon.stats.baseStamina + iSta)
            * Math.pow(CPM[lvl], 2)) * 0.1);
  if (result.cp < 10) result.cp = 10;
  return result;
}

function calculateOptimalStats(pokemon, iAtk, iDef, iSta, cpCap, startLvl) {
  if (startLvl === undefined) startLvl = 20;

  if (cpCap == 0)
    return calculateStats(pokemon, iAtk,iDef,iSta, 40);

  cpCap += 0.001;

  let p = calculateStats(pokemon, iAtk,iDef,iSta, startLvl);
  if (p.cp == cpCap)
    return p;

  else if (p.cp < cpCap) {
    let lp;
    for (; p.cp <= cpCap && p.level <= 40; p = calculateStats(pokemon, iAtk,iDef,iSta, p.level + 0.5))
      lp = p;
    return lp;
  }

  else {
    for (; p.cp >= cpCap && p.level >= 0; p = calculateStats(pokemon, iAtk,iDef,iSta, p.level - 0.5));
    return p;
  }

  return result;
}

function listOptimalStatsForCPCap(pokemon, cpCap) {
  let list = [];
  let lastLvl = 20;
  for (let iAtk = 15; iAtk >= (pokemon.tradeable ? 0 : 10); --iAtk) {
    for (let iDef = 15; iDef >= (pokemon.tradeable ? 0 : 10); --iDef) {
      for (let iSta = 15; iSta >= (pokemon.tradeable ? 0 : 10); --iSta) {
        let iPokemon = calculateOptimalStats(pokemon, iAtk,iDef,iSta, cpCap, lastLvl);
        list.push(iPokemon);
        lastLvl = iPokemon.level;
      }
    }
  }

  list.sort((function(a,b) {
    let sTot = b.statProduct - a.statProduct;
    if (sTot != 0) return sTot;

    let cp = b.cp - a.cp;
    if (cp != 0) return cp;

    let atk = b.attack - a.attack;
    if (atk != 0) return atk;

    let def = b.defense - a.defense;
    if (def != 0) return def;

    let sta = b.hp - a.hp;
    return sta;
  }));

  return list;
}
