import { dayFactor } from "../analytics/calendar";
import { commitOf } from "../analytics/data";
import { workspaces, type Workspace } from "../analytics/workspaces";
import { random } from "../core/sample-data";

// The members of a Relay workspace as its admin sees them, built one by one
// so every number on the usage dashboards is counted from the same people.
// Each workspace is calibrated to the vendor's record of it in the analytics
// kit: paid and claimed seats, members active in the last 7 and 28 days and in
// the 28 days ending 90 days ago, the renewal date, and the AI credit pace.
//
//   paid seats = assigned (active + inactive + never active) + pending invites + unassigned
//   qualifying activity = open or edit a board, task, or doc, comment, or use AI
//
// A member is active on a day with a chance set by how engaged they are and
// the day (weekends and the Labor Day week are quiet), and never after their
// last active day. Members who stopped using Relay are why active seats fall.

/** Days of history: two 90-day windows, and room for the 28-day window before them. */
export const HISTORY_DAYS = 210;

export const WORKSPACE_IDS = ["brightline", "kestrel", "bluefin"] as const;
export type WorkspaceId = (typeof WORKSPACE_IDS)[number];

interface Profile {
  name: string;
  industry: string;
  /** Teams and their share of members. A few are small on purpose: under 5 members they are hidden. */
  teams: [string, number][];
  /** Teams whose admins turned AI off. */
  aiOff: string[];
  /** Share of members on each AI intensity, by team; anything unlisted uses `ai`. */
  ai: AiMix;
  aiByTeam: Record<string, AiMix>;
  /** Days ago AI features were turned on for the workspace. */
  aiSince: number;
  /** Share signing in with SSO, and with 2FA among the rest. */
  sso: number;
  twoFactor: number;
  /** Share of members created by SCIM provisioning. */
  scim: number;
  /** Guests, as a share of paid seats; and the share of guests who can edit. */
  guests: number;
  guestEdit: number;
}

type AiMix = { power: number; habitual: number; occasional: number };

const PROFILES: Record<WorkspaceId, Profile> = {
  brightline: {
    name: "Brightline Health",
    industry: "Healthcare provider network",
    teams: [
      ["Clinical operations", 0.25],
      ["Patient services", 0.18],
      ["Revenue cycle", 0.15],
      ["Nursing leadership", 0.1],
      ["IT", 0.09],
      ["Finance", 0.08],
      ["People", 0.07],
      ["Compliance", 0.06],
      ["Executive office", 0.02],
    ],
    aiOff: ["Compliance"],
    ai: { power: 0.05, habitual: 0.2, occasional: 0.25 },
    aiByTeam: {
      "Revenue cycle": { power: 0.15, habitual: 0.35, occasional: 0.25 },
      IT: { power: 0.2, habitual: 0.35, occasional: 0.2 },
      "Clinical operations": { power: 0.02, habitual: 0.12, occasional: 0.2 },
    },
    aiSince: 150,
    sso: 0.82,
    twoFactor: 0.55,
    scim: 0.88,
    guests: 0.08,
    guestEdit: 0.45,
  },
  kestrel: {
    name: "Kestrel Labs",
    industry: "Biotech research",
    teams: [
      ["Research", 0.36],
      ["Lab operations", 0.2],
      ["Data science", 0.16],
      ["Product", 0.12],
      ["Operations", 0.1],
      ["Leadership", 0.06],
    ],
    aiOff: [],
    ai: { power: 0.2, habitual: 0.4, occasional: 0.25 },
    aiByTeam: {
      "Data science": { power: 0.45, habitual: 0.35, occasional: 0.15 },
    },
    aiSince: 200,
    sso: 0.6,
    twoFactor: 0.8,
    scim: 0,
    guests: 0.12,
    guestEdit: 0.6,
  },
  bluefin: {
    name: "Bluefin Studio",
    industry: "Design studio",
    teams: [
      ["Design", 0.5],
      ["Production", 0.25],
      ["Accounts", 0.15],
      ["Studio leads", 0.1],
    ],
    aiOff: [],
    ai: { power: 0.1, habitual: 0.35, occasional: 0.3 },
    aiByTeam: {},
    aiSince: 120,
    sso: 0,
    twoFactor: 0.7,
    scim: 0,
    guests: 0.25,
    guestEdit: 0.3,
  },
};

export type MemberStatus = "active" | "inactive" | "dormant" | "never_active";
export type AiBand = "power" | "habitual" | "occasional" | "none";

