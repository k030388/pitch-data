/* =====================================================
   PITCH DATA  script.js
   構成:
     1. データ（試合結果 RS（順位表Tは自動集計）/ 個人スタッツ L / 日程 F / 過去の対戦 HH）
     2. 状態（今のタブ・並び替え・比較チーム・表示中の節）
     3. 共通の道具（ランク計算、勝敗バッジなど）
     4. 各画面（順位表・対戦カード一覧/詳細・個人スタッツ・チーム比較）
     5. 描画（nav / render）
   データを更新するときは 1. だけ触ればOK
   ===================================================== */

/* ---------- 1. データ ---------- */

const ASOF = "2026年10月27日";

document.getElementById("note").innerHTML =
  "第12節終了時点（2026年10月27日）のデータ。<br>試合結果: ゲキサカ（Opta）/ 個人スタッツ・日程: Jリーグ公式（個人スタッツは更新タイミングにより最新試合が一部未反映の場合あり）/ 集計: JPick。公開ページは外部サイトへ直接通信できないため、更新時は最新データで再公開します。";

// 個人スタッツ（Jリーグ公式・2026/27 J1）上位3位まで（同順位は全員）
// [項目名, 単位, [[選手名, チーム略称, 数値, 順位], ...]]
const L = [
  ["ゴール", "点", [
    ["レオ セアラ", "鹿島", 12, 1],
    ["鈴木 章斗", "広島", 9, 2],
    ["瀬川 祐輔", "柏", 8, 3],
    ["マルシーニョ", "川崎F", 8, 3]
  ]],
  ["アシスト", "本", [
    ["金子 拓郎", "浦和", 6, 1],
    ["渡井 理己", "柏", 5, 2],
    ["相馬 勇紀", "町田", 4, 3],
    ["松村 晃助", "横浜FM", 4, 3],
    ["鈴木 章斗", "広島", 4, 3],
    ["長倉 幹樹", "FC東京", 4, 3],
    ["ルカオ", "岡山", 4, 3]
  ]],
  ["デュエル勝利数", "回", [
    ["稲垣 祥", "名古屋", 40, 1],
    ["知念 慶", "横浜FM", 35, 2],
    ["山本 悠樹", "川崎F", 33, 3],
    ["ジャクソン アーバイン", "C大阪", 33, 3]
  ]],
  ["クリーンシート", "試合", [
    ["キム スンギュ", "FC東京", 8, 1],
    ["谷 晃生", "町田", 4, 2],
    ["中村 航輔", "C大阪", 4, 2],
    ["権田 修一", "神戸", 4, 2]
  ]],
  ["総走行距離", "km", [
    ["井手口 陽介", "神戸", 142.3, 1],
    ["稲垣 祥", "名古屋", 141.5, 2],
    ["中川 敦瑛", "柏", 139.6, 3]
  ]]
];

// 日程（対戦カード）
// [節, 日付(YYYY-MM-DD), キックオフ, ホーム略称, アウェイ略称, 会場]
// ※略称は上の T の略称と同じ表記にすること。節ごとに追加していける。
const F = [
  [13, "2026-10-31", "14:00", "水戸", "広島", "水戸信ス"],
  [13, "2026-10-31", "14:00", "京都", "清水", "サンガS"],
  [13, "2026-10-31", "14:00", "岡山", "FC東京", "JFEス"],
  [13, "2026-10-31", "15:00", "鹿島", "C大阪", "メルスタ"],
  [13, "2026-10-31", "15:00", "神戸", "名古屋", "ノエスタ"],
  [13, "2026-10-31", "16:00", "柏", "浦和", "三協F柏"],
  [13, "2026-11-01", "13:00", "横浜FM", "川崎F", "日産ス"],
  [13, "2026-11-01", "14:00", "千葉", "福岡", "フクアリ"],
  [13, "2026-11-01", "14:00", "長崎", "東京V", "ピースタ"],
  [13, "2026-11-01", "16:00", "町田", "G大阪", "Gスタ"]
];

