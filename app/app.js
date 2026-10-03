/* LessonPrep Stage 4 — async data API over IndexedDB (via db.js).
   Same LP shape as Stage 3, now promise-based + versions, templates,
   schemes, questions, resources, annotations, collections, search. */
(function () {
  var db = function () { return window.LPDB.db; };

  async function searchLessons(q) {
    q = (q || "").trim().toLowerCase();
    var all = await db().lessons.orderBy("updatedAt").reverse().toArray();
    if (!q) return all;
    return all.filter(function (l) {
      var hay = (l.topic + " " + l.sections.map(function (s) { return s.title + " " + s.body; }).join(" ")).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  window.LP = {
    ready: function () { return window.LPDB.migrateOnce(); },

    // ---- lessons ----
    getLessons: function () { return db().lessons.orderBy("updatedAt").reverse().toArray(); },
    searchLessons: searchLessons,
    getLesson: function (id) { return db().lessons.get(id); },
    putLesson: function (lesson) { lesson.updatedAt = Date.now(); return db().lessons.put(lesson); },
    deleteLesson: async function (id) {
      await db().lessons.delete(id);
      await db().versions.where("lessonId").equals(id).delete();
      await db().annotations.where("lessonId").equals(id).delete();
      await db().collections.delete(id);
    },
    duplicateLesson: async function (id) {
      var src = await db().lessons.get(id);
      if (!src) return null;
      var copy = JSON.parse(JSON.stringify(src));
      copy.id = window.LPDB.uid(); copy.topic = src.topic + " (copy)";
      copy.status = "Draft"; copy.updatedAt = Date.now();
      await db().lessons.put(copy);
      return copy;
    },
    newLesson: async function (topic, templateId) {
      var sections = window.LPDB.blankSections();
      if (templateId) {
        var t = await db().templates.get(Number(templateId));
        if (t) sections = JSON.parse(JSON.stringify(t.sections));
      }
      var lesson = { id: window.LPDB.uid(), topic: topic || "Untitled lesson", status: "Draft", updatedAt: Date.now(), sections: sections };
      var parts = (topic || "").split("—");
      if (parts.length > 1 && lesson.sections[3]) lesson.sections[3].body = parts[1].trim();
      await db().lessons.put(lesson);
      return lesson;
    },

    // ---- versions (snapshot + restore) ----
    snapshotLesson: async function (id, label) {
      var l = await db().lessons.get(id);
      if (!l) return;
      await db().versions.put({ lessonId: id, label: label || "Snapshot", snapshot: JSON.parse(JSON.stringify({ topic: l.topic, sections: l.sections, checks: l.checks || {} })), updatedAt: Date.now() });
    },
    listVersions: function (id) { return db().versions.where("lessonId").equals(id).reverse().sortBy("updatedAt"); },
    restoreVersion: async function (vid) {
      var v = await db().versions.get(vid);
      if (!v) return null;
      var l = await db().lessons.get(v.lessonId);
      if (!l) return null;
      l.topic = v.snapshot.topic; l.sections = v.snapshot.sections; l.checks = v.snapshot.checks;
      await this.putLesson(l);
      return l;
    },

    // ---- templates ----
    listTemplates: function () { return db().templates.toArray(); },
    saveTemplate: function (name, sections) { return db().templates.put({ name: name, sections: JSON.parse(JSON.stringify(sections)) }); },
    deleteTemplate: function (tid) { return db().templates.delete(tid); },

    // ---- schemes / questions / resources ----
    listSchemes: function () { return db().schemes.toArray(); },
    addScheme: function (title, body) { return db().schemes.put({ title: title, body: body }); },
    deleteScheme: function (sid) { return db().schemes.delete(sid); },
    listQuestions: function () { return db().questions.toArray(); },
    addQuestion: function (q) { return db().questions.put(q); },
    deleteQuestion: function (qid) { return db().questions.delete(qid); },
    listResources: function (kind) { return kind ? db().resources.where("kind").equals(kind).toArray() : db().resources.toArray(); },
    addResource: function (kind, title, body) { return db().resources.put({ kind: kind, title: title, body: body }); },
    deleteResource: function (rid) { return db().resources.delete(rid); },

    // ---- annotations (private sticky notes per lesson) ----
    listAnnotations: function (lessonId) { return db().annotations.where("lessonId").equals(lessonId).toArray(); },
    addAnnotation: function (lessonId, text) { return db().annotations.put({ lessonId: lessonId, text: text, updatedAt: Date.now() }); },
    deleteAnnotation: function (aid) { return db().annotations.delete(aid); },

    // ---- collections (favourites) ----
    isFav: async function (lessonId) { return !!(await db().collections.get(lessonId)); },
    toggleFav: async function (lessonId) {
      var existing = await db().collections.get(lessonId);
      if (existing) await db().collections.delete(lessonId);
      else await db().collections.put({ lessonId: lessonId });
      return !existing;
    },

    // ---- timetable: {day 0=Mon..6=Sun, time, className, subject, topic} ----
    listTimetable: function () { return db().timetable.toArray(); },
    addTimetable: function (e) { return db().timetable.put(e); },
    deleteTimetable: function (tid) { return db().timetable.delete(tid); },
    nextEntry: async function () {
      var all = await db().timetable.toArray();
      if (!all.length) return null;
      var today = (new Date().getDay() + 6) % 7; // Mon=0
      all.sort(function (a, b) { return (a.day - today + 7) % 7 - ((b.day - today + 7) % 7) || (a.time < b.time ? -1 : 1); });
      return all[0];
    },

    // ---- reflections: {lessonId, reached, struggles, carry, updatedAt} ----
    listReflections: function (lessonId) { return db().reflections.where("lessonId").equals(lessonId).reverse().sortBy("updatedAt"); },
    addReflection: function (lessonId, r) { return db().reflections.put({ lessonId: lessonId, reached: r.reached || "", struggles: r.struggles || "", carry: r.carry || "", updatedAt: Date.now() }); },
    deleteReflection: function (rid) { return db().reflections.delete(rid); },
    lastCarryForward: async function () {
      var all = await db().reflections.orderBy("updatedAt").reverse().limit(5).toArray();
      for (var i = 0; i < all.length; i++) if (all[i].carry) return all[i];
      return null;
    },
    startNextLesson: async function (fromLessonId) {
      var src = await db().lessons.get(fromLessonId);
      var refs = await db().reflections.where("lessonId").equals(fromLessonId).reverse().sortBy("updatedAt");
      var carry = refs.length ? refs[0].carry : "";
      var lesson = {
        id: window.LPDB.uid(), topic: (src ? src.topic + " — continued" : "Continued lesson"),
        status: "Draft", updatedAt: Date.now(), sections: window.LPDB.blankSections()
      };
      if (carry) {
        for (var i = 0; i < lesson.sections.length; i++) {
          if (lesson.sections[i].title === "Previous Knowledge") lesson.sections[i].body = carry;
        }
      }
      await db().lessons.put(lesson);
      return lesson;
    },

    // ---- profile (small: stays in localStorage) ----
    getProfile: function () {
      try { return JSON.parse(localStorage.getItem("lp_profile")) || null; } catch (e) { return null; }
    },
    saveProfile: function (p) { try { localStorage.setItem("lp_profile", JSON.stringify(p)); } catch (e) {} }
  };
  // defaults merged by pages
  window.LP_DEFAULT_PROFILE = { name: "", classes: "", subjects: "", detail: "Standard", aids: "cheap/local only", evaluation: "3 questions" };

  // ---- Stage 7: installable shell + backup ----
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  window.LP_BACKUP = {
    exportAll: async function () {
      await window.LPDB.migrateOnce();
      var t = window.LPDB.db.tables;
      var dump = { app: "lessonprep", v: 1, exportedAt: Date.now(), tables: {} };
      for (var i = 0; i < t.length; i++) dump.tables[t[i].name] = await t[i].toArray();
      try { dump.profile = JSON.parse(localStorage.getItem("lp_profile")) || null; } catch (e) { dump.profile = null; }
      try { dump.ai = JSON.parse(localStorage.getItem("lp_ai_config")) || null; } catch (e) { dump.ai = null; }
      return dump;
    },
    importAll: async function (dump) {
      if (!dump || dump.app !== "lessonprep" || !dump.tables) throw new Error("Not a LessonPrep backup file.");
      var db = window.LPDB.db;
      await db.transaction("rw", db.tables, async function () {
        for (var name in dump.tables) {
          if (db[name]) { await db[name].clear(); await db[name].bulkPut(dump.tables[name]); }
        }
      });
      if (dump.profile) try { localStorage.setItem("lp_profile", JSON.stringify(dump.profile)); } catch (e) {}
      if (dump.ai) try { localStorage.setItem("lp_ai_config", JSON.stringify(dump.ai)); } catch (e) {}
    }
  };
})();
