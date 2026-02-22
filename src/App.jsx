import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import _ from "lodash";

// ── Persistence ──────────────────────────────────────────────────────────
const STORAGE_KEY = "leadership-dashboard-v1";

const defaultTeam = [
  {
    id: "tm1",
    name: "Sarah Chen",
    role: "Sr. Solutions Architect",
    avatar: "SC",
    capacity: 40,
    notes: "",
    devGoals: "AWS Solutions Architect Pro certification by Q3. Transition into technical lead role.",
    strengths: "Deep technical knowledge, client communication, system design",
    growthAreas: "Delegation, saying no to scope creep, presenting to executives",
    coachingLog: [],
  },
  {
    id: "tm2",
    name: "Marcus Johnson",
    role: "Project Manager",
    avatar: "MJ",
    capacity: 40,
    notes: "",
    devGoals: "PMP certification. Build cross-functional leadership skills.",
    strengths: "Stakeholder management, timeline tracking, risk identification",
    growthAreas: "Technical depth, data-driven decision making, conflict resolution",
    coachingLog: [],
  },
  {
    id: "tm3",
    name: "Priya Patel",
    role: "Business Analyst",
    avatar: "PP",
    capacity: 40,
    notes: "",
    devGoals: "Move into product ownership. Complete Agile certification.",
    strengths: "Requirements gathering, documentation, attention to detail",
    growthAreas: "Strategic thinking, presenting recommendations, stakeholder pushback",
    coachingLog: [],
  },
  {
    id: "tm4",
    name: "David Kim",
    role: "DevOps Engineer",
    avatar: "DK",
    capacity: 40,
    notes: "",
    devGoals: "Lead infrastructure modernization. Mentor junior engineers.",
    strengths: "Automation, CI/CD, cloud infrastructure, troubleshooting",
    growthAreas: "Documentation, cross-team communication, planning ahead",
    coachingLog: [],
  },
];

const defaultTasks = [
  { id: "t1", title: "ERP data migration planning", assignee: "tm1", project: "NetSuite Migration", priority: "High", businessPriority: 5, regulatoryImpact: "High", dueDate: "2026-03-07", effort: 12, status: "In Progress", risk: "Yellow" },
  { id: "t2", title: "Vendor API integration spec", assignee: "tm1", project: "Platform Modernization", priority: "Medium", businessPriority: 3, regulatoryImpact: "Low", dueDate: "2026-03-14", effort: 8, status: "Not Started", risk: "Green" },
  { id: "t3", title: "Q1 compliance audit prep", assignee: "tm2", project: "Regulatory Compliance", priority: "High", businessPriority: 5, regulatoryImpact: "High", dueDate: "2026-02-28", effort: 16, status: "In Progress", risk: "Red" },
  { id: "t4", title: "Stakeholder alignment meetings", assignee: "tm2", project: "NetSuite Migration", priority: "Medium", businessPriority: 4, regulatoryImpact: "Medium", dueDate: "2026-03-10", effort: 6, status: "In Progress", risk: "Green" },
  { id: "t5", title: "User acceptance testing plan", assignee: "tm3", project: "NetSuite Migration", priority: "High", businessPriority: 5, regulatoryImpact: "Medium", dueDate: "2026-03-05", effort: 14, status: "In Progress", risk: "Yellow" },
  { id: "t6", title: "Process documentation update", assignee: "tm3", project: "Platform Modernization", priority: "Low", businessPriority: 2, regulatoryImpact: "Low", dueDate: "2026-03-21", effort: 10, status: "Not Started", risk: "Green" },
  { id: "t7", title: "CI/CD pipeline hardening", assignee: "tm4", project: "Platform Modernization", priority: "High", businessPriority: 4, regulatoryImpact: "Medium", dueDate: "2026-03-03", effort: 18, status: "In Progress", risk: "Yellow" },
  { id: "t8", title: "Security patch deployment", assignee: "tm4", project: "Regulatory Compliance", priority: "High", businessPriority: 5, regulatoryImpact: "High", dueDate: "2026-02-25", effort: 10, status: "In Progress", risk: "Red" },
  { id: "t9", title: "Dashboard analytics build", assignee: "tm1", project: "Data Analytics", priority: "Medium", businessPriority: 3, regulatoryImpact: "Low", dueDate: "2026-03-18", effort: 14, status: "Not Started", risk: "Green" },
  { id: "t10", title: "Warranty data reconciliation", assignee: "tm3", project: "Data Analytics", priority: "Medium", businessPriority: 3, regulatoryImpact: "Medium", dueDate: "2026-03-12", effort: 8, status: "Not Started", risk: "Green" },
];