// 試合結果（リーグ戦 第1〜12節）。順位表(T)はこの結果から自動で集計する
// [節, 日付, ホーム略称, アウェイ略称, ホーム得点, アウェイ得点]
// ※出典: ゲキサカ（Opta）。新しい節が終わったら一番下に足すだけで順位表も更新される。
const RS = [
  [1, "2026-08-07", "横浜FM", "鹿島", 3, 4],
  [1, "2026-08-07", "G大阪", "浦和", 4, 3],
  [1, "2026-08-08", "柏", "水戸", 2, 1],
  [1, "2026-08-08", "FC東京", "町田", 1, 5],
  [1, "2026-08-08", "名古屋", "清水", 0, 1],
  [1, "2026-08-08", "C大阪", "岡山", 2, 1],
  [1, "2026-08-08", "福岡", "神戸", 0, 1],
  [1, "2026-08-08", "広島", "千葉", 3, 0],
  [1, "2026-08-09", "東京V", "川崎F", 1, 1],
  [1, "2026-08-09", "長崎", "京都", 2, 1],

  [2, "2026-08-14", "東京V", "柏", 1, 3],
  [2, "2026-08-15", "鹿島", "名古屋", 2, 1],
  [2, "2026-08-15", "水戸", "G大阪", 1, 1],
  [2, "2026-08-15", "清水", "横浜FM", 0, 1],
  [2, "2026-08-15", "岡山", "長崎", 1, 0],
  [2, "2026-08-15", "浦和", "広島", 1, 4],
  [2, "2026-08-15", "千葉", "町田", 0, 4],
  [2, "2026-08-15", "川崎F", "京都", 2, 2],
  [2, "2026-08-15", "神戸", "FC東京", 2, 2],
  [2, "2026-08-15", "福岡", "C大阪", 3, 0],

  [3, "2026-08-21", "柏", "長崎", 4, 2],
  [3, "2026-08-21", "FC東京", "千葉", 2, 0],
  [3, "2026-08-22", "鹿島", "福岡", 3, 2],
  [3, "2026-08-22", "岡山", "東京V", 0, 0],
  [3, "2026-08-22", "名古屋", "G大阪", 3, 1],
  [3, "2026-08-22", "京都", "水戸", 1, 3],
  [3, "2026-08-22", "C大阪", "清水", 1, 0],
  [3, "2026-08-22", "広島", "川崎F", 1, 1],
  [3, "2026-08-22", "横浜FM", "神戸", 1, 0],
  [3, "2026-08-23", "町田", "浦和", 3, 1],

  [4, "2026-08-29", "水戸", "町田", 1, 1],
  [4, "2026-08-29", "G大阪", "広島", 0, 0],
  [4, "2026-08-29", "清水", "柏", 0, 1],
  [4, "2026-08-29", "長崎", "FC東京", 0, 3],
  [4, "2026-08-29", "浦和", "横浜FM", 3, 2],
  [4, "2026-08-29", "東京V", "鹿島", 0, 2],
  [4, "2026-08-29", "川崎F", "千葉", 4, 2],
  [4, "2026-08-29", "名古屋", "岡山", 2, 1],
  [4, "2026-08-29", "京都", "福岡", 2, 1],
  [4, "2026-08-29", "神戸", "C大阪", 1, 0],

  [5, "2026-09-02", "水戸", "鹿島", 4, 2],
  [5, "2026-09-02", "千葉", "岡山", 1, 2],
  [5, "2026-09-02", "東京V", "神戸", 0, 2],
  [5, "2026-09-02", "町田", "川崎F", 2, 1],
  [5, "2026-09-02", "横浜FM", "京都", 1, 1],
  [5, "2026-09-02", "清水", "FC東京", 1, 1],
  [5, "2026-09-02", "C大阪", "柏", 2, 0],
  [5, "2026-09-02", "広島", "名古屋", 3, 0],
  [5, "2026-09-02", "福岡", "浦和", 2, 3],
  [5, "2026-09-02", "長崎", "G大阪", 2, 2],

  [6, "2026-09-05", "福岡", "水戸", 1, 1],
  [6, "2026-09-06", "鹿島", "浦和", 0, 1],
  [6, "2026-09-06", "千葉", "G大阪", 2, 0],
  [6, "2026-09-06", "名古屋", "町田", 1, 3],
  [6, "2026-09-06", "岡山", "広島", 3, 2],
  [6, "2026-09-06", "柏", "横浜FM", 0, 2],
  [6, "2026-09-06", "川崎F", "清水", 3, 1],
  [6, "2026-09-06", "C大阪", "東京V", 0, 0],
  [6, "2026-09-06", "神戸", "長崎", 3, 1],
  [6, "2026-09-06", "FC東京", "京都", 2, 0],

  [7, "2026-09-11", "京都", "柏", 2, 3],
  [7, "2026-09-11", "神戸", "鹿島", 2, 1],
  [7, "2026-09-12", "水戸", "川崎F", 0, 1],
  [7, "2026-09-12", "清水", "福岡", 1, 0],
  [7, "2026-09-12", "町田", "横浜FM", 1, 1],
  [7, "2026-09-12", "G大阪", "FC東京", 0, 2],
  [7, "2026-09-12", "広島", "C大阪", 6, 1],
  [7, "2026-09-12", "長崎", "名古屋", 2, 0],
  [7, "2026-09-13", "東京V", "千葉", 1, 1],
  [7, "2026-09-13", "浦和", "岡山", 1, 2],

  [8, "2026-09-19", "川崎F", "鹿島", 3, 3],
  [8, "2026-09-19", "福岡", "広島", 0, 1],
  [8, "2026-09-19", "浦和", "東京V", 3, 1],
  [8, "2026-09-19", "清水", "千葉", 2, 1],
  [8, "2026-09-19", "長崎", "C大阪", 1, 1],
  [8, "2026-09-19", "FC東京", "名古屋", 1, 0],
  [8, "2026-09-19", "岡山", "京都", 1, 2],
  [8, "2026-09-19", "横浜FM", "水戸", 2, 0],
  [8, "2026-09-20", "町田", "柏", 2, 4],
  [8, "2026-09-20", "G大阪", "神戸", 0, 1],

  [9, "2026-10-09", "鹿島", "G大阪", 2, 0],
  [9, "2026-10-09", "柏", "神戸", 4, 2],
  [9, "2026-10-10", "C大阪", "横浜FM", 0, 0],
  [9, "2026-10-10", "FC東京", "浦和", 3, 0],
  [9, "2026-10-10", "福岡", "岡山", 2, 1],
  [9, "2026-10-10", "京都", "町田", 0, 1],
  [9, "2026-10-11", "千葉", "長崎", 1, 1],
  [9, "2026-10-11", "水戸", "清水", 1, 2],
  [9, "2026-10-11", "東京V", "広島", 0, 2],
  [9, "2026-10-11", "川崎F", "名古屋", 1, 2],

  [10, "2026-10-17", "清水", "G大阪", 2, 2],
  [10, "2026-10-17", "千葉", "横浜FM", 0, 0],
  [10, "2026-10-17", "東京V", "FC東京", 0, 4],
  [10, "2026-10-17", "広島", "京都", 3, 0],
  [10, "2026-10-17", "鹿島", "長崎", 2, 0],
  [10, "2026-10-17", "C大阪", "川崎F", 2, 4],
  [10, "2026-10-17", "水戸", "浦和", 0, 1],
  [10, "2026-10-17", "柏", "名古屋", 1, 3],
  [10, "2026-10-18", "岡山", "神戸", 0, 3],
  [10, "2026-10-18", "町田", "福岡", 3, 0],

  [11, "2026-10-21", "FC東京", "柏", 0, 0],
  [11, "2026-10-21", "横浜FM", "東京V", 2, 2],
  [11, "2026-10-21", "川崎F", "神戸", 2, 1],
  [11, "2026-10-21", "清水", "町田", 0, 5],
  [11, "2026-10-21", "名古屋", "C大阪", 1, 1],
  [11, "2026-10-21", "京都", "鹿島", 2, 2],
  [11, "2026-10-21", "岡山", "水戸", 2, 0],
  [11, "2026-10-21", "福岡", "G大阪", 1, 2],
  [11, "2026-10-21", "長崎", "広島", 4, 0],
  [11, "2026-10-21", "浦和", "千葉", 3, 2],

  [12, "2026-10-24", "広島", "清水", 4, 0],
  [12, "2026-10-24", "鹿島", "柏", 2, 3],
  [12, "2026-10-24", "東京V", "福岡", 3, 1],
  [12, "2026-10-24", "神戸", "町田", 0, 0],
  [12, "2026-10-24", "G大阪", "京都", 2, 2],
  [12, "2026-10-25", "名古屋", "横浜FM", 1, 1],
  [12, "2026-10-25", "浦和", "長崎", 1, 0],
  [12, "2026-10-25", "C大阪", "千葉", 2, 2],
  [12, "2026-10-25", "FC東京", "水戸", 6, 0],
  [12, "2026-10-25", "川崎F", "岡山", 2, 1]
];

