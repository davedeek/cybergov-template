import { useState, useMemo } from "react";

const DEFAULT_EMPLOYEES = [
  { id: 'e1', name: 'Director', role: 'Dir. of Energy Services' },
  { id: 'e2', name: 'Analyst A', role: 'Energy Analyst' },
  { id: 'e3', name: 'Analyst B', role: 'Energy Analyst' },
  { id: 'e4', name: 'Specialist', role: 'Rebate Specialist' },
  { id: 'e5', name: 'Coordinator', role: 'Program Coordinator' },
];

const DEFAULT_ACTIVITIES = [
  { id: 'a1', name: 'Rebate Processing' },
  { id: 'a2', name: 'Customer Service' },
  { id: 'a3', name: 'Power Supply' },
  { id: 'a4', name: 'Management' },
];

const DEFAULT_CELLS = {
  'a1-e1': [{ task: 'Rebates review', hours: 10 }],
  'a1-e2': [{ task: 'Heat pump rebate processing', hours: 20 }, { task: 'EV rebate processing', hours: 5 }],
  'a1-e3': [{ task: 'Solar rebate processing', hours: 5 }, { task: 'Other residential rebates', hours: 10 }],
  'a1-e4': [{ task: 'C&I rebate processing', hours: 10 }, { task: 'Heat pump rebate processing', hours: 20 }],
  'a1-e5': [{ task: 'EV rebate processing', hours: 5 }, { task: 'Rebate customer service', hours: 15 }],
  'a2-e1': [{ task: 'Key account management', hours: 5 }],
  'a2-e2': [{ task: 'Key account management', hours: 15 }],
  'a2-e5': [{ task: 'Rebate customer service', hours: 15 }, { task: 'Key account management', hours: 5 }],
  'a3-e1': [{ task: 'Portfolio management', hours: 15 }, { task: 'Regulatory interface', hours: 10 }],
  'a3-e2': [{ task: 'Supply & load forecasting', hours: 15 }, { task: 'Grid asset management', hours: 5 }],
  'a3-e3': [{ task: 'Supply & load forecasting', hours: 5 }, { task: 'Power supply review', hours: 5 }],
  'a4-e1': [{ task: 'Personnel management', hours: 8 }, { task: 'Inter-division coordination', hours: 15 }],
  'a4-e3': [{ task: 'Inter-division coordination', hours: 5 }],
  'a4-e4': [{ task: 'Inter-division coordination', hours: 3 }],
};

