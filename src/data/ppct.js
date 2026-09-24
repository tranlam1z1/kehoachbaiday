// Phân phối chương trình Tiếng Anh lớp 1, 2, 3 — năm học 2026-2027
// Mã NLS viết gọn: "1.1" = "1.1.CB1a", "2.2b" = "2.2.CB1b". Mã đầy đủ (có "CB") giữ nguyên.

export function expandNls(tokens) {
  return tokens
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t) => {
      if (/CB/.test(t)) return t;
      const m = t.match(/^(\d\.\d)([abc])?$/);
      return m ? `${m[1]}.CB1${m[2] || "a"}` : t;
    })
    .join(", ");
}

// Cấu trúc chung của sách Global Success 1 và 2 (70 tiết)
function buildGlobalSuccess(units, codes, selfCheck2, isGrade2) {
  const out = [];
  const unit = (i) => {
    const n = `Unit ${i + 1}: ${units[i]}`;
    const u = `Unit ${i + 1}`;
    out.push({ name: `${n} – Lesson 1 (1,2)`, short: `${u}: Lesson 1 (1,2)`, note: isGrade2 ? "Dạy thêm trò chơi trong SGV" : "" });
    out.push({ name: `${n} – Lesson 2 (3,4,5)`, short: `${u}: Lesson 2 (3,4,5)` });
    out.push({ name: `${n} – Lesson 3 (6,7,8)`, short: `${u}: Lesson 3 (6,7,8)` });
  };
  const funTime = (n) => {
    out.push({ name: `Fun time ${n} (1,2)` });
    out.push({ name: `Fun time ${n} (3,4)` });
  };
  const review = (n) => out.push({ name: `Review ${n} (1,2)` });
  const selfCheck = (x) => out.push({ name: `Self-check (${x})` });

  unit(0); unit(1); funTime(1); unit(2); unit(3); review(1); selfCheck("1,2,3"); selfCheck(selfCheck2);
  unit(4); unit(5); funTime(2); unit(6); unit(7); review(2); selfCheck("1,2,3"); selfCheck("4,5,6");
  out.push({ name: "Review for the first term test" });
  out.push({ name: "The first term test" });
  unit(8); unit(9); funTime(3); unit(10); unit(11); review(3); selfCheck("1,2,3"); selfCheck("4,5,6");
  unit(12); unit(13); funTime(4); unit(14); unit(15); review(4);
  out.push({ name: "Self-check" });
  out.push({ name: "The second term test" });

  const c = codes.split("|");
  out.forEach((o, i) => (o.nls = expandNls(c[i] || "")));
  return out;
}

const G1_UNITS = [
  "In the school playground", "In the dining room", "At the street market", "In the bedroom",
  "At the fish and chip shop", "In the classroom", "In the garden", "In the park",
  "In the shop", "At the zoo", "At the bus stop", "At the lake",
  "In the school canteen", "In the school toy shop", "At the football match", "At home",
];
const G2_UNITS = [
  "At my birthday party", "In the backyard", "At the seaside", "In the countryside",
  "In the classroom", "On the farm", "In the kitchen", "In the village",
  "In the grocery store", "At the zoo", "In the playground", "At the cafe",
  "In the maths class", "At home", "In the clothes shop", "At the campsite",
];

// Mã NLS theo thứ tự tiết 1 → 70, ngăn cách bằng "|"
const G1_CODES =
  "1.1|1.1|1.1|1.1|2.1|1.1|1.1|1.2|1.2|4.3|1.1|2.1|2.1|1.1|1.1|2.1|2.1|1.1|2.1|2.1|1.1|2.1|2.1|1.1|1.1|1.1|1.1,2.1|4.3|1.1,2.1|1.1,2.1,4.3|1.1,2.1,4.3|2.1|2.1|3.1||4.1.CB2a|1.1|2.1|2.1|1.1|1.1|2.1|2.1|1.1|1.1|2.1|1.1|5.3|1.1|2.1|1.1|2.1|1.1|2.1|1.1|2.1|1.1|2.1|2.1|1.1|1.1|1.1|1.1b|1.1b|1.1|1.1|2.1|1.1|1.1|4.1.CB2a";
const G2_CODES =
  "1.1|1.1|2.1|1.1|1.1|2.1|1.1|1.2|1.1|4.3|1.1|1.1|1.1|1.1|1.1|2.1|1.1|1.1|2.1|5.3|1.1|5.3|1.1|1.1|3.1|2.1|1.1|2.1|1.1|2.1|1.1|2.1|2.1|2.1||4.1.CB2a|2.1|4.1|1.1|1.1|2.1,3.1|2.1,2.1b|2.1|3.1,4.3|1.1,2.1|3.1,4.1|2.1|1.1|2.1|2.1b,4.1|2.1|3.1|2.1,3.1|1.1,2.1|4.3|1.1|1.1|1.2|1.1|1.1|1.1|1.1|1.1|1.1|2.1|1.1b|1.1b|1.1b|1.1b|4.1.CB2a";