// 過去の対戦成績（J1・2025シーズン）
// [シーズン, 日付, ホーム略称, アウェイ略称, ホーム得点, アウェイ得点, 会場]
// ※2025年にJ1で対戦がなかったカード（水戸・千葉・長崎が絡むカード）は空。
// ※2026年前半の百年構想リーグは含んでいない。
const HH = [
  ["2025", "2025-03-16", "清水", "京都", 1, 2, "アイスタ"],
  ["2025", "2025-09-20", "京都", "清水", 0, 1, "サンガS"],
  ["2025", "2025-04-06", "岡山", "FC東京", 1, 0, "JFEス"],
  ["2025", "2025-10-25", "FC東京", "岡山", 3, 1, "味スタ"],
  ["2025", "2025-04-12", "C大阪", "鹿島", 1, 0, "ハナサカ"],
  ["2025", "2025-09-23", "鹿島", "C大阪", 3, 1, "メルスタ"],
  ["2025", "2025-02-22", "名古屋", "神戸", 2, 2, "豊田ス"],
  ["2025", "2025-06-15", "神戸", "名古屋", 2, 1, "ノエスタ"],
  ["2025", "2025-03-02", "浦和", "柏", 0, 2, "埼玉"],
  ["2025", "2025-08-22", "柏", "浦和", 4, 2, "三協F柏"],
  ["2025", "2025-04-09", "川崎F", "横浜FM", 3, 3, "U等々力"],
  ["2025", "2025-09-13", "横浜FM", "川崎F", 0, 3, "日産ス"],
  ["2025", "2025-04-02", "G大阪", "町田", 0, 1, "パナスタ"],
  ["2025", "2025-08-20", "町田", "G大阪", 3, 1, "Gスタ"]
];

