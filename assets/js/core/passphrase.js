// Replace password placeholders in code blocks with a randomly generated passphrase
// so users don't copy placeholder values into real deployments.

document.addEventListener("DOMContentLoaded", () => {
  const words = [
    "Alder",
    "Apple",
    "Ash",
    "Aspen",
    "Balsa",
    "Basswood",
    "Beech",
    "Birch",
    "Boxwood",
    "Cedar",
    "Cherry",
    "Chestnut",
    "Cottonwood",
    "Cypress",
    "Dogwood",
    "Douglas",
    "Elder",
    "Elm",
    "Eucalyptus",
    "Fir",
    "Ginkgo",
    "Hawthorn",
    "Hazel",
    "Hemlock",
    "Hickory",
    "Holly",
    "Juniper",
    "Larch",
    "Laurel",
    "Linden",
    "Locust",
    "Magnolia",
    "Maple",
    "Mulberry",
    "Oak",
    "Olive",
    "Osage",
    "Pawpaw",
    "Pear",
    "Pecan",
    "Pine",
    "Plane",
    "Plum",
    "Poplar",
    "Redwood",
    "Rowan",
    "Sequoia",
    "Spruce",
    "Sycamore",
    "Teak",
    "Tulip",
    "Walnut",
    "Willow",
    "Yew",
  ];

  function randomInt(max) {
    const buf = new Uint32Array(1);
    // Rejection sampling to avoid modulo bias.
    const limit = 0x100000000 - (0x100000000 % max);
    do {
      crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }

  function generatePassphrase() {
    let result = Array.from(
      { length: 4 },
      () => words[randomInt(words.length)],
    ).join("-");
    const digitCount = randomInt(2) + 1; // 1 or 2 digits
    for (let i = 0; i < digitCount; i++) {
      const pos = randomInt(result.length + 1);
      result = result.slice(0, pos) + randomInt(10) + result.slice(pos);
    }
    return result;
  }

  function getPassphrase(name) {
    // Reuse the same passphrase within a browser session so users can navigate between pages and
    // refresh without the password changing under them.
    const keyName = `cedar-docs-${name}`;
    let passphrase = sessionStorage.getItem(keyName);
    if (!passphrase) {
      passphrase = generatePassphrase();
      sessionStorage.setItem(keyName, passphrase);
    }
    return passphrase;
  }

  document.querySelectorAll("pre code").forEach((code) => {
    const text = code.textContent;
    const hasCedarPassword = text.includes(
      "REPLACE_WITH_SECURE_CEDAR_PASSWORD",
    );
    const hasUserPassword = text.includes("REPLACE_WITH_SECURE_USER_PASSWORD");

    if (!hasCedarPassword && !hasUserPassword) return;

    let html = code.innerHTML;
    if (hasCedarPassword) {
      const passphrase = getPassphrase("cedar-password");
      html = html.replaceAll("REPLACE_WITH_SECURE_CEDAR_PASSWORD", passphrase);
    }
    if (hasUserPassword) {
      const passphrase = getPassphrase("cedardb-user");
      html = html.replaceAll("REPLACE_WITH_SECURE_USER_PASSWORD", passphrase);
    }
    code.innerHTML = html;
  });
});
