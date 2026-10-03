/* LessonPrep — accounts gate (Stage: auth).
   - Sign-up stores teachers locally (hashed passwords, never plain text).
   - Sign-in accepts email OR phone number + password.
   - Every page except login.html/signup.html auto-redirects here when signed out.
   - NOTE: learning-grade auth (local device). Real cloud auth comes later. */
(function () {
  var UKEY = "lp_users", SKEY = "lp_session";

  function getUsers() { try { return JSON.parse(localStorage.getItem(UKEY)) || []; } catch (e) { return []; } }
  function saveUsers(u) { localStorage.setItem(UKEY, JSON.stringify(u)); }
  function normPhone(p) { return ((p || "").replace(/[\s\-()]/g, "")); }

  async function hash(pw) {
    var salted = "lp$" + pw;
    try {
      if (window.crypto && crypto.subtle) {
        var d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
        return Array.from(new Uint8Array(d)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      }
    } catch (e) {}
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < salted.length; i++) {
      var ch = salted.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "f" + (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
  }

  window.Auth = {
    current: function () {
      var id = null;
      try { id = localStorage.getItem(SKEY); } catch (e) {}
      if (!id) return null;
      var users = getUsers();
      for (var i = 0; i < users.length; i++) if (users[i].id === id) return users[i];
      return null;
    },
    signup: async function (data) {
      // data: {firstName, middleName, lastName, age, phone, email, country, address, gender, password}
      var users = getUsers();
      var phone = normPhone(data.phone);
      var email = (data.email || "").trim().toLowerCase();
      for (var i = 0; i < users.length; i++) {
        if (normPhone(users[i].phone) === phone) throw new Error("This phone number is already registered. Please sign in.");
        if (email && users[i].email === email) throw new Error("This email is already registered. Please sign in.");
      }
      var user = {
        id: "u" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
        firstName: data.firstName.trim(), middleName: (data.middleName || "").trim(), lastName: data.lastName.trim(),
        age: data.age || "", phone: data.phone.trim(), email: email,
        country: data.country.trim(), address: data.address.trim(), gender: data.gender,
        passHash: await hash(data.password), createdAt: Date.now()
      };
      users.push(user); saveUsers(users);
      try { localStorage.setItem(SKEY, user.id); } catch (e) {}
      return user;
    },
    login: async function (identifier, password) {
      var idn = (identifier || "").trim();
      var isEmail = idn.indexOf("@") !== -1;
      var users = getUsers(), found = null;
      for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (isEmail ? (u.email === idn.toLowerCase()) : (normPhone(u.phone) === normPhone(idn))) { found = u; break; }
      }
      if (!found) throw new Error(isEmail ? "No account with this email. Please sign up first." : "No account with this phone number. Please sign up first.");
      if ((await hash(password)) !== found.passHash) throw new Error("Wrong password. Try again.");
      try { localStorage.setItem(SKEY, found.id); } catch (e) {}
      return found;
    },
    logout: function () { try { localStorage.removeItem(SKEY); } catch (e) {} location.href = "login.html"; }
  };

  // ---- gate: everybody signs up/in before using the app ----
  var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (page !== "login.html" && page !== "signup.html") {
    if (!window.Auth.current()) location.replace("login.html");
  }
})();