// チーム略称とロゴ画像の対応表
const LOGOS = {
  "神戸": "images/kobe.svg",
  "柏": "images/kashiwa.svg",
  "広島": "images/hiroshima.svg",
  "町田": "images/machida.svg",
  "FC東京": "images/fctokyo.svg",
  "横浜FM": "images/yokohamafm.svg",
  "川崎F": "images/kawasaki.svg",
  "鹿島": "images/kashima.svg",
  "岡山": "images/okayama.svg",
  "浦和": "images/urawa.svg",
  "C大阪": "images/cerezo.svg",
  "清水": "images/shimizu.svg",
  "水戸": "images/mito.svg",
  "京都": "images/kyoto.svg",
  "長崎": "images/nagasaki.svg",
  "G大阪": "images/gamba.svg",
  "名古屋": "images/nagoya.svg",
  "福岡": "images/fukuoka.svg",
  "東京V": "images/verdy.svg",
  "千葉": "images/chiba.svg"
};

// チーム略称からロゴ画像のHTMLを作る
function logo(c) {
  const src = LOGOS[c];

  // ロゴの登録がなければ何も表示しない
  if (!src) return "";

  return `<img class="team-logo" src="${src}" alt="">`;
}

// クラブ一覧 [クラブ名, 略称]
const TEAMS = [
  ["ヴィッセル神戸", "神戸"],
  ["柏レイソル", "柏"],
  ["サンフレッチェ広島", "広島"],
  ["FC町田ゼルビア", "町田"],
  ["FC東京", "FC東京"],
  ["横浜F・マリノス", "横浜FM"],
  ["川崎フロンターレ", "川崎F"],
  ["鹿島アントラーズ", "鹿島"],
  ["ファジアーノ岡山", "岡山"],
  ["浦和レッズ", "浦和"],
  ["セレッソ大阪", "C大阪"],
  ["清水エスパルス", "清水"],
  ["水戸ホーリーホック", "水戸"],
  ["京都サンガF.C.", "京都"],
  ["V・ファーレン長崎", "長崎"],
  ["ガンバ大阪", "G大阪"],
  ["名古屋グランパス", "名古屋"],
  ["アビスパ福岡", "福岡"],
  ["東京ヴェルディ", "東京V"],
  ["ジェフユナイテッド千葉", "千葉"]
];

