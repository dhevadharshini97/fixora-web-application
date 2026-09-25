"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, ArrowUpRight, BadgeCheck, Building2, CheckCircle2, ChevronRight,
  Clock3, Droplets, Filter, Inbox, MapPin, RefreshCw, Road, Search, Shield,
  Trash2, TriangleAlert, UserRound, Users, Wrench, X, Zap, BrainCircuit,
  ClipboardCheck, Timer
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Card, StatusPill, SeverityBadge } from "@/components/ui";
import { cn, deadlineInfo, isOpen, timeAgo } from "@/lib/utils";
import { ESCALATION_LEVELS } from "@/lib/constants";

type DepartmentKey =
  | "All Departments" | "Roads & Infrastructure" | "Water Supply"
  | "Electricity" | "Sanitation" | "Public Safety";

const departments: { name: DepartmentKey; icon: typeof Road; categories: string[]; accent: string }[] = [
  { name:"All Departments", icon:Building2, categories:[], accent:"from-brand-600 to-teal-500" },
  { name:"Roads & Infrastructure", icon:Road, categories:["Road","Pothole","Street Light","Drainage"], accent:"from-blue-600 to-cyan-500" },
  { name:"Water Supply", icon:Droplets, categories:["Water","Pipeline","Leakage"], accent:"from-cyan-600 to-sky-500" },
  { name:"Electricity", icon:Zap, categories:["Electricity","Power","Transformer"], accent:"from-amber-500 to-orange-500" },
  { name:"Sanitation", icon:Trash2, categories:["Garbage","Waste","Sanitation"], accent:"from-emerald-600 to-lime-500" },
  { name:"Public Safety", icon:Shield, categories:["Safety","Street Safety","Public Safety"], accent:"from-violet-600 to-fuchsia-500" },
];

function belongsToDepartment(c: Complaint, d: DepartmentKey) {
  if (d === "All Departments" || c.department === d) return true;
  const value = (c.department || c.category || "").toLowerCase();
  return departments.find(x => x.name === d)?.categories.some(x => value.includes(x.toLowerCase())) ?? false;
}