export interface Member {
  id: string;
  name: string;
  email: string;
  team: string;
  role: "Owner" | "Admin" | "Member";
  /** Days ago they joined (claimed their seat). */
  joinedAgo: number;
  /** Days ago they were last active; undefined if never. */
  lastActiveAgo?: number;
  auth: "SSO" | "2FA" | "Password";
  scim: boolean;
  aiAccess: boolean;
  aiBand: AiBand;
  /** Activity by day, index 0 the oldest day of the history and the last index today. */
  active: Uint8Array;
  /** AI actions by day, same indexing. */
  aiActions: Uint8Array;
}

export interface Invite {
  email: string;
  team: string;
  sentAgo: number;
}

export interface Guest {
  name: string;
  canEdit: boolean;
  lastActiveAgo: number;
}

export interface WorkspaceModel {
  id: WorkspaceId;
  name: string;
  industry: string;
  plan: Workspace["plan"];
  record: Workspace;
  paidSeats: number;
  pricePerSeat: number;
  renewalInDays: number;
  members: Member[];
  invites: Invite[];
  unassigned: number;
  guests: Guest[];
  teams: string[];
  aiOff: string[];
  aiSince: number;
  /** AI credits: annual commit (Business) or a monthly pool (Team). */
  credits: CreditPlan;
}

export interface CreditPlan {
  kind: "annual" | "monthly";
  allowance: number;
  /** Days into the current period, and its length. */
  elapsedDays: number;
  periodDays: number;
  /** Credits each AI action costs, scaled so the annual commit matches the vendor's record. */
  perAction: number;
  /** Credits a member may use a month before they hit their limit. */
  memberMonthlyLimit: number;
}

const FIRST = [
  "Aisha",
  "Ben",
  "Carmen",
  "Daniel",
  "Elena",
  "Farid",
  "Grace",
  "Hiro",
  "Isabel",
  "Jonah",
  "Kavya",
  "Liam",
  "Maya",
  "Nikhil",
  "Olivia",
  "Pedro",
  "Quinn",
  "Rosa",
  "Samir",
  "Tara",
  "Uma",
  "Victor",
  "Wen",
  "Ximena",
  "Yusuf",
  "Zoe",
  "Amara",
  "Bruno",
  "Chloe",
  "Dev",
  "Esther",
  "Felix",
  "Gabriela",
  "Hassan",
  "Ines",
  "Jamal",
  "Keiko",
  "Lena",
  "Mateo",
  "Nora",
];
const LAST = [
  "Abbott",
  "Banerjee",
  "Castillo",
  "Dimitrov",
  "Ekwueme",
  "Fischer",
  "Goldberg",
  "Haddad",
  "Iwasaki",
  "Jensen",
  "Kowalski",
  "Lindqvist",
  "Moreau",
  "Nakamura",
  "Okafor",
  "Patel",
  "Quintero",
  "Rahman",
  "Schmidt",
  "Tanaka",
  "Underwood",
  "Varga",
  "Whitfield",
  "Xu",
  "Yilmaz",
];

const RECORD_NAMES: Record<WorkspaceId, string> = {
  brightline: "Brightline Health",
  kestrel: "Kestrel Labs",
  bluefin: "Bluefin Studio",
};
const PRICE_PER_SEAT = { Team: 20, Business: 40 } as const;
/** Team plans pool this many AI credits a seat each month; Business commits for the year. */
const TEAM_MONTHLY_CREDITS = 150;
const BUSINESS_ANNUAL_CREDITS = 1_000;
/** Today is October 10: 10 days into the monthly period. */
const MONTH_ELAPSED = 10;
const MONTH_DAYS = 31;
/** AI actions on an active day, by intensity. */
const ACTIONS_A_DAY: Record<AiBand, number> = { power: 6, habitual: 2, occasional: 0.25, none: 0 };

const cache = new Map<WorkspaceId, WorkspaceModel>();

export function workspaceModel(id: WorkspaceId): WorkspaceModel {
  const hit = cache.get(id);
  if (hit) return hit;
  const model = build(id);
  cache.set(id, model);
  return model;
}

/** Index in a member's day arrays for a day `ago` days before today. */
export const dayIndex = (ago: number) => HISTORY_DAYS - 1 - ago;