// 順位表のデータ: RS（試合結果）から自動で集計する
// n=クラブ名 c=略称 w/d/l=勝/分/敗 gf/ga=得点/失点 f=直近5試合(新しい順)
// h/a=ホーム/アウェイの[勝,分,敗] p=勝点 g=試合数 gd=得失点差
const T = TEAMS.map(([n, c]) => {
  // そのチームの試合を新しい順に
  const games = RS
    .filter(m => m[2] == c || m[3] == c)
    .sort((x, y) => y[1].localeCompare(x[1]) || y[0] - x[0]);

  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  const h = [0, 0, 0], a = [0, 0, 0];   // [勝, 分, 敗]
  let f = "";

  games.forEach((m, i) => {
    const isHome = m[2] == c;
    const my = isHome ? m[4] : m[5];
    const op = isHome ? m[5] : m[4];
    const k = my > op ? 0 : my == op ? 1 : 2;   // 0=勝 1=分 2=敗
    (isHome ? h : a)[k]++;
    if (k == 0) w++; else if (k == 1) d++; else l++;
    gf += my;
    ga += op;
    if (i < 5) f += "WDL"[k];
  });

  return { n, c, w, d, l, gf, ga, f, h, a, p: w * 3 + d, g: w + d + l, gd: gf - ga };
});

/* ---------- 2. 状態 ---------- */

const tabs = ["順位表", "対戦カード", "個人スタッツ", "チーム比較"];

let tab = 0;        // 今開いているタブ（tabs の番号）
let sk = "p";       // 順位表の並び替えキー
let sd = -1;        // 並び順（-1=降順 / 1=昇順）
let A = "神戸";     // チーム比較: 左のチーム（略称）
let B = "町田";     // チーム比較: 右のチーム（略称）
let R = null;       // 対戦カード: 表示中の節（null なら最初の節）

/* ---------- 3. 共通の道具 ---------- */

const $ = id => document.getElementById(id);

// 勝点→得失点差→総得点 の順で並べた略称リスト（順位 = 番号+1）
const rank = [...T]
  .sort((a, b) => b.p - a.p || b.gd - a.gd || b.gf - a.gf)
  .map(t => t.c);

// 略称からチームのデータを取る
const teamOf = c => T.find(t => t.c == c);

// 順位を返す
const rankOf = c => rank.indexOf(c) + 1;

// 勝・分・敗の表示名（丸の title / 読み上げ用）
const RESULT_LABEL = { W: "勝", D: "分", L: "敗" };

// "WLD..." → 緑/グレー/赤の丸のHTML
const formBadges = s =>
  `<span class="form">${[...s].map(x =>
    `<i class="${x}" title="${RESULT_LABEL[x]}" aria-label="${RESULT_LABEL[x]}"></i>`
  ).join("")}</span>`;

// [勝,分,敗] → "勝-分-敗"
const record = x => x.join("-");

// 勝敗の判定（自分の得点, 相手の得点 → "W" / "D" / "L"）
const resultOf = (gf, ga) => gf > ga ? "W" : gf < ga ? "L" : "D";

// "2026-10-25" → "10/25"
const shortDate = d => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;

// "2026-10-31" → "10月31日(土)"
const WEEKDAYS = "日月火水木金土";
const longDate = d => {
  const x = new Date(d + "T00:00:00");
  return `${x.getMonth() + 1}月${x.getDate()}日(${WEEKDAYS[x.getDay()]})`;
};

// チームの直近5試合（新しい順）
// → [{ date, opp, home(ホームか), gf, ga, res }]
function recent(c, n = 5) {
  return RS
    .filter(m => m[2] == c || m[3] == c)
    .sort((a, b) => b[1].localeCompare(a[1]) || b[0] - a[0])
    .slice(0, n)
    .map(m => {
      const home = m[2] == c;
      const gf = home ? m[4] : m[5];
      const ga = home ? m[5] : m[4];
      return { date: m[1], opp: home ? m[3] : m[2], home, gf, ga, res: resultOf(gf, ga) };
    });
}

// 2チームの過去の対戦（新しい順）
const headToHead = (a, b) => HH
  .filter(m => (m[2] == a && m[3] == b) || (m[2] == b && m[3] == a))
  .sort((x, y) => y[1].localeCompare(x[1]));

// 個人スタッツ上位に載っているチームの選手（順位つき）
const leadersOf = c => L.flatMap(([title, unit, players]) =>
  players
    .map(([name, team, value, rank]) => ({ title, unit, name, team, value, rank }))
    .filter(p => p.team == c)
);

// 勝敗の丸（詳細ページの直近5試合用）
const badge = r => `<i class="rb ${r}" title="${RESULT_LABEL[r]}" aria-label="${RESULT_LABEL[r]}"></i>`;

