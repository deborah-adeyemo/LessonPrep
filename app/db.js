/* LessonPrep Stage 4 — Dexie/IndexedDB filing cabinet (works offline).
   Stores: lessons, versions, templates, schemes, questions, resources,
   annotations, collections. First run migrates Stage-3 localStorage data. */
(function () {
  var db = new Dexie("lessonprep");
  db.version(1).stores({
    lessons: "id, topic, status, updatedAt",
    versions: "++vid, lessonId, updatedAt",
    templates: "++tid, name",
    schemes: "++sid, title",
    questions: "++qid, topic, difficulty",
    resources: "++rid, kind",
    annotations: "++aid, lessonId",
    collections: "lessonId"
  });
  db.version(2).stores({
    timetable: "++tid, day",
    reflections: "++rid, lessonId, updatedAt"
  });

  function uid(prefix) {
    return (prefix || "l") + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }
  var SECTION_TITLES = [
    "Date and Time", "Class", "Subject", "Topic", "Duration", "Period",
    "Previous Knowledge", "Aims & Objectives", "Introduction",
    "Teacher Activities", "Student Activities", "Teaching Methods",
    "Teaching Aids", "Teaching Content", "Evaluation",
    "Conclusion", "Assignment", "Summary"
  ];
  function blankSections() {
    return SECTION_TITLES.map(function (t) { return { title: t, body: "" }; });
  }
  function seedLesson() {
    return {
      id: uid(), topic: "JSS2 Mathematics — Algebra: like terms",
      status: "Draft", updatedAt: Date.now(),
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
    };
  }

  async function migrateOnce() {
    if (localStorage.getItem("lp_dexie_migrated")) return;
    var count = await db.lessons.count();
    if (count === 0) {
      var raw = null;
      try { raw = localStorage.getItem("lp_lessons"); } catch (e) {}
      var lessons = raw ? JSON.parse(raw) : [seedLesson()];
      if (!lessons.length) lessons = [seedLesson()];
      await db.lessons.bulkPut(lessons);
      await db.templates.put({ name: "Standard 18-section note", sections: blankSections() });
      await db.templates.put({ name: "Quick 8-section note", sections: ["Topic", "Class", "Objectives", "Introduction", "Teaching Content", "Student Activities", "Evaluation", "Assignment"].map(function (t) { return { title: t, body: "" }; }) });
    }
    try { localStorage.setItem("lp_dexie_migrated", "1"); } catch (e) {}
  }

  window.LPDB = { db: db, uid: uid, blankSections: blankSections, migrateOnce: migrateOnce };
})();
