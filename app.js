
const KEY="kings9-data";
const seed={
 entries:[
  {id:1,desc:"Pagamento - João Silva",amount:120,date:"2026-08-14",type:"Pix"},
  {id:2,desc:"Serviço - Maria Santos",amount:80,date:"2026-08-13",type:"Serviço"},
  {id:3,desc:"Pix - Pedro Oliveira",amount:150,date:"2026-08-13",type:"Pix"}
 ],
 exits:[
  {id:4,desc:"Aluguel da loja",amount:500,date:"2026-08-14",category:"Aluguel",type:"Fixa",installment:"1/1"},
  {id:5,desc:"Material de limpeza",amount:45,date:"2026-08-13",category:"Materiais",type:"Variável",installment:"1/1"}
 ],
 expenses:[
  {id:10,desc:"Compra de Produtos",amount:1250,due:"2026-08-15",category:"Mercadorias",type:"Variável",installments:2,current:1,status:"A vencer"},
  {id:11,desc:"Conta de Luz",amount:180,due:"2026-08-16",category:"Contas Fixas",type:"Fixa",installments:1,current:1,status:"A vencer"},
  {id:12,desc:"Cartão Nubank",amount:835,due:"2026-08-25",category:"Cartão",type:"Cartão",installments:3,current:2,status:"A vencer"}
 ],
 clients:[
  {id:20,name:"João Silva",phone:"(11) 99999-9999",open:150,total:850},
  {id:21,name:"Maria Santos",phone:"(11) 98888-8888",open:80,total:820},
  {id:22,name:"Pedro Oliveira",phone:"(11) 97777-7777",open:200,total:1200},
  {id:23,name:"Lucas Mendes",phone:"(11) 96666-6666",open:0,total:430}
 ],
 receivables:[
  {id:30,client:"João Silva",amount:150,due:"2026-08-20",desc:"Serviço de Barba",status:"A receber"},
  {id:31,client:"Maria Santos",amount:80,due:"2026-08-18",desc:"Coloração",status:"A receber"},
  {id:32,client:"Pedro Oliveira",amount:200,due:"2026-08-25",desc:"Corte + Barba",status:"A receber"}
 ]
};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||seed;
let tab="inicio";
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n||0);
const sum=a=>a.reduce((s,x)=>s+Number(x.amount||0),0);
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const today=new Date().toISOString().slice(0,10);

