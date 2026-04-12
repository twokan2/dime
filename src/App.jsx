import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ES_LEVELS, ES_Q } from "./es_questions";
import { FR_LEVELS, FR_Q } from "./fr_questions";
import { ZH_LEVELS, ZH_Q } from "./zh_questions";

const firebaseConfig = {
  apiKey: "AIzaSyBvn9IZcL618S2jhArXWa--K123Y1i-f7g",
  authDomain: "ds-dynamic-app.firebaseapp.com",
  projectId: "ds-dynamic-app",
  storageBucket: "ds-dynamic-app.firebasestorage.app",
  messagingSenderId: "366254576022",
  appId: "1:366254576022:web:dd0a197b734f498e8fcdb7"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_EMAIL = "twokan2@gmail.com";

const LANGS = {
  es: { name: "Spanish", flag: "🇪🇸", label: "Español", speech: "es-MX" },
  fr: { name: "French", flag: "🇫🇷", label: "Français", speech: "fr-FR" },
  zh: { name: "Chinese", flag: "🇨🇳", label: "中文 Mandarin", speech: "zh-CN" },
};

const LEVEL_DATA = { es: ES_LEVELS, fr: FR_LEVELS, zh: ZH_LEVELS };
const Q_DATA = { es: ES_Q, fr: FR_Q, zh: ZH_Q };

const speak = (text, lang = "es-MX") => {
  try { if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = 0.82; const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(lang.split("-")[0])); if (v) u.voice = v; window.speechSynthesis.speak(u); }} catch (e) {}
};

const useSound = () => {
  const c = useRef(null);
  const g = () => { if (!c.current) c.current = new (window.AudioContext || window.webkitAudioContext)(); return c.current; };
  return (t) => { try { const x=g(),o=x.createOscillator(),gn=x.createGain(); o.connect(gn); gn.connect(x.destination);
    if(t==="ok"){o.frequency.setValueAtTime(523,x.currentTime);o.frequency.setValueAtTime(659,x.currentTime+.1);o.frequency.setValueAtTime(784,x.currentTime+.2);gn.gain.setValueAtTime(.1,x.currentTime);gn.gain.exponentialRampToValueAtTime(.01,x.currentTime+.4);o.start(x.currentTime);o.stop(x.currentTime+.4);}
    else if(t==="no"){o.frequency.setValueAtTime(200,x.currentTime);o.frequency.setValueAtTime(150,x.currentTime+.15);o.type="sawtooth";gn.gain.setValueAtTime(.07,x.currentTime);gn.gain.exponentialRampToValueAtTime(.01,x.currentTime+.3);o.start(x.currentTime);o.stop(x.currentTime+.3);}
    else if(t==="up"){[523,659,784,1047].forEach((f,i)=>{const oo=x.createOscillator(),gg=x.createGain();oo.connect(gg);gg.connect(x.destination);oo.frequency.setValueAtTime(f,x.currentTime+i*.12);gg.gain.setValueAtTime(.08,x.currentTime+i*.12);gg.gain.exponentialRampToValueAtTime(.01,x.currentTime+i*.12+.3);oo.start(x.currentTime+i*.12);oo.stop(x.currentTime+i*.12+.3);});}
  } catch(e){} };
};