// Wonderful World 3 (140 tiết)
function buildGrade3() {
  const out = [];
  const push = (name, code, short) => out.push({ name, short, nls: expandNls(code) });
  const L = ["Lesson 1 (1,2,3)", "Lesson 1 (4,5,6)", "Lesson 2 (1,2,3)", "Lesson 2 (4,5,6)", "Lesson 3 (1,2,3)", "Lesson 3 (4,5,6)"];
  const unit = (n, title, codes) => codes.split("|").forEach((c, i) => push(`Unit ${n}: ${title} – ${L[i]}`, c, `Unit ${n}: ${L[i]}`));
  const review = (n, a, b, f) => {
    push(`Review ${n}: Activity 1-2`, a);
    push(`Review ${n}: Activity 3-5`, b);
    push(`Review ${n}: Fun time`, f);
  };

  push("Làm quen chương trình SGK lớp 3", "1.1a");
  push("Starter: A. Numbers", "1.1b");
  push("Starter: B. The Alphabet", "2.1a");
  push("Starter: C. Fun Time", "2.3a");
  unit(1, "Hello", "2.1a|2.2b|2.1b|1.2a|1.1c|3.1a");
  unit(2, "Our names", "1.1a|3.2a|2.1b|1.2a|1.1c|3.1b");
  unit(3, "Our friends", "2.1a|2.5b|1.2a|2.2a|1.1c|3.3a");
  unit(4, "Our bodies", "1.1a|3.1a|4.3a|1.3b|1.1c|2.4a");
  unit(5, "My hobbies", "2.2b|3.1a|2.1b|1.2a|1.1c|2.6b");
  review(1, "1.3a", "5.4a", "2.3b");
  unit(6, "Our school", "1.1a|4.1a|2.1a|3.2a|1.1c|2.4a");
  unit(7, "Classroom instructions", "2.5a|1.2a|2.1b|5.2c|1.1c|3.3a");
  unit(8, "My school things", "1.1a|2.2a|1.2a|3.1a|1.1c|2.4a");
  unit(9, "Colours", "2.1a|1.1a,1.2a|1.1a|1.2a|2.1a|3.1a");
  unit(10, "Break time activities", "2.3b|4.3a|2.1a|2.5a|1.1c|2.4a");
  review(2, "1.3a", "5.2a", "2.3a");
  push("Kiểm tra học kì I: Làm bài kiểm tra", "5.1a");
  push("Kiểm tra học kì I: Chữa bài", "5.4b");
  unit(11, "My family", "1.1a|4.2a|2.1b|1.2a|1.1c|3.1b");
  unit(12, "Jobs", "1.1a|2.6a|2.1a|1.2a|1.1c|2.2a");
  unit(13, "My house", "1.1a|3.1a|2.1b|1.3b|1.1c|3.1b");
  unit(14, "My bedroom", "1.1a|4.1a|2.1a|1.2a|1.1c|2.4a");
  unit(15, "At the dining table", "1.1b|4.3b|2.5b|1.2a|1.1c|3.1a");
  review(3, "1.3a", "5.4a", "2.3a");
  unit(16, "My pets", "1.1a|2.6c|2.1b|1.2a|1.1c|3.1b");
  unit(17, "Our toys", "1.1a|2.2a|2.1a|1.2a|1.1c|2.4a");
  unit(18, "Playing and doing", "1.1b|3.1a|2.1b|1.2a|1.1c|4.3a");
  unit(19, "Outdoor activities", "1.1a|2.3b|2.1a|1.2a|1.1c|3.1b");
  unit(20, "At the zoo", "1.1a|2.5c|2.1b|1.2a|1.1c|3.3a");
  review(4, "1.3a", "5.4b", "2.4a");
  push("Kiểm tra học kì II: Làm bài kiểm tra", "5.1a");
  push("Kiểm tra học kì II: Chữa bài", "5.4a");
  return out;
}

export const PPCT = {
  1: { book: "Global Success 1", perWeek: 2, items: buildGlobalSuccess(G1_UNITS, G1_CODES, "4,5", false) },
  2: { book: "Global Success 2", perWeek: 2, items: buildGlobalSuccess(G2_UNITS, G2_CODES, "4,5,6", true) },
  3: { book: "Wonderful World 3", perWeek: 4, items: buildGrade3() },
};

// Khối được lấy theo chữ số đầu của tên lớp: "3A" -> 3
export function gradeOf(cls) {
  const g = parseInt(String(cls).trim()[0], 10);
  return PPCT[g] ? g : null;
}
