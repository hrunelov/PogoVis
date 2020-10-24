const TYPE_COLORS = {
  bug:      "#7A9C26",
  dark:     "#51525E",
  dragon:   "#075A96",
  electric: "#C6AE4A",
  fairy:    "#CC8BC0",
  fighting: "#AA354C",
  fire:     "#CB8142",
  flying:   "#7C8FB4",
  ghost:    "#4E5797",
  grass:    "#4B9852",
  ground:   "#AB724B",
  ice:      "#63A89F",
  normal:   "#747B81",
  poison:   "#944EA6",
  psychic:  "#CA6B6A",
  rock:     "#A29772",
  steel:    "#437882",
  water:    "#4B88B0",
  unknown:  "#807A78"
};

var pokedex;

class Pokedex extends JSONAssignedObject {
  constructor(json, imgIndex, progress, done) {
    super(json);

    pokedex = this;

    // Load types
    this.types = json.types.map(t => new Type(t));
    progress(0.09);

    // Replace keys with references to types
    for (let t of this.types) {
      for (let e of t.effectiveness) {
        const ec = e;
        for (let tt of this.types.filter(ttt => ttt.key === ec.defendingType))
          e.defendingType = tt;
      }
    }
    progress(0.18);

    // Load moves
    this.moves = {
      fast: json.moves.fast.map(m => new FastMove(m)),
      charged: json.moves.charged.map(m => new ChargedMove(m))
    };
    progress(0.27);

    // Load items
    this.items = json.items.map(i => Object.assign(new Item(), i));
    progress(0.36);

    // Load Pokémon
    this.pokemon = json.pokemon.map(p => new Pokemon(p));
    progress(0.45);

    // Replace keys with references to Pokémon and forms in evolutions and relatives, and set images
    for (let p of this.pokemon) {
      for (let f of p.forms) {
        if (f.evolutions) {
          for (let e of f.evolutions) {
            const ec = e;
            for (let pp of this.pokemon.filter(ppp => ppp.key === ec.pokemon))
              for (let ff of pp.forms.filter(fff => fff.key === ec.form))
                e.descendant = ff;
            delete e.pokemon;
            delete e.form;
          }
        }
        f.image = /*(imgIndex.includes(f.key) ?*/ f.key /*: p.forms[0].key)*/;
      }
      if (p.relatives)
        for (let i = 0; i < p.relatives.length; ++i)
          p.relatives[i] = this.pokemon.filter(pp => pp.key === p.relatives[i])[0];
    }
    progress(0.54);

    // Super Effective Multiplier
    this.superEffectiveMultiplier = function() {
      for (let t of this.types)
        for (let e of t.effectiveness)
          if (e.damageMultiplier > 1)
            return e.damageMultiplier;
    }.bind(this)();

    // Not Very Effective Multiplier
    this.notVeryEffectiveMultiplier = function() {
      for (let t of this.types)
        for (let e of t.effectiveness)
          if (e.damageMultiplier < 1 && this.types.find(tt => tt.effectiveness.find(ee => ee.damageMultiplier < e.damageMultiplier)))
            return e.damageMultiplier;
    }.bind(this)();

    // Immune Multiplier
    this.immuneMultiplier = function() {
      for (let t of this.types)
        for (let e of t.effectiveness)
          if (!this.types.find(tt => tt.effectiveness.find(ee => ee.damageMultiplier < e.damageMultiplier)))
            return e.damageMultiplier;
    }.bind(this)();

    // Store max league stats
    // let maxGreatStats = this.pokemon.map(p => p.forms.map(f => listOptimalStatsForCPCap(f,1500).maxStats));
    // this.max.greatStats = {
    //   attack:   d3.max(maxGreatStats.map(p => d3.max(p.map(f => f.attack)))),
    //   defense:  d3.max(maxGreatStats.map(p => d3.max(p.map(f => f.defense)))),
    //   hp:       d3.max(maxGreatStats.map(p => d3.max(p.map(f => f.hp))))
    // };
    progress(0.72);
    // let maxUltraStats = this.pokemon.map(p => p.forms.map(f => listOptimalStatsForCPCap(f,2500).maxStats));
    // this.max.ultraStats = {
    //   attack:   d3.max(maxUltraStats.map(p => d3.max(p.map(f => f.attack)))),
    //   defense:  d3.max(maxUltraStats.map(p => d3.max(p.map(f => f.defense)))),
    //   hp:       d3.max(maxUltraStats.map(p => d3.max(p.map(f => f.hp))))
    // };
    progress(0.81);
    // let maxMasterStats = this.pokemon.map(p => p.forms.map(f => listOptimalStatsForCPCap(f,0).maxStats));
    // this.max.masterStats = {
    //   attack:   d3.max(maxMasterStats.map(p => d3.max(p.map(f => f.attack)))),
    //   defense:  d3.max(maxMasterStats.map(p => d3.max(p.map(f => f.defense)))),
    //   hp:       d3.max(maxMasterStats.map(p => d3.max(p.map(f => f.hp))))
    // };
    progress(0.9);

    progress(1);
    done();
  }

