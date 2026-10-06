/* LessonPrep accounts — device-local sign-up / login (no server, no cost).
   - Accounts live ONLY on this device/browser (private by design).
   - Passwords are never stored: salted SHA-256 hash via WebCrypto.
   - Honest limit: this stops casual snoopers on shared devices, NOT someone
     with developer tools + time. A cloud account system (Supabase Auth) can
     replace these functions later without touching page code.
   API (all pages): Auth.require() [sync gate], Auth.signUp(), Auth.login(),
   Auth.logout(), Auth.current(). */
(function () {
  var USERS_KEY = "lp_users";
  var SESSION_KEY = "lp_session";

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function normId(id) { return (id || "").trim().toLowerCase(); }

  async function sha256(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function salt() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  window.Auth = {
    hasUsers: function () { return readUsers().length > 0; },
    current: function () {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
      catch (e) { return null; }
    },
    // Call FIRST on every protected page. Not logged in -> login page.
    require: function () {
      if (!this.current()) location.replace("login.html");
    },
    async signUp(firstName, lastName, identifier, password) {
      firstName = (firstName || "").trim(); lastName = (lastName || "").trim();
      identifier = normId(identifier); password = password || "";
      if (firstName.length < 2) throw new Error("Please enter your first name.");
      if (lastName.length < 2) throw new Error("Please enter your last name.");
      if (identifier.length < 3) throw new Error("Enter an email address or phone number.");
      if (password.length < 6) throw new Error("Password needs at least 6 characters.");
      var users = readUsers();
      if (users.some(function (u) { return u.id === identifier; })) throw new Error("Account exists — please log in instead.");
      var s = salt();
      var name = firstName + " " + lastName;
      var user = { id: identifier, name: name, firstName: firstName, lastName: lastName, salt: s, hash: await sha256(s + password), createdAt: Date.now() };
      users.push(user); saveUsers(users);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name }));
      return user;
    },
    async login(identifier, password) {
      identifier = normId(identifier); password = password || "";
      var user = readUsers().find(function (u) { return u.id === identifier; });
      if (!user) throw new Error("No account found — please sign up first.");
      var hash = await sha256(user.salt + password);
      if (hash !== user.hash) throw new Error("Wrong password — try again.");
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name }));
      return user;
    },
    logout: function () {
      localStorage.removeItem(SESSION_KEY);
      location.replace("login.html");
    }
  };
})();