export default function WorkDistributionChart() {
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
  const [cells, setCells] = useState(DEFAULT_CELLS);
  const [activeCell, setActiveCell] = useState(null);
  const [newTask, setNewTask] = useState({ task: '', hours: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '' });
  const [newActivity, setNewActivity] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const [view, setView] = useState('chart');

  const empTotals = useMemo(() => {
    const t = {};
    employees.forEach(e => {
      t[e.id] = 0;
      activities.forEach(a => {
        const key = `${a.id}-${e.id}`;
        if (cells[key]) cells[key].forEach(task => { t[e.id] += Number(task.hours) || 0; });
      });
    });
    return t;
  }, [cells, employees, activities]);

  const actTotals = useMemo(() => {
    const t = {};
    activities.forEach(a => {
      t[a.id] = 0;
      employees.forEach(e => {
        const key = `${a.id}-${e.id}`;
        if (cells[key]) cells[key].forEach(task => { t[a.id] += Number(task.hours) || 0; });
      });
    });
    return t;
  }, [cells, employees, activities]);

  const flags = useMemo(() => {
    const result = [];
    employees.forEach(e => {
      if (empTotals[e.id] > 40)
        result.push({ type: 'overload', severity: 'red', message: `${e.name} is logged at ${empTotals[e.id]} hrs/wk — over capacity.`, guide: 'Who can absorb tasks? Does this unit need a new hire?' });
    });
    const mgr = employees[0];
    if (mgr) {
      const nonMgmtHours = activities
        .filter(a => !a.name.toLowerCase().includes('management'))
        .reduce((sum, a) => {
          const key = `${a.id}-${mgr.id}`;
          return sum + (cells[key] ? cells[key].reduce((s, t) => s + (Number(t.hours) || 0), 0) : 0);
        }, 0);
      if (nonMgmtHours > 20)
        result.push({ type: 'manager doing analyst work', severity: 'yellow', message: `${mgr.name} has ~${nonMgmtHours} hrs/wk in non-management activities.`, guide: 'Which tasks can be delegated to ground staff?' });
    }
    activities.forEach(a => {
      const assigned = employees.filter(e => {
        const key = `${a.id}-${e.id}`;
        return cells[key] && cells[key].length > 0;
      });
      if (assigned.length === 1 && actTotals[a.id] > 5)
        result.push({ type: 'thin coverage', severity: 'blue', message: `"${a.name}" has only one person assigned — key-person risk.`, guide: 'What happens if this person is out sick for a week?' });
    });
    employees.forEach(e => {
      const actCount = activities.filter(a => {
        const key = `${a.id}-${e.id}`;
        return cells[key] && cells[key].length > 0;
      }).length;
      if (actCount >= 4)
        result.push({ type: 'fragmented effort', severity: 'yellow', message: `${e.name} has tasks spread across ${actCount} activities.`, guide: 'Are these related? Should they be consolidated or reassigned?' });
    });
    return result;
  }, [employees, activities, cells, empTotals, actTotals]);

  const getCellTasks = (actId, empId) => cells[`${actId}-${empId}`] || [];

  const addTask = () => {
    if (!activeCell || !newTask.task.trim() || !newTask.hours) return;
    const key = `${activeCell.actId}-${activeCell.empId}`;
    setCells(prev => ({ ...prev, [key]: [...(prev[key] || []), { task: newTask.task.trim(), hours: Number(newTask.hours) }] }));
    setNewTask({ task: '', hours: '' });
  };

  const removeTask = (actId, empId, idx) => {
    const key = `${actId}-${empId}`;
    setCells(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const sevBg = { red: '#FDF0ED', yellow: '#FDFAED', blue: '#EDF1FB' };
  const sevColor = { red: '#C94A1E', yellow: '#9A7000', blue: '#2B5EA7' };
  const sevBorder = { red: '#C94A1E', yellow: '#D4A017', blue: '#2B5EA7' };

  return (
    <div style={{ fontFamily: "'Bitter', Georgia, serif", background: '#F5F0E8', minHeight: '100vh', color: '#1A1A18' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input { font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 12px; border: 1px solid #C8C3B4; background: white; padding: 5px 8px; color: #1A1A18; outline: none; }
        input:focus { border-color: #C94A1E; }
        .tab { background: none; border: none; cursor: pointer; padding: 10px 22px; font-family: 'Bitter', Georgia, serif; font-size: 14px; font-weight: 600; border-bottom: 3px solid transparent; color: #5C5A52; letter-spacing: 0.01em; }
        .tab.active { border-bottom-color: #C94A1E; color: #1A1A18; }
        .tab:hover { color: #1A1A18; }
        .btn { font-family: 'Bitter', Georgia, serif; font-size: 13px; font-weight: 600; border: none; cursor: pointer; padding: 6px 14px; }
        .btn-primary { background: #C94A1E; color: white; }
        .btn-primary:hover { background: #A83A14; }
        .btn-ghost { background: none; border: 1px solid #C8C3B4; color: #5C5A52; }
        .btn-ghost:hover { border-color: #C94A1E; color: #C94A1E; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #1A1A18; color: #F5F0E8; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 12px; text-align: left; border-right: 1px solid #2E2E2C; white-space: nowrap; }
        td { border: 1px solid #C8C3B4; padding: 8px 10px; vertical-align: top; background: white; min-width: 140px; }
        .act-label { background: #2A2A28 !important; color: #F5F0E8; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; min-width: 160px; max-width: 160px; letter-spacing: 0.04em; border-color: #3A3A38 !important; }
        .cell-task { display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; padding: 3px 0; border-bottom: 1px dotted #C8C3B4; }
        .cell-task:last-child { border-bottom: none; }
        .rm { background: none; border: none; cursor: pointer; color: #C8C3B4; font-size: 13px; padding: 0 2px; line-height: 1.2; flex-shrink: 0; }
        .rm:hover { color: #C94A1E; }
        .total-row td { background: #1A1A18 !important; color: #F5F0E8 !important; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; border-color: #3A3A38 !important; text-align: right; }
        .act-total { background: #EDEAE2 !important; font-family: 'IBM Plex Mono', monospace; font-size: 11px; text-align: right; color: #5C5A52; }
        .add-task-btn { display: block; width: 100%; margin-top: 5px; font-size: 10px; color: #C8C3B4; background: none; border: 1px dashed #C8C3B4; cursor: pointer; padding: 2px 4px; font-family: 'IBM Plex Mono', monospace; text-align: left; }
        .add-task-btn:hover { color: #C94A1E; border-color: #C94A1E; }
        .cell-active { outline: 2px solid #C94A1E; outline-offset: -1px; }
        .flag { padding: 14px 18px; margin-bottom: 10px; border-left: 4px solid; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#1A1A18', color: '#F5F0E8', padding: '24px 32px' }}>
        <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C94A1E', marginBottom: 8 }}>Work Simplification Program — Tool I</div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>Work Distribution Chart</h1>
        <div style={{ fontSize: 12, color: '#8A8880', marginTop: 6, fontFamily: 'IBM Plex Mono, monospace' }}>Who does what — and how many hours it takes</div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#EDE8E0', borderBottom: '1px solid #C8C3B4', padding: '0 32px', display: 'flex', alignItems: 'center' }}>
        <button className={`tab ${view === 'chart' ? 'active' : ''}`} onClick={() => setView('chart')}>Chart</button>
        <button className={`tab ${view === 'flags' ? 'active' : ''}`} onClick={() => setView('flags')}>
          Analysis Flags
          {flags.length > 0 && <span style={{ background: '#C94A1E', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10, marginLeft: 7 }}>{flags.length}</span>}
        </button>
        <button className={`tab ${view === 'legend' ? 'active' : ''}`} onClick={() => setView('legend')}>Six Questions</button>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* ── CHART VIEW ── */}
        {view === 'chart' && (
          <>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {addingEmployee ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'white', padding: '8px 12px', border: '1px solid #C8C3B4' }}>
                  <input placeholder="Name" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} style={{ width: 90 }} />
                  <input placeholder="Role" value={newEmployee.role} onChange={e => setNewEmployee(p => ({ ...p, role: e.target.value }))} style={{ width: 150 }} />
                  <button className="btn btn-primary" onClick={() => { if (newEmployee.name.trim()) { setEmployees(p => [...p, { id: `e${Date.now()}`, ...newEmployee }]); setNewEmployee({ name: '', role: '' }); setAddingEmployee(false); } }}>Add</button>
                  <button className="btn btn-ghost" onClick={() => setAddingEmployee(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={() => setAddingEmployee(true)}>+ Employee</button>
              )}
              {addingActivity ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'white', padding: '8px 12px', border: '1px solid #C8C3B4' }}>
                  <input placeholder="Activity name" value={newActivity} onChange={e => setNewActivity(e.target.value)} style={{ width: 200 }} />
                  <button className="btn btn-primary" onClick={() => { if (newActivity.trim()) { setActivities(p => [...p, { id: `a${Date.now()}`, name: newActivity.trim() }]); setNewActivity(''); setAddingActivity(false); } }}>Add</button>
                  <button className="btn btn-ghost" onClick={() => setAddingActivity(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={() => setAddingActivity(true)}>+ Activity</button>
              )}

              {activeCell && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'white', padding: '8px 14px', border: '2px solid #C94A1E', marginLeft: 'auto' }}>
                  <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#C94A1E', marginRight: 4, letterSpacing: '0.1em' }}>ADDING TO CELL ▸</span>
                  <input placeholder="Task description" value={newTask.task} onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))} style={{ width: 220 }} onKeyDown={e => e.key === 'Enter' && addTask()} />
                  <input placeholder="hrs/wk" value={newTask.hours} onChange={e => setNewTask(p => ({ ...p, hours: e.target.value }))} type="number" style={{ width: 72 }} onKeyDown={e => e.key === 'Enter' && addTask()} />
                  <button className="btn btn-primary" onClick={addTask}>Add</button>
                  <button className="btn btn-ghost" onClick={() => setActiveCell(null)}>Done</button>
                </div>
              )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', border: '2px solid #1A1A18' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 160 }}>Activity / Task</th>
                    {employees.map(e => (
                      <th key={e.id}>
                        <div style={{ fontSize: 12 }}>{e.name}</div>
                        <div style={{ fontWeight: 400, opacity: 0.6, fontSize: 10, marginTop: 2, textTransform: 'none', letterSpacing: 0 }}>{e.role}</div>
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', minWidth: 70 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(a => (
                    <tr key={a.id}>
                      <td className="act-label">{a.name}</td>
                      {employees.map(e => {
                        const tasks = getCellTasks(a.id, e.id);
                        const isActive = activeCell?.actId === a.id && activeCell?.empId === e.id;
                        const hrs = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
                        return (
                          <td key={e.id} className={isActive ? 'cell-active' : ''}>
                            {tasks.map((t, i) => (
                              <div key={i} className="cell-task">
                                <span style={{ fontSize: 12, flex: 1, lineHeight: 1.3 }}>{t.task}</span>
                                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#5C5A52', whiteSpace: 'nowrap', marginLeft: 4 }}>{t.hours}h</span>
                                <button className="rm" onClick={() => removeTask(a.id, e.id, i)}>×</button>
                              </div>
                            ))}
                            <button className="add-task-btn" onClick={() => setActiveCell({ actId: a.id, empId: e.id })}>
                              {tasks.length === 0 ? '+ add task' : `+ add  ·  ${hrs}h total`}
                            </button>
                          </td>
                        );
                      })}
                      <td className="act-total">{actTotals[a.id] || 0}h</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td style={{ background: '#1A1A18', color: '#F5F0E8', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: '0.08em', textAlign: 'left' }}>HRS / WEEK</td>
                    {employees.map(e => {
                      const over = empTotals[e.id] > 40;
                      return (
                        <td key={e.id} style={{ color: over ? '#F08060' : '#F5F0E8' }}>
                          {empTotals[e.id]}h {over ? ' ⚑' : ''}
                        </td>
                      );
                    })}
                    <td>{Object.values(empTotals).reduce((a, b) => a + b, 0)}h</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: '#8A8880' }}>
              Click any cell to select it, then add tasks in the toolbar above. ⚑ = over 40 hrs/wk.
            </div>
          </>
        )}

        {/* ── FLAGS VIEW ── */}
        {view === 'flags' && (
          <div style={{ maxWidth: 660 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>Analysis Flags</h2>
            <p style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: '#5C5A52', marginTop: 0, marginBottom: 28 }}>
              Automatically raised from chart data. Starting points for inquiry — not verdicts.
            </p>
            {flags.length === 0 && (
              <div style={{ padding: 28, background: 'white', border: '1px solid #C8C3B4', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: '#5C5A52' }}>
                No flags raised. Add data to the chart to enable analysis.
              </div>
            )}
            {flags.map((f, i) => (
              <div key={i} className="flag" style={{ background: sevBg[f.severity], borderLeftColor: sevBorder[f.severity] }}>
                <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: sevColor[f.severity], marginBottom: 5 }}>{f.type}</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>{f.message}</div>
                <div style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: '#5C5A52' }}>→ {f.guide}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── SIX QUESTIONS VIEW ── */}
        {view === 'legend' && (
          <div style={{ maxWidth: 580 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>The Six Questions</h2>
            <p style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: '#5C5A52', marginTop: 0, marginBottom: 28 }}>
              From the original Work Simplification program. Apply to every task and activity on your chart.
            </p>
            {[
              { q: 'What', prompt: 'What are the steps? Do I have them all? What does each task actually do?' },
              { q: 'Why', prompt: 'Is this task necessary? Can a good result be obtained without it? Don\'t be misled by an excuse when you\'re looking for a reason.' },
              { q: 'Where', prompt: 'Can this be done closer to where the output is needed? Can we reduce transportation by changing location of employees or equipment?' },
              { q: 'When', prompt: 'Is this done in the right sequence? Can steps be combined or simplified by moving them earlier or later?' },
              { q: 'Who', prompt: 'Is the right person doing this? Is there someone better placed — or should it be delegated?' },
              { q: 'How', prompt: 'Can it be done better with different equipment, a form, or a different layout? Can we make the job easier for everyone involved?' },
            ].map(({ q, prompt }, i) => (
              <div key={q} style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '1px solid #C8C3B4' }}>
                <div style={{ width: 100, padding: '18px 16px', background: '#1A1A18', color: '#C94A1E', fontWeight: 700, fontSize: 20, flexShrink: 0, fontFamily: 'Bitter, Georgia, serif' }}>{q}</div>
                <div style={{ padding: '18px 20px', background: 'white', flex: 1, fontSize: 14, lineHeight: 1.6 }}>{prompt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
