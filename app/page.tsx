'use client';
import {
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import {useEffect,useMemo,useState} from 'react';
import {ShieldCheck,Activity,Network,FileSearch,ChartNoAxesCombined,LockKeyhole,ArrowUpRight,Search, Bell, CircleHelp, ChevronRight, Check, X, AlertTriangle, Upload, Sparkles, Wallet, ShieldAlert, Clock3, SlidersHorizontal, Plus, RefreshCw, ExternalLink, Sun, Moon} from 'lucide-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {AgGridReact} from 'ag-grid-react';
import type {ColDef} from 'ag-grid-community';
import AnalyticsStudio from '@/components/analytics-studio';

import FraudGraph from '@/components/fraud-graph';
import EvidenceReview from '@/components/evidence-review';
import ReportingGuide from '@/components/reporting-guide';
import OnboardingTour, { TOUR_STEPS } from '@/components/onboarding-tour';

ModuleRegistry.registerModules([AllCommunityModule]);

type Tx={id:string;time:string;agent:string;recipient:string;amount:number;status:string;risk:number;source:string};
type InvestigationCase = {
  id: string;
  title: string;
  transactionIds: string[];
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string[];
  createdAt: string;
};
const seed:Tx[]=[
{id:'PS-80421',time:'10:42:18',agent:'procurement-agent',recipient:'studio@northstar.test · merchant@demo.test',amount:349.00,status:'REVIEW',risk:64,source:'Human approval'},
{id:'PS-80418',time:'10:28:11',agent:'procurement-agent',recipient:'vendor@unknown.test',amount:76.50,status:'REVIEW',risk:58,source:'Recipient policy'},
{id:'PS-80417',time:'10:21:45',agent:'finance-agent',recipient:'studio@northstar.test',amount:212.00,status:'ALLOWED',risk:8,source:'PayPal Sandbox'},
];
const nav=[['Overview',Activity],['Agent Firewall',ShieldCheck],['Live Transactions',Wallet],['Fraud Intelligence',Network],['Investigation Cases',FileSearch],['Recovery Workspace',Upload],['Analytics Studio',ChartNoAxesCombined],['Security Policies',LockKeyhole]] as const;
export default function Home(){
 const [theme, setTheme] = useState<'dark' | 'light'>('dark');
 const [themeReady, setThemeReady] = useState(false);
 const [tourOpen, setTourOpen] = useState(false);
 const [tourPhase, setTourPhase] = useState<'intro' | 'component' | 'complete'>('intro');
 const [tourStep, setTourStep] = useState(0);

 useEffect(() => {
   const completed = window.localStorage.getItem('payshield-tour-completed');
   if (completed !== 'true') {
     setTourOpen(true);
     setTourPhase('intro');
     setTourStep(0);
   }
 }, []);

 useEffect(() => {
   const savedTheme = window.localStorage.getItem('payshield-theme');
   if (savedTheme === 'light' || savedTheme === 'dark') {
     setTheme(savedTheme);
   }
   setThemeReady(true);
 }, []);

 useEffect(() => {
   if (!themeReady) return;
   document.documentElement.dataset.theme = theme;
   window.localStorage.setItem('payshield-theme', theme);
 }, [theme, themeReady]);
 const [active,setActive]=useState('Overview'); const [cases, setCases] = useState<InvestigationCase[]>([]); const [rows,setRows]=useState(seed); const [recipient,setRecipient]=useState('studio@northstar.test'); const [amount,setAmount]=useState('129'); const [agent,setAgent]=useState('procurement-agent'); const [decision,setDecision]=useState<any>(null); const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(''); const [evidence,setEvidence]=useState<any>(null); const [caseOpen,setCaseOpen]=useState(false); const [approvalUrl,setApprovalUrl]=useState('');
 const [approvalRequestId, setApprovalRequestId] = useState('');
const [approvalPin, setApprovalPin] = useState('');
const [approvalStatus, setApprovalStatus] = useState('');
  const finishTour = () => {
   window.localStorage.setItem('payshield-tour-completed', 'true');
   setTourOpen(false);
   setTourPhase('intro');
   setTourStep(0);
 };

 const advanceTour = () => {
   if (tourPhase === 'intro') {
     setTourPhase('component');
     setTourStep(0);
     setActive(TOUR_STEPS[0].module);
     return;
   }
   if (tourPhase === 'complete') { finishTour(); return; }
   if (tourStep >= TOUR_STEPS.length - 1) { setTourPhase('complete'); return; }
   const nextStep = tourStep + 1;
   setTourStep(nextStep);
   setActive(TOUR_STEPS[nextStep].module);
 };

 const goBackTour = () => {
   if (tourPhase === 'complete') {
     const lastStep = TOUR_STEPS.length - 1;
     setTourPhase('component');
     setTourStep(lastStep);
     setActive(TOUR_STEPS[lastStep].module);
     return;
   }
   if (tourPhase !== 'component') return;
   if (tourStep <= 0) { setTourPhase('intro'); setTourStep(0); setActive('Overview'); return; }
   const previousStep = tourStep - 1;
   setTourStep(previousStep);
   setActive(TOUR_STEPS[previousStep].module);
 };
const columns=useMemo<ColDef<Tx>[]>(()=>[{field:'id',headerName:'TRANSACTION',flex:1.1},{field:'time',headerName:'TIME',width:110},{field:'agent',headerName:'AGENT',flex:1.2},{field:'recipient',headerName:'RECIPIENT',flex:1.4},{field:'amount',headerName:'AMOUNT',width:115,valueFormatter:p=>`$${Number(p.value).toFixed(2)}`},{field:'risk',headerName:'RISK',width:90,cellRenderer:(p:any)=><span className={`risk ${p.value>70?'danger':p.value>35?'warn':'safe'}`}>{p.value}/100</span>},{field:'status',headerName:'DECISION',width:120,cellRenderer:(p:any)=><span className={`pill ${String(p.value).toLowerCase()}`}>{p.value}</span>}],[]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('token');
  const paypal = params.get('paypal');

  if (paypal === 'cancel') {
    setNotice('PayPal checkout was cancelled. No payment was captured.');
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  if (paypal === 'success' && orderId) {
    setBusy(true);

    fetch('/api/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then(async (r) => {
        const d = await r.json();

        if (!r.ok) {
          throw new Error(d.error || 'Capture failed');
        }

        const tx = d.transaction;

        setNotice(
          `PayPal capture status: ${tx.status} · Order ${tx.orderId}`
        );

        setRows((prev) => [
          {
            id: tx.orderId,
            time: new Date().toLocaleTimeString(),
            agent: tx.agentId,
            recipient: tx.recipient,
            amount: tx.amount,
            status: 'CAPTURED',
            risk: 8,
            source: 'PayPal Sandbox',
          },
          ...prev,
        ]);
      })
      .catch((e) => setNotice(e.message))
      .finally(() => {
        setBusy(false);
        window.history.replaceState({}, '', window.location.pathname);
      });
  }
}, []);

async function evaluate() {
  setBusy(true);
  setNotice('');
  setApprovalRequestId('');
  setApprovalPin('');
  setApprovalStatus('');

  try {
    const r = await fetch('/api/firewall/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agent,
        recipient,
        amount: Number(amount),
        currency: 'USD',
      }),
    });

    const d = await r.json();

    if (!r.ok) throw new Error(d.error || 'Evaluation failed');

    setDecision(d);

    if (d.approvalRequired && d.approvalRequestId) {
      setApprovalRequestId(d.approvalRequestId);
      setApprovalStatus('Pending human approval. Enter your approval PIN.');
      setNotice('Policy review: human approval is required.');
    } else if (d.decision === 'ALLOW') {
      setNotice('Policy check passed. You can now create a PayPal Sandbox order.');
    } else {
      setNotice(d.reasons?.join('. ') || 'Payment requires further review.');
    }
  } catch (e: any) {
    setNotice(e.message);
  } finally {
    setBusy(false);
  }
}