  getCounterEffectiveness(types) {
    let result = this.types.map(t => { return {
      attackingType: t,
      damageMultiplier: 1
    };});

    for (let t of types) {
      for (let e of t.counterEffectiveness) {
        const ec = e;
        result.find(ee => ee.attackingType.key === ec.attackingType.key).damageMultiplier *= ec.damageMultiplier;
      }
    }

    return result;
  }
}

class Type extends JSONAssignedObject {
  get counterEffectiveness() {
    return pokedex.types.map(function(t) { return {
      attackingType: t,
      damageMultiplier: t.effectiveness.find(e => e.defendingType.key === this.key).damageMultiplier
    };}.bind(this));
  }

  get color() {
    return TYPE_COLORS[this.key];
  }
}

class FastMove extends JSONAssignedObject {
  constructor(json) {
    super(json);
    if (this.type)
      this.type = pokedex.types.find(t => t.key === this.type);
    else
      this.type = new Type();
  }
}

class ChargedMove extends JSONAssignedObject {
  constructor(json) {
    super(json);
    this.type = pokedex.types.find(t => t.key === this.type);
  }
}

class Item extends JSONAssignedObject {}

class Pokemon extends JSONAssignedObject {
  constructor(json) {
    super(json);

    if (!this.name)
      this.name = "MissingNo.";

    if (!this.category)
      this.category = "??? Pokémon";

    this.forms = this.forms.map(function(f) {
      let form = new Form(f);
      form.pokemon = this;
      // if (!form.description) {
      //   const description = (this.description ? this.description : "Data missing.");
      //   delete form.description;
      //   Object.defineProperty(form, "description", {get: () => description});
      // }
      return form;
    }.bind(this));
  }
}

class Form extends JSONAssignedObject {
  constructor(json) {
    super(json);

    this.types = this.types.map(t => pokedex.types.find(tt => tt.key === t));

    for (let m of this.movePool.fast) {
      const mc = m;
      m.move = pokedex.moves.fast.find(mm => mm.key === mc.move);
    }
    for (let m of this.movePool.charged) {
      const mc = m;
      m.move = pokedex.moves.charged.find(mm => mm.key === mc.move);
    }

    if (this.evolutions) {
      for (let e of this.evolutions) {
        const ec = e;
        if (e.requirements.item)
          e.requirements.item = pokedex.items.find(i => i.key === ec.requirements.item);
      }
    }
  }

  get counterEffectiveness() {
    return pokedex.getCounterEffectiveness(this.types);
  }

  get ancestor() {
    for (let p of pokedex.pokemon)
      for (let f of p.forms)
        if (f.evolutions && f.evolutions.find(e => e.descendant && e.descendant.key === this.key))
          return f;
    return undefined;
  }

  get firstAncestor() {
    let a = this;
    for (; a.ancestor; a = a.ancestor);
    return a;
  }

  get lineage() {
    let result = [];
    let r = this.firstAncestor;
    function recurse(a) {
      result.push(a);
      if (a.evolutions)
        for (let e of a.evolutions)
          recurse(e.descendant);
    }
    recurse(this.firstAncestor);
    return result;
  }

  sameTyping(other, strict) {
    if (this.types.length !== other.types.length)
      return false;
    let firstSame = this.types[0].key === other.types[0].key;
    if (this.types.length === 1) return firstSame;
    return (firstSame && this.types[1].key === other.types[1].key) ||
           (!strict && this.types[0].key === other.types[1].key && this.types[1].key === other.types[0].key);
  }
}

function getTypeSplitColor(types, t, brightness) {
  let c1 = mixColors("#000", types[0].color, brightness);
  if (types.length == 1)
    return c1;
  else {
    let c2 = mixColors("#000", types[1].color, brightness);
    return splitColor("to bottom", c1, c2, t);
  }
}

// function getAverageBaseStats() {
//   let result = {
//     attack: 0,
//     defense: 0,
//     stamina: 0
//   };
//
//   let n = 0;
//   for (let pokemon of pokedex.pokemon) {
//     for (let form of pokemon.forms) {
//       result.attack += form.baseStats.attack;
//       result.defense += form.baseStats.defense;
//       result.stamina += form.baseStats.stamina;
//       ++n;
//     }
//   }
//   result.attack /= n;
//   result.defense /= n;
//   result.stamina /= n;
//
//   return result;
// }