/* ---------- 4. 各画面 ---------- */

// 4-1. 順位表
function standings() {
  // 並び替え（選んだ列 → 勝点 → 得失点差）
  const rows = [...T].sort(
    (a, b) => sd * (a[sk] - b[sk]) || b.p - a.p || b.gd - a.gd
  );

  // 見出しセルを作る（クリックで並び替え）
  const th = (key, label) => {
    const isOn = sk == key;
    const nextSd = isOn ? -sd : -1;
    const arrow = isOn ? (sd < 0 ? "▼" : "▲") : "";
    return `<th class="${isOn ? "s" : ""}" onclick="sk='${key}';sd=${nextSd};render()">${label}${arrow}</th>`;
  };

  // 順位に応じた左の色帯
  const zone = r => r <= 2 ? "z1" : r <= 5 ? "z2" : r >= 18 ? "z3" : "";

  const head = `<tr><th class="pos">#</th><th>クラブ</th>${th("g", "試")}${th("w", "勝")}${th("d", "分")}${th("l", "敗")}${th("gf", "得")}${th("ga", "失")}${th("gd", "差")}${th("p", "勝点")}<th>直近5試合</th><th>H</th><th>A</th></tr>`;

  const body = rows.map(t => {
    const r = rankOf(t.c);
    const gd = (t.gd > 0 ? "+" : "") + t.gd;
    return `<tr>
      <td class="pos ${zone(r)}">${r}</td>
      <td><span class="tn">${logo(t.c)}<b>${t.n}</b></span></td>
      <td>${t.g}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
      <td>${t.gf}</td><td>${t.ga}</td><td>${gd}</td>
      <td><b>${t.p}</b></td>
      <td>${formBadges(t.f)}</td>
      <td>${record(t.h)}</td><td>${record(t.a)}</td>
    </tr>`;
  }).join("");

  const legend = `<div class="legend">
    <span><b style="background:var(--ac)"></b>ACLE出場枠</span>
    <span><b style="background:var(--ac2)"></b>ACLE出場の可能性あり</span>
    <span><b style="background:#d9534f"></b>降格圏</span>
    <span><b class="c W"></b>勝 <b class="c D"></b>分 <b class="c L"></b>敗</span>
    <span>直近5試合は新しい順 / H・A=ホーム・アウェイ(勝-分-敗)</span>
    <span>見出しクリックで並び替え</span>
  </div>`;

  return `<div class="card scroll"><table>${head}${body}</table>${legend}</div>`;
}

// 4-2. 対戦カード（一覧）
function fixtures() {
  // データにある節の一覧（小さい順）
  const rounds = [...new Set(F.map(x => x[0]))].sort((a, b) => a - b);
  if (!rounds.includes(R)) R = rounds[0];

  // チーム1つ分の表示（略称 / 直近5試合）。スマホで折り返さないよう略称を使う
const teamBlock = (c, extraClass) => {
  const t = teamOf(c);
  const form = recent(c).map(r => r.res).join("");
  return `<div class="ft2 ${extraClass}">
    <b class="tn"><span>${t.n}</span></b>
    ${formBadges(form)}
  </div>`;
};

  // 選んだ節の試合を日付→時間順に並べる（F の番号 i を残しておく → 詳細ページのID）
  const matches = F
    .map((x, i) => ({ x, i }))
    .filter(o => o.x[0] == R)
    .sort((a, b) => a.x[1].localeCompare(b.x[1]) || a.x[2].localeCompare(b.x[2]));

  const days = [...new Set(matches.map(o => o.x[1]))];

  // 節の切り替え
  const picker = `<div class="row"><select onchange="R=+this.value;render()">${
    rounds.map(r => `<option value="${r}" ${r == R ? "selected" : ""}>第${r}節</option>`).join("")
  }</select></div>`;

  // 日付ごとのカード
  const dayCards = days.map(day => {
    const rows = matches.filter(o => o.x[1] == day).map(({ x, i }) => {
      const [, , time, home, away, venue] = x;
      // タップで詳細ページへ（URLが #m番号 になる）
      
return `<div class="fx" onclick="location.hash='m${i}'">
  <div class="tm">${time}</div>
  ${teamBlock(home, "")}
  <div class="vs">vs</div>
  ${teamBlock(away, "r")}
  <div class="vn">
    <span class="material-symbols-outlined">stadium</span>
    ${venue}
  </div>
</div>`;

    }).join("");
    return `<div class="card"><div class="dh">${longDate(day)}</div>${rows}</div>`;
  }).join("");

  const legend = `<div class="legend"><span>カードをタップすると詳細を開きます / 直近5試合は新しい順（第12節までの結果） / <b class="c W"></b>勝 <b class="c D"></b>分 <b class="c L"></b>敗</span></div>`;

  return picker + dayCards + legend;
}