const defaultRisks = [
  { id: "r1", title: "ERP go-live timeline at risk due to data quality issues", project: "NetSuite Migration", owner: "tm1", severity: "High", mitigation: "Dedicated data cleansing sprint scheduled for week of Mar 3. Engaged vendor support.", dateIdentified: "2026-02-10", status: "Open" },
  { id: "r2", title: "Compliance deadline may conflict with migration freeze", project: "Regulatory Compliance", owner: "tm2", severity: "Critical", mitigation: "Escalated to VP. Proposed phased approach to decouple deliverables.", dateIdentified: "2026-02-05", status: "Open" },
  { id: "r3", title: "Single point of failure on DevOps pipeline knowledge", project: "Platform Modernization", owner: "tm4", severity: "Medium", mitigation: "Cross-training sessions scheduled. Documentation sprint in progress.", dateIdentified: "2026-02-14", status: "Mitigating" },
];

const defaultDecisions = [
  { id: "d1", date: "2026-02-18", title: "Delayed Platform Modernization Phase 2 by two weeks", rationale: "Team capacity overloaded with compliance audit. Risk of quality issues if we proceed.", impact: "Medium" },
  { id: "d2", date: "2026-02-12", title: "Hired contractor for data migration support", rationale: "Internal team cannot absorb additional 40hrs/week of migration work without burnout risk.", impact: "High" },
];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

const riskColor = (r) => ({ Green: "#22c55e", Yellow: "#eab308", Red: "#ef4444", Critical: "#dc2626" }[r] || "#94a3b8");
const priorityColor = (p) => ({ High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" }[p] || "#94a3b8");
const bpLabel = (n) => ["", "Low", "Below Avg", "Medium", "Above Avg", "Critical"][n] || "";

function daysBetween(d1, d2) {
  return Math.ceil((new Date(d1) - new Date(d2)) / (1000 * 60 * 60 * 24));
}

function ageDays(dateStr) {
  return daysBetween(new Date().toISOString().split("T")[0], dateStr);
}

const uid = () => Math.random().toString(36).substr(2, 9);

function Badge({ children, color = "#64748b", bg, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 10px",
      borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      color, background: bg || `${color}18`, lineHeight: "20px",
      whiteSpace: "nowrap", ...style
    }}>{children}</span>
  );
}

function Avatar({ initials, size = 36, color = "#475569" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}22, ${color}11)`,
      border: `2px solid ${color}33`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 700,
      color, flexShrink: 0, letterSpacing: 0.5
    }}>{initials}</div>
  );
}

function CapacityBar({ percent, height = 8 }) {
  const clampPct = Math.min(percent, 150);
  const barColor = percent > 100 ? "#ef4444" : percent > 90 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: height, background: "#e2e8f0", overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(clampPct, 100)}%`, height: "100%", borderRadius: height,
        background: barColor, transition: "width 0.4s ease"
      }} />
      {percent > 100 && (
        <div style={{
          position: "absolute", right: 0, top: 0, width: `${Math.min(clampPct - 100, 50)}%`,
          height: "100%", background: `repeating-linear-gradient(45deg, ${barColor}44, ${barColor}44 2px, transparent 2px, transparent 6px)`,
        }} />
      )}
    </div>
  );
}

function Card({ children, style = {}, onClick, hoverable = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHov(true)}
      onMouseLeave={() => hoverable && setHov(false)}
      style={{
        background: "#fff", borderRadius: 12, padding: 20,
        border: "1px solid #e8ecf1",
        boxShadow: hov ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, transform 0.2s",
        transform: hov ? "translateY(-1px)" : "none",
        cursor: onClick ? "pointer" : "default", ...style
      }}
    >{children}</div>
  );
}

function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      animation: "fadeIn 0.15s ease"
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, width: "90%", maxWidth: width,
        maxHeight: "85vh", overflow: "auto", padding: 28,
        boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
        animation: "slideUp 0.2s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20, cursor: "pointer",
            color: "#94a3b8", padding: "4px 8px", borderRadius: 6, lineHeight: 1
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 2, background: "#f1f5f9", borderRadius: 10, padding: 3,
      marginBottom: 24
    }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "10px 16px", border: "none", borderRadius: 8,
          background: active === t.id ? "#fff" : "transparent",
          boxShadow: active === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          color: active === t.id ? "#0f172a" : "#64748b",
          fontWeight: active === t.id ? 600 : 500, fontSize: 13,
          cursor: "pointer", transition: "all 0.15s",
          fontFamily: "inherit", letterSpacing: 0.2
        }}>
          <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

function FormField({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none",
  color: "#1e293b", background: "#fafbfc", boxSizing: "border-box",
  transition: "border-color 0.15s"
};

const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23636e7b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: 12, paddingRight: 30 };

const btnPrimary = {
  padding: "9px 20px", background: "#0f172a", color: "#fff", border: "none",
  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "inherit", letterSpacing: 0.2
};

