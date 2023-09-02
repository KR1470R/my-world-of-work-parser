function decodeEntities(encodedString) {
  if (!encodedString) return;
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
      "nbsp":" ",
      "amp" : "&",
      "quot": "\"",
      "lt"  : "<",
      "gt"  : ">",
      "pound": "£",
      "dollar": "$",
      "euro": "€",
      "cent": "¢",
      "yen": "¥",
  };
  return encodedString.replace(translate_re, function(match, entity) {
      return translate[entity];
  }).replace(/&#(\d+);/gi, function(match, numStr) {
      var num = parseInt(numStr, 10);
      return String.fromCharCode(num);
  });
}

const washText = (text) => {
  let result = decodeEntities(text?.replaceAll("\n", " ")?.trim())?.trim().replaceAll("  ", " ");
  if (result?.includes("-")) {
    result = result.split("-").map(word => word.trim()).join(" - ");
  }
  return result;
}

console.log(washText("Accountant- Management"))

module.exports = washText;