function render(){
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 const views={inicio:home,caixa:caixa,receitas:receitas,despesas:despesas,clientes:clientes,mais:mais};
 document.getElementById("view").innerHTML=views[tab]();
 bind();
}
function header(title,sub=""){return `<h1>${title}</h1>${sub?`<div class="subtitle">${sub}</div>`:""}`}
function home(){
 const ent=sum(data.entries), out=sum(data.exits), recv=sum(data.receivables.filter(x=>x.status==="A receber")), pay=sum(data.expenses.filter(x=>x.status!=="Paga"));
 return header("Central Financeira","Hoje, ${new Date().toLocaleDateString("pt-BR")}")+
 `<div class="grid">
  <div class="card"><div class="label">Entradas</div><div class="value green">${money(ent)}</div></div>
  <div class="card"><div class="label">Saídas</div><div class="value red">${money(out)}</div></div>
  <div class="card"><div class="label">A Receber</div><div class="value blue">${money(recv)}</div></div>
  <div class="card"><div class="label">A Pagar</div><div class="value gold">${money(pay)}</div></div>
 </div>
 <div class="hero section"><div>Saldo Disponível</div><div class="big green">${money(ent-out)}</div><div class="subtitle">Entradas − saídas</div></div>
 <div class="section"><div class="section-head"><h2>Atalhos rápidos</h2></div>
 <div class="quick"><button class="btn primary" data-action="entry">＋ Entrada</button><button class="btn danger" data-action="exit">− Saída</button></div></div>
 <div class="section"><div class="section-head"><h2>Resumo do mês</h2><button class="btn small" data-tabto="relatorios">Detalhes</button></div>
 <div class="grid"><div class="card"><div class="label">Entradas</div><div class="value green">${money(ent)}</div></div><div class="card"><div class="label">Saídas</div><div class="value red">${money(out)}</div></div><div class="card"><div class="label">Lucro</div><div class="value blue">${money(ent-out)}</div></div><div class="card"><div class="label">Pendências</div><div class="value gold">${money(recv+pay)}</div></div></div></div>`;
}
function caixa(){
 const ent=sum(data.entries),out=sum(data.exits);
 return header("Caixa","Controle de entradas e saídas")+
 `<div class="quick"><button class="btn primary" data-action="entry">＋ Entrada rápida</button><button class="btn danger" data-action="exit">− Saída rápida</button></div>
 <div class="grid section"><div class="card"><div class="label">Total de entradas</div><div class="value green">${money(ent)}</div></div><div class="card"><div class="label">Total de saídas</div><div class="value red">${money(out)}</div></div></div>
 <div class="hero section"><div>Saldo do período</div><div class="big green">${money(ent-out)}</div></div>
 <div class="section"><div class="section-head"><h2>Movimentações recentes</h2></div><div class="list">${[...data.entries.map(x=>({...x,kind:"Entrada"})),...data.exits.map(x=>({...x,kind:"Saída"}))].sort((a,b)=>b.id-a.id).map(x=>`<div class="item"><div><div class="item-title">${x.desc}</div><div class="meta">${x.date} · ${x.type||"Outros"}</div></div><div class="item-right"><div class="amount ${x.kind==="Entrada"?"green":"red"}">${x.kind==="Entrada"?"+":"−"} ${money(x.amount)}</div><span class="pill ${x.kind==="Entrada"?"green":"red"}">${x.kind.toUpperCase()}</span></div></div>`).join("")||`<div class="empty">Nenhuma movimentação</div>`}</div></div>`;
}
function receitas(){
 const total=sum(data.receivables.filter(x=>x.status==="A receber"));
 return header("Receitas","Contas a receber")+
 `<div class="hero"><div>Total a receber</div><div class="big blue">${money(total)}</div></div>
 <div class="filters"><button class="btn sel">A receber</button><button class="btn">Recebidas</button><button class="btn">Todas</button></div>
 <div class="list">${data.receivables.map(x=>`<div class="item"><div><div class="item-title">${x.client}</div><div class="meta">Venc: ${brDate(x.due)} · ${x.desc}</div></div><div class="item-right"><div class="amount blue">${money(x.amount)}</div><span class="pill blue">${x.status}</span></div></div>`).join("")}</div>
 <div class="section"><button class="btn primary" data-action="receivable">＋ Nova receita</button></div>`;
}
function despesas(){
 const total=sum(data.expenses.filter(x=>x.status!=="Paga"));
 return header("Despesas","Vencimentos, parcelas e tipos de despesa")+
 `<div class="hero"><div>Total a pagar</div><div class="big red">${money(total)}</div></div>
 <div class="filters"><button class="btn sel">Todas</button><button class="btn">A vencer</button><button class="btn">Vencidas</button><button class="btn">Pagas</button></div>
 <input class="search" id="expenseSearch" placeholder="🔎 Buscar despesa...">
 <div class="list section">${data.expenses.map(x=>`<div class="item"><div><div class="item-title">${x.desc}</div><div class="meta">Venc: ${brDate(x.due)} · ${x.category}</div><div class="meta">${x.type} · Parcela ${x.current}/${x.installments}</div></div><div class="item-right"><div class="amount red">${money(x.amount)}</div><span class="pill ${x.status==="Paga"?"green":"red"}">${x.status}</span><div style="margin-top:7px"><button class="btn small" data-edit-expense="${x.id}">Editar</button></div></div></div>`).join("")}</div>
 <div class="section"><button class="btn danger" data-action="expense">＋ Nova despesa</button></div>`;
}
function clientes(){
 return header("Clientes","Clientes cadastrados e controle de fiado")+
 `<input class="search" id="clientSearch" placeholder="🔎 Buscar cliente...">
 <div class="list section">${data.clients.map(x=>`<div class="item"><div><div class="item-title">♙ ${x.name}</div><div class="meta">${x.phone||"Sem telefone"} · Total gasto ${money(x.total)}</div></div><div class="item-right"><div class="amount ${x.open?"red":"green"}">${x.open?money(x.open):"Sem pendências"}</div><span class="pill ${x.open?"red":"green"}">${x.open?"Em aberto":"Em dia"}</span></div></div>`).join("")}</div>
 <div class="section"><button class="btn blue" data-action="client">＋ Novo cliente</button></div>`;
}
function mais(){
 return header("Mais","Ferramentas da KINGS 9")+
 `<div class="list">
  <button class="item" data-action="calendar"><div><div class="item-title">Calendário financeiro</div><div class="meta">Visualize entradas e saídas por dia</div></div><b>›</b></button>
  <button class="item" data-action="reports"><div><div class="item-title">Relatórios</div><div class="meta">Resumo, lucro e gráficos</div></div><b>›</b></button>
  <button class="item" data-action="categories"><div><div class="item-title">Categorias</div><div class="meta">Organize receitas e despesas</div></div><b>›</b></button>
  <button class="item" data-action="fiado"><div><div class="item-title">Fiado</div><div class="meta">Controle de vendas em aberto</div></div><b>›</b></button>
  <button class="item" data-action="backup"><div><div class="item-title">Backup dos dados</div><div class="meta">Exportar ou importar seus lançamentos</div></div><b>›</b></button>
 </div>`;
}
function calendar(){
 let d=new Date(), y=d.getFullYear(),m=d.getMonth(), first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),cells="";
 ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"].forEach(x=>cells+=`<div class="day" style="min-height:32px;background:#1d1e20;font-weight:800">${x}</div>`);
 for(let i=0;i<first;i++)cells+=`<div class="day"></div>`;
 for(let n=1;n<=days;n++){let ds=`${y}-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`, es=data.entries.filter(x=>x.date===ds),xs=data.exits.filter(x=>x.date===ds), ex=data.expenses.filter(x=>x.due===ds); cells+=`<div class="day"><b>${n}</b>${es.length?`<span class="dot in">+${money(sum(es))}</span>`:""}${xs.length?`<span class="dot out">−${money(sum(xs))}</span>`:""}${ex.length?`<span class="dot out">Venc ${money(sum(ex))}</span>`:""}</div>`}
 return header("Calendário","Visualize vencimentos e movimentações")+
 `<div class="card"><div class="section-head"><button class="btn small">‹</button><h2>${d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</h2><button class="btn small">›</button></div><div class="calendar">${cells}</div></div>`;
}
function reports(){
 const e=sum(data.entries),x=sum(data.exits),lucro=e-x;
 return header("Relatórios","Análises e gráficos")+
 `<div class="grid"><div class="card"><div class="label">Entradas</div><div class="value green">${money(e)}</div></div><div class="card"><div class="label">Saídas</div><div class="value red">${money(x)}</div></div><div class="card"><div class="label">Lucro</div><div class="value blue">${money(lucro)}</div></div><div class="card"><div class="label">Margem</div><div class="value gold">${e?((lucro/e)*100).toFixed(1):0}%</div></div></div>
 <div class="card section"><div class="section-head"><h2>Entradas × Saídas</h2><span class="meta">Últimos lançamentos</span></div><div class="chart">${[35,48,42,68,55,76,62,82,70,88].map(h=>`<div class="bar" style="height:${h}%"></div>`).join("")}</div><div class="legend"><span class="green">● Entradas</span><span class="red">● Saídas</span></div></div>`;
}
function categories(){let cats={};data.expenses.forEach(x=>cats[x.category]=(cats[x.category]||0)+Number(x.amount));return header("Despesas por categoria","Agosto 2026")+`<div class="list">${Object.entries(cats).map(([k,v])=>`<div class="item"><div class="item-title">${k}</div><div class="amount red">${money(v)}</div></div>`).join("")||`<div class="empty">Cadastre despesas para ver categorias.</div>`}</div>`}
function fiado(){let total=sum(data.clients.map(x=>x.open));return header("Fiado","Controle de vendas em aberto")+`<div class="hero"><div>Total em aberto</div><div class="big red">${money(total)}</div></div><div class="list section">${data.clients.filter(x=>x.open>0).map(x=>`<div class="item"><div><div class="item-title">${x.name}</div><div class="meta">Em aberto · ${money(x.open)}</div></div><button class="btn primary">Receber</button></div>`).join("")||`<div class="empty">Nenhum fiado em aberto.</div>`}</div>`}

