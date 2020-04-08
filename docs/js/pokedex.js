/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
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

    // Replace keys with references to types
    for (let t of this.types) {
      for (let e of t.effectiveness) {
        const ec = e;
        for (let tt of this.types.filter(ttt => ttt.key === ec.defendingType))
          e.defendingType = tt;
      }
    }

    // Load moves
    this.moves = {
      fast: json.moves.fast.map(m => new FastMove(m)),
      charged: json.moves.charged.map(m => new ChargedMove(m))
    };

    // Load items
    this.items = json.items.map(i => Object.assign(new Item(), i));

    // Load Pokémon
    this.pokemon = json.pokemon.map(p => new Pokemon(p));

    // Replace keys with references to Pokémon forms in evolutions, and set images
    for (let p of this.pokemon) {
      for (let f of p.forms) {
        for (let e of f.evolutions) {
          const ec = e;
          for (let pp of this.pokemon.filter(ppp => ppp.key === ec.pokemon))
          for (let ff of pp.forms.filter(fff => fff.key === ec.form))
          e.descendant = ff;
          delete e.pokemon;
          delete e.form;
        }
        f.image = (imgIndex.includes(f.key) ? f.key : p.forms[0].key);
      }
    }

    // Store min and max damage multipliers
    let min = 1;
    for (let t1 of this.types) {
      for (let t2 of this.types) {
        if (t1.key === t2.key) continue;
        let m = Math.min(...this.getCounterEffectiveness([t1, t2]).map(e => e.damageMultiplier));
        if (m < min)
          min = m;
      }
    }
    this.minDamageMultiplier = min;

    let max = 0;
    for (let t1 of this.types) {
      for (let t2 of this.types) {
        if (t1.key === t2.key) continue;
        let m = Math.max(...this.getCounterEffectiveness([t1, t2]).map(e => e.damageMultiplier));
        if (m > max)
          max = m;
      }
    }
    this.maxDamageMultiplier = max;

    progress(1);
    done();
  }

  getCounterEffectiveness(types) {
    let result = pokedex.types.map(t => { return {
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

    this.forms = this.forms.map(function(f) {
      let form = new Form(f);
      form.pokemon = this;
      if (!form.description) {
        const description = this.description;
        delete form.description;
        Object.defineProperty(form, "description", {get: () => description});
      }
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

    for (let e of this.evolutions) {
      const ec = e;
      if (e.requirements.item)
        e.requirements.item = pokedex.items.find(i => i.key === ec.requirements.item);
    }
  }

  get counterEffectiveness() {
    return pokedex.getCounterEffectiveness(this.types);
  }

  get ancestor() {
    for (let p of pokedex.pokemon)
      for (let f of p.forms)
        if (f.evolutions.find(e => e.descendant.key === this.key) !== undefined)
          return f;
    return undefined;
  }

  get firstAncestor() {
    let a = this;
    for (; a.ancestor !== undefined; a = a.ancestor);
    return a;
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