export default function DepartmentPage() {
  const [complaints,setComplaints]=useState<Complaint[]>([]);
  const [department,setDepartment]=useState<DepartmentKey>("All Departments");
  const [tab,setTab]=useState<"open"|"done">("open");
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState<"all"|"critical"|"overdue">("all");
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState<number|null>(null);
  const [selectedComplaint,setSelectedComplaint]=useState<Complaint|null>(null);
  const [assignments,setAssignments]=useState<Record<string,string>>({});
  const [assignedOfficer,setAssignedOfficer]=useState("");

  const load=async()=>{
    setLoading(true);
    let local:Complaint[]=[];
    try{
      local=JSON.parse(localStorage.getItem("fixora_local_complaints")??"[]");
      setAssignments(JSON.parse(localStorage.getItem("fixora_department_assignments")??"{}"));
    }catch{}
    try{
      const r=await fetch("/api/complaints",{cache:"no-store"});
      const d=await r.json();
      const server:Complaint[]=d.complaints??[];
      setComplaints([...local,...server].filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i));
    }catch{setComplaints(local);}
    finally{setLoading(false);}
  };
  useEffect(()=>{load();},[]);

  const dept=useMemo(()=>complaints.filter(c=>belongsToDepartment(c,department)),[complaints,department]);
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return dept.filter(c=>{
      if(filter==="critical" && c.severity!=="critical") return false;
      if(filter==="overdue" && !deadlineInfo(c).overdue) return false;
      return !q || [c.title,c.description,c.street,c.category,c.citizenName].filter(Boolean).some(v=>String(v).toLowerCase().includes(q));
    });
  },[dept,query,filter]);
  const open=filtered.filter(isOpen), done=filtered.filter(c=>!isOpen(c));
  const overdue=open.filter(c=>deadlineInfo(c).overdue);
  const selected=departments.find(d=>d.name===department)??departments[0];
  const SelectedIcon=selected.icon;

  const totals=useMemo(()=>({
    open:dept.filter(isOpen).length,
    overdue:dept.filter(c=>isOpen(c)&&deadlineInfo(c).overdue).length,
    critical:dept.filter(c=>c.severity==="critical"&&isOpen(c)).length,
    resolved:dept.filter(c=>!isOpen(c)).length,
  }),[dept]);

  const act=async(id:number,action:"start"|"resolve")=>{
    setBusy(id);
    try{
      const r=await fetch(`/api/complaints/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
      if(!r.ok) throw new Error();
    }catch{
      const next=complaints.map(c=>c.id===id?({...c,status:action==="start"?"in_progress":"resolved",updatedAt:new Date().toISOString()} as Complaint):c);
      setComplaints(next);
      try{localStorage.setItem("fixora_local_complaints",JSON.stringify(next.slice(0,50)));}catch{}
      if(selectedComplaint?.id===id)setSelectedComplaint(next.find(c=>c.id===id)??null);
      setBusy(null); return;
    }
    await load();
    setBusy(null);
  };

  const assign=(id:number)=>{
    if(!assignedOfficer)return;
    const next={...assignments,[String(id)]:assignedOfficer};
    setAssignments(next);
    try{localStorage.setItem("fixora_department_assignments",JSON.stringify(next));}catch{}
  };

  return <div className="space-y-5 pb-8">
    <section className="relative overflow-hidden rounded-[30px] bg-slate-950 p-5 text-white shadow-xl sm:p-7">
      <div className="absolute inset-0 opacity-20 grid-bg"/>
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"/>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${selected.accent} shadow-lg`}><SelectedIcon className="h-7 w-7"/></div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-teal-300"><Activity className="h-3.5 w-3.5"/>Live operations</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{department==="All Departments"?"Civic Operations Center":department}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">One workspace to triage citizen reports, assign field teams, monitor SLA risk and close cases with proof.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black hover:bg-white/15 disabled:opacity-50"><RefreshCw className={cn("h-4 w-4",loading&&"animate-spin")}/>Sync queue</button>
      </div>
    </section>

    <section className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {departments.map(d=>{const I=d.icon; const count=complaints.filter(c=>belongsToDepartment(c,d.name)&&isOpen(c)).length; return <button key={d.name} onClick={()=>setDepartment(d.name)} className={cn("rounded-2xl border p-3 text-left transition-all",department===d.name?"border-brand-300 bg-brand-50 shadow-sm ring-2 ring-brand-100":"border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm")}><div className="flex items-center justify-between"><I className={cn("h-4 w-4",department===d.name?"text-brand-600":"text-slate-400")}/><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{count}</span></div><p className="mt-2 line-clamp-2 text-[10px] font-black leading-tight text-slate-700">{d.name}</p></button>})}
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        {label:"Open queue",value:totals.open,icon:Inbox,note:"needs action"},
        {label:"SLA at risk",value:totals.overdue,icon:TriangleAlert,note:"overdue cases"},
        {label:"Critical",value:totals.critical,icon:Zap,note:"priority cases"},
        {label:"Resolved",value:totals.resolved,icon:BadgeCheck,note:"completed"},
      ].map((s,i)=>{const I=s.icon; return <motion.div key={s.label} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}><Card className="relative overflow-hidden p-4"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{s.label}</p><p className="mt-1 text-2xl font-black text-slate-900">{s.value}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{s.note}</p></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><I className="h-4 w-4"/></div></div></Card></motion.div>})}
    </section>

    <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-3">
        <Card className="p-3">
          <div className="flex flex-col gap-2.5 md:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ID, problem, street or citizen..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-xs font-semibold outline-none focus:border-brand-400 focus:bg-white"/></div>
            <div className="flex gap-1.5 overflow-x-auto">
              {(["open","done"] as const).map(k=><button key={k} onClick={()=>setTab(k)} className={cn("whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-black",tab===k?"bg-slate-900 text-white":"bg-slate-100 text-slate-500")}>{k==="open"?`Inbox ${open.length}`:`Resolved ${done.length}`}</button>)}
              {(["all","critical","overdue"] as const).map(k=><button key={k} onClick={()=>setFilter(k)} className={cn("whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black",filter===k?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-500")}>{k==="all"?"All":k==="critical"?"Critical":"Overdue"}</button>)}
            </div>
          </div>
        </Card>

        <div className="space-y-2.5">
          {((tab==="open"?open:done)).map((c,i)=>{const dl=deadlineInfo(c); const openC=isOpen(c); return <motion.div key={c.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.03}}><Card className="overflow-hidden p-0"><div className={cn("border-l-4 p-4",c.severity==="critical"?"border-rose-500":dl.overdue?"border-amber-400":"border-teal-400")}><div className="flex gap-3"><img src={c.photoUrl||"/images/complaints/pothole.jpg"} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[9px] font-black uppercase tracking-wide text-slate-400">FX-{c.id}</span><StatusPill status={c.status}/><SeverityBadge severity={c.severity}/></div><h3 className="mt-1 truncate text-[13px] font-black text-slate-900">{c.title}</h3></div><button onClick={()=>{setSelectedComplaint(c);setAssignedOfficer(assignments[String(c.id)]??"")}} className="rounded-lg p-1.5 text-slate-300 hover:bg-brand-50 hover:text-brand-600"><ChevronRight className="h-4 w-4"/></button></div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-400"><span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-teal-500"/>{c.street||"Location unavailable"}</span><span>{timeAgo(c.reportedAt)}</span><span className="flex items-center gap-1"><Users className="h-3 w-3"/>{c.supporters??1} reports</span></div><div className="mt-2 flex flex-wrap gap-1.5">{openC&&dl.overdue&&<span className="rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600">SLA {dl.days}d overdue</span>}{(c.escalationLevel??0)>0&&<span className="rounded-lg bg-orange-50 px-2 py-1 text-[9px] font-black text-orange-600">{ESCALATION_LEVELS[Math.min(3,c.escalationLevel??0)]}</span>}{assignments[String(c.id)]&&<span className="rounded-lg bg-teal-50 px-2 py-1 text-[9px] font-black text-teal-700">Assigned · {assignments[String(c.id)]}</span>}</div></div></div>{openC&&<div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3"><button onClick={()=>act(c.id,"start")} disabled={busy===c.id||c.status==="in_progress"} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-[10px] font-black text-slate-600 hover:border-brand-300 disabled:opacity-40"><Wrench className="h-3.5 w-3.5"/>{c.status==="in_progress"?"Work in progress":"Start work"}</button><button onClick={()=>act(c.id,"resolve")} disabled={busy===c.id} className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-[10px] font-black text-white hover:bg-slate-800 disabled:opacity-40">{busy===c.id?"Updating…":"Resolve case"}<ArrowUpRight className="h-3.5 w-3.5"/></button></div>}</div></Card></motion.div>})}
          {((tab==="open"?open:done)).length===0&&<Card className="p-12 text-center"><BadgeCheck className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 text-sm font-black text-slate-700">Queue is clear</p><p className="mt-1 text-xs text-slate-400">Try another department or filter.</p></Card>}
        </div>
      </div>

      <aside className="hidden space-y-3 lg:block">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live workload</p><p className="mt-1 text-sm font-black text-slate-900">Operations health</p></div><Activity className="h-4 w-4 text-teal-500"/></div><div className="mt-4 space-y-3"><div><div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">Within SLA</span><span>{totals.open?Math.max(0,Math.round(((totals.open-totals.overdue)/totals.open)*100)):100}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{width:`${totals.open?Math.max(0,Math.round(((totals.open-totals.overdue)/totals.open)*100)):100}%`}}/></div></div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><Clock3 className="h-4 w-4 text-slate-400"/><p className="mt-2 text-lg font-black">{totals.overdue}</p><p className="text-[9px] font-bold text-slate-400">SLA risk</p></div><div className="rounded-xl bg-slate-50 p-3"><Users className="h-4 w-4 text-slate-400"/><p className="mt-2 text-lg font-black">{dept.reduce((n,c)=>n+(c.supporters??1),0)}</p><p className="text-[9px] font-bold text-slate-400">Citizen reports</p></div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-brand-600"/><p className="text-xs font-black text-slate-800">AI attention queue</p></div><p className="mt-1 text-[10px] leading-4 text-slate-400">Cases needing quick human review.</p><div className="mt-3 space-y-2">{dept.filter(c=>isOpen(c)&&(c.severity==="critical"||deadlineInfo(c).overdue)).slice(0,4).map(c=><button key={c.id} onClick={()=>{setSelectedComplaint(c);setAssignedOfficer(assignments[String(c.id)]??"")}} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-left hover:bg-brand-50"><div className="flex items-center justify-between"><span className="truncate text-[10px] font-black text-slate-700">{c.title}</span><ChevronRight className="h-3 w-3 text-slate-300"/></div><span className="text-[9px] font-bold text-rose-500">{c.severity==="critical"?"Critical":"SLA overdue"}</span></button>)}{dept.filter(c=>isOpen(c)&&(c.severity==="critical"||deadlineInfo(c).overdue)).length===0&&<p className="rounded-xl bg-teal-50 p-3 text-[10px] font-bold text-teal-700">No urgent cases right now.</p>}</div></Card>
      </aside>
    </section>

    {selectedComplaint&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={()=>setSelectedComplaint(null)}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-brand-600">Case command view</p><h2 className="text-lg font-black text-slate-900">FX-{selectedComplaint.id}</h2></div><button onClick={()=>setSelectedComplaint(null)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4"/></button></div>
        <div className="space-y-4 p-5">
          <div className="flex gap-3"><img src={selectedComplaint.photoUrl||"/images/complaints/pothole.jpg"} alt="" className="h-24 w-24 rounded-2xl object-cover"/><div className="min-w-0"><div className="flex flex-wrap gap-1.5"><StatusPill status={selectedComplaint.status}/><SeverityBadge severity={selectedComplaint.severity}/></div><h3 className="mt-2 text-base font-black">{selectedComplaint.title}</h3><p className="mt-1 text-xs text-slate-500">{selectedComplaint.description||"No description provided."}</p><p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400"><MapPin className="h-3 w-3"/>{selectedComplaint.street||"Location unavailable"}</p></div></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Reported",timeAgo(selectedComplaint.reportedAt)],["Supporters",String(selectedComplaint.supporters??1)],["SLA",deadlineInfo(selectedComplaint).overdue?"Overdue":`${deadlineInfo(selectedComplaint).days}d left`],["Escalation",String(selectedComplaint.escalationLevel??0)]].map(([k,v])=><div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">{k}</p><p className="mt-1 text-xs font-black">{v}</p></div>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4"><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-brand-600"/><p className="text-xs font-black">AI triage</p></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white p-2"><p className="font-black text-brand-600">{selectedComplaint.severity==="critical"?"92":selectedComplaint.severity==="high"?"78":"54"}%</p><p className="text-[8px] font-bold text-slate-400">Risk</p></div><div className="rounded-xl bg-white p-2"><p className="font-black text-teal-600">{selectedComplaint.supporters??1}</p><p className="text-[8px] font-bold text-slate-400">Reports</p></div><div className="rounded-xl bg-white p-2"><p className="font-black text-orange-500">{selectedComplaint.escalationLevel??0}</p><p className="text-[8px] font-bold text-slate-400">Escalation</p></div></div></div>
            <div className="rounded-2xl border border-slate-100 p-4"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-teal-600"/><p className="text-xs font-black">Field assignment</p></div><select value={assignedOfficer} onChange={e=>setAssignedOfficer(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold"><option value="">Select team</option><option>Roads Team A</option><option>Roads Team B</option><option>Water Response Team</option><option>Electrical Field Team</option><option>Sanitation Team</option><option>Public Safety Team</option></select><button onClick={()=>assign(selectedComplaint.id)} disabled={!assignedOfficer} className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white disabled:opacity-40">Save assignment</button></div>
          </div>
          <div className="rounded-2xl border border-slate-100 p-4"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-600"/><p className="text-xs font-black">Case progress</p></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Submitted",true],["AI verified",true],["Assigned",!!assignments[String(selectedComplaint.id)]],["In progress",selectedComplaint.status==="in_progress"||selectedComplaint.status==="resolved"]].map(([label,done])=><div key={String(label)} className="rounded-xl bg-slate-50 p-2.5"><CheckCircle2 className={cn("h-4 w-4",done?"text-teal-500":"text-slate-300")}/><p className="mt-1 text-[9px] font-black text-slate-600">{String(label)}</p></div>)}</div></div>
          <div className="grid gap-2 sm:grid-cols-3"><button onClick={()=>act(selectedComplaint.id,"start")} disabled={busy===selectedComplaint.id||selectedComplaint.status==="in_progress"||selectedComplaint.status==="resolved"} className="rounded-xl border border-slate-200 py-2.5 text-xs font-black disabled:opacity-40">Start work</button><button onClick={()=>act(selectedComplaint.id,"resolve")} disabled={busy===selectedComplaint.id||selectedComplaint.status==="resolved"} className="rounded-xl bg-teal-600 py-2.5 text-xs font-black text-white disabled:opacity-40">Resolve case</button><Link href={`/complaints/${selectedComplaint.id}`} className="flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 py-2.5 text-xs font-black text-brand-700">Citizen tracking</Link></div>
        </div>
      </div>
    </div>}
  </div>;
}