function modal(title,body,actions=""){document.getElementById("modal").innerHTML=`<h2>${title}</h2>${body}<div class="modal-actions">${actions||`<button class="btn" data-close>Cancelar</button>`}</div>`;document.getElementById("modalBackdrop").classList.add("open");}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open")}
function expenseForm(x={}){
 modal(x.id?"Editar despesa":"Nova despesa",`<div class="form">
 <label>Descrição<input id="fdesc" value="${x.desc||""}" placeholder="Ex.: Aluguel da loja"></label>
 <div class="form-row"><label>Valor<input id="famount" type="number" step="0.01" value="${x.amount||""}"></label><label>Tipo de despesa<select id="ftype"><option ${x.type==="Fixa"?"selected":""}>Fixa</option><option ${x.type==="Variável"?"selected":""}>Variável</option><option ${x.type==="Cartão"?"selected":""}>Cartão</option><option ${x.type==="Mercadoria"?"selected":""}>Mercadoria</option><option ${x.type==="Outros"?"selected":""}>Outros</option></select></label></div>
 <div class="form-row"><label>Data de vencimento<input id="fdue" type="date" value="${x.due||today}"></label><label>Categoria<input id="fcat" value="${x.category||""}" placeholder="Ex.: Contas Fixas"></label></div>
 <div class="form-row"><label>Nº de parcelas<input id="finst" type="number" min="1" value="${x.installments||1}"></label><label>Parcela atual<input id="fcur" type="number" min="1" value="${x.current||1}"></label></div>
 <label>Status<select id="fstatus"><option>A vencer</option><option>Vencida</option><option>Paga</option></select></label>
 </div>`, `<button class="btn" data-close>Cancelar</button><button class="btn danger" data-save-expense="${x.id||""}">Salvar</button>`);
}
function entryForm(kind){
 modal(kind==="entry"?"Nova entrada":"Nova saída",`<div class="form">
 <label>Descrição<input id="edesc" placeholder="${kind==="entry"?"Ex.: Pagamento - João":"Ex.: Aluguel"}"></label>
 <div class="form-row"><label>Valor<input id="eamount" type="number" step="0.01"></label><label>Data<input id="edate" type="date" value="${today}"></label></div>
 <label>Tipo<select id="etype"><option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Serviço</option><option>Outros</option></select></label>
 </div>`, `<button class="btn" data-close>Cancelar</button><button class="btn ${kind==="entry"?"primary":"danger"}" data-save-entry="${kind}">Salvar</button>`);
}
function clientForm(){modal("Novo cliente",`<div class="form"><label>Nome<input id="cname" placeholder="Nome do cliente"></label><label>Telefone<input id="cphone" placeholder="(00) 00000-0000"></label><label>Limite de fiado<input id="climit" type="number" step="0.01" value="0"></label></div>`,`<button class="btn" data-close>Cancelar</button><button class="btn blue" data-save-client>Salvar</button>`)}
function receivableForm(){modal("Nova receita",`<div class="form"><label>Cliente<input id="rclient" placeholder="Nome do cliente"></label><div class="form-row"><label>Valor<input id="ramount" type="number" step="0.01"></label><label>Vencimento<input id="rdue" type="date" value="${today}"></label></div><label>Descrição<input id="rdesc" placeholder="Ex.: Serviço"></label></div>`,`<button class="btn" data-close>Cancelar</button><button class="btn primary" data-save-receivable>Salvar</button>`)}
function brDate(s){return new Date(s+"T12:00:00").toLocaleDateString("pt-BR")}
function bind(){
 document.querySelectorAll("[data-tabto]").forEach(b=>b.onclick=()=>{tab="mais";render()});
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{let a=b.dataset.action;if(a==="entry"||a==="exit")entryForm(a);else if(a==="expense")expenseForm();else if(a==="client")clientForm();else if(a==="receivable")receivableForm();else if(a==="calendar"){document.getElementById("view").innerHTML=calendar();bind()}else if(a==="reports"){document.getElementById("view").innerHTML=reports();bind()}else if(a==="categories"){document.getElementById("view").innerHTML=categories();bind()}else if(a==="fiado"){document.getElementById("view").innerHTML=fiado();bind()}else if(a==="backup")backup()});
 document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeModal);
 document.querySelectorAll("[data-edit-expense]").forEach(b=>b.onclick=()=>expenseForm(data.expenses.find(x=>x.id==b.dataset.editExpense)));
 document.querySelectorAll("[data-save-expense]").forEach(b=>b.onclick=()=>{let old=data.expenses.find(x=>x.id==b.dataset.saveExpense);let obj={id:old?.id||Date.now(),desc:document.getElementById("fdesc").value,amount:+document.getElementById("famount").value,due:document.getElementById("fdue").value,category:document.getElementById("fcat").value||"Outros",type:document.getElementById("ftype").value,installments:+document.getElementById("finst").value,current:+document.getElementById("fcur").value,status:document.getElementById("fstatus").value};if(old)Object.assign(old,obj);else data.expenses.push(obj);save();closeModal();render()});
 document.querySelectorAll("[data-save-entry]").forEach(b=>b.onclick=()=>{let obj={id:Date.now(),desc:document.getElementById("edesc").value||"Movimentação",amount:+document.getElementById("eamount").value,date:document.getElementById("edate").value,type:document.getElementById("etype").value};if(!obj.amount)return alert("Informe o valor.");(b.dataset.saveEntry==="entry"?data.entries:data.exits).push(obj);save();closeModal();render()});
 document.querySelectorAll("[data-save-client]").forEach(b=>b.onclick=()=>{let name=document.getElementById("cname").value.trim();if(!name)return alert("Informe o nome.");data.clients.push({id:Date.now(),name,phone:document.getElementById("cphone").value,open:0,total:0});save();closeModal();render()});
 document.querySelectorAll("[data-save-receivable]").forEach(b=>b.onclick=()=>{let client=document.getElementById("rclient").value.trim();let amount=+document.getElementById("ramount").value;if(!client||!amount)return alert("Informe cliente e valor.");data.receivables.push({id:Date.now(),client,amount,due:document.getElementById("rdue").value,desc:document.getElementById("rdesc").value||"Receita",status:"A receber"});save();closeModal();render()});
 const es=document.getElementById("expenseSearch");if(es)es.oninput=()=>{document.querySelectorAll(".item").forEach(i=>i.style.display=i.innerText.toLowerCase().includes(es.value.toLowerCase())?"flex":"none")};
 const cs=document.getElementById("clientSearch");if(cs)cs.oninput=()=>{document.querySelectorAll(".item").forEach(i=>i.style.display=i.innerText.toLowerCase().includes(cs.value.toLowerCase())?"flex":"none")};
}
function backup(){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kings9-backup.json";a.click();URL.revokeObjectURL(a.href);
}
document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
document.getElementById("modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeModal()};
document.getElementById("menuBtn").onclick=()=>{tab="mais";render()};
render();

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
