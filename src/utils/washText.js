function decodeEntities(encodedString) {
  if (!encodedString) return;
  const translate_re = /&(nbsp|amp|quot|lt|gt|pound|dollar|euro|cent|yen);/g;
  const translate = {
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
    const num = parseInt(numStr, 10);
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

console.log(washText("Accountant- Management &pound;14,000"))

module.exports = washText;