function build(id: WorkspaceId): WorkspaceModel {
  const profile = PROFILES[id];
  const record = workspaces().find((w) => w.name === RECORD_NAMES[id])!;
  const next = random(`usage:${id}`);
  const claimed = record.claimed;
  const pending = Math.round((record.seats - claimed) * 0.6);

  // Teams by share, largest remainder so they add up to the members.
  const teamCounts = shareOut(
    claimed,
    profile.teams.map(([, s]) => s),
  );
  const teamOf: string[] = profile.teams.flatMap(([team], k) =>
    Array.from({ length: teamCounts[k]! }, () => team),
  );
  // Shuffle teams so groups are not in blocks.
  for (let i = teamOf.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [teamOf[i], teamOf[j]] = [teamOf[j]!, teamOf[i]!];
  }

  // Joined: most long ago; about 3.5% in the last 60 days.
  const recent = Math.max(1, Math.round(claimed * 0.035));
  const joined = Array.from({ length: claimed }, (_, i) =>
    i < recent ? 3 + Math.floor(next() * 57) : 120 + Math.floor(next() * 1400),
  );

  // Who is active now and who was 90 days ago, from the vendor's record.
  // A: active in the last 7 days. B: last active 8–28 days ago. C: active 90
  // days ago, stopped since. D: the rest (never active, or dormant).
  const order = Array.from({ length: claimed }, (_, i) => i).sort(
    (a, b) => joined[a]! - joined[b]! || a - b,
  );
  // Recent joiners: two of them have not yet been active; the rest are.
  const fresh = new Set(order.slice(0, Math.min(2, recent, claimed - record.active28)));
  const shuffled = shuffle(
    Array.from({ length: claimed }, (_, i) => i).filter((i) => !fresh.has(i)),
    next,
  );
  const a = shuffled.slice(0, record.active7);
  const b = shuffled.slice(record.active7, record.active28);
  const restPool = shuffled.slice(record.active28);
  // Only members who had joined by then can have been active 90 days ago.
  const couldThen = restPool.filter((i) => joined[i]! > 117);
  const activeThenAlready = [...a, ...b].filter((i) => joined[i]! > 117).length;
  const cCount = Math.max(0, Math.min(couldThen.length, record.active28Before - activeThenAlready));
  const c = couldThen.slice(0, cCount);
  const inC = new Set(c);
  const d = [...restPool.filter((i) => !inC.has(i)), ...fresh];
  // Exactly the record's count were active 90 days ago; any other long-time
  // member active today was away then and came back since.
  const activeThen = new Set(
    [...c, ...[...a, ...b].filter((i) => joined[i]! > 117)].slice(0, record.active28Before),
  );

  // Nobody is last active before they joined.
  const lastActive = new Map<number, number | undefined>();
  for (const i of a) lastActive.set(i, Math.min(joined[i]!, Math.floor(next() * 7)));
  for (const i of b) lastActive.set(i, Math.min(joined[i]!, 7 + Math.floor(next() * 21)));
  for (const i of c) lastActive.set(i, 28 + Math.floor(next() * 62));
  // D: recent joiners never active; others dormant, last active before the
  // 90-days-ago window (so they don't count in it), or never active.
  for (const i of d) {
    const dormant = !fresh.has(i) && joined[i]! >= 118 && next() < 0.5;
    lastActive.set(i, dormant ? Math.min(joined[i]!, 118 + Math.floor(next() * 50)) : undefined);
  }

  const names = uniqueNames(claimed + pending, next);
  const members: Member[] = Array.from({ length: claimed }, (_, i) => {
    const team = teamOf[i]!;
    const last = lastActive.get(i);
    const mix = profile.aiByTeam[team] ?? profile.ai;
    const aiAccess = !profile.aiOff.includes(team);
    const roll = next();
    const aiBand: AiBand = !aiAccess
      ? "none"
      : roll < mix.power
        ? "power"
        : roll < mix.power + mix.habitual
          ? "habitual"
          : roll < mix.power + mix.habitual + mix.occasional
            ? "occasional"
            : "none";
    // Engagement: how often an active member shows up on a working day.
    const engagement = 0.45 + 0.5 * next();
    const activeDays = new Uint8Array(HISTORY_DAYS);
    const aiDays = new Uint8Array(HISTORY_DAYS);
    if (last != null) {
      for (let ago = Math.min(joined[i]!, HISTORY_DAYS - 1); ago >= last; ago--) {
        const away = ago >= 90 && ago <= 117 && joined[i]! > 117 && !activeThen.has(i);
        const on = !away && (ago === last || next() < engagement * dayFactor(ago));
        if (!on) continue;
        activeDays[dayIndex(ago)] = 1;
        if (ago <= profile.aiSince) {
          const expected = ACTIONS_A_DAY[aiBand];
          const whole = Math.floor(expected);
          aiDays[dayIndex(ago)] = whole + (next() < expected - whole ? 1 : 0);
        }
      }
      // Anyone the record counts as active 90 days ago was active then.
      if (activeThen.has(i)) {
        const window = Array.from({ length: 28 }, (_, k) => 90 + k).filter(
          (ago) => ago <= joined[i]!,
        );
        if (!window.some((ago) => activeDays[dayIndex(ago)])) {
          activeDays[dayIndex(window[Math.floor(next() * window.length)]!)] = 1;
        }
      }
    }
    const name = names[i]!;
    const auth: Member["auth"] =
      next() < profile.sso ? "SSO" : next() < profile.twoFactor ? "2FA" : "Password";
    return {
      id: `${id}-${i}`,
      name,
      email: emailOf(name, profile.name),
      team,
      role: i === 0 ? "Owner" : next() < 0.03 ? "Admin" : "Member",
      joinedAgo: joined[i]!,
      ...(last != null ? { lastActiveAgo: last } : {}),
      auth,
      scim: next() < profile.scim,
      aiAccess,
      aiBand,
      active: activeDays,
      aiActions: aiDays,
    };
  });

  const invites: Invite[] = Array.from({ length: pending }, (_, k) => ({
    email: emailOf(names[claimed + k]!, profile.name),
    team: profile.teams[Math.floor(next() * profile.teams.length)]![0],
    sentAgo: 1 + Math.floor(next() * 21),
  }));
  const guests: Guest[] = Array.from(
    { length: Math.round(record.seats * profile.guests) },
    (_, k) => ({
      name: `${FIRST[(k * 7 + 3) % FIRST.length]} ${LAST[(k * 5 + 2) % LAST.length]} (guest)`,
      canEdit: next() < profile.guestEdit,
      lastActiveAgo: Math.floor(next() * 40),
    }),
  );

  return {
    id,
    name: profile.name,
    industry: profile.industry,
    plan: record.plan,
    record,
    paidSeats: record.seats,
    pricePerSeat: PRICE_PER_SEAT[record.plan],
    renewalInDays: record.renewalInDays,
    members,
    invites,
    unassigned: record.seats - claimed - pending,
    guests,
    teams: profile.teams.map(([t]) => t),
    aiOff: profile.aiOff,
    aiSince: profile.aiSince,
    credits: creditPlan(record, members),
  };
}

