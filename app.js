const KEY="kings92_data_v1";
const defaultData={
  cuts:[], clients:[
    {id:"c1",name:"João Silva",phone:"(11) 99999-9999",spent:850,open:150},
    {id:"c2",name:"Maria Santos",phone:"(11) 98888-8888",spent:620,open:80},
    {id:"c3",name:"Pedro Oliveira",phone:"(11) 97777-7777",spent:1200,open:200},
    {id:"c4",name:"Lucas Mendes",phone:"(11) 96666-6666",spent:450,open:0},
    {id:"c5",name:"Gabriel Lima",phone:"(11) 95555-5555",spent:310,open:60},
    {id:"c6",name:"Felipe Rocha",phone:"(11) 94444-4444",spent:280,open:40}
  ],
  revenues:[
    {id:"r1",client:"João Silva",desc:"Serviço de Barba",value:150,date:"2026-08-20",status:"A receber"},
    {id:"r2",client:"Maria Santos",desc:"Coloração",value:80,date:"2026-08-18",status:"A receber"},
    {id:"r3",client:"Pedro Oliveira",desc:"Corte + Barba",value:200,date:"2026-08-25",status:"A receber"},
    {id:"r4",client:"Lucas Mendes",desc:"Corte",value:120,date:"2026-08-30",status:"A receber"},
    {id:"r5",client:"Gabriel Lima",desc:"Pigmentação",value:160,date:"2026-08-31",status:"A receber"}
  ],
  expenses:[
    {id:"e1",desc:"Aluguel da loja",value:500,category:"Aluguel",date:"2026-08-14",status:"A vencer"},
    {id:"e2",desc:"Compra de Produtos",value:1250,category:"Mercadorias",date:"2026-08-16",status:"A vencer"},
    {id:"e3",desc:"Conta de Luz",value:180,category:"Contas Fixas",date:"2026-08-18",status:"A vencer"},
    {id:"e4",desc:"Internet",value:120,category:"Contas Fixas",date:"2026-08-20",status:"Pago"},
    {id:"e5",desc:"Cartão Nubank",value:835,category:"Cartão",date:"2026-08-25",status:"A vencer"},
    {id:"e6",desc:"Material de Barbearia",value:320,category:"Materiais",date:"2026-08-28",status:"Pago"},
    {id:"e7",desc:"Salário Funcionário",value:2000,category:"Folha de Pagamento",date:"2026-08-31",status:"A vencer"}
  ],
  movements:[
    {id:"m1",type:"in",desc:"Pagamento - João Silva",value:120,date:"2026-08-14"},
    {id:"m2",type:"out",desc:"Aluguel da loja",value:500,date:"2026-08-14"},
    {id:"m3",type:"in",desc:"Serviço - Maria Santos",value:80,date:"2026-08-13"},
    {id:"m4",type:"out",desc:"Material de limpeza",value:45,date:"2026-08-13"},
    {id:"m5",type:"in",desc:"Pix - Pedro Oliveira",value:150,date:"2026-08-12"}
  ],
  goal:0
};
let data=load();
let page="home";

