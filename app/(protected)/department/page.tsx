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

  const kanban = {
    new: filtered.filter(c => c.status === "submitted" || c.status === "ai_verified" || c.status === "assigned"),
    progress: filtered.filter(c => c.status === "in_progress"),
    resolved: filtered.filter(c => !isOpen(c) || c.status === "resolved"),
  };

  return <div className="min-h-screen -m-4 bg-[#f4f7f9] sm:-m-6 lg:-m-8">
    <div className="flex min-h-screen">
      <aside className="hidden w-[235px] shrink-0 bg-[#102a2e] p-4 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#23c7a8] text-[#102a2e]"><Building2 className="h-5 w-5"/></div>
          <div><p className="text-sm font-black">FIXORA</p><p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Department Hub</p></div>
        </div>
        <p className="mb-2 mt-6 px-2 text-[9px] font-black uppercase tracking-[.2em] text-white/35">Departments</p>
        <div className="space-y-1.5">
          {departments.map(d=>{const I=d.icon; const n=complaints.filter(c=>belongsToDepartment(c,d.name)&&isOpen(c)).length; return <button key={d.name} onClick={()=>setDepartment(d.name)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",department===d.name?"bg-white text-[#102a2e]":"text-white/65 hover:bg-white/5 hover:text-white")}><I className="h-4 w-4 shrink-0"/><span className="min-w-0 flex-1 truncate text-[10px] font-black">{d.name}</span><span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black",department===d.name?"bg-[#dff8f2] text-[#0d806d]":"bg-white/10 text-white/50")}>{n}</span></button>})}
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-[#23c7a8]"/><p className="text-[10px] font-black">Live system</p></div>
          <p className="mt-2 text-[9px] leading-4 text-white/45">Complaint routing, SLA monitoring and field response.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-3">
            <div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#0d9c84]">Operations / {department}</p><h1 className="mt-1 text-xl font-black tracking-tight text-[#102a2e] sm:text-2xl">Department Command Board</h1></div>
            <button onClick={load} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm"><RefreshCw className={cn("h-3.5 w-3.5",loading&&"animate-spin")}/> Refresh</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1450px] space-y-4 p-4 sm:p-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Active cases",totals.open,"needs action",Inbox,"text-[#0d9c84]","bg-[#e5faf5]"],
              ["SLA overdue",totals.overdue,"escalate now",TriangleAlert,"text-rose-600","bg-rose-50"],
              ["Critical",totals.critical,"priority queue",Zap,"text-amber-600","bg-amber-50"],
              ["Resolved",totals.resolved,"closed cases",BadgeCheck,"text-blue-600","bg-blue-50"]
            ].map(([label,value,note,I,color,bg])=>{const Icon=I as typeof Inbox;return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{String(label)}</p><p className="mt-1 text-2xl font-black text-[#102a2e]">{String(value)}</p><p className="text-[9px] font-bold text-slate-400">{String(note)}</p></div><div className={cn("grid h-10 w-10 place-items-center rounded-xl",String(bg),String(color))}><Icon className="h-4 w-4"/></div></div></div>})}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search complaint, location, citizen..." className="w-full rounded-xl bg-slate-50 py-3 pl-9 pr-3 text-xs font-semibold outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-[#23c7a8]"/></div>
              <div className="flex gap-1.5 overflow-x-auto">{(["all","critical","overdue"] as const).map(k=><button key={k} onClick={()=>setFilter(k)} className={cn("rounded-xl px-3 py-2.5 text-[9px] font-black uppercase",filter===k?"bg-[#102a2e] text-white":"bg-slate-100 text-slate-500")}>{k}</button>)}</div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-3">
            {[
              ["NEW / TRIAGE",kanban.new,"bg-blue-500","text-blue-600"],
              ["FIELD WORK",kanban.progress,"bg-amber-500","text-amber-600"],
              ["RESOLVED",kanban.resolved,"bg-emerald-500","text-emerald-600"]
            ].map(([title,list,dot,txt])=>{const arr=list as Complaint[];return <section key={String(title)} className="min-w-0 rounded-2xl bg-[#e9eef0] p-2.5">
              <div className="flex items-center justify-between px-2 py-2"><div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full",String(dot))}/><h2 className="text-[10px] font-black tracking-wider text-[#102a2e]">{String(title)}</h2></div><span className="rounded-lg bg-white px-2 py-1 text-[9px] font-black text-slate-500">{arr.length}</span></div>
              <div className="space-y-2">
                {arr.slice(0,8).map(c=>{const dl=deadlineInfo(c);return <button key={c.id} onClick={()=>{setSelectedComplaint(c);setAssignedOfficer(assignments[String(c.id)]??"")}} className="group w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2"><span className="text-[8px] font-black uppercase tracking-wider text-slate-400">FX-{c.id}</span><SeverityBadge severity={c.severity}/></div>
                  <h3 className="mt-2 line-clamp-2 text-xs font-black leading-4 text-[#102a2e]">{c.title}</h3>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-slate-400"><MapPin className="h-3 w-3 text-[#23aF98]"/><span className="truncate">{c.street||"Location unavailable"}</span></div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2"><span className="text-[9px] font-bold text-slate-400">{timeAgo(c.reportedAt)}</span><span className={cn("text-[9px] font-black",dl.overdue?"text-rose-500":String(txt))}>{dl.overdue?"SLA overdue":c.status.replace("_"," ")}</span></div>
                  {assignments[String(c.id)]&&<div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#e7faf5] px-2 py-1.5 text-[8px] font-black text-[#087d69]"><UserRound className="h-3 w-3"/>{assignments[String(c.id)]}</div>}
                </button>})}
                {arr.length===0&&<div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-slate-300"/><p className="mt-2 text-[10px] font-bold text-slate-400">No cases</p></div>}
              </div>
              {arr.length>8&&<p className="pt-2 text-center text-[9px] font-black text-slate-400">+ {arr.length-8} more cases</p>}
            </section>})}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">SLA health</p><h2 className="mt-1 text-sm font-black text-[#102a2e]">Response performance</h2></div><Timer className="h-5 w-5 text-[#23c7a8]"/></div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#23c7a8]" style={{width:`${totals.open?Math.max(0,Math.round(((totals.open-totals.overdue)/totals.open)*100)):100}%`}}/></div>
              <div className="mt-2 flex justify-between text-[9px] font-black text-slate-400"><span>Within SLA</span><span>{totals.open?Math.max(0,Math.round(((totals.open-totals.overdue)/totals.open)*100)):100}%</span></div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-violet-500"/><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">AI attention</p><h2 className="text-sm font-black text-[#102a2e]">Cases requiring review</h2></div></div><div className="mt-3 flex flex-wrap gap-2">{dept.filter(c=>isOpen(c)&&(c.severity==="critical"||deadlineInfo(c).overdue)).slice(0,5).map(c=><button key={c.id} onClick={()=>{setSelectedComplaint(c);setAssignedOfficer(assignments[String(c.id)]??"")}} className="rounded-xl bg-violet-50 px-3 py-2 text-[9px] font-black text-violet-700">FX-{c.id} · {c.severity==="critical"?"Critical":"SLA risk"}</button>)}{dept.filter(c=>isOpen(c)&&(c.severity==="critical"||deadlineInfo(c).overdue)).length===0&&<span className="text-[10px] font-bold text-slate-400">No urgent cases.</span>}</div></section>
          </div>
        </div>
      </main>

      {selectedComplaint&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a2e]/60 p-3 backdrop-blur-sm" onClick={()=>setSelectedComplaint(null)}>
        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-widest text-[#0d9c84]">Case workspace</p><h2 className="text-lg font-black text-[#102a2e]">FX-{selectedComplaint.id}</h2></div><button onClick={()=>setSelectedComplaint(null)} className="rounded-xl bg-slate-100 p-2"><X className="h-4 w-4"/></button></div>
          <div className="space-y-4 p-5">
            <div className="flex gap-3"><img src={selectedComplaint.photoUrl||"/images/complaints/pothole.jpg"} alt="" className="h-24 w-24 rounded-2xl object-cover"/><div><div className="flex flex-wrap gap-1.5"><StatusPill status={selectedComplaint.status}/><SeverityBadge severity={selectedComplaint.severity}/></div><h3 className="mt-2 text-base font-black text-[#102a2e]">{selectedComplaint.title}</h3><p className="mt-1 text-xs text-slate-500">{selectedComplaint.description||"No description provided."}</p><p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400"><MapPin className="h-3 w-3"/>{selectedComplaint.street||"Location unavailable"}</p></div></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Reported",timeAgo(selectedComplaint.reportedAt)],["Reports",String(selectedComplaint.supporters??1)],["SLA",deadlineInfo(selectedComplaint).overdue?"Overdue":`${deadlineInfo(selectedComplaint).days}d left`],["Escalation",String(selectedComplaint.escalationLevel??0)]].map(([k,v])=><div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">{k}</p><p className="mt-1 text-xs font-black">{v}</p></div>)}</div>
            <div className="rounded-2xl bg-[#102a2e] p-4 text-white"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[#23c7a8]"/><p className="text-xs font-black">Assign field team</p></div><select value={assignedOfficer} onChange={e=>setAssignedOfficer(e.target.value)} className="mt-3 w-full rounded-xl bg-white/10 px-3 py-3 text-xs font-bold text-white outline-none"><option className="text-black" value="">Select team</option><option className="text-black">Roads Team A</option><option className="text-black">Roads Team B</option><option className="text-black">Water Response Team</option><option className="text-black">Electrical Field Team</option><option className="text-black">Sanitation Team</option><option className="text-black">Public Safety Team</option></select><button onClick={()=>assign(selectedComplaint.id)} disabled={!assignedOfficer} className="mt-2 w-full rounded-xl bg-[#23c7a8] py-2.5 text-xs font-black text-[#102a2e] disabled:opacity-40">Save assignment</button></div>
            <div className="grid gap-2 sm:grid-cols-3"><button onClick={()=>act(selectedComplaint.id,"start")} disabled={busy===selectedComplaint.id||selectedComplaint.status==="in_progress"||selectedComplaint.status==="resolved"} className="rounded-xl border border-slate-200 py-3 text-xs font-black disabled:opacity-40"><Wrench className="mr-1 inline h-3.5 w-3.5"/>Start work</button><button onClick={()=>act(selectedComplaint.id,"resolve")} disabled={busy===selectedComplaint.id||selectedComplaint.status==="resolved"} className="rounded-xl bg-[#102a2e] py-3 text-xs font-black text-white disabled:opacity-40">Resolve case</button><Link href={`/complaints/${selectedComplaint.id}`} className="flex items-center justify-center rounded-xl border border-[#bcefe5] bg-[#e9fbf7] py-3 text-xs font-black text-[#087d69]">Citizen tracking</Link></div>
          </div>
        </div>
      </div>}
    </div>
  </div>;
}
