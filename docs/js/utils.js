/*! PogoVis v0.0.1 | (c) 2020 Hannes Runelöv | MIT License |  */
class JSONAssignedObject {
  constructor(json) {
    Object.assign(this, json);
  }
}

function deepFreeze(o) {
  let frozen = [];
  let deepFreezeSafe = function(oo) {
    if (frozen.includes(oo))
      return;
    frozen.push(oo);
    for (let prop of Object.getOwnPropertyNames(oo)) {
      let value = oo[prop];
      if (value && typeof value === "object")
        deepFreezeSafe(value);
    }
    Object.freeze(oo);
  };
  deepFreezeSafe(o);
}

function equivalent(o1, o2, ignore) {
	if (typeof o1 !== typeof o2)
  	return false;

  if (typeof o1 !== "object")
  	return o1 === o2;

  if (Object.getOwnPropertyNames(o1).length != Object.getOwnPropertyNames(o2).length)
    return false;

  let checked1 = [];
  let checked2 = [];
  let differs = false;
  let recurse = function(oo1, oo2) {
    if (checked1.includes(oo1) || checked2.includes(oo2))
      return;

    checked1.push(oo1);
    checked2.push(oo2);

    let len = Object.getOwnPropertyNames(oo1).length;
    let props1 = Object.getOwnPropertyNames(oo1);
    let props2 = Object.getOwnPropertyNames(oo2);

    for (let i = 0; i < len; ++i) {
      let prop1 = props1[i];
      let prop2 = props2[i];

      if (ignore && (ignore.includes(prop1) || ignore.includes(prop2)))
        return;

      if (prop1 !== prop2) {
        differs = true;
        return;
      }

      let value1 = oo1[prop1];
      let value2 = oo2[prop2];
      if (value1 && value2 && typeof value1 === "object" && typeof value2 === "object")
        recurse(value1, value2);
      else if (value1 !== value2) {
        differs = true;
      }
    }
  };
  recurse(o1, o2);
  return !differs;
}

function hexToRgba(hex) {
  if (hex.length == 4) {
    let oldHex = hex;
    hex = "#";
    for (let i = 1; i <= 3; ++i)
      for (let j = 0; j < 2; ++j)
        hex += oldHex.charAt(i);
  }

  let result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: !result[4] ? 255 : parseInt(result[4], 16)
  } : undefined;
}

function rgbaToHex(rgba) {
  if (!rgba.a) rgba.a = 255;

  let s = function(c) {
  	c = c.toString(16);
    if (c.length < 2) c = "0" + c;
    return c;
  };

  return "#" + s(rgba.r) + s(rgba.g) + s(rgba.b) + s(rgba.a);
}

function mixColors(c1, c2, t) {
  let re = /rgb\(\s*([0-9]+\.?[0-9]*)\s*,\s*([0-9]+\.?[0-9]*)\s*,\s*([0-9]+\.?[0-9]*)\s*\)/i;
  let match1 = re.exec(c1);
  let match2 = re.exec(c2);

  let rgba1 = (match1 ? {r: match1[1], g: match1[2], b: match1[3], a: 255} : hexToRgba(c1));
  let rgba2 = (match2 ? {r: match2[1], g: match2[2], b: match2[3], a: 255} : hexToRgba(c2));

  let rgba = {
    r: Math.round((1-t)*rgba1.r + t*rgba2.r),
    g: Math.round((1-t)*rgba1.g + t*rgba2.g),
    b: Math.round((1-t)*rgba1.b + t*rgba2.b),
    a: Math.round((1-t)*rgba1.a + t*rgba2.a)
  };
  return rgbaToHex(rgba);
}

function getFontColor(color) {
  let rgb = hexToRgba(color);
  let con = (c1,c2) => {
    let lum = c => {
      let calc = d => {
        d /= 255.0;
        if (d <= 0.03928) d /= 12.92;
        else d = Math.pow((d + 0.055) / 1.055, 2.4);
        return d;
      };
      return 0.2126 * calc(c.r) + 0.7152 * calc(c.g) + 0.0722 * calc(c.b);
    };
    let c1L = lum(c1) + 0.3;
    let c2L = lum(c2) + 0.3;
    return Math.max(c1L, c2L) / Math.min(c1L, c2L);
  };
  return con(rgb, {r:255, g:255, b:255}) > con(rgb, {r:0, g:0, b:0}) ? "#ffffff" : "#000000";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1, str.length-1).toLowerCase();
}

function generateFrame(s, caption, class1, class2, class3, class4) {
  let f = s.append("div")
    .classed("frame", true);

  if (class1)
    f.classed(class1, true);
  if (class2)
    f.classed(class2, true);
  if (class3)
    f.classed(class3, true);
  if (class4)
    f.classed(class4, true);

  f.append("span")
    .classed("frame-caption", true)
    .text(caption);

  let b = f.append("div")
    .classed("frame-body", true);

  return b;
}

function splitColor(dir, c1, c2, t) {
  return "linear-gradient(" + dir + "," +
                              c1 + " 0%," +
                              c1 + " " + (t*100) + "%," +
                              c2 + " " + (t*100) + "%," +
                              c2 + " 100%)";
}

function oneDecimal(num) {
  return Math.round(num*10)/10;
}

function functionize(x) {
  if (typeof x === "function")
    return x;
  else
    return () => x;
}