function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){
  try{
    const old=JSON.parse(localStorage.getItem(KEY));
    if(old) return dedupeAll(old);
  }catch(e){}
  const d=clone(defaultData); save(d); return d;
}
function norm(v){return String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function money(v){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0)}
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function signature(o, fields){
  return fields.map(k=>{
    let v=o[k];
    if(k==="value") v=Number(v||0).toFixed(2);
    if(k==="date") v=String(v||"").slice(0,10);
    return norm(v);
  }).join("|")
}
function dedupe(arr,fields){
  const seen=new Set(), out=[];
  for(const x of (Array.isArray(arr)?arr:[])){
    const s=signature(x,fields);
    if(!seen.has(s)){seen.add(s);out.push(x)}
  }
  return out;
}
function dedupeAll(d){
  d.clients=dedupe(d.clients,["name","phone"]);
  d.revenues=dedupe(d.revenues,["client","desc","value","date"]);
  d.expenses=dedupe(d.expenses,["desc","value","category","date"]);
  d.movements=dedupe(d.movements,["type","desc","value","date"]);
  d.cuts=dedupe(d.cuts,["client","value","date","service"]);
  return d;
}
function save(d=data){localStorage.setItem(KEY,JSON.stringify(d))}
function add(type,obj){
  data[type].push({...obj,id:uid(type[0])});
  data=dedupeAll(data); save(); render();
}
function totals(){
  const incoming=data.movements.filter(x=>x.type==="in").reduce((a,x)=>a+Number(x.value||0),0);
  const outgoing=data.movements.filter(x=>x.type==="out").reduce((a,x)=>a+Number(x.value||0),0);
  const receivable=data.revenues.filter(x=>x.status!=="Recebida").reduce((a,x)=>a+Number(x.value||0),0);
  const payable=data.expenses.filter(x=>x.status!=="Pago").reduce((a,x)=>a+Number(x.value||0),0);
  return {incoming,outgoing,receivable,payable,balance:incoming-outgoing,profit:incoming-outgoing};
}
function render(){
  document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===page));
  document.getElementById("main").innerHTML=pages[page]?pages[page]():pages.home();
  document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{page=b.dataset.nav;closeDrawer();render()});
  bindActions();
}
function header(title,sub=""){
  return `<div style="margin-bottom:12px"><h1 class="page-title">${title}</h1><div class="page-sub">${sub}</div></div>`
}
function pagesHome(){
 const t=totals(), goal=Number(data.goal||0), pct=goal?Math.min(100,t.incoming/goal*100):0;
 return `<div class="page">
 ${header("Central Financeira","Hoje, 14 de Agosto de 2026")}
 <section class="hero"><div class="hero-kicker">FATURAMENTO DE HOJE</div><h1>${money(todayRevenue())}</h1><div class="accent">${todayCuts()} cortes registrados</div><div class="progress"><i style="width:${pct}%"></i></div><div class="progress-row"><span>${goal?`Meta diária ${money(goal)}`:"Meta diária não definida"}</span><span>${Math.round(pct)}%</span></div></section>
 <div class="grid2"><div class="card"><div class="label">ÚLTIMOS 7 DIAS</div><div class="big">${money(weekRevenue())}</div><small>${weekCuts()} cortes</small></div><div class="card"><div class="label">MÊS ATUAL</div><div class="big">${money(monthRevenue())}</div><small>${monthCuts()} cortes</small></div></div>
 <section class="fin-card"><div class="fin-head"><div><div class="page-sub">VISÃO FINANCEIRA</div><h2>Central Financeira</h2></div><button data-nav="cash">Ver caixa →</button></div>
 <div class="fin-grid"><div class="stat"><small>Entradas</small><b class="green">${money(t.incoming)}</b></div><div class="stat"><small>Saídas</small><b class="red">${money(t.outgoing)}</b></div><div class="stat"><small>A Receber</small><b class="blue">${money(t.receivable)}</b></div><div class="stat"><small>A Pagar</small><b class="gold">${money(t.payable)}</b></div></div>
 <div class="quick-grid"><button class="quick greenbtn" data-action="quickIn"><span class="qi">＋</span>Entrada</button><button class="quick redbtn" data-action="quickOut"><span class="qi">−</span>Saída</button><button class="quick bluebtn" data-action="addClient"><span class="qi">♙</span>Cliente</button></div></section>
 <div class="section-title">Movimentações recentes</div>${movementRows(data.movements.slice().reverse().slice(0,5))}
 </div>`
}
function todayRevenue(){return data.cuts.filter(x=>x.date==="2026-08-14").reduce((a,x)=>a+Number(x.value||0),0)}
function todayCuts(){return data.cuts.filter(x=>x.date==="2026-08-14").length}
function weekRevenue(){return data.cuts.reduce((a,x)=>a+Number(x.value||0),0)}
function weekCuts(){return data.cuts.length}
function monthRevenue(){return data.cuts.filter(x=>String(x.date).startsWith("2026-08")).reduce((a,x)=>a+Number(x.value||0),0)}
function monthCuts(){return data.cuts.filter(x=>String(x.date).startsWith("2026-08")).length}
function movementRows(arr){return arr.map(x=>`<div class="row"><div class="row-icon ${x.type==="in"?"green":"red"}">${x.type==="in"?"↑":"↓"}</div><div class="row-main"><b>${esc(x.desc)}</b><small>${brDate(x.date)}</small></div><div class="row-price ${x.type==="in"?"green":"red"}">${money(x.value)}</div></div>`).join("")||`<div class="empty"><strong>Nenhuma movimentação</strong>Comece registrando uma entrada ou saída.</div>`}
function pagesCash(){const t=totals();return `<div class="page">${header("Caixa","Controle de entradas e saídas")}
<div class="grid2"><button class="quick greenbtn" data-action="quickIn"><span class="qi">＋</span>Entrada rápida</button><button class="quick redbtn" data-action="quickOut"><span class="qi">−</span>Saída rápida</button></div>
<div class="metric-row" style="margin-top:12px"><div class="metric"><span>Total Entradas</span><b class="green">${money(t.incoming)}</b></div><div class="metric"><span>Total Saídas</span><b class="red">${money(t.outgoing)}</b></div></div>
<div class="fin-card" style="text-align:center"><div class="page-sub">Saldo do Período</div><div style="font-size:35px;font-weight:950;margin-top:7px" class="${t.balance>=0?"green":"red"}">${money(t.balance)}</div></div>
<div class="section-title">Movimentações Recentes</div>${movementRows(data.movements.slice().reverse())}</div>`}
function pagesExpenses(){return `<div class="page">${header("Despesas","Gerencie suas despesas")}<div class="filter"><button class="active">Todas</button><button>A vencer</button><button>Vencidas</button><button>Pagas</button></div>${data.expenses.map(expenseRow).join("")}<button class="fab" data-action="addExpense">＋</button></div>`}
function expenseRow(e){return `<div class="row"><div class="row-icon">${iconFor(e.category)}</div><div class="row-main"><b>${esc(e.desc)}</b><small>Venc: ${brDate(e.date)} · ${esc(e.category)}</small></div><div style="text-align:right"><div class="row-price red">${money(e.value)}</div><small class="${e.status==="Pago"?"green":"gold"}">${e.status}</small></div></div>`}
function pagesClients(){return `<div class="page">${header("Clientes","Seus clientes cadastrados")}<input class="search" id="clientSearch" placeholder="⌕  Buscar cliente..."><div id="clientList">${clientRows(data.clients)}</div><button class="fab" data-action="addClient">＋</button></div>`}
function clientRows(arr){return arr.map(c=>`<div class="row"><div class="row-icon">♙</div><div class="row-main"><b>${esc(c.name)}</b><small>${esc(c.phone)}<br>Total gasto: ${money(c.spent)}</small></div><div style="text-align:right"><small class="${c.open?"red":"green"}">${c.open?"Em aberto":"✓"}</small><div class="row-price ${c.open?"red":"green"}">${money(c.open)}</div></div></div>`).join("")||`<div class="empty"><strong>Nenhum cliente</strong>Cadastre seu primeiro cliente.</div>`}
function pagesReceivables(){return `<div class="page">${header("Receitas","Contas a receber")}<div class="filter"><button class="active">A Receber</button><button>Recebidas</button><button>Todas</button></div>${data.revenues.map(revenueRow).join("")}<button class="fab" data-action="addRevenue">＋</button></div>`}
function revenueRow(r){return `<div class="row"><div class="row-icon">♙</div><div class="row-main"><b>${esc(r.client)}</b><small>${brDate(r.date)}<br>${esc(r.desc)}</small></div><div style="text-align:right"><div class="row-price ${r.status==="Recebida"?"green":"red"}">${money(r.value)}</div><small class="${r.status==="Recebida"?"green":"gold"}">${r.status}</small></div></div>`}
function pagesCalendar(){let cells=["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];for(let i=1;i<=31;i++)cells.push(`<div class="cal-cell"><b>${i}</b>${i%3===0?`<span class="pill in">R$ ${i*25}</span>`:""}${i%7===0?`<span class="pill out">R$ ${i*20}</span>`:""}</div>`);return `<div class="page">${header("Calendário","Visualize entradas e saídas")}<div class="fin-card"><div class="fin-head"><button>‹</button><b>Agosto 2026</b><button>›</button></div></div><div class="calendar">${cells.map((x,i)=>i<7?`<div class="cal-head">${x}</div>`:x).join("")}</div></div>`}
function pagesReports(){const t=totals();return `<div class="page">${header("Relatórios","Análises e gráficos")}<div class="metric-row"><div class="metric"><span>Entradas</span><b class="green">${money(t.incoming)}</b></div><div class="metric"><span>Saídas</span><b class="red">${money(t.outgoing)}</b></div><div class="metric"><span>Lucro</span><b class="blue">${money(t.profit)}</b></div><div class="metric"><span>Margem</span><b class="gold">${t.incoming?(t.profit/t.incoming*100).toFixed(2):"0,00"}%</b></div></div><div class="fin-card"><b>Entradas x Saídas</b><div class="chart">${[30,52,42,70,55,82,62,77,66,88,70,92].map(v=>`<i class="bar" style="height:${v}%"></i>`).join("")}${[18,25,20,38,29,45,35,49,40,54,44,58].map(v=>`<i class="bar r" style="height:${v}%"></i>`).join("")}</div></div></div>`}
function pagesCategories(){const map={};data.expenses.forEach(e=>map[e.category]=(map[e.category]||0)+Number(e.value||0));return `<div class="page">${header("Despesas por Categoria","Agosto 2026")}${Object.entries(map).map(([k,v])=>`<div class="row"><div class="row-icon">${iconFor(k)}</div><div class="row-main"><b>${esc(k)}</b><small>Despesas registradas</small></div><div class="row-price red">${money(v)}</div></div>`).join("")}</div>`}
function pagesMore(){return `<div class="page">${header("Mais","Configurações e ferramentas")}<div class="more-list">${[
["Categorias","Gerencie categorias de receitas e despesas","categories"],["Contas","Gerencie suas contas e cartões","cash"],["Formas de Pagamento","Débito, Pix, Cartão...","settings"],["Backup & Restauração","Faça backup dos seus dados","settings"],["Segurança","Bloqueio e dados","settings"],["Sobre o KINGS","Versão 9.2.1","about"]
].map(x=>`<button class="row" style="width:100%;text-align:left" data-nav="${x[2]}"><div class="row-icon">◆</div><div class="row-main"><b>${x[0]}</b><small>${x[1]}</small></div><span>›</span></button>`).join("")}</div></div>`}
function pagesSettings(){return `<div class="page">${header("Configurações","KINGS 9.2.1")}<div class="fin-card"><div class="section-title" style="margin-top:0">Meta diária</div><div class="field"><input id="goalInput" class="search" type="number" value="${data.goal||""}" placeholder="Ex.: 1000"></div><button class="save" data-action="saveGoal">Salvar meta</button></div><div class="fin-card"><div class="section-title" style="margin-top:0">Deduplicação</div><p class="page-sub">O KINGS remove automaticamente registros idênticos de cortes, clientes, receitas, despesas e movimentações antes de salvar.</p><button class="save" data-action="dedupe">Verificar e eliminar duplicados agora</button></div><div class="fin-card"><div class="section-title" style="margin-top:0">Backup</div><button class="save" data-action="export">Exportar backup JSON</button></div></div>`}
function pagesAbout(){return `<div class="page">${header("Sobre o KINGS","Sistema Financeiro")}<div class="hero"><div class="hero-kicker">KINGS 9.2.1</div><h1 style="font-size:32px">Completo e profissional</h1><div class="accent">100% offline • PWA instalável</div><div class="section-title">✓ Deduplicação automática</div><div class="section-title">✓ Backup e restauração</div></div></div>`}
const pages={home:pagesHome,cash:pagesCash,expenses:pagesExpenses,clients:pagesClients,receivables:pagesReceivables,calendar:pagesCalendar,reports:pagesReports,categories:pagesCategories,more:pagesMore,settings:pagesSettings,about:pagesAbout};

function bindActions(){
 const s=document.getElementById("clientSearch"); if(s)s.oninput=()=>document.getElementById("clientList").innerHTML=clientRows(data.clients.filter(c=>norm(c.name).includes(norm(s.value))||norm(c.phone).includes(norm(s.value))));
}
function openModal(html){document.getElementById("modalBody").innerHTML=html;document.getElementById("modal").classList.add("open")}
function closeModal(){document.getElementById("modal").classList.remove("open")}
function closeDrawer(){document.getElementById("drawer").classList.remove("open")}
function bindGlobal(){
 document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-nav]"); if(nav){page=nav.dataset.nav;closeModal();closeDrawer();render();return}
  const a=e.target.closest("[data-action]"); if(!a)return;
  const act=a.dataset.action;
  if(act==="menu")document.getElementById("drawer").classList.add("open");
  if(act==="closeDrawer")closeDrawer();
  if(act==="settings"){page="settings";render()}
  if(act==="closeModal")closeModal();
  if(act==="quickIn")openEntry("in");
  if(act==="quickOut")openEntry("out");
  if(act==="addClient")openClient();
  if(act==="addExpense")openExpense();
  if(act==="addRevenue")openRevenue();
  if(act==="saveGoal"){data.goal=Number(document.getElementById("goalInput").value||0);save();closeModal();render()}
  if(act==="dedupe"){const before=countAll(data);data=dedupeAll(data);save();alert(`Verificação concluída. ${before-countAll(data)} duplicado(s) removido(s).`);render()}
  if(act==="export"){download("kings-9.2.1-backup.json",JSON.stringify(data,null,2),"application/json")}
 });
}
function openEntry(type){openModal(`<h2>${type==="in"?"Nova Entrada":"Nova Saída"}</h2><div class="field"><label>DESCRIÇÃO</label><input id="fDesc" placeholder="${type==="in"?"Pagamento - Cliente":"Aluguel da loja"}"></div><div class="field"><label>VALOR</label><input id="fValue" type="number" step="0.01" placeholder="0,00"></div><div class="field"><label>DATA</label><input id="fDate" type="date" value="2026-08-14"></div><button class="save" id="modalSave">Salvar</button>`);document.getElementById("modalSave").onclick=()=>{add("movements",{type,desc:document.getElementById("fDesc").value,value:Number(document.getElementById("fValue").value||0),date:document.getElementById("fDate").value});closeModal()}}
function openClient(){openModal(`<h2>Novo Cliente</h2><div class="field"><label>NOME</label><input id="cName" placeholder="Nome completo"></div><div class="field"><label>TELEFONE</label><input id="cPhone" placeholder="(11) 99999-9999"></div><button class="save" id="modalSave">Salvar cliente</button>`);document.getElementById("modalSave").onclick=()=>{add("clients",{name:document.getElementById("cName").value,phone:document.getElementById("cPhone").value,spent:0,open:0});closeModal()}}
function openExpense(){openModal(`<h2>Nova Despesa</h2><div class="field"><label>DESCRIÇÃO</label><input id="eDesc" placeholder="Aluguel da loja"></div><div class="field"><label>VALOR</label><input id="eValue" type="number" step="0.01"></div><div class="field"><label>CATEGORIA</label><select id="eCat"><option>Aluguel</option><option>Mercadorias</option><option>Contas Fixas</option><option>Cartão</option><option>Materiais</option><option>Folha de Pagamento</option><option>Outros</option></select></div><div class="field"><label>VENCIMENTO</label><input id="eDate" type="date" value="2026-08-14"></div><button class="save" id="modalSave">Salvar despesa</button>`);document.getElementById("modalSave").onclick=()=>{const e={desc:document.getElementById("eDesc").value,value:Number(document.getElementById("eValue").value||0),category:document.getElementById("eCat").value,date:document.getElementById("eDate").value,status:"A vencer"};add("expenses",e);data.movements.push({id:uid("m"),type:"out",desc:e.desc,value:e.value,date:e.date});data=dedupeAll(data);save();closeModal();render()}}
function openRevenue(){openModal(`<h2>Nova Receita</h2><div class="field"><label>CLIENTE</label><input id="rClient" placeholder="João Silva"></div><div class="field"><label>DESCRIÇÃO</label><input id="rDesc" placeholder="Serviço"></div><div class="field"><label>VALOR</label><input id="rValue" type="number" step="0.01"></div><div class="field"><label>VENCIMENTO</label><input id="rDate" type="date" value="2026-08-20"></div><button class="save" id="modalSave">Salvar receita</button>`);document.getElementById("modalSave").onclick=()=>{add("revenues",{client:document.getElementById("rClient").value,desc:document.getElementById("rDesc").value,value:Number(document.getElementById("rValue").value||0),date:document.getElementById("rDate").value,status:"A receber"});closeModal()}}
function countAll(d){return ["cuts","clients","revenues","expenses","movements"].reduce((a,k)=>a+(d[k]?.length||0),0)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function brDate(v){if(!v)return "";const [y,m,d]=String(v).slice(0,10).split("-");return d&&m&&y?`${d}/${m}/${y}`:v}
function iconFor(k){return ({Aluguel:"⌂",Mercadorias:"🛒","Contas Fixas":"●",Cartão:"▣",Materiais:"✂","Folha de Pagamento":"$"}[k]||"◆")}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
bindGlobal();render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js?v=921").catch(()=>{});