// 4-2b. 対戦カード（詳細ページ） id = F の番号
function matchDetail(id) {
  const back = `<a class="back" href="#" onclick="tab=${tabs.indexOf("対戦カード")};location.hash='';return false">← 対戦カード一覧へ</a>`;
  const x = F[id];
  if (!x) return back + `<div class="card">試合が見つかりませんでした。</div>`;

  const [round, day, time, home, away, venue] = x;
  const h = teamOf(home);
  const a = teamOf(away);

  // ① 日時・会場
  const head = `<div class="card mh">
    <div class="mh-sub">第${round}節</div>
    <div class="mh-teams">
      <div><small>HOME</small><b class="tn"><span>${h.n}</span></b></div>
      <span class="vs">vs</span>
      <div class="r"><small>AWAY</small><b class="tn"><span>${a.n}</span></b></div>
    </div>
    <div class="mh-info">
      <div><span>日時</span>${longDate(day)} ${time} キックオフ</div>
      <div><span>会場</span>${venue}</div>
    </div>
  </div>`;

  // ② 両チームの直近5試合
  const recentList = c => {
    const t = teamOf(c);
    const rows = recent(c).map(r => `<div class="rr">
      <span class="d">${shortDate(r.date)}</span>
      ${badge(r.res)}
      <span class="o tn"><span class="ha">${r.home ? "H" : "A"}</span>${teamOf(r.opp).c}</span>
      <b>${r.gf}-${r.ga}</b>
    </div>`).join("");
    const rs = recent(c);
    const w = rs.filter(r => r.res == "W").length;
    const d = rs.filter(r => r.res == "D").length;
    const l = rs.filter(r => r.res == "L").length;
    return `<div><div class="sh">${t.n}<small>${w}勝${d}分${l}敗</small></div>${rows}</div>`;
  };
  const recentCard = `<div class="card"><div class="ct">両チームの直近5試合</div>
    <div class="two">${recentList(home)}${recentList(away)}</div>
    <div class="legend"><span>H=ホーム / A=アウェイ ・ 数字は（そのチームの得点-失点）</span></div>
  </div>`;

  // ③ このカードの過去の対戦成績
  const past = headToHead(home, away);
  let pastBody;
  if (past.length == 0) {
    pastBody = `<div class="empty">2025シーズン以降のJ1では対戦がありません。</div>`;
  } else {
    let w = 0, d = 0, l = 0;   // ホームチーム目線
    past.forEach(m => {
      const gf = m[2] == home ? m[4] : m[5];
      const ga = m[2] == home ? m[5] : m[4];
      const r = resultOf(gf, ga);
      if (r == "W") w++; else if (r == "D") d++; else l++;
    });
    const rows = past.map(m => `<div class="hh">
      <span class="d">${m[1].replace(/-/g, "/")}</span>
      <span class="t tn r">${teamOf(m[2]).c}</span>
      <b class="sc">${m[4]} - ${m[5]}</b>
      <span class="t tn">${teamOf(m[3]).c}</span>
      <span class="v">${m[6]}</span>
    </div>`).join("");
    pastBody = `<div class="sum">${h.c} 目線: ${past.length}試合 ${w}勝${d}分${l}敗</div>${rows}`;
  }
  const pastCard = `<div class="card"><div class="ct">過去の対戦成績</div>${pastBody}
    <div class="legend"><span>J1（2025シーズン以降）のリーグ戦。2026年前半の百年構想リーグは含みません。</span></div>
  </div>`;

  // ④ 両チームの個人スタッツ上位選手
  const leaderList = c => {
    const t = teamOf(c);
    const ps = leadersOf(c);
    const rows = ps.length
      ? ps.map(p => `<div class="m2">
          <span>${p.rank}位</span>
          <span><b>${p.name}</b><br><small style="color:var(--mu)">${p.title}</small></span>
          <b class="v">${p.value}${p.unit}</b>
        </div>`).join("")
      : `<div class="empty">個人スタッツ上位（3位まで）に該当選手なし</div>`;
    return `<div><div class="sh">${t.n}</div>${rows}</div>`;
  };
  const leaderCard = `<div class="card"><div class="ct">個人スタッツ上位選手</div>
    <div class="two">${leaderList(home)}${leaderList(away)}</div>
    <div class="legend"><span>各項目の上位3位まで（同順位を含む）が対象・第12節終了時点</span></div>
  </div>`;

  const cmp = `<a class="back" href="#" onclick="A='${home}';B='${away}';tab=${tabs.indexOf("チーム比較")};location.hash='';return false">この2チームをチーム比較で見る →</a>`;

  return back + head + recentCard + pastCard + leaderCard + cmp;
}

