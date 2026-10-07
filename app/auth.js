/* LessonPrep accounts — two modes, same page code.
 *
 * DEVICE mode (default, offline): accounts live ONLY in this browser
 *   (localStorage lp_users, salted SHA-256). No internet needed.
 * CLOUD mode (needs one-time free Supabase setup, see docs/SUPABASE_SETUP.md):
 *   email accounts live in your Supabase project, so a teacher can sign up
 *   on one phone and log in on another — and you see every account in the
 *   Supabase dashboard (Authentication → Users). Phone-number identifiers
 *   always stay device-local (Supabase SMS needs a paid add-on).
 *
 * Honest limits: device mode stops casual snoopers, not DevTools. Cloud
 * mode adds real cross-device login + recovery emails, but lessons themselves
 * still live on-device until a later sync step.
 */
(function () {
  var USERS_KEY = "lp_users";
  var SESSION_KEY = "lp_session";
  var SB_KEY = "lp_supabase";
  var _client = null;

  function normId(id) { return (id || "").trim().toLowerCase(); }
  function isEmail(id) { return /.+@.+\..+/.test(id); }

  // ---------- device store ----------
  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function setSession(id, name, cloud) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: id, name: name, cloud: !!cloud }));
  }
  async function sha256(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function salt() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  // ---------- cloud (Supabase) ----------
  function sbConfig() {
    try { return JSON.parse(localStorage.getItem(SB_KEY)) || null; }
    catch (e) { return null; }
  }
  function cloudReady() {
    var c = sbConfig();
    return !!(c && c.url && c.key && window.supabase && navigator.onLine);
  }
  function client() {
    if (_client) return _client;
    var c = sbConfig();
    _client = window.supabase.createClient(c.url, c.key);
    return _client;
  }

  window.Auth = {
    // settings (Profile page)
    cloudConfig: sbConfig,
    saveCloud: function (url, key) {
      _client = null;
      localStorage.setItem(SB_KEY, JSON.stringify({ url: (url || "").trim().replace(/\/$/, ""), key: (key || "").trim() }));
    },
    cloudOn: cloudReady,

    hasUsers: function () { return readUsers().length > 0; },
    current: function () {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
      catch (e) { return null; }
    },
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

      // Cloud path: email + configured + online.
      if (cloudReady() && isEmail(identifier)) {
        var r = await client().auth.signUp({
          email: identifier, password: password,
          options: { data: { first_name: firstName, last_name: lastName } }
        });
        if (r.error) throw new Error(r.error.message);
        if (!r.data.session) throw new Error("Account created — check your email to confirm it, then log in.");
        setSession(identifier, firstName + " " + lastName, true);
        return { id: identifier, name: firstName + " " + lastName };
      }
      if (cloudReady() && !isEmail(identifier)) {
        // fall through to device account (SMS needs paid add-on)
      }
      var users = readUsers();
      if (users.some(function (u) { return u.id === identifier; })) throw new Error("Account exists — please log in instead.");
      var s = salt();
      var user = { id: identifier, name: firstName + " " + lastName, firstName: firstName, lastName: lastName, salt: s, hash: await sha256(s + password), createdAt: Date.now() };
      users.push(user); saveUsers(users);
      setSession(user.id, user.name, false);
      return user;
    },

    async login(identifier, password) {
      identifier = normId(identifier); password = password || "";
      if (cloudReady() && isEmail(identifier)) {
        var r = await client().auth.signInWithPassword({ email: identifier, password: password });
        if (r.error) throw new Error(r.error.message);
        var meta = (r.data.user && r.data.user.user_metadata) || {};
        var nm = ((meta.first_name || "") + " " + (meta.last_name || "")).trim() || identifier;
        setSession(identifier, nm, true);
        return { id: identifier, name: nm };
      }
      var user = readUsers().find(function (u) { return u.id === identifier; });
      if (!user) throw new Error("No account found — please sign up first.");
      var hash = await sha256(user.salt + password);
      if (hash !== user.hash) throw new Error("Wrong password — try again.");
      setSession(user.id, user.name, false);
      return user;
    },

    async resetPassword(identifier) {
      identifier = normId(identifier);
      if (!cloudReady() || !isEmail(identifier)) throw new Error("Password reset needs a cloud email account (see Profile → Cloud accounts).");
      var r = await client().auth.resetPasswordForEmail(identifier, { redirectTo: location.origin + location.pathname.replace(/[^/]+$/, "login.html") });
      if (r.error) throw new Error(r.error.message);
      return true;
    },

    logout: async function () {
      try { if (cloudReady()) await client().auth.signOut(); } catch (e) {}
      localStorage.removeItem(SESSION_KEY);
      location.replace("login.html");
    }
  };
})();