/**
 * Business workspaces commit to a year of credits; each action's cost is
 * scaled so the year so far matches the vendor's record of the commit. Team
 * workspaces pool credits a seat each month at the list cost per action.
 */
function creditPlan(record: Workspace, members: Member[]): CreditPlan {
  if (record.plan === "Business") {
    const commit = commitOf(record.name)!;
    const elapsedDays = 365 - record.renewalInDays;
    const actions = sum(members.map((m) => sumFrom(m.aiActions, elapsedDays)));
    return {
      kind: "annual",
      allowance: record.seats * BUSINESS_ANNUAL_CREDITS,
      elapsedDays,
      periodDays: 365,
      perAction: actions ? commit.used / actions : 1,
      memberMonthlyLimit: 400,
    };
  }
  return {
    kind: "monthly",
    allowance: record.seats * TEAM_MONTHLY_CREDITS,
    elapsedDays: MONTH_ELAPSED,
    periodDays: MONTH_DAYS,
    perAction: 5.5,
    memberMonthlyLimit: 300,
  };
}

/** Sum of a day array over the last `days` days. */
export function sumFrom(values: Uint8Array, days: number): number {
  let total = 0;
  for (let ago = 0; ago < Math.min(days, HISTORY_DAYS); ago++) total += values[dayIndex(ago)]!;
  return total;
}

/** Whether a member was active on any of the days `from` to `to` days ago. */
export function activeBetween(m: Member, from: number, to: number): boolean {
  for (let ago = to; ago <= from; ago++) if (m.active[dayIndex(ago)]) return true;
  return false;
}

export const sum = (values: number[]) => values.reduce((x, y) => x + y, 0);

function shuffle<T>(items: T[], next: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function shareOut(total: number, shares: number[]): number[] {
  const all = sum(shares);
  const raw = shares.map((s) => (s / all) * total);
  const counts = raw.map(Math.floor);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((x, y) => y[0] - x[0]);
  const missing = total - sum(counts);
  for (let k = 0; k < missing; k++) counts[order[k]![1]]! += 1;
  return counts;
}

function uniqueNames(count: number, next: () => number): string[] {
  const out: string[] = [];
  const taken = new Set<string>();
  const start = Math.floor(next() * FIRST.length * LAST.length);
  for (let k = 0; out.length < count; k++) {
    const n = (start + k * 37) % (FIRST.length * LAST.length);
    const name = `${FIRST[n % FIRST.length]} ${LAST[Math.floor(n / FIRST.length)]}`;
    if (!taken.has(name)) {
      taken.add(name);
      out.push(name);
    }
  }
  return out;
}

const emailOf = (name: string, workspace: string) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${workspace.toLowerCase().split(" ")[0]}.example`;