async function approvePayment() {
  if (!approvalRequestId || !approvalPin.trim()) {
    setNotice('Enter your approval PIN first.');
    return;
  }

  setBusy(true);
  setNotice('');

  try {
    const r = await fetch('/api/firewall/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: approvalRequestId,
        pin: approvalPin,
      }),
    });

    const d = await r.json();

    if (!r.ok) {
      throw new Error(d.error || 'Approval failed');
    }

    setApprovalStatus('APPROVED');
    setApprovalPin('');
    setNotice('Human approval verified. You can now create the PayPal order.');
  } catch (e: any) {
    setNotice(e.message);
  } finally {
    setBusy(false);
  }
}

 
async function createOrder() {
  setBusy(true);
  setNotice('');

  try {
    const isHighValue = Number(amount) > 250;

    if (isHighValue && approvalStatus !== 'APPROVED') {
      throw new Error('Human approval is required before creating this order.');
    }

    const r = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agent,
        recipient,
        amount: Number(amount),
        ...(isHighValue ? { approvalRequestId } : {}),
      }),
    });

    const d = await r.json();

    if (!r.ok) throw new Error(d.error || 'Order creation failed');

    setApprovalUrl(d.approvalUrl || '');

    setNotice(
      d.demo
        ? 'Demo order created. No real PayPal payment was made.'
        : `PayPal order ${d.id} created. Continue to PayPal to approve it.`
    );

    setDecision(d.firewall);

    setRows(prev => [
      {
        id: d.id || `PS-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        agent,
        recipient,
        amount: Number(amount),
        status: d.demo ? 'DEMO' : 'ALLOWED',
        risk: 8,
        source: d.demo ? 'Local demo' : 'PayPal Sandbox',
      },
      ...prev,
    ]);
  } catch (e: any) {
    setNotice(e.message);
  } finally {
    setBusy(false);
  }
}

 async function uploadFile(file?: File) {
  if (!file) return;

  setBusy(true);
  setEvidence(null);
  setNotice('Processing uploaded evidence...');

  try {
    const fd = new FormData();
    fd.append('file', file);

    const response = await fetch('/api/evidence/extract', {
      method: 'POST',
      body: fd,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || data.message ||
        `Evidence extraction failed (${response.status}).`
      );
    }

    const saveResponse = await fetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceFile: data.fields?.sourceFile || file.name,
        mode: data.mode || 'UNKNOWN',
        extractedText: data.text || '',
        extractedFields: data.fields || {},
      }),
    });

    const savedData = await saveResponse.json();

    if (!saveResponse.ok) {
      throw new Error(
        savedData.error || 'Evidence extracted but could not be saved.'
      );
    }

    setEvidence({
      ...data,
      evidenceId: savedData.evidence.id,
    });

    setNotice(
      'Evidence extracted and saved. Verify all candidate fields before using them.'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Evidence extraction failed.';

    setNotice(message);
  } finally {
    setBusy(false);
  }
}

async function verifyEvidenceRecord(reviewedFields: {
  amount: string;
  transactionId: string;
  date: string;
  recipient: string;
}) {
  if (!evidence?.evidenceId) {
    setNotice('Evidence record ID is missing. Upload the evidence again.');
    return false;
  }

  try {
    const response = await fetch('/api/evidence', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: evidence.evidenceId,
        acknowledged: true,
        reviewedFields,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to save evidence verification.');
    }

    setNotice('Evidence verification saved successfully.');
    return true;
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : 'Unable to save evidence verification.'
    );
    return false;
  }
}

async function invalidateEvidenceVerification() {
  if (!evidence?.evidenceId) return;

  try {
    const response = await fetch('/api/evidence', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: evidence.evidenceId,
        acknowledged: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to invalidate verification.');
    }

    setNotice('Evidence edited. Previous verification has been cleared.');
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : 'Unable to invalidate verification.'
    );
  }
}
async function createCase(transactionId: string, title: string) {
  const transaction = rows.find(row => row.id === transactionId);

  if (!transaction) {
    setNotice('Select a valid transaction before creating a case.');
    return;
  }

  try {
    setBusy(true);

    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim() || `Investigation for ${transaction.id}`,
        transactionIds: [transaction.id],
        status: 'OPEN',
        priority:
          transaction.risk >= 70
            ? 'HIGH'
            : transaction.risk >= 40
              ? 'MEDIUM'
              : 'LOW',
        notes: [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to create investigation case.');
    }

    setCases(prev => [data.case, ...prev]);
    setNotice(`${data.case.id} created successfully.`);
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : 'Unable to create investigation case.'
    );
  } finally {
    setBusy(false);
  }
}

async function updateCaseStatus(
  caseId: string,
  status: InvestigationCase['status']
) {
  try {
    const response = await fetch('/api/cases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: caseId, status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to update case status.');
    }

    setCases(prev =>
      prev.map(item => item.id === caseId ? data.case : item)
    );
    setNotice(`Case ${caseId} status updated.`);
  } catch (error) {
    setNotice(
      error instanceof Error ? error.message : 'Unable to update case status.'
    );
  }
}

async function addCaseNote(caseId: string, note: string) {
  const cleanNote = note.trim();
  if (!cleanNote) return;

  try {
    const response = await fetch('/api/cases', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: caseId, note: cleanNote }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to save analyst note.');
    }

    setCases(prev =>
      prev.map(item => item.id === caseId ? data.case : item)
    );
    setNotice('Analyst note saved successfully.');
  } catch (error) {
    setNotice(
      error instanceof Error ? error.message : 'Unable to save analyst note.'
    );
  }
}const allowed=rows.filter(x=>x.status==='ALLOWED').length; const blocked=rows.filter(x=>x.status==='BLOCKED').length;
 return <main className="shell"><aside className="sidebar"><div className="brand"><div className="brandmark"><ShieldCheck size={22}/></div><div><b>PayShield<span> AI</span></b><small>PAYMENT SECURITY</small></div></div><div className="workspace"><span className="live-dot"/> COMMAND CENTER <ChevronRight size={13}/></div><nav>{nav.map(([label,Icon])=><button key={label} onClick={()=>setActive(label)} className={active===label?'nav active':'nav'}><Icon size={17}/><span>{label}</span>{label==='Agent Firewall'&&<i className="nav-count">2</i>}</button>)}</nav><div className="side-bottom"><div className="secure-card"><div className="secure-icon"><LockKeyhole size={16}/></div><b>Environment secured</b><p>Sandbox mode · Test data only</p><span className="status-line"><i/> All systems operational</span></div><div className="profile"><div className="avatar">VS</div><div><b>Vennela's workspace</b><small>Administrator</small></div><SlidersHorizontal size={16}/></div></div></aside>
 <section className="main"><header className="topbar"><div className="crumb">Workspace <ChevronRight size={14}/> <b>{active}</b></div><div className="top-actions"><span className="env"><i/> SANDBOX ENVIRONMENT</span><button className="icon-btn" title="Search"><Search size={17}/></button><button className="icon-btn" title="Notifications"><Bell size={17}/><em/></button><button className="icon-btn" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setTheme(current => current === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button><button className="icon-btn" title="Replay guided tour" onClick={() => { setActive('Overview'); setTourPhase('intro'); setTourStep(0); setTourOpen(true); }}><CircleHelp size={17}/></button></div></header>
 <div className="content"><div className="page-heading"><div><div className="eyebrow"><span/> AI-POWERED PAYMENT DEFENSE</div><h1>{active==='Overview'?'Security command center':active}</h1><p>Monitor agent activity, enforce payment policies, and investigate threats in real time.</p></div><div className="heading-right"><span className="updated"><span className="live-dot"/> LIVE MONITORING</span><button className="outline-btn" onClick={()=>{setRows(seed);setDecision(null);setNotice('Demo data refreshed.')}}><RefreshCw size={14}/> Refresh data</button></div></div>
 {active !== 'Overview' ? (
  <ModuleView
    active={active}
    rows={rows}
    cases={cases}
    setCases={setCases}
    createCase={createCase}
    updateCaseStatus={updateCaseStatus}
    addCaseNote={addCaseNote}
    columns={columns}
    approvalUrl={approvalUrl}
    agent={agent}
    setAgent={setAgent}
    recipient={recipient}
    setRecipient={setRecipient}
    amount={amount}
    setAmount={setAmount}
     approvalRequestId={approvalRequestId}
     approvalPin={approvalPin}
     setApprovalPin={setApprovalPin}
     approvalStatus={approvalStatus}
     approvePayment={approvePayment}
     createOrder={createOrder}
     decision={decision}
    busy={busy}
    evaluate={evaluate}
    notice={notice}
    uploadFile={uploadFile}
    evidence={evidence}
    verifyEvidenceRecord={verifyEvidenceRecord}
    invalidateEvidenceVerification={invalidateEvidenceVerification}
  />
) : <>
 <div className="hero-strip" data-tour="overview-hero"><div className="hero-copy"><div className="hero-kicker"><Sparkles size={13}/> AUTONOMOUS AI AGENT PAYMENT FIREWALL</div><h2>Trust every transaction.<br/><span>Verify every intention.</span></h2><p>Deterministic guardrails for autonomous payments â€” with human control at every critical decision.</p><button className="primary-btn" onClick={()=>setActive('Agent Firewall')}>Open AgentPay Firewall <ArrowUpRight size={16}/></button></div><div className="hero-visual"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="core"><ShieldCheck size={42}/><small>PAYSHIELD</small></div><div className="orbit-tag tag-a"><span className="live-dot"/> POLICY ENGINE</div><div className="orbit-tag tag-b"><LockKeyhole size={12}/> ZERO TRUST</div><div className="orbit-tag tag-c"><Activity size={12}/> LIVE RISK</div></div><div className="hero-foot"><span>POLICY ENGINE <b>ACTIVE</b></span><span>DECISION LATENCY <b>42ms</b></span><span>LAST SYNC <b>Just now</b></span></div></div>
 <div className="stats" data-tour="overview-stats"><Stat icon={<Activity/>} label="Transactions monitored" value="1,284" change="↑ 12.8%" tone="teal"/><Stat icon={<ShieldAlert/>} label="Threats blocked" value="37" change={`${blocked} in this demo`} tone="red"/><Stat icon={<Clock3/>} label="Pending approvals" value="08" change="Requires attention" tone="amber"/><Stat icon={<Wallet/>} label="Value protected" value="$24.8K" change="Sandbox estimate" tone="violet"/></div>
 <div className="section-row"><div><h3>Payment activity</h3><p>Latest transactions evaluated by the firewall</p></div><button className="text-btn" onClick={()=>setActive('Live Transactions')}>View all transactions <ArrowUpRight size={14}/></button></div>
 <div className="grid-wrap" data-tour="overview-activity"><div className="grid-toolbar"><div className="grid-title"><span className="live-dot"/> LIVE TRANSACTION STREAM <span className="tiny-count">{rows.length} RECORDS</span></div><button className="filter-btn"><SlidersHorizontal size={14}/> Filters</button></div><div className="ag-theme-quartz-dark transaction-grid"><AgGridReact<Tx> theme="legacy" rowData={rows} columnDefs={columns} defaultColDef={{sortable:true,filter:true,resizable:true}} pagination={true} paginationPageSize={5}  paginationPageSizeSelector={[5, 10, 20, 50]} domLayout="autoHeight" headerHeight={42} rowHeight={52} animateRows={true} suppressCellFocus={true}/></div></div>
 <div className="lower-grid"><section className="panel firewall-panel" data-tour="overview-firewall"><div className="panel-head"><div><div className="eyebrow">POLICY SIMULATOR</div><h3>Test a payment request</h3></div><span className="pill review">DETERMINISTIC</span></div><p className="panel-sub">Evaluate an agent payment against your active spending policy before it reaches PayPal.</p><div className="form-grid"><label>Agent identity<select value={agent} onChange={e=>setAgent(e.target.value)}><option>procurement-agent</option><option>travel-agent-02</option><option>finance-agent</option></select></label><label>Recipient email<input value={recipient} onChange={e=>setRecipient(e.target.value)} /></label><label>Payment amount (USD)<input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>{approvalRequestId && (
  <div className="approval-section">
    <label>
      Human approval PIN
      <input
        type="password"
        value={approvalPin}
        onChange={e => setApprovalPin(e.target.value)}
        placeholder="Enter approval PIN"
        autoComplete="off"
      />
    </label>

    <button
      className="primary-btn"
      disabled={busy || approvalStatus === 'APPROVED'}
      onClick={approvePayment}
    >
      <ShieldCheck size={15} />
      {approvalStatus === 'APPROVED' ? 'Approved' : 'Approve payment'}
    </button>

    <small>{approvalStatus}</small>
  </div>
)}</div><div className="button-row"><button className="primary-btn" disabled={busy} onClick={evaluate}><ShieldCheck size={15}/> Evaluate policy</button><button className="outline-btn" disabled={busy || !(decision?.decision === 'ALLOW' || (decision?.approvalRequired && approvalStatus === 'APPROVED'))} onClick={createOrder}><Wallet size={15}/> Create PayPal order</button></div>{decision&&<div className={`decision-box ${decision.decision.toLowerCase()}`}><div className="decision-icon">{decision.decision==='ALLOW'?<Check/>:decision.decision==='BLOCK'?<X/>:<AlertTriangle/>}</div><div><b>{decision.decision} ·</b>{(decision.reasons||[]).map((r:string,i:number)=><small key={i}>â€¢ {r}</small>)}</div></div>}{notice&&<div className="notice">{notice}</div>}{approvalUrl&&<a className="primary-btn" href={approvalUrl}>Continue to PayPal approval <ArrowUpRight size={14}/></a>}</section>
 <section className="panel"><div className="panel-head"><div><div className="eyebrow">FRAUD INTELLIGENCE</div><h3>Suspicious relationships</h3></div><button className="icon-btn" onClick={()=>setActive('Fraud Intelligence')}><ArrowUpRight size={16}/></button></div><p className="panel-sub">Connected activity flagged for investigation. Signals are not proof of wrongdoing.</p><div className="graph-preview" data-tour="overview-fraud-graph"><svg viewBox="0 0 460 190" role="img" aria-label="Illustrative transaction relationship graph"><g stroke="#31445d" strokeWidth="1.4"><path d="M75 90 L190 40 L300 80 L390 35 M75 90 L190 145 L300 80 L390 150 M190 40 L190 145" fill="none"/></g><g fill="#0c1a2b" stroke="#20d9b1" strokeWidth="2"><circle cx="75" cy="90" r="17"/><circle cx="190" cy="40" r="13"/><circle cx="190" cy="145" r="13"/><circle cx="300" cy="80" r="20"/></g><circle cx="390" cy="35" r="14" fill="#281a25" stroke="#ef5350" strokeWidth="2.5"/><circle cx="390" cy="150" r="14" fill="#281a25" stroke="#ef5350" strokeWidth="2.5"/><g fill="#d8e5f5" fontSize="10" textAnchor="middle"><text x="75" y="120">Agent A</text><text x="190" y="18">Vendor B</text><text x="190" y="174">Vendor C</text><text x="300" y="113">Hub wallet</text><text x="390" y="16">Flagged</text><text x="390" y="177">Flagged</text></g></svg><div className="graph-legend"><span><i className="teal-dot"/> Known entity</span><span><i className="red-dot"/> Flagged signal</span></div></div><div className="case-row"><div className="case-icon"><AlertTriangle size={16}/></div><div><b>CASE-2026-018 · Shared recipient cluster</b><small>4 linked transfers · 2 flagged signals</small></div><button className="text-btn" onClick={()=>setCaseOpen(!caseOpen)}>{caseOpen?'Close':'Review'} <ChevronRight size={14}/></button></div>{caseOpen&&<div className="case-detail">Illustrative synthetic case. Review transaction provenance and supporting evidence before making any allegation.</div>}</section></div>
 <div className="lower-grid second" data-tour="overview-recovery"><section className="panel"><div className="panel-head"><div><div className="eyebrow">RECOVERY WORKSPACE</div><h3>Evidence intake</h3></div><span className="pill allowed">OCR READY</span></div><p className="panel-sub">Upload a receipt or screenshot to extract candidate transaction details. Always verify before use.</p><label className="upload-zone" data-tour="overview-recovery-upload"><input type="file" accept="image/*,.pdf,.txt" onChange={e=>uploadFile(e.target.files?.[0])}/><div className="upload-icon"><Upload size={20}/></div><b>Drop evidence or browse files</b><small>PNG, JPG, PDF or TXT · Demo extractor supports text files; connect PaddleOCR for image/PDF OCR.</small></label>{evidence&&<div className="extract-result"><b>Extraction result · {evidence.mode}</b><p>{JSON.stringify(evidence.fields)}</p><small>Candidate values only. Verify extracted details before using them.</small></div>}</section></div>
 </>}
 <footer>PAYSHIELD AI <span>·</span> Secure by design. Explainable by default. <span className="footer-right">DEMO DATA IS SYNTHETIC · NOT FINANCIAL ADVICE</span></footer>
 </div></section><OnboardingTour
  open={tourOpen}
  phase={tourPhase}
  step={tourStep}
  onNext={advanceTour}
  onBack={goBackTour}
  onSkip={finishTour}
/></main>
}
function ModuleView({
  active,
  rows,
  cases,
  createCase,
  updateCaseStatus,
  addCaseNote,
  columns,
  approvalUrl,
  agent,
  setAgent,
  recipient,
  setRecipient,
  amount,
  setAmount,
  approvalRequestId,
  approvalPin,
  setApprovalPin,
  approvalStatus,
  approvePayment,
  createOrder,
  decision,
  busy,
  evaluate,
  notice,
  uploadFile,
  evidence,
  verifyEvidenceRecord,
  invalidateEvidenceVerification,
}: any) {
 const titleMap:any={'Agent Firewall':'AgentPay Firewall','Live Transactions':'Live transaction monitor','Fraud Intelligence':'Fraud intelligence graph','Investigation Cases':'Investigation case manager','Recovery Workspace':'Payment recovery workspace','Analytics Studio':'Analytics Studio','Security Policies':'Security policy controls'};
 return <section className="module-page">
  <div className="module-intro" data-tour="module-intro"><div className="eyebrow"><span/> PAYSHIELD SECURITY MODULE</div><h2>{titleMap[active]||active}</h2><p>{active==='Agent Firewall'?'Evaluate autonomous payment requests against deterministic spending guardrails.':active==='Live Transactions'?'Inspect individual payment decisions and their source, amount and risk signals.':active==='Fraud Intelligence'?'Explore synthetic transaction relationships. Connections are investigative signals, not proof of wrongdoing.':active==='Investigation Cases'?'Review flagged activity, supporting signals and investigation status.':active==='Recovery Workspace'?'Upload transaction evidence, inspect extracted candidates and prepare a recovery record.':active==='Analytics Studio'?'Explore the analytics integration status and the questions the Studio dashboard should answer.': 'Review the active deterministic spending limits and recipient controls.'}</p></div>
  {active==='Agent Firewall' && <div className="panel"><div className="panel-head"><div><div className="eyebrow">POLICY SIMULATOR</div><h3>Evaluate a payment request</h3></div><span className="pill review">DETERMINISTIC</span></div><p className="panel-sub">A request is evaluated locally by the policy engine before a PayPal order can be created.</p><div className="form-grid"><label data-tour="firewall-agent">Agent identity<select value={agent} onChange={e=>setAgent(e.target.value)}><option>procurement-agent</option><option>travel-agent-02</option><option>finance-agent</option></select></label><label data-tour="firewall-recipient">Recipient email<input value={recipient} onChange={e=>setRecipient(e.target.value)}/></label><label data-tour="firewall-amount">Payment amount (USD)<input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>{approvalRequestId && (
    <div className="approval-section" data-tour="firewall-approval">
      <label>Human approval PIN
        <input type="password" value={approvalPin} onChange={e=>setApprovalPin(e.target.value)} placeholder="Enter approval PIN" autoComplete="off" />
      </label>
      <button className="primary-btn" disabled={busy || approvalStatus === 'APPROVED'} onClick={approvePayment}>
        <ShieldCheck size={15}/> {approvalStatus === 'APPROVED' ? 'Approved' : 'Approve payment'}
      </button>
      <small>{approvalStatus}</small>
    </div>
  )}</div><div className="button-row"><button data-tour="firewall-evaluate" className="primary-btn" disabled={busy} onClick={evaluate}><ShieldCheck size={15}/> Evaluate policy</button><button data-tour="firewall-paypal-order" className="outline-btn" disabled={busy || !(decision?.decision === 'ALLOW' || (decision?.approvalRequired && approvalStatus === 'APPROVED'))} onClick={createOrder}><Wallet size={15}/> Create PayPal order</button></div>{decision&&<div data-tour="firewall-decision" className={`decision-box ${String(decision.decision).toLowerCase()}`}><div className="decision-icon"><ShieldCheck/></div><div><b>{decision.decision} ·</b>{(decision.reasons||[]).map((r:string,i:number)=><small key={i}>â€¢ {r}</small>)}</div></div>}{notice&&<div className="notice">{notice}</div>}{approvalUrl&&<a className="primary-btn" href={approvalUrl}>Continue to PayPal approval <ArrowUpRight size={14}/></a>}</div>}
  {active==='Live Transactions' && <div className="panel" data-tour="transactions-ledger"><div className="panel-head"><div><div className="eyebrow">TRANSACTION LEDGER</div><h3>{rows.length} demo transactions</h3></div><span className="pill allowed">SANDBOX DATA</span></div><div className="ag-theme-quartz-dark transaction-grid"><AgGridReact<Tx> theme="legacy" rowData={rows} columnDefs={columns} defaultColDef={{sortable:true,filter:true,resizable:true,floatingFilter:true}} pagination={true} paginationPageSize={10} paginationPageSizeSelector={[5, 10, 20, 50]} domLayout="autoHeight" headerHeight={42} rowHeight={52} animateRows={true}/></div></div>}
 {active === 'Fraud Intelligence' && (
  <div className="panel">
    <div className="panel-head">
      <div>
        <div className="eyebrow">ENTITY RELATIONSHIP MAP</div>
        <h3>Transaction Relationship Intelligence</h3>
      </div>
      <span className="pill review">INVESTIGATIVE SIGNALS</span>
    </div>

    <p className="panel-sub">
      Explore relationships between payment agents and recipients.
      Red connections indicate high-risk transactions.
      Connections are investigative signals, not proof of fraud.
    </p>

    <div data-tour="fraud-relationship-graph"><FraudGraph rows={rows} /></div>
  </div>
  )}
   {active === 'Investigation Cases' && (
     <div className="panel">
       <div className="panel-head">
         <div>
           <div className="eyebrow">CASE MANAGEMENT</div>
           <h3>Investigation workspace</h3>
         </div>
         <span className="pill review">{cases.length} CASE(S)</span>
       </div>

       <p className="panel-sub">
         Create and manage investigations using transactions in the current demo ledger.
       </p>

       <form data-tour="cases-create-form" className="form-grid"
         onSubmit={e => {
           e.preventDefault();
           const form = e.currentTarget;
           const data = new FormData(form);
           createCase(
             String(data.get('transactionId') || ''),
             String(data.get('title') || '')
           );
           form.reset();
         }}
       >
         <label>
           Related transaction
           <select name="transactionId" required defaultValue={rows[0]?.id || ''}>
             {rows.map((row: Tx) => (
               <option key={row.id} value={row.id}>
  {row.id} · ${row.amount.toFixed(2)} · {row.status}
               </option>
             ))}
           </select>
         </label>

         <label>
           Case title
           <input name="title" placeholder="e.g. Unusual recipient activity" required />
         </label>

         <button className="primary-btn" type="submit" disabled={rows.length === 0}>
           <AlertTriangle size={15} /> Create investigation
         </button>
       </form>

       <div className="section-row" data-tour="cases-queue"><div><h3>Case queue</h3>
           <p>{cases.length} investigation(s) created in this session</p>
         </div>
       </div>

       {cases.length === 0 ? (
         <div className="case-detail">
           No investigation cases yet. Select a transaction above to create your first case.
         </div>
       ) : (
         cases.map((item: InvestigationCase) => (
           <div className="case-detail" key={item.id} style={{ marginBottom: 14 }}>
             <div className="case-row">
               <div className="case-icon"><AlertTriangle size={16} /></div>
               <div>
                 <b>{item.id} · {item.title}</b>
                 <small>
                   Priority: {item.priority} · Created: {new Date(item.createdAt).toLocaleString()}
                 </small>
               </div>
               <span className={`pill ${item.status === 'RESOLVED' ? 'allowed' : 'review'}`}>
                 {item.status}
               </span>
             </div>

             <p><strong>Linked transactions:</strong> {item.transactionIds.join(', ')}</p>

             {item.transactionIds.map((transactionId: string) => {
               const transaction = rows.find((row: Tx) => row.id === transactionId);
               return transaction ? (
                 <div key={transactionId}>
                   <small>
                     {transaction.agent} → {transaction.recipient} · ${transaction.amount.toFixed(2)} · Risk {transaction.risk}/100
                     {transaction.status}
                   </small>
                 </div>
               ) : (
                 <small key={transactionId}>
                   Transaction {transactionId} is no longer in the current ledger.
                 </small>
               );
             })}

             <label style={{ display: 'block', marginTop: 12 }}>
               Investigation status
               <select
                 value={item.status}
                 onChange={e => updateCaseStatus(item.id, e.target.value as InvestigationCase['status'])}
               >
                 <option value="OPEN">OPEN</option>
                 <option value="INVESTIGATING">INVESTIGATING</option>
                 <option value="RESOLVED">RESOLVED</option>
               </select>
             </label>

             <form
               onSubmit={e => {
                 e.preventDefault();
                 const form = e.currentTarget;
                 const data = new FormData(form);
                 addCaseNote(item.id, String(data.get('note') || ''));
                 form.reset();
               }}
             >
               <label style={{ display: 'block', marginTop: 12 }}>
                 Add analyst note
                 <input name="note" placeholder="Record an observation or next step..." required />
               </label>
               <button className="outline-btn" type="submit" style={{ marginTop: 8 }}>
                 Add note
               </button>
             </form>

             {item.notes.length > 0 && (
               <div style={{ marginTop: 12 }}>
                 <strong>Analyst notes</strong>
                 <ul>
                   {item.notes.map((note: string, index: number) => (
                     <li key={`${item.id}-note-${index}`}>{note}</li>
                   ))}
                 </ul>
               </div>
             )}
           </div>
         ))
       )}

       <small>
         Demo limitation: cases and notes are held in application memory and are not persisted to a database.
         Case links and risk priorities are investigative aids, not proof of fraud.
       </small>
     </div>
   )}
  {active==='Recovery Workspace' && (
    <div className="panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">EVIDENCE INTAKE</div>
          <h3>Upload payment evidence</h3>
        </div>
        <span className="pill allowed">EXTRACTION API</span>
      </div>

      <p className="panel-sub">
        Upload a receipt or screenshot. Extracted values are candidates and must be checked against the original.
      </p>

      <label className="upload-zone" data-tour="recovery-upload">
        <input
          type="file"
          accept="image/*,.pdf,.txt"
          onChange={e => uploadFile(e.target.files?.[0])}
        />
        <div className="upload-icon"><Upload size={20}/></div>
        <b>Drop evidence or browse files</b>
        <small>PNG, JPG, PDF or TXT · Demo extractor supports text files; connect PaddleOCR for image/PDF OCR.</small>
      </label>

      {notice && <div className="notice">{notice}</div>}

      <div data-tour="recovery-review"><EvidenceReview
        evidence={evidence}
        onVerify={verifyEvidenceRecord}
        onInvalidate={invalidateEvidenceVerification}
      /></div>
      <ReportingGuide />
    </div>
  )}
  {active === 'Analytics Studio' && (
  <div className="panel">
    <div className="panel-head">
      <div>
        <div className="eyebrow">SPONSOR ANALYTICS</div>
        <h3>PayShield Transaction Intelligence</h3>
      </div>
      <span className="pill allowed">AG STUDIO</span>
    </div>

    <p className="panel-sub">
      Explore transaction amounts, recipient patterns, risk scores and
      payment decisions. Data shown is synthetic or from PayPal Sandbox.
    </p>

    <div data-tour="analytics-dashboard"><AnalyticsStudio rows={rows} /></div>
  </div>
)}
  {active==='Security Policies' && <div className="panel"><div className="panel-head"><div><div className="eyebrow">ACTIVE POLICY</div><h3>Default agent spending policy</h3></div><span className="pill allowed">ENFORCED</span></div><div className="policy-grid" data-tour="policy-limits"><div><small>Per-transaction limit</small><b>$500</b></div><div><small>Daily limit (configured)</small><b>$1,500</b></div><div><small>Human approval above</small><b>$250</b></div><div><small>Hourly transaction cap</small><b>5</b></div></div><h3 className="policy-heading" data-tour="policy-approved">Approved recipients</h3><p className="panel-sub">studio@northstar.test · merchant@demo.test</p><h3 className="policy-heading" data-tour="policy-blocked">Blocked recipients</h3><p className="panel-sub">suspicious@fraud.test</p><p className="notice">Demo policy values are configured in lib/policy.ts. Daily aggregate tracking and editable policy persistence are not implemented yet.</p></div>}
 </section>
}

function Stat({icon,label,value,change,tone}:{icon:React.ReactNode;label:string;value:string;change:string;tone:string}){return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-change">{change}</div></div>}
