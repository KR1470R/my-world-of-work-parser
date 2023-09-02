const washText = require("./washText.js");

const getSelectorWithText = (document, selector, text) => {
  return document.querySelectorAll(selector).filter(el => washText(el.innerText) === text)[0];
}

module.exports = getSelectorWithText;
