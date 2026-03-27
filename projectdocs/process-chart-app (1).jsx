import { useState, useMemo, useEffect, useRef } from "react";

/* ─── Mermaid loaded once from CDN ─── */
function useMermaid() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.mermaid) { setReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js';
    s.onload = () => {
      window.mermaid.initialize({ startOnLoad: false, theme: 'base',
        themeVariables: {
          primaryColor: '#1A1A18', primaryTextColor: '#F5F0E8', primaryBorderColor: '#444',
          lineColor: '#C8C3B4', secondaryColor: '#EDEAE2', tertiaryColor: '#F5F0E8',
          nodeBorder: '#C8C3B4', clusterBkg: '#EDEAE2', titleColor: '#1A1A18',
          edgeLabelBackground: '#F5F0E8', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px',
        }
      });
      setReady(true);
    };
    document.head.appendChild(s);
  }, []);
  return ready;
}

/* ─── Symbols ─── */
function Symbol({ type, size = 28 }) {
  const s = size, h = s / 2, strokeW = Math.max(2, s * 0.09);
  if (type === 'operation') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display:'block', flexShrink:0 }}>
      <circle cx={h} cy={h} r={h - strokeW} fill="#1A1A18" />
    </svg>
  );
  if (type === 'transportation') {
    const sm = s * 0.65;
    return (
      <svg width={sm} height={sm} viewBox={`0 0 ${s} ${s}`} style={{ display:'block', flexShrink:0 }}>
        <circle cx={h} cy={h} r={h - strokeW * 1.2} fill="none" stroke="#1A1A18" strokeWidth={strokeW * 1.4} />
      </svg>
    );
  }
  if (type === 'storage') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display:'block', flexShrink:0 }}>
      <polygon points={`${h},${strokeW} ${s-strokeW},${s-strokeW} ${strokeW},${s-strokeW}`}
        fill="none" stroke="#1A1A18" strokeWidth={strokeW} strokeLinejoin="round" />
    </svg>
  );
  if (type === 'inspection') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display:'block', flexShrink:0 }}>
      <rect x={strokeW} y={strokeW} width={s-strokeW*2} height={s-strokeW*2}
        fill="none" stroke="#1A1A18" strokeWidth={strokeW} />
    </svg>
  );
  return null;
}

const SYMBOL_META = {
  operation:      { label:'Operation',      hint:'Something is changed, created, or added to' },
  transportation: { label:'Transportation', hint:'Something moves from one place to another'  },
  storage:        { label:'Storage',        hint:'Something waits — no action taken'           },
  inspection:     { label:'Inspection',     hint:'Something is checked but not changed'        },
};
const SYMBOL_ACCENT = {
  operation:'#1A1A18', transportation:'#5C5A52', storage:'#D4A017', inspection:'#2B5EA7',
};

const DEFAULT_STEPS = [
  { id:'s1',  symbol:'operation',      description:'Application received at front desk',         who:'Front Desk Clerk', minutes:null, feet:null },
  { id:'s2',  symbol:'transportation', description:'Application carried to processing clerk',     who:'Front Desk Clerk', minutes:null, feet:45   },
  { id:'s3',  symbol:'storage',        description:'Application held in incoming basket',         who:'—',                minutes:180,  feet:null },
  { id:'s4',  symbol:'inspection',     description:'Application checked for completeness',        who:'Processing Clerk', minutes:null, feet:null },
  { id:'s5',  symbol:'operation',      description:'Application entered into tracking system',    who:'Processing Clerk', minutes:null, feet:null },
  { id:'s6',  symbol:'transportation', description:'Application routed to supervisor for review', who:'Processing Clerk', minutes:null, feet:120  },
  { id:'s7',  symbol:'storage',        description:"Application held in supervisor's inbox",      who:'—',                minutes:2880, feet:null },
  { id:'s8',  symbol:'inspection',     description:'Supervisor reviews application',              who:'Supervisor',       minutes:null, feet:null },
  { id:'s9',  symbol:'operation',      description:'Supervisor approves and signs',               who:'Supervisor',       minutes:null, feet:null },
  { id:'s10', symbol:'transportation', description:'Application returned to processing clerk',    who:'Supervisor',       minutes:null, feet:120  },
  { id:'s11', symbol:'operation',      description:'Approval notification sent to applicant',     who:'Processing Clerk', minutes:null, feet:null },
  { id:'s12', symbol:'storage',        description:'Application filed in archive',                who:'Processing Clerk', minutes:null, feet:null },
];