const btnSecondary = { ...btnPrimary, background: "#f1f5f9", color: "#475569" };

const TABS = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "people", label: "People", icon: "◉" },
  { id: "workload", label: "Workload", icon: "▦" },
  { id: "projects", label: "Projects", icon: "◈" },
  { id: "risks", label: "Risks", icon: "⚑" },
  { id: "oneone", label: "1:1s", icon: "◇" },
  { id: "decisions", label: "Decisions", icon: "◆" },
];

export default function App() {
  const stored = useMemo(() => loadData(), []);
  const [team, setTeam] = useState(stored?.team || defaultTeam);
  const [tasks, setTasks] = useState(stored?.tasks || defaultTasks);
  const [risks, setRisks] = useState(stored?.risks || defaultRisks);
  const [decisions, setDecisions] = useState(stored?.decisions || defaultDecisions);
  const [tab, setTab] = useState("overview");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [editRisk, setEditRisk] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewRisk, setShowNewRisk] = useState(false);
  const [showNewDecision, setShowNewDecision] = useState(false);
  const [filterProject, setFilterProject] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");
  const [reassignTask, setReassignTask] = useState(null);

  useEffect(() => { saveData({ team, tasks, risks, decisions }); }, [team, tasks, risks, decisions]);

  const projects = useMemo(() => [...new Set(tasks.map((t) => t.project))].sort(), [tasks]);
  const today = new Date().toISOString().split("T")[0];
  const getPersonTasks = useCallback((id) => tasks.filter((t) => t.assignee === id), [tasks]);

  const getCapacity = useCallback((id) => {
    const person = team.find((p) => p.id === id);
    const totalEffort = getPersonTasks(id).reduce((s, t) => s + (t.effort || 0), 0);
    const cap = person?.capacity || 40;
    return { total: totalEffort, capacity: cap, percent: Math.round((totalEffort / cap) * 100) };
  }, [team, getPersonTasks]);

  const overloadedMembers = useMemo(() => team.filter((p) => getCapacity(p.id).percent > 90), [team, getCapacity]);

  const criticalDeadlines = useMemo(() =>
    tasks.filter((t) => { const days = daysBetween(t.dueDate, today); return days <= 7 && days >= 0 && t.priority === "High"; })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)), [tasks, today]);

  const topRisks = useMemo(() =>
    risks.filter((r) => r.status !== "Closed").sort((a, b) => {
      const sev = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (sev[a.severity] || 9) - (sev[b.severity] || 9);
    }).slice(0, 5), [risks]);

  const conflictingDeadlines = useMemo(() => {
    const highTasks = tasks.filter((t) => t.priority === "High" || t.businessPriority >= 4);
    const conflicts = [];
    for (let i = 0; i < highTasks.length; i++) {
      for (let j = i + 1; j < highTasks.length; j++) {
        if (highTasks[i].assignee === highTasks[j].assignee &&
          Math.abs(daysBetween(highTasks[i].dueDate, highTasks[j].dueDate)) <= 3) {
          conflicts.push([highTasks[i], highTasks[j]]);
        }
      }
    }
    return conflicts;
  }, [tasks]);

  const overdueRisks = useMemo(() => risks.filter((r) => r.status === "Open" && ageDays(r.dateIdentified) > 14), [risks]);

  const updateTask = (id, updates) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, ...updates } : t));
  const addTask = (task) => setTasks((ts) => [...ts, { ...task, id: `t${uid()}` }]);
  const deleteTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const updateRisk = (id, updates) => setRisks((rs) => rs.map((r) => r.id === id ? { ...r, ...updates } : r));
  const addRisk = (risk) => setRisks((rs) => [...rs, { ...risk, id: `r${uid()}` }]);
  const addDecision = (dec) => setDecisions((ds) => [...ds, { ...dec, id: `d${uid()}` }]);
  const updatePerson = (id, updates) => setTeam((ts) => ts.map((t) => t.id === id ? { ...t, ...updates } : t));

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filterProject !== "All") result = result.filter((t) => t.project === filterProject);
    if (filterPriority !== "All") result = result.filter((t) => t.priority === filterPriority);
    if (sortBy === "dueDate") result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    else if (sortBy === "priority") result.sort((a, b) => b.businessPriority - a.businessPriority);
    else if (sortBy === "risk") { const rv = { Red: 0, Yellow: 1, Green: 2 }; result.sort((a, b) => (rv[a.risk] || 9) - (rv[b.risk] || 9)); }
    return result;
  }, [tasks, filterProject, filterPriority, sortBy]);

  const resetData = () => {
    if (confirm("Reset all data to defaults?")) {
      setTeam(defaultTeam); setTasks(defaultTasks); setRisks(defaultRisks); setDecisions(defaultDecisions);
    }
  };

  // ── Overview ──
  const renderOverview = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Team Members", value: team.length, sub: `${overloadedMembers.length} overloaded`, color: overloadedMembers.length ? "#ef4444" : "#22c55e" },
          { label: "Active Tasks", value: tasks.length, sub: `${tasks.filter((t) => t.priority === "High").length} high priority`, color: "#f59e0b" },
          { label: "Open Risks", value: risks.filter((r) => r.status !== "Closed").length, sub: `${overdueRisks.length} overdue`, color: overdueRisks.length ? "#ef4444" : "#22c55e" },
          { label: "Due This Week", value: criticalDeadlines.length, sub: "critical deadlines", color: criticalDeadlines.length > 2 ? "#ef4444" : "#22c55e" },
        ].map((s, i) => (
          <Card key={i}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 6 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {(overloadedMembers.length > 0 || overdueRisks.length > 0 || conflictingDeadlines.length > 0) && (
        <Card style={{ marginBottom: 24, borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 12 }}>⚠ Escalations Required</div>
          {overloadedMembers.map((p) => (
            <div key={p.id} style={{ fontSize: 13, color: "#475569", marginBottom: 6, paddingLeft: 12 }}>
              <strong>{p.name}</strong> is at <span style={{ color: "#ef4444", fontWeight: 700 }}>{getCapacity(p.id).percent}%</span> capacity
            </div>
          ))}
          {overdueRisks.map((r) => (
            <div key={r.id} style={{ fontSize: 13, color: "#475569", marginBottom: 6, paddingLeft: 12 }}>
              Risk "<strong>{r.title.substring(0, 60)}</strong>" open for <span style={{ color: "#ef4444", fontWeight: 700 }}>{ageDays(r.dateIdentified)} days</span>
            </div>
          ))}
          {conflictingDeadlines.map(([a, b], i) => (
            <div key={i} style={{ fontSize: 13, color: "#475569", marginBottom: 6, paddingLeft: 12 }}>
              <strong>{team.find((p) => p.id === a.assignee)?.name}</strong> has conflicting deadlines: "{a.title}" and "{b.title}"
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Top Risks</div>
          {topRisks.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>No open risks</div>}
          {topRisks.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor(r.severity), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.project} · {ageDays(r.dateIdentified)}d old</div>
              </div>
              <Badge color={riskColor(r.severity)}>{r.severity}</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Critical Deadlines This Week</div>
          {criticalDeadlines.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>No critical deadlines this week</div>}
          {criticalDeadlines.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor(t.risk), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{t.title}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{team.find((p) => p.id === t.assignee)?.name} · {t.project}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: daysBetween(t.dueDate, today) <= 2 ? "#ef4444" : "#f59e0b" }}>
                {daysBetween(t.dueDate, today) === 0 ? "Today" : `${daysBetween(t.dueDate, today)}d`}
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Team Capacity</div>
        <div style={{ display: "grid", gap: 14 }}>
          {team.map((p) => {
            const cap = getCapacity(p.id);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar initials={p.avatar} size={32} />
                <div style={{ width: 130, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.name}</div>
                <div style={{ flex: 1 }}><CapacityBar percent={cap.percent} /></div>
                <div style={{ width: 50, textAlign: "right", fontSize: 13, fontWeight: 700, color: cap.percent > 100 ? "#ef4444" : cap.percent > 90 ? "#f59e0b" : "#22c55e" }}>{cap.percent}%</div>
                <div style={{ width: 80, textAlign: "right", fontSize: 11, color: "#94a3b8" }}>{cap.total}h / {cap.capacity}h</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  // ── People ──
  const renderPeople = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {team.map((person) => {
          const pTasks = getPersonTasks(person.id);
          const cap = getCapacity(person.id);
          const pProjects = [...new Set(pTasks.map((t) => t.project))];
          return (
            <Card key={person.id} hoverable onClick={() => setSelectedPerson(person.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar initials={person.avatar} size={42} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{person.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{person.role}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: cap.percent > 100 ? "#ef4444" : cap.percent > 90 ? "#f59e0b" : "#22c55e" }}>{cap.percent}%</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>capacity</div>
                </div>
              </div>
              <CapacityBar percent={cap.percent} />
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {pProjects.map((pr) => <Badge key={pr} color="#6366f1">{pr}</Badge>)}
              </div>
              <div style={{ marginTop: 14 }}>
                {pTasks.slice(0, 3).map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: riskColor(t.risk), flexShrink: 0 }} />
                    <div style={{ flex: 1, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <Badge color={priorityColor(t.priority)} style={{ fontSize: 10 }}>{t.priority}</Badge>
                  </div>
                ))}
                {pTasks.length > 3 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>+{pTasks.length - 3} more tasks</div>}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!selectedPerson} onClose={() => setSelectedPerson(null)} title={team.find((p) => p.id === selectedPerson)?.name || ""} width={680}>
        {selectedPerson && (() => {
          const person = team.find((p) => p.id === selectedPerson);
          const pTasks = getPersonTasks(selectedPerson);
          const cap = getCapacity(selectedPerson);
          return (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
                <Avatar initials={person.avatar} size={48} />
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{person.role}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cap.percent > 100 ? "#ef4444" : cap.percent > 90 ? "#f59e0b" : "#22c55e" }}>{cap.percent}% capacity</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{cap.total}h / {cap.capacity}h</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Tasks ({pTasks.length})</div>
              {pTasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 6, background: "#fafbfc", borderRadius: 8, fontSize: 13 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor(t.risk) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t.project} · {t.effort}h · Due {t.dueDate}</div>
                  </div>
                  <Badge color={priorityColor(t.priority)}>{t.priority}</Badge>
                  <button onClick={() => { setReassignTask(t.id); }} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Reassign</button>
                </div>
              ))}
              <button onClick={() => { setShowNewTask(true); setSelectedPerson(null); }} style={{ ...btnPrimary, marginTop: 10, fontSize: 12, padding: "7px 16px" }}>+ Add Task</button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );

  // ── Workload ──
  const renderWorkload = () => (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Click "Reassign" on any task to move it between team members.</div>
      {team.map((person) => {
        const pTasks = getPersonTasks(person.id);
        const cap = getCapacity(person.id);
        const overloaded = cap.percent > 90;
        return (
          <Card key={person.id} style={{ marginBottom: 16, borderLeft: overloaded ? "4px solid " + (cap.percent > 100 ? "#ef4444" : "#f59e0b") : "4px solid #22c55e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <Avatar initials={person.avatar} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{person.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{person.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: cap.percent > 100 ? "#ef4444" : cap.percent > 90 ? "#f59e0b" : "#22c55e" }}>{cap.percent}%</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{cap.total}h of {cap.capacity}h</div>
              </div>
            </div>
            <CapacityBar percent={cap.percent} height={10} />
            {overloaded && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: cap.percent > 100 ? "#fef2f2" : "#fefce8", borderRadius: 8, fontSize: 12, fontWeight: 600, color: cap.percent > 100 ? "#dc2626" : "#ca8a04" }}>
                {cap.percent > 100 ? "⚠ Over capacity — immediate rebalancing needed" : "⚠ Near capacity — monitor closely"}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              {pTasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, background: "#fafbfc", borderRadius: 6, fontSize: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: riskColor(t.risk) }} />
                  <div style={{ flex: 1, fontWeight: 500, color: "#334155" }}>{t.title}</div>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{t.effort}h</span>
                  <Badge color={priorityColor(t.priority)} style={{ fontSize: 10 }}>{t.priority}</Badge>
                  <button onClick={() => setReassignTask(t.id)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", color: "#64748b", fontFamily: "inherit", fontWeight: 500 }}>Reassign</button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <Modal open={!!reassignTask} onClose={() => setReassignTask(null)} title="Reassign Task" width={400}>
        {reassignTask && (() => {
          const task = tasks.find((t) => t.id === reassignTask);
          if (!task) return null;
          return (
            <div>
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{task.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{task.project} · {task.effort}h · Currently: {team.find((p) => p.id === task.assignee)?.name}</div>
              </div>
              <FormField label="Reassign to">
                <select style={selectStyle} value={task.assignee} onChange={(e) => { updateTask(task.id, { assignee: e.target.value }); setReassignTask(null); }}>
                  {team.map((p) => (<option key={p.id} value={p.id}>{p.name} ({getCapacity(p.id).percent}% used)</option>))}
                </select>
              </FormField>
            </div>
          );
        })()}
      </Modal>
    </div>
  );

  // ── Projects ──
  const renderProjects = () => (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <FormField label="Project" style={{ marginBottom: 0 }}>
          <select style={{ ...selectStyle, width: 180 }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="All">All Projects</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Priority" style={{ marginBottom: 0 }}>
          <select style={{ ...selectStyle, width: 140 }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="All">All</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </FormField>
        <FormField label="Sort By" style={{ marginBottom: 0 }}>
          <select style={{ ...selectStyle, width: 140 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="dueDate">Due Date</option><option value="priority">Business Priority</option><option value="risk">Risk</option>
          </select>
        </FormField>
        <div style={{ marginLeft: "auto", paddingTop: 18 }}>
          <button onClick={() => setShowNewTask(true)} style={btnPrimary}>+ New Task</button>
        </div>
      </div>

      {conflictingDeadlines.length > 0 && (
        <Card style={{ marginBottom: 16, borderLeft: "4px solid #f59e0b", padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ca8a04", marginBottom: 6 }}>⚠ Conflicting High-Priority Deadlines</div>
          {conflictingDeadlines.map(([a, b], i) => (
            <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              <strong>{team.find((p) => p.id === a.assignee)?.name}</strong>: "{a.title}" ({a.dueDate}) ↔ "{b.title}" ({b.dueDate})
            </div>
          ))}
        </Card>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["Risk", "Task", "Project", "Assignee", "Priority", "Biz Prio", "Regulatory", "Due", "Effort", "Status", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const daysLeft = daysBetween(t.dueDate, today);
              const overdue = daysLeft < 0;
              return (
                <tr key={t.id}>
                  <td style={{ padding: "10px 12px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: riskColor(t.risk) }} /></td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e293b", maxWidth: 200 }}>{t.title}</td>
                  <td style={{ padding: "10px 12px" }}><Badge color="#6366f1">{t.project}</Badge></td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{team.find((p) => p.id === t.assignee)?.name}</td>
                  <td style={{ padding: "10px 12px" }}><Badge color={priorityColor(t.priority)}>{t.priority}</Badge></td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}><span style={{ fontWeight: 700, color: t.businessPriority >= 4 ? "#dc2626" : "#64748b" }}>{t.businessPriority}/5</span></td>
                  <td style={{ padding: "10px 12px" }}><Badge color={priorityColor(t.regulatoryImpact)}>{t.regulatoryImpact}</Badge></td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap", color: overdue ? "#ef4444" : daysLeft <= 3 ? "#f59e0b" : "#64748b" }}>
                    {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d`}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{t.effort}h</td>
                  <td style={{ padding: "10px 12px" }}><Badge color="#64748b">{t.status}</Badge></td>
                  <td style={{ padding: "10px 12px" }}><button onClick={() => setEditTask(t)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TaskModal open={showNewTask || !!editTask} onClose={() => { setShowNewTask(false); setEditTask(null); }} task={editTask} team={team} projects={projects}
        onSave={(t) => { if (editTask) updateTask(editTask.id, t); else addTask(t); setShowNewTask(false); setEditTask(null); }}
        onDelete={editTask ? () => { deleteTask(editTask.id); setEditTask(null); } : null} />
    </div>
  );

  // ── Risks ──
  const renderRisks = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>Risks open for 14+ days are automatically flagged for review.</div>
        <button onClick={() => setShowNewRisk(true)} style={btnPrimary}>+ Log Risk</button>
      </div>

      {risks.filter((r) => r.status !== "Closed").map((r) => {
        const age = ageDays(r.dateIdentified);
        const overdue = r.status === "Open" && age > 14;
        return (
          <Card key={r.id} style={{ marginBottom: 12, borderLeft: `4px solid ${riskColor(r.severity)}`, background: overdue ? "#fef2f2" : "#fff" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{r.title}</span>
                  {overdue && <Badge color="#ef4444">⚠ OVERDUE</Badge>}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                  {r.project} · Owner: {team.find((p) => p.id === r.owner)?.name || "Unassigned"} · Identified: {r.dateIdentified} · <strong>{age} days old</strong>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <Badge color={riskColor(r.severity)}>{r.severity}</Badge>
                  <Badge color={r.status === "Mitigating" ? "#22c55e" : "#f59e0b"}>{r.status}</Badge>
                </div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  <strong style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Mitigation: </strong>{r.mitigation}
                </div>
              </div>
              <button onClick={() => setEditRisk(r)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 11 }}>Edit</button>
            </div>
          </Card>
        );
      })}

      {risks.filter((r) => r.status === "Closed").length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginTop: 24, marginBottom: 12 }}>Closed Risks</div>
          {risks.filter((r) => r.status === "Closed").map((r) => (
            <div key={r.id} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, fontSize: 13, color: "#94a3b8" }}>
              <span style={{ textDecoration: "line-through" }}>{r.title}</span><span style={{ marginLeft: 8 }}>· {r.project}</span>
            </div>
          ))}
        </>
      )}

      <RiskModal open={showNewRisk || !!editRisk} onClose={() => { setShowNewRisk(false); setEditRisk(null); }} risk={editRisk} team={team} projects={projects}
        onSave={(r) => { if (editRisk) updateRisk(editRisk.id, r); else addRisk(r); setShowNewRisk(false); setEditRisk(null); }} />
    </div>
  );

  // ── 1:1s ──
  const renderOneOne = () => {
    const [activePerson, setActivePerson] = useState(team[0]?.id);
    const person = team.find((p) => p.id === activePerson);
    const [newCoachEntry, setNewCoachEntry] = useState("");
    if (!person) return null;
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {team.map((p) => (
            <button key={p.id} onClick={() => setActivePerson(p.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
              border: activePerson === p.id ? "2px solid #0f172a" : "1px solid #e2e8f0",
              borderRadius: 10, background: activePerson === p.id ? "#0f172a08" : "#fff",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              fontWeight: activePerson === p.id ? 700 : 500, color: activePerson === p.id ? "#0f172a" : "#64748b"
            }}><Avatar initials={p.avatar} size={24} />{p.name.split(" ")[0]}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Development Goals</div>
            <textarea value={person.devGoals} onChange={(e) => updatePerson(person.id, { devGoals: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Strengths</div>
            <textarea value={person.strengths} onChange={(e) => updatePerson(person.id, { strengths: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Growth Areas</div>
            <textarea value={person.growthAreas} onChange={(e) => updatePerson(person.id, { growthAreas: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </Card>
        </div>
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>1:1 Notes</div>
          <textarea value={person.notes} onChange={(e) => updatePerson(person.id, { notes: e.target.value })} rows={5} placeholder="Meeting notes, action items, follow-ups..." style={{ ...inputStyle, resize: "vertical" }} />
        </Card>
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Coaching Log</div>
          {(person.coachingLog || []).map((entry, i) => (
            <div key={i} style={{ padding: "10px 14px", background: "#fafbfc", borderRadius: 8, marginBottom: 6, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#334155" }}>{entry.text}</span>
              <span style={{ color: "#94a3b8", fontSize: 11, whiteSpace: "nowrap", marginLeft: 12 }}>{entry.date}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={newCoachEntry} onChange={(e) => setNewCoachEntry(e.target.value)} placeholder="Add coaching note..." style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => { if (e.key === "Enter" && newCoachEntry.trim()) { updatePerson(person.id, { coachingLog: [...(person.coachingLog || []), { text: newCoachEntry.trim(), date: today }] }); setNewCoachEntry(""); } }} />
            <button onClick={() => { if (newCoachEntry.trim()) { updatePerson(person.id, { coachingLog: [...(person.coachingLog || []), { text: newCoachEntry.trim(), date: today }] }); setNewCoachEntry(""); } }} style={btnPrimary}>Add</button>
          </div>
        </Card>
      </div>
    );
  };

  // ── Decisions ──
  const renderDecisions = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>Major decisions and rationale for future reference.</div>
        <button onClick={() => setShowNewDecision(true)} style={btnPrimary}>+ Log Decision</button>
      </div>
      {decisions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((d) => (
        <Card key={d.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: d.impact === "High" ? "#fef2f2" : d.impact === "Medium" ? "#fefce8" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>◆</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{d.title}</span>
                <Badge color={d.impact === "High" ? "#ef4444" : d.impact === "Medium" ? "#f59e0b" : "#22c55e"}>{d.impact} Impact</Badge>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{d.date}</div>
              <div style={{ fontSize: 13, color: "#475569" }}>
                <strong style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Rationale: </strong>{d.rationale}
              </div>
            </div>
          </div>
        </Card>
      ))}
      <DecisionModal open={showNewDecision} onClose={() => setShowNewDecision(false)} onSave={(d) => { addDecision(d); setShowNewDecision(false); }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'DM Sans', 'Segoe UI', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #94a3b8 !important; outline: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        table tr:hover td { background: #fafbfc; }
      `}</style>
      <div style={{ background: "#fff", borderBottom: "1px solid #e8ecf1", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>Leadership Dashboard</h1>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{team.length} team members · {tasks.length} tasks · Week of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <button onClick={resetData} style={{ ...btnSecondary, fontSize: 11, padding: "6px 14px" }}>Reset Demo Data</button>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        {tab === "overview" && renderOverview()}
        {tab === "people" && renderPeople()}
        {tab === "workload" && renderWorkload()}
        {tab === "projects" && renderProjects()}
        {tab === "risks" && renderRisks()}
        {tab === "oneone" && renderOneOne()}
        {tab === "decisions" && renderDecisions()}
      </div>
    </div>
  );
}

function TaskModal({ open, onClose, task, team, projects, onSave, onDelete }) {
  const [form, setForm] = useState({ title: "", assignee: team[0]?.id || "", project: projects[0] || "", priority: "Medium", businessPriority: 3, regulatoryImpact: "Low", dueDate: new Date().toISOString().split("T")[0], effort: 8, status: "Not Started", risk: "Green" });
  useEffect(() => {
    if (task) setForm({ ...task });
    else setForm({ title: "", assignee: team[0]?.id || "", project: projects[0] || "", priority: "Medium", businessPriority: 3, regulatoryImpact: "Low", dueDate: new Date().toISOString().split("T")[0], effort: 8, status: "Not Started", risk: "Green" });
  }, [task, open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit Task" : "New Task"} width={520}>
      <FormField label="Task Title"><input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Task description..." /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Assignee"><select style={selectStyle} value={form.assignee} onChange={(e) => set("assignee", e.target.value)}>{team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
        <FormField label="Project"><input style={inputStyle} value={form.project} onChange={(e) => set("project", e.target.value)} placeholder="Project name" list="projects-list" /><datalist id="projects-list">{projects.map((p) => <option key={p} value={p} />)}</datalist></FormField>
        <FormField label="Priority"><select style={selectStyle} value={form.priority} onChange={(e) => set("priority", e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></FormField>
        <FormField label="Business Priority (1-5)"><select style={selectStyle} value={form.businessPriority} onChange={(e) => set("businessPriority", Number(e.target.value))}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} – {bpLabel(n)}</option>)}</select></FormField>
        <FormField label="Regulatory Impact"><select style={selectStyle} value={form.regulatoryImpact} onChange={(e) => set("regulatoryImpact", e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></FormField>
        <FormField label="Risk Status"><select style={selectStyle} value={form.risk} onChange={(e) => set("risk", e.target.value)}><option>Green</option><option>Yellow</option><option>Red</option></select></FormField>
        <FormField label="Due Date"><input style={inputStyle} type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></FormField>
        <FormField label="Effort (hours)"><input style={inputStyle} type="number" min={1} max={80} value={form.effort} onChange={(e) => set("effort", Number(e.target.value))} /></FormField>
        <FormField label="Status"><select style={selectStyle} value={form.status} onChange={(e) => set("status", e.target.value)}><option>Not Started</option><option>In Progress</option><option>Blocked</option><option>Done</option></select></FormField>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "space-between" }}>
        <div>{onDelete && <button onClick={onDelete} style={{ ...btnSecondary, color: "#ef4444" }}>Delete Task</button>}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={() => form.title && onSave(form)} style={btnPrimary}>{task ? "Save Changes" : "Create Task"}</button>
        </div>
      </div>
    </Modal>
  );
}

function RiskModal({ open, onClose, risk, team, projects, onSave }) {
  const [form, setForm] = useState({ title: "", project: projects[0] || "", owner: team[0]?.id || "", severity: "Medium", mitigation: "", dateIdentified: new Date().toISOString().split("T")[0], status: "Open" });
  useEffect(() => {
    if (risk) setForm({ ...risk });
    else setForm({ title: "", project: projects[0] || "", owner: team[0]?.id || "", severity: "Medium", mitigation: "", dateIdentified: new Date().toISOString().split("T")[0], status: "Open" });
  }, [risk, open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title={risk ? "Edit Risk" : "Log New Risk"} width={520}>
      <FormField label="Risk Description"><textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Describe the risk..." /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Project"><input style={inputStyle} value={form.project} onChange={(e) => set("project", e.target.value)} list="riskprojects" /><datalist id="riskprojects">{projects.map((p) => <option key={p} value={p} />)}</datalist></FormField>
        <FormField label="Risk Owner"><select style={selectStyle} value={form.owner} onChange={(e) => set("owner", e.target.value)}>{team.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
        <FormField label="Severity"><select style={selectStyle} value={form.severity} onChange={(e) => set("severity", e.target.value)}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></FormField>
        <FormField label="Status"><select style={selectStyle} value={form.status} onChange={(e) => set("status", e.target.value)}><option>Open</option><option>Mitigating</option><option>Closed</option></select></FormField>
        <FormField label="Date Identified"><input style={inputStyle} type="date" value={form.dateIdentified} onChange={(e) => set("dateIdentified", e.target.value)} /></FormField>
      </div>
      <FormField label="Mitigation Plan"><textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.mitigation} onChange={(e) => set("mitigation", e.target.value)} placeholder="Describe mitigation actions..." /></FormField>
      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={() => form.title && onSave(form)} style={btnPrimary}>{risk ? "Save Changes" : "Log Risk"}</button>
      </div>
    </Modal>
  );
}

function DecisionModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], title: "", rationale: "", impact: "Medium" });
  useEffect(() => { if (open) setForm({ date: new Date().toISOString().split("T")[0], title: "", rationale: "", impact: "Medium" }); }, [open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title="Log Decision" width={480}>
      <FormField label="Decision"><input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="What was decided?" /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Date"><input style={inputStyle} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></FormField>
        <FormField label="Impact Level"><select style={selectStyle} value={form.impact} onChange={(e) => set("impact", e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></FormField>
      </div>
      <FormField label="Rationale"><textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.rationale} onChange={(e) => set("rationale", e.target.value)} placeholder="Why was this decision made?" /></FormField>
      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={btnSecondary}>Cancel</button>
        <button onClick={() => form.title && onSave(form)} style={btnPrimary}>Log Decision</button>
      </div>
    </Modal>
  );
}