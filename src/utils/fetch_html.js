const fetch_html = async (url) => {
  const html = await (await fetch(
    url,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0"
      }
    }
  )).text();
  return html;
}

module.exports = fetch_html;