export default function Dime() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authName, setAuthName] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [scr, setScr] = useState("landing");
  const [lang, setLang] = useState("es");
  const [prog, setProg] = useState({});
  const [lvl, setLvl] = useState(0);
  const [qi, setQi] = useState(0);
  const [pts, setPts] = useState(0);
  const [sel, setSel] = useState(null);
  const [show, setShow] = useState(false);
  const [qs, setQs] = useState([]);
  const [cmb, setCmb] = useState(0);
  const [res, setRes] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [mustPass, setMustPass] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const snd = useSound();

  const LEVELS = LEVEL_DATA[lang] || ES_LEVELS;
  const QUESTIONS = Q_DATA[lang] || ES_Q;
  const speechLang = LANGS[lang]?.speech || "es-MX";
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    // Check for email link sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("dime_email_for_signin");
      if (!email) email = window.prompt("Please enter your email to confirm sign-in");
      if (email) {
        signInWithEmailLink(auth, email, window.location.href).then(() => {
          window.localStorage.removeItem("dime_email_for_signin");
          window.history.replaceState(null, "", window.location.pathname);
        }).catch(e => console.error(e));
      }
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docSnap = await getDoc(doc(db, "dime_users", u.uid));
        if (docSnap.exists()) { setProg(docSnap.data().progress || {}); setAuthName(docSnap.data().name || ""); }
        setScr("langselect");
      } else { setUser(null); setScr("landing"); }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => { if ("speechSynthesis" in window) window.speechSynthesis.getVoices(); }, []);

  const saveProg = async (np) => {
    setProg(np);
    if (user) { try { await setDoc(doc(db, "dime_users", user.uid), { email: user.email, name: authName || user.email, progress: np, lastUpdated: serverTimestamp() }, { merge: true }); } catch (e) {} }
  };

  const lp = prog[lang] || { xp: 0, streak: 0, last: null, done: [], hi: {}, tc: 0, ta: 0 };
  const setLp = (u) => { const nl = { ...lp, ...u }; saveProg({ ...prog, [lang]: nl, sound: prog.sound !== undefined ? prog.sound : true }); };

  const shuf = (a) => { const r=[...a]; for(let i=r.length-1;i>0;i--){const j=0|Math.random()*(i+1);[r[i],r[j]]=[r[j],r[i]];} return r; };

  const go = (l) => { const d=QUESTIONS[l]; if(!d) return; setLvl(l); setQs(shuf(d).map(q=>({...q,options:shuf(q.o)}))); setQi(0);setPts(0);setCmb(0);setSel(null);setShow(false);setRes([]);setScr("play"); };

  const pick = (a) => {
    if(show) return; const q=qs[qi]; const ok=a===q.a;
    setSel(a); setShow(true); speak(q.a, speechLang);
    if(ok){if(prog.sound!==false)snd("ok");setPts(s=>s+10+Math.min(cmb,5)*2);setCmb(c=>c+1);}
    else{if(prog.sound!==false)snd("no");setCmb(0);}
    setRes(r=>[...r,{ok,q:q.q,you:a,ans:q.a,ex:q.ex,ph:q.ph}]);
    setTimeout(()=>{if(qi+1<qs.length){setQi(i=>i+1);setSel(null);setShow(false);}else{fin(ok?pts+10+Math.min(cmb,5)*2:pts);}},2000);
  };

  const fin = (fs) => {
    if(prog.sound!==false)snd("up");
    const today=new Date().toDateString(); const wt=lp.last===today;
    const cc=res.filter(r=>r.ok).length+(sel===qs[qi]?.a?1:0);
    const allOk=cc===qs.length; const canAdv=!mustPass||allOk;
    setLp({ xp:lp.xp+fs, streak:wt?lp.streak:lp.streak+1, last:today, done:canAdv&&!lp.done.includes(lvl)?[...lp.done,lvl]:lp.done, hi:{...lp.hi,[lvl]:Math.max(lp.hi[lvl]||0,fs)}, tc:lp.tc+cc, ta:lp.ta+qs.length });
    setPts(fs); setScr("results");
  };

  const retryMissed = () => {
    const missed=res.filter(r=>!r.ok);if(!missed.length)return;
    const mq=missed.map(m=>(QUESTIONS[lvl]||[]).find(q=>q.q===m.q)).filter(Boolean).map(q=>({...q,options:shuf(q.o)}));
    setQs(shuf(mq));setQi(0);setSel(null);setShow(false);setRes([]);setScr("play");
  };

  const unlk = (i) => { if(i===0)return true; if(lang==="es"&&i<=9)return lp.done.includes(i-1); if(lang==="es"&&i>9)return lp.done.filter(l=>l<=9).length>=10; return lp.done.includes(i-1); };

  const rank = () => { const x=lp.xp||0; if(x<100)return{l:1,t:"Beginner",n:100};if(x<300)return{l:2,t:"Student",n:300};if(x<600)return{l:3,t:"Apprentice",n:600};if(x<1000)return{l:4,t:"Speaker",n:1000};if(x<1500)return{l:5,t:"Conversationalist",n:1500};return{l:6,t:lang==="es"?"Boricua Honorario 🇵🇷":lang==="fr"?"Citoyen d'Honneur 🇫🇷":"荣誉市民 🇨🇳",n:null}; };

  const r=rank(); const cq=qs[qi];

  const doShare = async () => {
    const t=`I'm learning ${LANGS[lang].name} on Dime ${LANGS[lang].flag}\n\nLevel ${r.l} — ${r.t}\n${lp.xp} XP · ${lp.streak} day streak 🔥\n${lp.done.length}/${LEVELS.length} levels\n\nhttps://playdime.app`;
    if(navigator.share){try{await navigator.share({title:"Dime",text:t});}catch(e){}}
    else{try{await navigator.clipboard.writeText(t);setToast("Copied!");setTimeout(()=>setToast(""),2e3);}catch(e){}}
  };

  const handleSignup = async () => { setAuthErr("");setAuthMsg(""); try { const cred=await createUserWithEmailAndPassword(auth,authEmail,authPass); await setDoc(doc(db,"dime_users",cred.user.uid),{email:authEmail,name:authName,progress:{},createdAt:serverTimestamp(),lastUpdated:serverTimestamp()}); } catch(e){setAuthErr(e.message.replace("Firebase: ",""));} };
  const handleLogin = async () => { setAuthErr("");setAuthMsg(""); try{await signInWithEmailAndPassword(auth,authEmail,authPass);}catch(e){setAuthErr(e.message.replace("Firebase: ",""));} };
  const handleLogout = async () => { await signOut(auth); setScr("landing"); };
  const handleResetPassword = async () => { setAuthErr("");setAuthMsg(""); try{await sendPasswordResetEmail(auth,authEmail);setAuthMsg("Reset email sent! Check your inbox.");}catch(e){setAuthErr(e.message.replace("Firebase: ",""));} };
  const handleEmailLink = async () => {
    setAuthErr("");setAuthMsg("");
    try {
      await sendSignInLinkToEmail(auth,authEmail,{url:window.location.origin+window.location.pathname,handleCodeInApp:true});
      window.localStorage.setItem("dime_email_for_signin",authEmail);
      setAuthMsg("Sign-in link sent! Check your email.");
    } catch(e){setAuthErr(e.message.replace("Firebase: ",""));}
  };

  const loadAdminUsers = async () => {
    try { const snap=await getDocs(query(collection(db,"dime_users"),orderBy("lastUpdated","desc"))); const users=[]; snap.forEach(d=>{users.push({id:d.id,...d.data()});}); setAdminUsers(users); } catch(e){console.error(e);}
  };

  const C = { bg:"#0B0B0F", card:"rgba(255,255,255,0.028)", border:"rgba(255,255,255,0.05)", gold:"#E8A838", cyan:"#06B6D4", red:"#EF4444", green:"#10B981", text:"#E5E2ED", sub:"rgba(255,255,255,0.35)", muted:"rgba(255,255,255,0.15)" };
  const Btn = ({children,primary,onClick,style:sx,disabled}) => <button onClick={onClick} disabled={disabled} style={{background:primary?`linear-gradient(135deg,${C.gold},#D97706)`:C.card,border:primary?"none":`1px solid ${C.border}`,borderRadius:12,padding:"14px 24px",fontSize:15,fontWeight:700,color:primary?"#0B0B0F":C.text,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",opacity:disabled?0.4:1,...sx}}>{children}</button>;

  if(authLoading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontFamily:"'Playfair Display', serif",fontSize:32}}>dime</div>;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Instrument Sans','DM Sans',system-ui,sans-serif",color:C.text,position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,168,56,0.04) 0%,transparent 60%)",top:"-20%",right:"-20%",filter:"blur(100px)"}}/>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(6,182,212,0.03) 0%,transparent 60%)",bottom:"10%",left:"-10%",filter:"blur(80px)"}}/>
      </div>
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:C.gold,color:"#000",padding:"10px 28px",borderRadius:100,fontSize:13,fontWeight:700,zIndex:999}}>{toast}</div>}

      <div style={{position:"relative",zIndex:1,maxWidth:440,margin:"0 auto",padding:"0 24px"}}>

        {/* LANDING / AUTH */}
        {scr==="landing"&&!user&&(
          <div style={{paddingTop:"18vh",textAlign:"center",paddingBottom:60}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:72,fontWeight:900,margin:"0 0 4px",color:C.gold,letterSpacing:-3,lineHeight:1}}>dime</h1>
            <div style={{fontSize:13,color:C.sub,letterSpacing:3,fontWeight:600,marginBottom:32,fontStyle:"italic"}}>"dee-meh" — talk to me</div>
            <p style={{fontSize:15,color:C.sub,lineHeight:1.7,maxWidth:300,margin:"0 auto 32px"}}>Learn conversational Spanish, French & Chinese. Real scenarios, not flashcards.</p>
            <div style={{textAlign:"left",maxWidth:320,margin:"0 auto"}}>
              {authScreen==="signup"&&<input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your name" style={{width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:14,fontFamily:"inherit",marginBottom:10,boxSizing:"border-box"}}/>}
              <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:14,fontFamily:"inherit",marginBottom:10,boxSizing:"border-box"}}/>
              {authScreen!=="emaillink"&&<input value={authPass} onChange={e=>setAuthPass(e.target.value)} placeholder="Password" type="password" style={{width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:14,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box"}}/>}
              {authErr&&<div style={{color:C.red,fontSize:12,marginBottom:10}}>{authErr}</div>}
              {authMsg&&<div style={{color:C.green,fontSize:12,marginBottom:10}}>{authMsg}</div>}
              {authScreen==="login"&&<><Btn primary onClick={handleLogin}>Log In</Btn><div style={{display:"flex",justifyContent:"space-between",marginTop:12}}><button onClick={()=>{setAuthScreen("signup");setAuthErr("");setAuthMsg("");}} style={{background:"none",border:"none",color:C.sub,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Create account</button><button onClick={handleResetPassword} style={{background:"none",border:"none",color:C.gold,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Forgot password?</button></div><div style={{textAlign:"center",marginTop:12}}><button onClick={()=>{setAuthScreen("emaillink");setAuthErr("");setAuthMsg("");}} style={{background:"none",border:"none",color:C.sub,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Sign in with email link (no password)</button></div></>}
              {authScreen==="signup"&&<><Btn primary onClick={handleSignup}>Create Account</Btn><div style={{textAlign:"center",marginTop:12}}><button onClick={()=>{setAuthScreen("login");setAuthErr("");setAuthMsg("");}} style={{background:"none",border:"none",color:C.sub,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Already have an account? Log in</button></div></>}
              {authScreen==="emaillink"&&<><Btn primary onClick={handleEmailLink}>Send Sign-In Link</Btn><div style={{textAlign:"center",marginTop:12}}><button onClick={()=>{setAuthScreen("login");setAuthErr("");setAuthMsg("");}} style={{background:"none",border:"none",color:C.sub,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Back to password login</button></div></>}
            </div>
            <div style={{fontSize:10,color:C.muted,marginTop:48,letterSpacing:1}}>Built by The Premise</div>
          </div>
        )}

        {/* LANGUAGE SELECT */}
        {scr==="langselect"&&(
          <div style={{paddingTop:48,textAlign:"center",paddingBottom:60}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:900,margin:"0 0 4px",color:C.gold,letterSpacing:-2}}>dime</h1>
            <div style={{fontSize:12,color:C.sub,letterSpacing:3,marginBottom:36,fontStyle:"italic"}}>"dee-meh" — talk to me</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:20}}>Choose your language</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:320,margin:"0 auto"}}>
              {Object.entries(LANGS).map(([key,val])=>(
                <button key={key} onClick={()=>{setLang(key);setScr("home");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",width:"100%",color:"inherit",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s"}}>
                  <span style={{fontSize:28}}>{val.flag}</span>
                  <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{val.name}</div><div style={{fontSize:11,color:C.sub}}>{val.label}</div></div>
                </button>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:32}}>
              {isAdmin&&<button onClick={()=>{loadAdminUsers();setScr("admin");}} style={{background:"none",border:`1px solid ${C.gold}`,borderRadius:8,padding:"8px 16px",color:C.gold,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>ADMIN</button>}
              <button onClick={handleLogout} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>LOG OUT</button>
            </div>
            <div style={{fontSize:10,color:C.muted,marginTop:24,letterSpacing:1}}>Built by The Premise</div>
          </div>
        )}

        {/* ADMIN PANEL */}
        {scr==="admin"&&isAdmin&&(
          <div style={{paddingTop:36,paddingBottom:40}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:C.gold,margin:0}}>Admin</h2>
              <button onClick={()=>setScr("langselect")} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",color:C.sub,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
            </div>
            <div style={{fontSize:12,color:C.sub,marginBottom:16}}>{adminUsers.length} registered users</div>
            <button onClick={loadAdminUsers} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",color:C.text,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>Refresh</button>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {adminUsers.map((u,i)=>{
                const p=u.progress||{};
                const langs=Object.keys(p).filter(k=>k!=="sound");
                const totalXp=langs.reduce((s,l)=>(p[l]?.xp||0)+s,0);
                const totalLevels=langs.reduce((s,l)=>(p[l]?.done?.length||0)+s,0);
                return (
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{fontSize:13,fontWeight:700,color:u.email===ADMIN_EMAIL?C.gold:C.text}}>{u.name||u.email}</div>
                      <div style={{fontSize:10,color:C.muted}}>{u.lastUpdated?.toDate?.()?.toLocaleDateString?.()|| "—"}</div>
                    </div>
                    <div style={{fontSize:11,color:C.sub}}>{u.email}</div>
                    <div style={{display:"flex",gap:12,marginTop:8}}>
                      <div style={{fontSize:11}}><span style={{color:C.gold,fontWeight:700}}>{totalXp}</span> <span style={{color:C.muted}}>XP</span></div>
                      <div style={{fontSize:11}}><span style={{color:C.cyan,fontWeight:700}}>{totalLevels}</span> <span style={{color:C.muted}}>levels</span></div>
                      {langs.map(l=><span key={l} style={{fontSize:14}}>{LANGS[l]?.flag||l}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HOME */}
        {scr==="home"&&(
          <div style={{paddingTop:36,paddingBottom:40}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,margin:0,color:C.gold,letterSpacing:-1}}>dime</h1>
                <button onClick={()=>setScr("langselect")} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",fontSize:18,cursor:"pointer"}}>{LANGS[lang]?.flag}</button>
              </div>
              <div style={{display:"flex",gap:6}}>
                {[{icon:"?",fn:()=>setModal("how")},{icon:prog.sound!==false?"♪":"✕",fn:()=>saveProg({...prog,sound:prog.sound===false})},{icon:"↗",fn:doShare}].map((b,i)=>(
                  <button key={i} onClick={b.fn} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,color:C.sub,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>{b.icon}</button>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {[{l:"XP",v:lp.xp||0,c:C.gold},{l:"STREAK",v:`${lp.streak||0}🔥`,c:"#F97316"},{l:"RANK",v:r.l,c:C.cyan}].map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,flex:1,textAlign:"center",padding:"14px 8px"}}>
                  <div style={{fontSize:20,fontWeight:800,color:s.c,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
                  <div style={{fontSize:8,fontWeight:700,letterSpacing:2.5,color:C.muted,marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.gold,opacity:0.7}}>{r.t}{r.n&&<span style={{opacity:0.4,marginLeft:8}}>· {r.n-(lp.xp||0)} to next</span>}</div>
              {(lp.ta||0)>0&&<div style={{fontSize:11,color:C.muted}}>{Math.round((lp.tc||0)/lp.ta*100)}% acc</div>}
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"10px 14px",background:C.card,borderRadius:10,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:12,color:C.sub}}>Must pass all to advance</div>
              <button onClick={()=>setMustPass(!mustPass)} style={{background:mustPass?C.gold:"rgba(255,255,255,0.06)",border:"none",borderRadius:100,width:42,height:24,cursor:"pointer",position:"relative",transition:"all 0.2s"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:mustPass?21:3,transition:"all 0.2s"}}/>
              </button>
            </div>

            <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:C.muted,marginBottom:10}}>{LANGS[lang]?.name.toUpperCase()}</div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:lang==="es"?24:32}}>
              {LEVELS.slice(0,lang==="es"?10:LEVELS.length).map((lv,i)=>{
                const u=unlk(i),d=lp.done.includes(i),h=lp.hi?.[i];
                return <button key={i} onClick={()=>u&&go(i)} disabled={!u} style={{background:d?"rgba(232,168,56,0.03)":C.card,border:d?`1px solid rgba(232,168,56,0.12)`:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:u?"pointer":"not-allowed",opacity:u?1:0.25,textAlign:"left",transition:"all 0.15s",width:"100%",color:"inherit",fontFamily:"inherit"}}>
                  <div style={{fontSize:22,width:34,textAlign:"center"}}>{lv.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:d?C.gold:C.text}}>{lv.name}</div><div style={{fontSize:11,color:C.sub}}>{lv.desc}</div></div>
                  {d&&h&&<div style={{fontSize:9,fontWeight:700,color:C.gold,background:"rgba(232,168,56,0.08)",padding:"3px 10px",borderRadius:100}}>{h}</div>}
                  {!u&&<span style={{fontSize:13,opacity:0.5}}>🔒</span>}
                </button>;
              })}
            </div>

            {lang==="es"&&(<>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:3,color:"rgba(6,182,212,0.4)"}}>🇵🇷 CARIBBEAN / PR</div>
                {lp.done.filter(l=>l<=9).length<10&&<div style={{fontSize:9,color:C.muted}}>Complete all 10 to unlock</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:32}}>
                {LEVELS.slice(10).map((lv,i)=>{
                  const idx=i+10,u=unlk(idx),d=lp.done.includes(idx),h=lp.hi?.[idx];
                  return <button key={idx} onClick={()=>u&&go(idx)} disabled={!u} style={{background:d?"rgba(6,182,212,0.03)":C.card,border:d?`1px solid rgba(6,182,212,0.12)`:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:u?"pointer":"not-allowed",opacity:u?1:0.25,textAlign:"left",transition:"all 0.15s",width:"100%",color:"inherit",fontFamily:"inherit"}}>
                    <div style={{fontSize:22,width:34,textAlign:"center"}}>{lv.icon}</div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:d?C.cyan:C.text}}>{lv.name}</div><div style={{fontSize:11,color:C.sub}}>{lv.desc}</div></div>
                    {d&&h&&<div style={{fontSize:9,fontWeight:700,color:C.cyan,background:"rgba(6,182,212,0.08)",padding:"3px 10px",borderRadius:100}}>{h}</div>}
                    {!u&&<span style={{fontSize:13,opacity:0.5}}>🔒</span>}
                  </button>;
                })}
              </div>
            </>)}

            <div style={{display:"flex",justifyContent:"center",gap:16}}>
              <button onClick={handleLogout} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>LOG OUT</button>
            </div>
            <div style={{textAlign:"center",fontSize:10,color:C.muted,marginTop:16,letterSpacing:1}}>Built by The Premise</div>
          </div>
        )}

        {/* PLAY */}
        {scr==="play"&&cq&&(
          <div style={{paddingTop:28,paddingBottom:40}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <button onClick={()=>setScr("home")} style={{background:C.card,border:"none",borderRadius:10,padding:"7px 14px",color:C.sub,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>✕ QUIT</button>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {cmb>1&&<div style={{fontSize:12,fontWeight:800,color:"#F97316"}}>{cmb}x🔥</div>}
                <div style={{fontSize:13,fontWeight:700,color:C.gold}}>{pts}</div>
              </div>
            </div>
            <div style={{height:3,background:C.card,borderRadius:100,marginBottom:28,overflow:"hidden"}}><div style={{height:"100%",width:`${qi/qs.length*100}%`,background:`linear-gradient(90deg,${C.gold},#D97706)`,borderRadius:100,transition:"width 0.4s ease"}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:C.muted}}>{LEVELS[lvl]?.icon} {LEVELS[lvl]?.name.toUpperCase()}</div>
              <div style={{fontSize:10,color:C.muted}}>{qi+1}/{qs.length}</div>
            </div>
            <div style={{display:"inline-block",padding:"4px 12px",borderRadius:100,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16,background:cq.type==="translate"?"rgba(232,168,56,0.08)":cq.type==="fillblank"?"rgba(6,182,212,0.08)":"rgba(249,115,22,0.08)",color:cq.type==="translate"?C.gold:cq.type==="fillblank"?C.cyan:"#F97316"}}>
              {cq.type==="translate"?"TRANSLATE":cq.type==="fillblank"?"FILL IN BLANK":"SCENARIO"}
            </div>
            <div style={{fontSize:cq.q.length>50?18:23,fontWeight:800,lineHeight:1.35,marginBottom:28,color:"#F5F3FA",fontFamily:"'Playfair Display',serif"}}>{cq.q}</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {cq.options.map((o,i)=>{
                const iS=sel===o,iC=o===cq.a;let bg=C.card,bd=`1px solid ${C.border}`,tc=C.text;
                if(show&&iC){bg="rgba(16,185,129,0.06)";bd="1px solid rgba(16,185,129,0.25)";tc=C.green;}
                else if(show&&iS){bg="rgba(239,68,68,0.06)";bd="1px solid rgba(239,68,68,0.25)";tc=C.red;}
                return <button key={i} onClick={()=>pick(o)} disabled={show} style={{background:bg,border:bd,borderRadius:12,padding:"13px 16px",fontSize:o.length>40?12:14,fontWeight:600,color:tc,cursor:show?"default":"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit",lineHeight:1.4,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{width:24,height:24,borderRadius:7,background:show&&iC?"rgba(16,185,129,0.1)":show&&iS?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0,color:show&&iC?C.green:show&&iS?C.red:C.muted}}>
                    {show&&iC?"✓":show&&iS&&!iC?"✕":String.fromCharCode(65+i)}
                  </span>
                  <span style={{flex:1}}>{o}</span>
                  {show&&iC&&<button onClick={e=>{e.stopPropagation();speak(o,speechLang);}} style={{background:"rgba(16,185,129,0.08)",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>🔊</button>}
                </button>;
              })}
            </div>
            {show&&<div style={{marginTop:14,padding:"12px 14px",background:"rgba(232,168,56,0.04)",border:`1px solid rgba(232,168,56,0.1)`,borderRadius:10}}>
              {cq.ph&&<div style={{fontSize:12,color:C.gold,fontStyle:"italic",marginBottom:4}}>🔊 {cq.ph}</div>}
              {cq.ex&&<div style={{fontSize:12,color:C.sub,lineHeight:1.5}}>{cq.ex}</div>}
            </div>}
          </div>
        )}

        {/* RESULTS */}
        {scr==="results"&&(
          <div style={{paddingTop:48,paddingBottom:40,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:10}}>{pts>=qs.length*10*.9?"🔥":pts>=qs.length*10*.5?"🤎":"📚"}</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,margin:"0 0 4px",color:C.gold}}>
              {pts>=qs.length*10*.9?(lang==="es"?"¡Brutal!":lang==="fr"?"Fantastique!":"太棒了!"):pts>=qs.length*10*.5?"Getting there":"Keep going"}
            </h2>
            <div style={{fontSize:12,color:C.sub,marginBottom:28}}>{LEVELS[lvl]?.icon} {LEVELS[lvl]?.name}</div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:20}}>
              <div style={{fontSize:42,fontWeight:900,fontFamily:"'Playfair Display',serif",color:C.gold}}>{pts}</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,color:C.muted,marginTop:2}}>POINTS</div>
              <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:18}}>
                {[{v:res.filter(r=>r.ok).length,l:"CORRECT",c:C.green},{v:res.filter(r=>!r.ok).length,l:"WRONG",c:C.red},{v:`${lp.streak||0}🔥`,l:"STREAK",c:"#F97316"}].map((s,i)=>(
                  <div key={i}><div style={{fontSize:17,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:C.muted,letterSpacing:1}}>{s.l}</div></div>
                ))}
              </div>
            </div>
            {res.some(r=>!r.ok)&&(
              <div style={{background:"rgba(239,68,68,0.03)",border:"1px solid rgba(239,68,68,0.08)",borderRadius:14,padding:18,textAlign:"left",marginBottom:20}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:C.red,marginBottom:10}}>REVIEW</div>
                {res.filter(r=>!r.ok).map((r,i)=>(
                  <div key={i} style={{padding:"8px 0",borderBottom:i<res.filter(x=>!x.ok).length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{fontSize:11,color:C.sub,marginBottom:2}}>{r.q}</div>
                    <div style={{fontSize:12,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{color:C.red,textDecoration:"line-through"}}>{r.you}</span>
                      <span style={{color:C.muted}}>→</span>
                      <span style={{color:C.green,fontWeight:700}}>{r.ans}</span>
                      <button onClick={()=>speak(r.ans,speechLang)} style={{background:"rgba(16,185,129,0.06)",border:"none",borderRadius:5,width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🔊</button>
                    </div>
                    {r.ph&&<div style={{fontSize:11,color:C.gold,fontStyle:"italic"}}>🔊 {r.ph}</div>}
                    {r.ex&&<div style={{fontSize:11,color:C.sub,lineHeight:1.4,marginTop:2}}>{r.ex}</div>}
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {res.some(r=>!r.ok)&&<Btn primary onClick={retryMissed}>Retry Missed ({res.filter(r=>!r.ok).length})</Btn>}
              <Btn onClick={()=>go(lvl)}>Play Full Level Again</Btn>
              {lvl+1<LEVELS.length&&unlk(lvl+1)&&(!mustPass||!res.some(r=>!r.ok))&&<Btn onClick={()=>go(lvl+1)}>Next Level →</Btn>}
              {mustPass&&res.some(r=>!r.ok)&&<div style={{fontSize:11,color:C.red,padding:8}}>Clear all questions to unlock next level</div>}
              <Btn onClick={doShare} style={{background:"rgba(255,255,255,0.02)"}}>Share ↗</Btn>
              <button onClick={()=>setScr("home")} style={{background:"none",border:"none",padding:12,fontSize:12,color:C.muted,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>BACK TO LEVELS</button>
            </div>
          </div>
        )}

        {/* HOW TO PLAY */}
        {modal==="how"&&(
          <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.94)",backdropFilter:"blur(16px)",overflowY:"auto",padding:"56px 28px 40px"}}>
            <div style={{maxWidth:400,margin:"0 auto"}}>
              <button onClick={()=>setModal(null)} style={{position:"fixed",top:16,right:16,background:C.card,border:"none",borderRadius:10,width:34,height:34,color:C.sub,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:501}}>✕</button>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:24,color:C.gold}}>How to play</h2>
              {[{i:"🔤",t:"Translate",d:"Pick the correct translation."},{i:"✏️",t:"Fill in Blank",d:"Complete the sentence."},{i:"🎭",t:"Scenario",d:"Real-life situation — choose your response."},{i:"🔊",t:"Audio + Phonetics",d:"Correct answer spoken aloud. Phonetic pronunciation shown."},{i:"💡",t:"Explanations",d:"Every question explains WHY the answer is correct."},{i:"🔒",t:"Must-Pass",d:"Toggle to require 100% before advancing."},{i:"🇵🇷",t:"Caribbean (Spanish)",d:"Complete 10 neutral levels to unlock PR dialect."}].map((x,i)=>(
                <div key={i} style={{display:"flex",gap:14,marginBottom:18}}>
                  <div style={{fontSize:20,width:30,textAlign:"center",flexShrink:0}}>{x.i}</div>
                  <div><div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{x.t}</div><div style={{fontSize:12,color:C.sub,lineHeight:1.5}}>{x.d}</div></div>
                </div>
              ))}
              <div style={{marginTop:16}}><Btn onClick={()=>setModal(null)} style={{borderRadius:100}}>Got it</Btn></div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}button:hover:not(:disabled){filter:brightness(1.08)}button:active:not(:disabled){transform:scale(.98)}*{box-sizing:border-box;margin:0;padding:0}input:focus{outline:1px solid rgba(232,168,56,0.3)}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:100px}`}</style>
    </div>
  );
}
