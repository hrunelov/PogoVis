const TYPE_COLORS = {
  "bug":      "#99c32f",
  "dark":     "#656776",
  "dragon":   "#0970bb",
  "electric": "#f7da5c",
  "fairy":    "#ffaef0",
  "fighting": "#d5425f",
  "fire":     "#fea153",
  "flying":   "#9bb3e1",
  "ghost":    "#626dbd",
  "grass":    "#5ebe67",
  "ground":   "#d68e5e",
  "ice":      "#7cd2c7",
  "normal":   "#919aa1",
  "poison":   "#b961cf",
  "psychic":  "#fc8684",
  "rock":     "#cbbd8e",
  "steel":    "#5496a2",
  "water":    "#5eaadc"
};

var pokedex;

class Pokedex extends JSONAssignedObject {
  constructor(json, imgIndex, progress, done) {
    super(json);

    pokedex = this;

    let newPokemon = [];
    let newTypes = [];
    let newMoves = {
      "fast": [],
      "charged": []
    };
    let newItems = [];

    // Load types
    for (let t of json.types)
      newTypes.push(new Type(t));
    this.types = newTypes;

    // Replace keys with references to types
    for (let t of this.types)
      for (let e of t.effectiveness) {
        const ec = e;
        for (let tt of this.types.filter(ttt => ttt.key === ec.defendingType))
          e.defendingType = tt;
      }

    // Load moves
    for (let m of json.moves.fast)
      newMoves.fast.push(new FastMove(m));
    for (let m of json.moves.charged)
      newMoves.charged.push(new ChargedMove(m));
    this.moves = newMoves;

    // Load items
    for (let i of json.items)
      newItems.push(Object.assign(new Item(), i));
    this.items = newItems;

    // Load Pokémon
    for (let p of json.pokemon)
      newPokemon.push(new Pokemon(p));
    this.pokemon = newPokemon;

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
    progress(1);
    done();
  }
}

class Type extends JSONAssignedObject {
  get counterEffectiveness() {
    let result = [];
    for (let t of pokedex.types) {
      result.push({
        "attackingType": t,
        "damageMultiplier": t.effectiveness.find(e => e.defendingType.key === this.key).damageMultiplier
      });
    }
    return result;
  }

  get color() {
    return TYPE_COLORS[this.key];
  }
}

class FastMove extends JSONAssignedObject {
  constructor(json) {
    super(json);
    this.type = pokedex.types.find(t => t.key === this.type);
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

    let newForms = [];

    for (let f of json.forms) {
      let form = new Form(f);
      form.pokemon = this;
      if (!form.description) {
        const description = this.description;
        delete form.description;
        Object.defineProperty(form, "description", {get: () => description});
      }
      newForms.push(form);
    }
    this.forms = newForms;
  }
}

class Form extends JSONAssignedObject {
  constructor(json) {
    super(json);

    let newTypes = [];

    for (let t of this.types) {
      const tc = t;
      newTypes.push(pokedex.types.find(tt => tt.key === tc));
    }
    this.types = newTypes;

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
    let result = [];
    for (let type of pokedex.types) {
      result.push({
        "attackingType": type,
        "damageMultiplier": 1
      });
    }

    for (let type of this.types) {
      for (let e of type.counterEffectiveness) {
        const ec = e;
        result.find(ee => ee.attackingType.key === ec.attackingType.key).damageMultiplier *= ec.damageMultiplier;
      }
    }

    return result;
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

function getAverageBaseStats() {
  let result = {
    "attack": 0,
    "defense": 0,
    "stamina": 0
  };

  let n = 0;
  for (let pokemon of pokedex.pokemon) {
    for (let form of pokemon.forms) {
      result.attack += form.baseStats.attack;
      result.defense += form.baseStats.defense;
      result.stamina += form.baseStats.stamina;
      ++n;
    }
  }
  result.attack /= n;
  result.defense /= n;
  result.stamina /= n;

  return result;
}