function fmtMinutes(m) {
  if (!m || m === 0) return null;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rem = m % 60;
  if (h >= 24) { const d = Math.floor(h/24), rh = h%24; return rh > 0 ? `${d}d ${rh}h` : `${d}d`; }
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

/* ══════════════════════════════════════════════
   FLOWCHART CANVAS EDITOR (Mermaid as output)
══════════════════════════════════════════════ */

const NODE_W = 192;
const NODE_H = 70;

const NODE_COLORS = {
  operation:      { bg:'#1A1A18', border:'#1A1A18', text:'#F5F0E8', badge:'#C94A1E',  badgeText:'#fff' },
  transportation: { bg:'#FFFFFF', border:'#888684', text:'#1A1A18', badge:'#888684',  badgeText:'#fff' },
  storage:        { bg:'#FFFDF0', border:'#D4A017', text:'#1A1A18', badge:'#D4A017',  badgeText:'#fff' },
  inspection:     { bg:'#F0F3FD', border:'#2B5EA7', text:'#1A1A18', badge:'#2B5EA7',  badgeText:'#fff' },
};

function initCanvas(steps) {
  const nodes = steps.map((s, i) => ({
    id: s.id, type: s.symbol, label: s.description,
    who: s.who, minutes: s.minutes, feet: s.feet,
    x: 80, y: 60 + i * (NODE_H + 44),
  }));
  const edges = steps.slice(0, -1).map((s, i) => ({
    id: `e${i}`, from: s.id, to: steps[i + 1].id,
  }));
  return { nodes, edges };
}

function toMermaidSrc(nodes, edges) {
  const safe = s => (s || '').replace(/["]/g, "'").replace(/[#{}|]/g, ' ').trim().slice(0, 50);
  const nid = id => `N${id.replace(/\W/g, '_')}`;
  const nodeFill  = { operation:'#1A1A18', transportation:'#EDEAE2', storage:'#FDFAED', inspection:'#EDF1FB' };
  const nodeStroke= { operation:'#1A1A18', transportation:'#888684', storage:'#D4A017',  inspection:'#2B5EA7' };
  const nodeText  = { operation:'#F5F0E8', transportation:'#1A1A18', storage:'#6A5000',  inspection:'#1A3A7A' };
  const lines = ['flowchart TD'];
  nodes.forEach(n => {
    const lbl  = safe(n.label);
    const meta = n.minutes ? `⏱ ${fmtMinutes(n.minutes)}` : n.feet ? `⟷ ${n.feet}ft` : '';
    const full = meta ? `${lbl}\\n${meta}` : lbl;
    const id   = nid(n.id);
    if (n.type === 'operation')           lines.push(`  ${id}["${full}"]`);
    else if (n.type === 'transportation') lines.push(`  ${id}(["${full}"])`);
    else if (n.type === 'storage')        lines.push(`  ${id}[/"${full}"/]`);
    else                                  lines.push(`  ${id}{"${full}"}`);
    lines.push(`  style ${id} fill:${nodeFill[n.type]},stroke:${nodeStroke[n.type]},color:${nodeText[n.type]}`);
  });
  edges.forEach(e => lines.push(`  ${nid(e.from)} --> ${nid(e.to)}`));
  return lines.join('\n');
}

function cubicPath(x1, y1, x2, y2) {
  const dy = Math.abs(y2 - y1);
  const ctrl = Math.max(50, dy * 0.45);
  return `M ${x1} ${y1} C ${x1} ${y1 + ctrl} ${x2} ${y2 - ctrl} ${x2} ${y2}`;
}

function MermaidView({ steps }) {
  const init = useMemo(() => initCanvas(steps), []); // eslint-disable-line
  const [nodes, setNodes]       = useState(init.nodes);
  const [edges, setEdges]       = useState(init.edges);
  const [selected, setSelected] = useState(null);   // { kind:'node'|'edge', id }
  const [dragging, setDragging] = useState(null);   // { nodeId, ox, oy }
  const [connecting, setConnect]= useState(null);   // { fromId, cx, cy }
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [showCode, setShowCode] = useState(true);
  const [copied, setCopied]     = useState(false);
  const canvasRef = useRef(null);

  const mermaidSrc = useMemo(() => toMermaidSrc(nodes, edges), [nodes, edges]);

  // canvas-relative position from mouse event
  const canvasXY = e => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left + canvasRef.current.scrollLeft,
             y: e.clientY - r.top  + canvasRef.current.scrollTop };
  };

  // Global mousemove / mouseup while dragging or connecting
  useEffect(() => {
    if (!dragging && !connecting) return;
    const onMove = e => {
      if (dragging) {
        const { x, y } = canvasXY(e);
        setNodes(p => p.map(n => n.id === dragging.nodeId
          ? { ...n, x: Math.max(0, x - dragging.ox), y: Math.max(0, y - dragging.oy) } : n));
      }
      if (connecting) {
        const { x, y } = canvasXY(e);
        setConnect(p => ({ ...p, cx: x, cy: y }));
      }
    };
    const onUp = e => {
      if (connecting) {
        const { x, y } = canvasXY(e);
        const target = nodes.find(n =>
          x >= n.x && x <= n.x + NODE_W && y >= n.y && y <= n.y + NODE_H && n.id !== connecting.fromId
        );
        if (target && !edges.some(ed => ed.from === connecting.fromId && ed.to === target.id)) {
          setEdges(p => [...p, { id: `e${Date.now()}`, from: connecting.fromId, to: target.id }]);
        }
        setConnect(null);
      }
      setDragging(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, connecting, nodes, edges]);

  // Keyboard delete
  useEffect(() => {
    const onKey = e => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected && document.activeElement.tagName !== 'INPUT') {
        if (selected.kind === 'node') {
          setNodes(p => p.filter(n => n.id !== selected.id));
          setEdges(p => p.filter(ed => ed.from !== selected.id && ed.to !== selected.id));
        } else {
          setEdges(p => p.filter(ed => ed.id !== selected.id));
        }
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const addNode = type => {
    const id = `n${Date.now()}`;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.scrollLeft + canvas.clientWidth / 2 - NODE_W / 2 : 120;
    const cy = canvas ? canvas.scrollTop  + 80 : 80;
    setNodes(p => [...p, { id, type, label: SYMBOL_META[type].label, who: '—', x: cx + Math.random()*60-30, y: cy + Math.random()*60-30 }]);
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (selected.kind === 'node') {
      setNodes(p => p.filter(n => n.id !== selected.id));
      setEdges(p => p.filter(ed => ed.from !== selected.id && ed.to !== selected.id));
    } else {
      setEdges(p => p.filter(ed => ed.id !== selected.id));
    }
    setSelected(null);
  };

  const startEdit = (e, node) => {
    e.stopPropagation();
    setEditingId(node.id);
    setEditLabel(node.label);
  };
  const commitEdit = () => {
    if (editLabel.trim()) setNodes(p => p.map(n => n.id === editingId ? { ...n, label: editLabel.trim() } : n));
    setEditingId(null);
  };

  const copyMermaid = () => {
    navigator.clipboard.writeText(mermaidSrc);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Canvas bounds
  const canvasW = Math.max(560, ...nodes.map(n => n.x + NODE_W + 80));
  const canvasH = Math.max(520, ...nodes.map(n => n.y + NODE_H + 80));

  const isNodeSel = selected?.kind === 'node';
  const isEdgeSel = selected?.kind === 'edge';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

      {/* ── Toolbar ── */}
      <div style={{ background:'#EDE8E0', borderBottom:'2px solid #1A1A18', padding:'8px 16px', display:'flex', gap:8, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
        <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#8A8880', letterSpacing:'0.14em', textTransform:'uppercase', marginRight:2 }}>Add node:</span>
        {Object.entries(SYMBOL_META).map(([type]) => {
          const tc = NODE_COLORS[type];
          return (
            <button key={type} onClick={() => addNode(type)}
              style={{ display:'flex', alignItems:'center', gap:5, background:tc.bg, border:`1.5px solid ${tc.border}`, cursor:'pointer', padding:'4px 10px', fontFamily:'Bitter, serif', fontSize:11, fontWeight:600, color:tc.text }}>
              <Symbol type={type} size={type==='transportation'?11:14} />
              {SYMBOL_META[type].label}
            </button>
          );
        })}

        <div style={{ width:1, height:20, background:'#C8C3B4', margin:'0 4px' }} />

        {selected && (
          <button onClick={deleteSelected}
            style={{ background:'#FDF0ED', color:'#C94A1E', border:'1.5px solid #C94A1E', cursor:'pointer', fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'4px 12px', letterSpacing:'0.06em' }}>
            ✕ {isEdgeSel ? 'DELETE CONNECTION' : 'DELETE NODE'}
          </button>
        )}

        <div style={{ flex:1 }} />

        <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#8A8880' }}>
          {nodes.length} nodes · {edges.length} edges
        </span>
        <div style={{ width:1, height:20, background:'#C8C3B4', margin:'0 4px' }} />
        <button onClick={() => setShowCode(p => !p)}
          style={{ background: showCode ? '#1A1A18' : 'none', color: showCode ? '#F5F0E8' : '#5C5A52', border:'1.5px solid #1A1A18', cursor:'pointer', fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'4px 12px', letterSpacing:'0.06em' }}>
          {showCode ? '‹ HIDE CODE' : '› SHOW CODE'}
        </button>
      </div>

      {/* ── Instruction bar ── */}
      <div style={{ background:'#F5F0E8', borderBottom:'1px solid #C8C3B4', padding:'4px 16px', fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#8A8880', display:'flex', gap:16, flexShrink:0 }}>
        <span>Drag nodes to arrange</span>
        <span>·</span>
        <span>Drag from ◉ port to connect</span>
        <span>·</span>
        <span>Double-click label to edit</span>
        <span>·</span>
        <span>Click edge or node + Delete to remove</span>
      </div>

      {/* ── Body: canvas + code ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── Canvas ── */}
        <div ref={canvasRef}
          style={{ flex:1, overflow:'auto', position:'relative', cursor: dragging ? 'grabbing' : 'default', background:'#F5F0E8' }}
          onClick={e => { if (e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') setSelected(null); }}
        >
          {/* Dot-grid + edges SVG (absolute, non-scrolling within inner div) */}
          <div style={{ position:'relative', width: canvasW, height: canvasH }}>
            <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              <defs>
                <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="14" cy="14" r="1.2" fill="#C8C3B4" opacity="0.6" />
                </pattern>
                <marker id="arr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                  <polygon points="0 0,9 3.5,0 7" fill="#888684" />
                </marker>
                <marker id="arr-sel" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                  <polygon points="0 0,9 3.5,0 7" fill="#C94A1E" />
                </marker>
                <marker id="arr-conn" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                  <polygon points="0 0,9 3.5,0 7" fill="#C94A1E" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>

            {/* Edges — separate SVG so pointer events work */}
            <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }} onClick={e => e.stopPropagation()}>
              {edges.map(ed => {
                const fn = nodes.find(n => n.id === ed.from);
                const tn = nodes.find(n => n.id === ed.to);
                if (!fn || !tn) return null;
                const x1 = fn.x + NODE_W/2, y1 = fn.y + NODE_H + 6;
                const x2 = tn.x + NODE_W/2, y2 = tn.y - 6;
                const isSel = selected?.kind === 'edge' && selected?.id === ed.id;
                return (
                  <g key={ed.id} style={{ cursor:'pointer' }} onClick={e => { e.stopPropagation(); setSelected({ kind:'edge', id:ed.id }); }}>
                    {/* Fat invisible hit target */}
                    <path d={cubicPath(x1,y1,x2,y2)} fill="none" stroke="transparent" strokeWidth={14} />
                    {/* Visible path */}
                    <path d={cubicPath(x1,y1,x2,y2)} fill="none"
                      stroke={isSel ? '#C94A1E' : '#888684'}
                      strokeWidth={isSel ? 2.5 : 2}
                      markerEnd={`url(#arr${isSel?'-sel':''})`}
                      strokeDasharray={isSel ? '6,3' : 'none'}
                    />
                  </g>
                );
              })}

              {/* In-progress connection line */}
              {connecting && (() => {
                const fn = nodes.find(n => n.id === connecting.fromId);
                if (!fn) return null;
                return <path d={cubicPath(fn.x+NODE_W/2, fn.y+NODE_H+6, connecting.cx, connecting.cy)}
                  fill="none" stroke="#C94A1E" strokeWidth={2} strokeDasharray="6,3" markerEnd="url(#arr-conn)" />;
              })()}
            </svg>

            {/* ── Nodes ── */}
            {nodes.map(n => {
              const tc = NODE_COLORS[n.type];
              const isSel = selected?.kind === 'node' && selected?.id === n.id;
              const isEditingThis = editingId === n.id;
              return (
                <div key={n.id}
                  style={{ position:'absolute', left: n.x, top: n.y, width: NODE_W, userSelect:'none', zIndex: isSel ? 10 : 1 }}
                  onMouseDown={e => {
                    if (e.button !== 0 || isEditingThis) return;
                    e.stopPropagation();
                    setSelected({ kind:'node', id:n.id });
                    const { x, y } = canvasXY(e);
                    setDragging({ nodeId:n.id, ox: x - n.x, oy: y - n.y });
                  }}
                >
                  {/* Card */}
                  <div style={{
                    background: tc.bg,
                    border: `2px solid ${isSel ? '#C94A1E' : tc.border}`,
                    padding:'10px 12px 10px 10px',
                    cursor: dragging?.nodeId === n.id ? 'grabbing' : 'grab',
                    boxShadow: isSel
                      ? '0 0 0 3px rgba(201,74,30,0.2), 0 4px 12px rgba(0,0,0,0.18)'
                      : '0 2px 6px rgba(0,0,0,0.1)',
                    position:'relative',
                    transition:'box-shadow 0.1s',
                  }}>
                    {/* Type badge */}
                    <div style={{ position:'absolute', top:0, right:0, background:tc.badge, color:tc.badgeText, fontSize:8, fontFamily:'IBM Plex Mono, monospace', letterSpacing:'0.06em', textTransform:'uppercase', padding:'2px 6px' }}>
                      {SYMBOL_META[n.type].label.slice(0,4)}
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:9, paddingRight:28 }}>
                      <div style={{ flexShrink:0 }}>
                        <Symbol type={n.type} size={n.type==='transportation'?16:22} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        {/* Editable label */}
                        {isEditingThis
                          ? <input autoFocus value={editLabel}
                              onChange={e => setEditLabel(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key==='Enter') commitEdit(); if (e.key==='Escape') setEditingId(null); }}
                              onClick={e => e.stopPropagation()}
                              style={{ width:'100%', fontSize:11, fontWeight:600, fontFamily:'Bitter,Georgia,serif', background:'transparent', border:'none', borderBottom:`1px solid ${tc.border}`, color:tc.text, outline:'none', padding:'1px 2px' }} />
                          : <div
                              onDoubleClick={e => startEdit(e, n)}
                              style={{ fontSize:11, fontWeight:600, color:tc.text, lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'text' }}
                              title="Double-click to edit">
                              {n.label}
                            </div>
                        }
                        {n.who && n.who !== '—' && (
                          <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:tc.text, opacity:0.55, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.who}</div>
                        )}
                        {(n.minutes || n.feet) && (
                          <div style={{ fontSize:9, fontFamily:'IBM Plex Mono, monospace', color:tc.badge, marginTop:3, fontWeight:600 }}>
                            {n.minutes ? `⏱ ${fmtMinutes(n.minutes)}` : `⟷ ${n.feet}ft`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom connection port */}
                  <div
                    onMouseDown={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      const { x, y } = canvasXY(e);
                      setConnect({ fromId: n.id, cx: x, cy: y });
                    }}
                    style={{
                      position:'absolute', bottom:-9, left:'50%', transform:'translateX(-50%)',
                      width:16, height:16, background:'white', border:`2px solid ${tc.border}`,
                      borderRadius:'50%', cursor:'crosshair', zIndex:20,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'border-color 0.1s, background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background=tc.badge; e.currentTarget.style.borderColor=tc.badge; }}
                    onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor=tc.border; }}
                    title="Drag to connect"
                  >
                    <div style={{ width:5, height:5, background:tc.border, borderRadius:'50%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mermaid code panel ── */}
        {showCode && (
          <div style={{ width:268, flexShrink:0, display:'flex', flexDirection:'column', background:'#1A1A18', borderLeft:'2px solid #2E2E2C', overflow:'hidden' }}>
            <div style={{ background:'#222220', borderBottom:'1px solid #2E2E2C', padding:'8px 14px', fontSize:9, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', letterSpacing:'0.14em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <span>Mermaid Output</span>
              <button onClick={copyMermaid} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:copied?'#86C78A':'#5C5A52', letterSpacing:'0.1em' }}>
                {copied ? '✓ COPIED' : 'COPY'}
              </button>
            </div>
            <pre style={{ flex:1, margin:0, padding:'14px 16px', fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#C8C3B4', lineHeight:1.75, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
              {mermaidSrc}
            </pre>
            <div style={{ borderTop:'1px solid #2E2E2C', padding:'10px 14px', background:'#141412', flexShrink:0 }}>
              <div style={{ fontSize:9, fontFamily:'IBM Plex Mono, monospace', color:'#444', lineHeight:1.7 }}>
                Paste into Notion, GitHub,<br/>Obsidian, or any Mermaid-compatible editor.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SPREADSHEET VIEW
══════════════════════════════════════════════ */
function SpreadsheetView({ steps, setSteps }) {
  const [editingId, setEditingId] = useState(null);
  const [editVals, setEditVals]   = useState({});
  const [copiedCsv, setCopiedCsv] = useState(false);

  const storageWarn = 480, distWarn = 200;

  const totals = useMemo(() => ({
    minutes: steps.reduce((s, r) => s + (Number(r.minutes) || 0), 0),
    feet:    steps.reduce((s, r) => s + (Number(r.feet)    || 0), 0),
  }), [steps]);

  const startEdit = step => {
    setEditingId(step.id);
    setEditVals({ description: step.description, who: step.who, minutes: step.minutes ?? '', feet: step.feet ?? '' });
  };

  const commitEdit = () => {
    if (!editingId) return;
    setSteps(prev => prev.map(s => s.id !== editingId ? s : {
      ...s,
      description: editVals.description.trim() || s.description,
      who:         editVals.who.trim() || '—',
      minutes:     s.symbol === 'storage'       && editVals.minutes !== '' ? Number(editVals.minutes) : s.minutes,
      feet:        s.symbol === 'transportation' && editVals.feet    !== '' ? Number(editVals.feet)    : s.feet,
    }));
    setEditingId(null);
  };

  const copyCSV = () => {
    const header = 'Step,Type,Description,Who,Wait (min),Distance (ft)';
    const rows   = steps.map((s,i) => `${i+1},${s.symbol},"${s.description}","${s.who}",${s.minutes??''},${s.feet??''}`);
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 1800);
  };

  const cols = [
    { key:'seq',         label:'#',          width:44  },
    { key:'symbol',      label:'Type',        width:120 },
    { key:'description', label:'Description', width:null },
    { key:'who',         label:'Who',         width:155 },
    { key:'minutes',     label:'Wait (min)',  width:95  },
    { key:'feet',        label:'Dist (ft)',   width:85  },
  ];

  return (
    <div style={{ flex:1, padding:'28px 32px', overflowY:'auto', minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#C94A1E', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Spreadsheet View</div>
          <div style={{ fontSize:12, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52' }}>{steps.length} steps · click a row to edit · changes sync to all views</div>
        </div>
        <button onClick={copyCSV} style={{ background:'#1A1A18', color:copiedCsv?'#C94A1E':'#F5F0E8', border:'none', cursor:'pointer', fontFamily:'IBM Plex Mono, monospace', fontSize:11, padding:'7px 14px', letterSpacing:'0.06em', transition:'color 0.2s' }}>
          {copiedCsv ? '✓ COPIED' : 'COPY CSV'}
        </button>
      </div>

      <div style={{ border:'2px solid #1A1A18', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <colgroup>
            {cols.map(c => <col key={c.key} style={{ width: c.width ? `${c.width}px` : undefined }} />)}
          </colgroup>
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={c.key} style={{
                  background:'#1A1A18', color:'#F5F0E8',
                  fontFamily:'IBM Plex Mono, monospace', fontSize:10,
                  fontWeight:500, textTransform:'uppercase', letterSpacing:'0.08em',
                  padding:'9px 12px', textAlign: c.key==='minutes'||c.key==='feet'||c.key==='seq' ? 'right' : 'left',
                  whiteSpace:'nowrap', borderRight: i < cols.length-1 ? '1px solid #2E2E2C' : 'none',
                }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => {
              const isEditing = editingId === step.id;
              const warnMin = (step.minutes ?? 0) > storageWarn;
              const warnFt  = (step.feet    ?? 0) > distWarn;
              const rowBg   = isEditing ? '#FFFBF0' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAF7';
              const cellStyle = (extra={}) => ({ padding: isEditing ? '5px 8px' : '9px 12px', borderRight:'1px solid #E8E4DC', borderBottom:'1px solid #E8E4DC', verticalAlign:'middle', ...extra });

              return (
                <tr key={step.id} onClick={() => !isEditing && startEdit(step)} style={{ cursor: isEditing ? 'default' : 'pointer', background: rowBg }}>
                  {/* # */}
                  <td style={cellStyle({ textAlign:'right' })}>
                    <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#8A8880' }}>{String(idx+1).padStart(2,'0')}</span>
                  </td>

                  {/* Type */}
                  <td style={cellStyle({ whiteSpace:'nowrap' })}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Symbol type={step.symbol} size={step.symbol==='transportation'?12:16} />
                      <span style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:SYMBOL_ACCENT[step.symbol], textTransform:'uppercase', letterSpacing:'0.06em' }}>
                        {SYMBOL_META[step.symbol].label}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td style={cellStyle()}>
                    {isEditing
                      ? <input value={editVals.description} autoFocus
                          onChange={e => setEditVals(p=>({...p, description:e.target.value}))}
                          onKeyDown={e => { if (e.key==='Enter') commitEdit(); if (e.key==='Escape') setEditingId(null); }}
                          style={{ width:'100%', fontSize:13 }} />
                      : <span style={{ fontSize:13 }}>{step.description}</span>
                    }
                  </td>

                  {/* Who */}
                  <td style={cellStyle()}>
                    {isEditing
                      ? <input value={editVals.who}
                          onChange={e => setEditVals(p=>({...p, who:e.target.value}))}
                          onKeyDown={e => { if (e.key==='Enter') commitEdit(); if (e.key==='Escape') setEditingId(null); }}
                          style={{ width:'100%', fontSize:12 }} />
                      : <span style={{ fontSize:12, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52' }}>{step.who}</span>
                    }
                  </td>

                  {/* Wait */}
                  <td style={cellStyle({ textAlign:'right', borderRight:'1px solid #E8E4DC' })}>
                    {isEditing && step.symbol === 'storage'
                      ? <input type="number" value={editVals.minutes}
                          onChange={e => setEditVals(p=>({...p, minutes:e.target.value}))}
                          onKeyDown={e => { if (e.key==='Enter') commitEdit(); if (e.key==='Escape') setEditingId(null); }}
                          style={{ width:70, textAlign:'right' }} />
                      : step.minutes
                        ? <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:warnMin?'#9A7000':'#1A1A18', background:warnMin?'#FDFAED':'transparent', padding:warnMin?'1px 5px':'0' }}>
                            {step.minutes}{warnMin&&' ⚑'}
                          </span>
                        : <span style={{ color:'#C8C3B4', fontFamily:'IBM Plex Mono, monospace', fontSize:11 }}>—</span>
                    }
                  </td>

                  {/* Distance */}
                  <td style={cellStyle({ textAlign:'right', borderRight:'none' })}>
                    {isEditing && step.symbol === 'transportation'
                      ? <input type="number" value={editVals.feet}
                          onChange={e => setEditVals(p=>({...p, feet:e.target.value}))}
                          onKeyDown={e => { if (e.key==='Enter') commitEdit(); if (e.key==='Escape') setEditingId(null); }}
                          style={{ width:60, textAlign:'right' }} />
                      : step.feet
                        ? <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:warnFt?'#2B5EA7':'#1A1A18', background:warnFt?'#EDF1FB':'transparent', padding:warnFt?'1px 5px':'0' }}>
                            {step.feet}{warnFt&&' ⚑'}
                          </span>
                        : <span style={{ color:'#C8C3B4', fontFamily:'IBM Plex Mono, monospace', fontSize:11 }}>—</span>
                    }
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ background:'#1A1A18' }}>
              <td colSpan={4} style={{ padding:'9px 12px', fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#8A8880', textTransform:'uppercase', letterSpacing:'0.1em', borderTop:'1px solid #333' }}>
                Totals — {steps.length} steps
              </td>
              <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'IBM Plex Mono, monospace', fontSize:13, fontWeight:700, color:totals.minutes>storageWarn?'#D4A017':'#F5F0E8', borderTop:'1px solid #333' }}>
                {totals.minutes || '—'}
              </td>
              <td style={{ padding:'9px 12px', textAlign:'right', fontFamily:'IBM Plex Mono, monospace', fontSize:13, fontWeight:700, color:totals.feet>distWarn?'#6A9AE0':'#F5F0E8', borderTop:'1px solid #333' }}>
                {totals.feet || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isEditing => false}
      <div style={{ marginTop:8, fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#8A8880' }}>
        Click a row to edit. Enter to commit, Esc to cancel. Edits sync back to Flow Chart and Mermaid views. ⚑ = exceeds threshold.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function ProcessChart() {
  const [processName, setProcessName] = useState('Rebate Application Processing');
  const [editingName, setEditingName] = useState(false);
  const [startPoint]  = useState('Application received at front desk');
  const [endPoint]    = useState('Application filed; applicant notified');
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [newStep, setNewStep] = useState({ symbol:'operation', description:'', who:'', minutes:'', feet:'' });
  const [view, setView] = useState('flow');

  const counts = useMemo(() => ({
    operation:      steps.filter(s => s.symbol === 'operation').length,
    transportation: steps.filter(s => s.symbol === 'transportation').length,
    storage:        steps.filter(s => s.symbol === 'storage').length,
    inspection:     steps.filter(s => s.symbol === 'inspection').length,
    totalMinutes:   steps.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
    totalFeet:      steps.reduce((sum, s) => sum + (Number(s.feet)    || 0), 0),
  }), [steps]);

  const addStep = () => {
    if (!newStep.description.trim()) return;
    setSteps(prev => [...prev, {
      id: `s${Date.now()}`,
      symbol:  newStep.symbol,
      description: newStep.description.trim(),
      who:     newStep.who.trim() || '—',
      minutes: newStep.symbol === 'storage'       && newStep.minutes ? Number(newStep.minutes) : null,
      feet:    newStep.symbol === 'transportation' && newStep.feet    ? Number(newStep.feet)    : null,
    }]);
    setNewStep(p => ({ ...p, description:'', who:'', minutes:'', feet:'' }));
  };

  const removeStep = id => setSteps(prev => prev.filter(s => s.id !== id));
  const moveStep = (id, dir) => {
    const idx = steps.findIndex(s => s.id === id);
    if (dir === -1 && idx === 0) return;
    if (dir === 1 && idx === steps.length-1) return;
    const next = [...steps];
    [next[idx], next[idx+dir]] = [next[idx+dir], next[idx]];
    setSteps(next);
  };

  // ── Drag state ──
  const [dragId,  setDragId]  = useState(null);
  const [dropIdx, setDropIdx] = useState(null); // insert-before index

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag ghost — we draw our own highlight
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:absolute;top:-9999px;opacity:0;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const onDragEnd = () => { setDragId(null); setDropIdx(null); };

  const onDropZone = (e, idx) => {
    e.preventDefault();
    if (dragId === null) return;
    const fromIdx = steps.findIndex(s => s.id === dragId);
    if (fromIdx === -1) return;
    // Adjust target index if dragging downward
    let toIdx = idx > fromIdx ? idx - 1 : idx;
    if (toIdx === fromIdx) { setDragId(null); setDropIdx(null); return; }
    const next = [...steps];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    setSteps(next);
    setDragId(null);
    setDropIdx(null);
  };

  const storageWarnThreshold = 480, distWarnThreshold = 200;

  return (
    <div style={{ fontFamily:"'Bitter', Georgia, serif", background:'#F5F0E8', minHeight:'100vh', color:'#1A1A18', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family:'IBM Plex Mono','Courier New',monospace; font-size:12px; border:1px solid #C8C3B4; background:white; padding:5px 8px; color:#1A1A18; outline:none; }
        input:focus, select:focus, textarea:focus { border-color:#C94A1E; }
        .btn { font-family:'Bitter',Georgia,serif; font-size:13px; font-weight:600; border:none; cursor:pointer; padding:6px 14px; }
        .btn-primary { background:#C94A1E; color:white; }
        .btn-primary:hover { background:#A83A14; }
        .sym-opt { border:2px solid #C8C3B4; background:white; padding:10px 8px 8px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:5px; flex:1; transition:all 0.1s; }
        .sym-opt:hover { border-color:#5C5A52; }
        .sym-opt.active { border-color:#C94A1E; background:#FDF0ED; }
        .sym-label { font-family:'IBM Plex Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.06em; color:#5C5A52; text-align:center; line-height:1.3; }
        .step-card { border:1px solid #C8C3B4; border-left:none; padding:12px 14px; background:white; flex:1; transition: opacity 0.15s; }
        .step-card.dragging { opacity:0.35; }
        .rm-btn { background:none; border:none; cursor:pointer; color:#C8C3B4; font-size:16px; padding:0 4px; line-height:1; }
        .rm-btn:hover { color:#C94A1E; }
        .drag-handle { cursor:grab; color:#C8C3B4; font-size:14px; padding:2px 4px; line-height:1; user-select:none; letter-spacing:-1px; }
        .drag-handle:hover { color:#5C5A52; }
        .drag-handle:active { cursor:grabbing; }
        .drop-zone { height:6px; margin: 0 0 0 52px; transition: height 0.1s, background 0.1s; }
        .drop-zone.active { height:24px; background: linear-gradient(to right, #C94A1E 3px, #FDF0ED 3px); border:1px dashed #C94A1E; display:flex; align-items:center; padding-left:12px; font-family:'IBM Plex Mono',monospace; font-size:10px; color:#C94A1E; letter-spacing:0.08em; }
        .step-row { display:flex; align-items:stretch; position:relative; }
        .badge { font-family:'IBM Plex Mono',monospace; font-size:10px; padding:2px 7px; display:inline-flex; align-items:center; gap:3px; }
        .vtab { background:none; border:none; cursor:pointer; padding:10px 22px; font-family:'Bitter',Georgia,serif; font-size:13px; font-weight:600; border-bottom:3px solid transparent; color:#5C5A52; letter-spacing:0.01em; }
        .vtab.active { border-bottom-color:#C94A1E; color:#1A1A18; }
        .vtab:hover { color:#1A1A18; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:'#1A1A18', color:'#F5F0E8', padding:'24px 32px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', letterSpacing:'0.2em', textTransform:'uppercase', color:'#C94A1E', marginBottom:8 }}>
          Work Simplification Program — Tool II
        </div>
        {editingName
          ? <input value={processName} onChange={e => setProcessName(e.target.value)}
              onBlur={() => setEditingName(false)} autoFocus
              style={{ fontSize:22, fontFamily:'Bitter,Georgia,serif', fontWeight:700, background:'#2A2A28', border:'1px solid #555', color:'#F5F0E8', padding:'4px 10px', width:380 }} />
          : <h1 style={{ margin:0, fontSize:30, fontWeight:700, letterSpacing:'-0.02em', cursor:'text' }} onClick={() => setEditingName(true)}>
              {processName} <span style={{ fontSize:14, color:'#555', fontWeight:400 }}>✏</span>
            </h1>
        }
        <div style={{ display:'flex', gap:0, marginTop:12, fontSize:12, fontFamily:'IBM Plex Mono, monospace' }}>
          <div style={{ background:'#C94A1E', padding:'4px 10px', color:'white', letterSpacing:'0.06em' }}>START</div>
          <div style={{ background:'#2A2A28', padding:'4px 12px', color:'#C8C3B4', marginRight:16 }}>{startPoint}</div>
          <div style={{ background:'#444', padding:'4px 10px', color:'white', letterSpacing:'0.06em' }}>END</div>
          <div style={{ background:'#2A2A28', padding:'4px 12px', color:'#C8C3B4' }}>{endPoint}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background:'#EDE8E0', borderBottom:'1px solid #C8C3B4', padding:'0 32px', display:'flex', alignItems:'center', flexShrink:0 }}>
        <button className={`vtab ${view==='flow'?'active':''}`}    onClick={() => setView('flow')}>Flow Chart</button>
        <button className={`vtab ${view==='mermaid'?'active':''}`} onClick={() => setView('mermaid')}>Mermaid</button>
        <button className={`vtab ${view==='sheet'?'active':''}`}   onClick={() => setView('sheet')}>Spreadsheet</button>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Flow view */}
        {view === 'flow' && (
          <div style={{ flex:1, padding:'28px 32px', overflowY:'auto', minWidth:0 }}>
            {steps.length === 0 && (
              <div style={{ padding:32, border:'1px dashed #C8C3B4', textAlign:'center', fontFamily:'IBM Plex Mono, monospace', fontSize:13, color:'#8A8880' }}>
                No steps yet. Use the form below.
              </div>
            )}
            {steps.map((step, idx) => {
              const isDragging = dragId === step.id;
              return (
                <div key={step.id}>
                  {/* ── Drop zone ABOVE this step ── */}
                  <div
                    className={`drop-zone ${dropIdx === idx && dragId && dragId !== step.id ? 'active' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDropIdx(idx); }}
                    onDragLeave={() => setDropIdx(null)}
                    onDrop={e => onDropZone(e, idx)}
                  >
                    {dropIdx === idx && dragId && dragId !== step.id ? 'DROP HERE' : null}
                  </div>

                  {/* ── Step row ── */}
                  <div
                    className="step-row"
                    draggable
                    onDragStart={e => onDragStart(e, step.id)}
                    onDragEnd={onDragEnd}
                    style={{ opacity: isDragging ? 0.3 : 1, transition:'opacity 0.15s' }}
                  >
                    {/* Connector + symbol column — also the drag handle */}
                    <div
                      style={{ width:52, display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, cursor:'grab' }}
                      title="Drag to reorder"
                    >
                      {idx > 0 && <div style={{ width:2, flex:'0 0 14px', background: isDragging ? '#C94A1E' : '#C8C3B4', transition:'background 0.15s' }} />}
                      <div style={{ width:52, height:52, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                        <Symbol type={step.symbol} size={step.symbol==='transportation'?24:32} />
                      </div>
                      {idx < steps.length-1 && <div style={{ width:2, flex:'0 0 14px', background: isDragging ? '#C94A1E' : '#C8C3B4', transition:'background 0.15s' }} />}
                    </div>

                    {/* Card */}
                    <div className={`step-card ${isDragging ? 'dragging' : ''}`} style={{ borderTop:idx===0?'1px solid #C8C3B4':'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5 }}>
                            <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#C8C3B4' }}>{String(idx+1).padStart(2,'0')}</span>
                            <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:SYMBOL_ACCENT[step.symbol],
                              background:step.symbol==='storage'?'#FDFAED':step.symbol==='inspection'?'#EDF1FB':'transparent',
                              padding:(step.symbol==='storage'||step.symbol==='inspection')?'1px 5px':'0' }}>
                              {SYMBOL_META[step.symbol].label}
                            </span>
                          </div>
                          <div style={{ fontSize:14, fontWeight:step.symbol==='operation'?600:400, lineHeight:1.4, marginBottom:4 }}>{step.description}</div>
                          {step.who && step.who !== '—' && <div style={{ fontSize:11, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:4 }}>{step.who}</div>}
                          <div style={{ display:'flex', gap:6, marginTop:2 }}>
                            {step.minutes && (
                              <span className="badge" style={{ background:'#FDFAED', border:`1px solid ${step.minutes>storageWarnThreshold?'#D4A017':'#E8E3D4'}`, color:step.minutes>storageWarnThreshold?'#9A7000':'#5C5A52' }}>
                                ⏱ {fmtMinutes(step.minutes)}{step.minutes>storageWarnThreshold&&<span style={{color:'#D4A017'}}> ⚑</span>}
                              </span>
                            )}
                            {step.feet && (
                              <span className="badge" style={{ background:'#EDF1FB', border:`1px solid ${step.feet>distWarnThreshold?'#2B5EA7':'#D0D8EF'}`, color:step.feet>distWarnThreshold?'#2B5EA7':'#5C5A52' }}>
                                ⟷ {step.feet} ft{step.feet>distWarnThreshold&&<span style={{color:'#2B5EA7'}}> ⚑</span>}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Controls */}
                        <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                          <button className="rm-btn" onMouseDown={e => e.stopPropagation()} onClick={() => removeStep(step.id)} title="Remove step">×</button>
                          <span className="drag-handle" title="Drag to reorder">⠿</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Final drop zone (after last step) ── */}
            {steps.length > 0 && (
              <div
                className={`drop-zone ${dropIdx === steps.length && dragId ? 'active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDropIdx(steps.length); }}
                onDragLeave={() => setDropIdx(null)}
                onDrop={e => onDropZone(e, steps.length)}
              >
                {dropIdx === steps.length && dragId ? 'DROP HERE' : null}
              </div>
            )}
            {steps.length > 0 && (
              <div style={{ display:'flex', alignItems:'center' }}>
                <div style={{ width:52, display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ width:2, height:20, background:'#C8C3B4' }} />
                  <div style={{ width:14, height:14, background:'#C94A1E', borderRadius:'50%' }} />
                </div>
                <div style={{ paddingLeft:12, fontSize:12, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', fontStyle:'italic' }}>{endPoint}</div>
              </div>
            )}

            {/* Add step form */}
            <div style={{ marginTop:36, border:'2px solid #1A1A18', background:'white', padding:'22px 22px 20px' }}>
              <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#C94A1E', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:16 }}>Add Next Step</div>
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {Object.entries(SYMBOL_META).map(([key, meta]) => (
                  <button key={key} className={`sym-opt ${newStep.symbol===key?'active':''}`} onClick={() => setNewStep(p=>({...p, symbol:key}))}>
                    <Symbol type={key} size={key==='transportation'?16:22} />
                    <span className="sym-label">{meta.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, fontFamily:'IBM Plex Mono, monospace', color:'#8A8880', marginBottom:14 }}>{SYMBOL_META[newStep.symbol].hint}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={{ flex:'2 1 260px' }}>
                  <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Description</div>
                  <input style={{ width:'100%' }} placeholder="What happens at this step?" value={newStep.description}
                    onChange={e => setNewStep(p=>({...p,description:e.target.value}))}
                    onKeyDown={e => e.key==='Enter' && addStep()} />
                </div>
                <div style={{ flex:'1 1 130px' }}>
                  <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Who</div>
                  <input style={{ width:'100%' }} placeholder="Role or name" value={newStep.who}
                    onChange={e => setNewStep(p=>({...p,who:e.target.value}))} />
                </div>
                {newStep.symbol==='storage' && (
                  <div style={{ flex:'0 1 110px' }}>
                    <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Wait (min)</div>
                    <input type="number" style={{ width:'100%' }} placeholder="0" value={newStep.minutes}
                      onChange={e => setNewStep(p=>({...p,minutes:e.target.value}))} />
                  </div>
                )}
                {newStep.symbol==='transportation' && (
                  <div style={{ flex:'0 1 110px' }}>
                    <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Distance (ft)</div>
                    <input type="number" style={{ width:'100%' }} placeholder="0" value={newStep.feet}
                      onChange={e => setNewStep(p=>({...p,feet:e.target.value}))} />
                  </div>
                )}
                <button className="btn btn-primary" onClick={addStep} style={{ height:32, alignSelf:'flex-end' }}>+ Add Step</button>
              </div>
            </div>
          </div>
        )}

        {view === 'mermaid' && <MermaidView steps={steps} />}
        {view === 'sheet'   && <SpreadsheetView steps={steps} setSteps={setSteps} />}

        {/* ── Sidebar (always visible) ── */}
        <div style={{ width:210, flexShrink:0, borderLeft:'1px solid #C8C3B4', padding:'28px 20px', background:'#EDEAE2', overflowY:'auto' }}>
          <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#C94A1E', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:18 }}>Summary</div>
          {(['operation','transportation','storage','inspection']).map(type => (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #C8C3B4' }}>
              <Symbol type={type} size={type==='transportation'?14:20} />
              <span style={{ flex:1, fontSize:12 }}>{SYMBOL_META[type].label}</span>
              <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:18, fontWeight:700 }}>{counts[type]}</span>
            </div>
          ))}
          <div style={{ marginTop:18, padding:'12px 0', borderBottom:'1px solid #C8C3B4' }}>
            <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:4, letterSpacing:'0.08em', textTransform:'uppercase' }}>Total Wait</div>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:22, fontWeight:700, color:counts.totalMinutes>storageWarnThreshold?'#D4A017':'#1A1A18' }}>
              {fmtMinutes(counts.totalMinutes)||'—'}
            </div>
            {counts.totalMinutes>storageWarnThreshold && <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#9A7000', marginTop:3 }}>⚑ Look for bottlenecks</div>}
          </div>
          <div style={{ padding:'12px 0', borderBottom:'1px solid #C8C3B4', marginBottom:18 }}>
            <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:4, letterSpacing:'0.08em', textTransform:'uppercase' }}>Total Distance</div>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:22, fontWeight:700, color:counts.totalFeet>distWarnThreshold?'#2B5EA7':'#1A1A18' }}>
              {counts.totalFeet>0?`${counts.totalFeet} ft`:'—'}
            </div>
            {counts.totalFeet>distWarnThreshold && <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#2B5EA7', marginTop:3 }}>⚑ Consider reorganizing</div>}
          </div>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:4, letterSpacing:'0.08em', textTransform:'uppercase' }}>Total Steps</div>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:32, fontWeight:700 }}>{steps.length}</div>
          </div>
          {steps.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52', marginBottom:6, letterSpacing:'0.08em', textTransform:'uppercase' }}>Composition</div>
              <div style={{ display:'flex', height:14, overflow:'hidden', border:'1px solid #C8C3B4' }}>
                {[['operation','#1A1A18'],['transportation','#888684'],['storage','#D4A017'],['inspection','#2B5EA7']].map(([type,color]) =>
                  counts[type]>0 ? <div key={type} style={{ width:`${(counts[type]/steps.length)*100}%`, background:color }} title={type} /> : null
                )}
              </div>
              <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                {[['#1A1A18','Op'],['#888684','Trans'],['#D4A017','Store'],['#2B5EA7','Insp']].map(([color,label]) => (
                  <span key={label} style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, fontFamily:'IBM Plex Mono, monospace', color:'#5C5A52' }}>
                    <span style={{ width:8, height:8, background:color, display:'inline-block', flexShrink:0 }} />{label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding:'14px 12px', background:'#1A1A18', color:'#F5F0E8' }}>
            <div style={{ fontSize:9, fontFamily:'IBM Plex Mono, monospace', color:'#C94A1E', letterSpacing:'0.12em', marginBottom:8 }}>ELIMINATE · COMBINE · REARRANGE · SIMPLIFY</div>
            <div style={{ fontSize:10, fontFamily:'IBM Plex Mono, monospace', color:'#C8C3B4', lineHeight:1.6 }}>
              Non-operation steps are elimination candidates. Long storage = bottleneck. Long distances = rearrange the room.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
