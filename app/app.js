/* LessonPrep Stage 3 — shared localStorage store (no database yet).
   Keys: lp_lessons (array), lp_profile (object).
   Stage 4 will swap these helpers for Dexie/IndexedDB without changing page code. */
(function () {
  var LESSONS_KEY = "lp_lessons";
  var PROFILE_KEY = "lp_profile";

  var SECTION_TITLES = [
    "Date and Time", "Class", "Subject", "Topic", "Duration", "Period",
    "Previous Knowledge", "Aims & Objectives", "Introduction",
    "Teacher Activities", "Student Activities", "Teaching Methods",
    "Teaching Aids", "Teaching Content", "Evaluation",
    "Conclusion", "Assignment", "Summary"
  ];

  function uid() {
    return "l" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function blankSections() {
    return SECTION_TITLES.map(function (t) { return { title: t, body: "" }; });
  }
  function seedLessons() {
    var lessons = read(LESSONS_KEY, null);
    if (lessons !== null) return lessons;
    lessons = [{
      id: uid(),
      topic: "JSS2 Mathematics — Algebra: like terms",
      status: "Draft",
      updatedAt: Date.now(),
      sections: [
        { title: "Date and Time", body: "Tuesday 9:00, 40 minutes, Period 2" },
        { title: "Class", body: "JSS2A" },
        { title: "Subject", body: "Mathematics" },
        { title: "Topic", body: "Algebra: like terms" },
        { title: "Duration", body: "40 minutes" },
        { title: "Period", body: "2" },
        { title: "Previous Knowledge", body: "Pupils can add whole numbers." },
        { title: "Aims & Objectives", body: "By the end, pupils simplify basic algebraic expressions." },
        { title: "Introduction", body: "Market oranges: 3 oranges + 2 oranges…" },
        { title: "Teacher Activities", body: "Demonstrate 3x + 2x on the board." },
        { title: "Student Activities", body: "Solve 5x + 4x on slates in pairs." },
        { title: "Teaching Methods", body: "Demonstration, question and answer." },
        { title: "Teaching Aids", body: "Bottle caps (cheap, local)." },
        { title: "Teaching Content", body: "Definitions, 3 worked examples, common mistakes." },
        { title: "Evaluation", body: "3 questions, each matched to an objective." },
        { title: "Conclusion", body: "Recap: only like terms combine." },
        { title: "Assignment", body: "4 take-home simplifications." },
        { title: "Summary", body: "One-line board note for copying." }
      ]
    }];
    write(LESSONS_KEY, lessons);
    return lessons;
  }

  window.LP = {
    getLessons: function () { return seedLessons(); },
    saveLessons: function (lessons) { write(LESSONS_KEY, lessons); },
    getLesson: function (id) {
      var lessons = seedLessons();
      for (var i = 0; i < lessons.length; i++) if (lessons[i].id === id) return lessons[i];
      return null;
    },
    putLesson: function (lesson) {
      var lessons = seedLessons();
      var found = false;
      for (var i = 0; i < lessons.length; i++) {
        if (lessons[i].id === lesson.id) { lessons[i] = lesson; found = true; break; }
      }
      if (!found) lessons.unshift(lesson);
      write(LESSONS_KEY, lessons);
    },
    deleteLesson: function (id) {
      write(LESSONS_KEY, seedLessons().filter(function (l) { return l.id !== id; }));
    },
    duplicateLesson: function (id) {
      var src = this.getLesson(id);
      if (!src) return null;
      var copy = JSON.parse(JSON.stringify(src));
      copy.id = uid();
      copy.topic = src.topic + " (copy)";
      copy.status = "Draft";
      copy.updatedAt = Date.now();
      this.putLesson(copy);
      return copy;
    },
    newLesson: function (topic) {
      var lesson = {
        id: uid(), topic: topic || "Untitled lesson",
        status: "Draft", updatedAt: Date.now(), sections: blankSections()
      };
      // Pre-fill Topic section when the title looks like "Class Subject — Topic".
      var parts = (topic || "").split("—");
      if (parts.length > 1) lesson.sections[3].body = parts[1].trim();
      this.putLesson(lesson);
      return lesson;
    },
    getProfile: function () {
      return read(PROFILE_KEY, { name: "", classes: "", subjects: "", detail: "Standard", aids: "cheap/local only", evaluation: "3 questions" });
    },
    saveProfile: function (p) { write(PROFILE_KEY, p); },
    uid: uid
  };
})();