// 4-3. 個人スタッツ
function leaders() {
  const cards = L.map(([title, unit, players]) => {
    const rows = players.map(([name, team, value, rank]) =>
      `<div class="m2">
        <span>${rank}</span>
        <span><b>${name}</b><br><small class="tn" style="color:var(--mu)">${team}</small></span>
        <b class="v">${value}${unit}</b>
      </div>`
    ).join("");
    return `<div class="card"><div style="color:var(--mu);font-size:.8rem;margin-bottom:6px">${title}</div>${rows}</div>`;
  }).join("");

  return `<div class="lg">${cards}</div>`;
}

// 4-4. チーム比較
function compare() {
  const a = teamOf(A);
  const b = teamOf(B);

  // 比較する項目 [表示名, データのキー]
  const stats = [
    ["勝点", "p"],
    ["得点", "gf"],
    ["失点", "ga"],
    ["得失点差", "gd"],
    ["勝利数", "w"]
  ];

  // チーム選択のプルダウン
  const options = selected => T.map(t =>
    `<option value="${t.c}" ${t.c == selected ? "selected" : ""}>${t.n}</option>`
  ).join("");

  // 1試合あたりの平均
  const perGame = (t, key) => (t[key] / t.g).toFixed(2);

  // 棒グラフの1行
  const barRow = ([label, key]) => {
    const max = Math.max(Math.abs(a[key]), Math.abs(b[key]), 1);
    const wa = Math.abs(a[key]) / max * 100;
    const wb = Math.abs(b[key]) / max * 100;
    return `<div class="bar">
      <div class="l"><b>${a[key]}</b><div class="track"><div class="f" style="width:${wa}%"></div></div></div>
      <div class="t">${label}</div>
      <div class="r"><div class="track"><div class="f" style="width:${wb}%"></div></div><b>${b[key]}</b></div>
    </div>`;
  };

  // 数字だけの行（棒なし）
  const textRow = (left, label, right) =>
    `<div class="bar"><b style="text-align:right">${left}</b><div class="t">${label}</div><b>${right}</b></div>`;

  return `
    <div class="row">
      <select onchange="A=this.value;render()">${options(A)}</select>
      <select onchange="B=this.value;render()">${options(B)}</select>
    </div>
    <div class="card">
      <div class="bar"><b class="tn" style="justify-content:flex-end"><span>${a.n}</span></b><span></span><b class="tn"><span>${b.n}</span></b></div>
      ${stats.map(barRow).join("")}
      ${textRow(perGame(a, "gf"), "1試合得点", perGame(b, "gf"))}
      ${textRow(perGame(a, "ga"), "1試合失点", perGame(b, "ga"))}
      ${textRow(record(a.h), "ホーム", record(b.h))}
      ${textRow(record(a.a), "アウェイ", record(b.a))}
    </div>`;
}

/* ---------- 5. 描画 ---------- */

// 画面ごとの関数（tabs と同じ順番）
const screens = [standings, fixtures, leaders, compare];

function nav() {
  $("nav").innerHTML = tabs.map((name, i) =>
    `<button class="${i == tab ? "on" : ""}" onclick="tab=${i};render()">${name}</button>`
  ).join("");
}

function render() {
  // URLが #m番号 のときは対戦カード詳細ページを表示
  const m = location.hash.match(/^#m(\d+)$/);
  if (m) {
    $("nav").innerHTML = "";
    $("v").innerHTML = matchDetail(+m[1]);
    window.scrollTo(0, 0);
    return;
  }
  nav();
  $("v").innerHTML = screens[tab]();
}

// 戻る/進む・ハッシュ変更でも再描画
window.addEventListener("hashchange", render);

render();