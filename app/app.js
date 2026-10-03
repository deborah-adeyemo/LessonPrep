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

    // ---- profile (small: stays in localStorage) ----
    getProfile: function () {
      try { return JSON.parse(localStorage.getItem("lp_profile")) || null; } catch (e) { return null; }
    },
    saveProfile: function (p) { try { localStorage.setItem("lp_profile", JSON.stringify(p)); } catch (e) {} }
  };
  // defaults merged by pages
  window.LP_DEFAULT_PROFILE = { name: "", classes: "", subjects: "", detail: "Standard", aids: "cheap/local only", evaluation: "3 questions" };
})();
