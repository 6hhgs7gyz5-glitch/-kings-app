const $=s=>document.querySelector(s);
const state=JSON.parse(localStorage.getItem("kings9")||'{"entries":[],"expenses":[],"clients":[],"goal":0}');
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const save=()=>localStorage.setItem("kings9",JSON.stringify(state));
const today=new Date();
$("#todayLabel").textContent=today.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit"}).toUpperCase();

function totals(){
 const ins=state.entries.reduce((s,x)=>s+Number(x.amount||0),0);
 const outs=state.expenses.filter(x=>x.paid!==false).reduce((s,x)=>s+Number(x.amount||0),0);
 return {ins,outs,balance:ins-outs};
}
function setTab(tab){
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(tab==="inicio") home(); if(tab==="caixa") caixa(); if(tab==="despesas") despesas(); if(tab==="clientes") clientes(); if(tab==="relatorios") relatorios();
}
document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));

function home(){
 const t=totals(), cuts=state.entries.length, goal=Number(state.goal||0), pct=goal?Math.min(100,(t.ins/goal)*100):0;
 $("#view").innerHTML=`
 <section class="hero">
  <div class="kicker">FATURAMENTO DE HOJE</div><div class="big">${money(t.ins)}</div>
  <div class="hero-sub">${cuts} cortes registrados</div>
  <div class="progress"><i style="width:${pct}%"></i></div>
  <div class="goal"><span>${goal?"Meta diária "+money(goal):"Meta diária não definida"}</span><span>${Math.round(pct)}%</span></div>
 </section>
 <div class="grid">
  <div class="card"><h3>ÚLTIMOS 7 DIAS</h3><div class="value">${money(t.ins)}</div><div class="small">${cuts} cortes</div></div>
  <div class="card"><h3>MÊS ATUAL</h3><div class="value">${money(t.balance)}</div><div class="small">${cuts} cortes</div></div>
 </div>
 <div class="section-title"><h2>Ações rápidas</h2></div>
 <div class="actions">
  <button class="action in" onclick="openEntry()"><strong>+ Entrada rápida</strong><small>Registrar recebimento</small></button>
  <button class="action out" onclick="openExpense()"><strong>− Saída rápida</strong><small>Registrar despesa</small></button>
 </div>
 <div class="section-title"><h2>Resumo</h2></div>
 <div class="list">
  <div class="row"><div>Total de entradas</div><div class="money in">${money(t.ins)}</div></div>
  <div class="row"><div>Total de saídas</div><div class="money out">${money(t.outs)}</div></div>
  <div class="row"><div>Saldo do período</div><div class="money">${money(t.balance)}</div></div>
 </div>`;
}
function caixa(){
 const t=totals();
 $("#view").innerHTML=`<div class="page-title">Caixa</div>
 <div class="grid">
  <div class="card"><h3>ENTRADAS</h3><div class="value" style="color:var(--blue)">${money(t.ins)}</div></div>
  <div class="card"><h3>SAÍDAS</h3><div class="value" style="color:var(--red)">${money(t.outs)}</div></div>
 </div>
 <div class="card" style="margin-top:18px"><h3>SALDO DO PERÍODO</h3><div class="value" style="color:var(--green)">${money(t.balance)}</div></div>
 <div class="section-title"><h2>Movimentações</h2><button onclick="openEntry()">+ Entrada</button></div>
 <div class="list">${[
 ...state.entries.map(x=>({type:"in",title:x.description||"Entrada",amount:x.amount,date:x.date})),
 ...state.expenses.filter(x=>x.paid!==false).map(x=>({type:"out",title:x.description||"Despesa",amount:x.amount,date:x.due}))
 ].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(x=>`<div class="row"><div><b>${x.title}</b><div class="meta">${x.date||""}</div></div><div class="money ${x.type}">${x.type==="out"?"− ":"+"}${money(x.amount)}</div></div>`).join("")||'<div class="empty">Nenhuma movimentação registrada.</div>'}</div>`;
}
function despesas(){
 $("#view").innerHTML=`<div class="page-title">Despesas</div>
 <div class="toolbar"><input id="expenseSearch" placeholder="Buscar despesa..." oninput="renderExpenseList()"></div>
 <div class="list" id="expenseList"></div><button class="fab" onclick="openExpense()">+</button>`;
 renderExpenseList();
}
function renderExpenseList(){
 const q=($("#expenseSearch")?.value||"").toLowerCase();
 const arr=state.expenses.filter(x=>(x.description||"").toLowerCase().includes(q)||(x.category||"").toLowerCase().includes(q));
 $("#expenseList").innerHTML=arr.map((x,i)=>`<div class="row"><div><b>${x.description||"Despesa"}</b><div class="meta">Vencimento: ${x.due||"—"} · ${x.category||"Outros"} · ${x.type||"Variável"}</div><div class="tag">${x.installment||"À vista"}</div></div><div style="text-align:right"><div class="money out">${money(x.amount)}</div><button class="danger" onclick="removeExpense(${i})">Excluir</button></div></div>`).join("")||'<div class="empty">Nenhuma despesa cadastrada.</div>';
}
function clientes(){
 $("#view").innerHTML=`<div class="page-title">Clientes</div><div class="toolbar"><input id="clientSearch" placeholder="Buscar cliente..." oninput="renderClients()"></div><div class="list" id="clientList"></div><button class="fab" onclick="openClient()">+</button>`;
 renderClients();
}
function renderClients(){
 const q=($("#clientSearch")?.value||"").toLowerCase();
 $("#clientList").innerHTML=state.clients.filter(x=>x.name.toLowerCase().includes(q)).map((x,i)=>`<div class="row"><div><b>${x.name}</b><div class="meta">${x.phone||"Sem telefone"} · ${x.note||"Cliente cadastrado"}</div></div><button class="danger" onclick="removeClient(${i})">Excluir</button></div>`).join("")||'<div class="empty">Cadastre seus clientes para deixar a lista pronta.</div>';
}
function relatorios(){
 const t=totals();
 $("#view").innerHTML=`<div class="page-title">Relatórios</div><div class="grid">
 <div class="card"><h3>ENTRADAS</h3><div class="value">${money(t.ins)}</div></div>
 <div class="card"><h3>SAÍDAS</h3><div class="value">${money(t.outs)}</div></div></div>
 <div class="section-title"><h2>Despesas por tipo</h2></div><div class="list">
 ${Object.entries(state.expenses.reduce((a,x)=>(a[x.type||"Variável"]=(a[x.type||"Variável"]||0)+Number(x.amount||0),a),{})).map(([k,v])=>`<div class="row"><div>${k}</div><div class="money out">${money(v)}</div></div>`).join("")||'<div class="empty">Sem despesas.</div>'}</div>`;
}
function openSheet(html){$("#sheetCard").innerHTML=html;$("#sheet").classList.remove("hidden")}
function closeSheet(){$("#sheet").classList.add("hidden")}
$("#sheet").onclick=e=>{if(e.target.id==="sheet")closeSheet()};

function openEntry(){openSheet(`<h2>Nova entrada</h2><form class="form" onsubmit="addEntry(event)">
<label>Descrição<input id="edesc" required placeholder="Ex.: Corte, Pix, pagamento"></label>
<div class="tw"><label>Valor<input id="eamount" required type="number" step="0.01" min="0" placeholder="0,00"></label><label>Data<input id="edate" type="date" value="${new Date().toISOString().slice(0,10)}"></label></div>
<button class="primary">Salvar entrada</button></form>`)}
function addEntry(e){e.preventDefault();state.entries.push({description:$("#edesc").value,amount:Number($("#eamount").value),date:$("#edate").value});save();closeSheet();setTab("caixa")}
function openExpense(){openSheet(`<h2>Nova despesa</h2><form class="form" onsubmit="addExpense(event)">
<label>Descrição<input id="xdesc" required placeholder="Ex.: Aluguel, cartão, fornecedor"></label>
<div class="tw"><label>Valor total<input id="xamount" required type="number" step="0.01" min="0"></label><label>Vencimento<input id="xdue" type="date" value="${new Date().toISOString().slice(0,10)}"></label></div>
<div class="tw"><label>Tipo<select id="xtype"><option>Fixa</option><option>Variável</option><option>Cartão</option><option>Fornecedor</option><option>Empréstimo</option><option>Outros</option></select></label><label>Parcela<input id="xinst" placeholder="Ex.: 3/12 ou À vista"></label></div>
<label>Categoria<input id="xcat" placeholder="Ex.: Casa, Negócio, Cartão"></label>
<button class="primary">Salvar despesa</button></form>`)}
function addExpense(e){e.preventDefault();state.expenses.push({description:$("#xdesc").value,amount:Number($("#xamount").value),due:$("#xdue").value,type:$("#xtype").value,installment:$("#xinst").value||"À vista",category:$("#xcat").value||"Outros",paid:true});save();closeSheet();setTab("despesas")}
function removeExpense(i){if(confirm("Excluir esta despesa?")){state.expenses.splice(i,1);save();renderExpenseList()}}
function openClient(){openSheet(`<h2>Novo cliente</h2><form class="form" onsubmit="addClient(event)">
<label>Nome<input id="cname" required></label><label>Telefone<input id="cphone"></label><label>Observação<input id="cnote"></label>
<button class="primary">Salvar cliente</button></form>`)}
function addClient(e){e.preventDefault();state.clients.push({name:$("#cname").value,phone:$("#cphone").value,note:$("#cnote").value});save();closeSheet();setTab("clientes")}
function removeClient(i){if(confirm("Excluir este cliente?")){state.clients.splice(i,1);save();renderClients()}}
$("#settingsBtn").onclick=()=>openSheet(`<h2>Configurações KINGS 9</h2><form class="form" onsubmit="setGoal(event)"><label>Meta diária<input id="goal" type="number" step="0.01" value="${state.goal||0}"></label><button class="primary">Salvar meta</button></form><p class="small">Os dados ficam salvos neste aparelho/navegador.</p>`);
function setGoal(e){e.preventDefault();state.goal=Number($("#goal").value||0);save();closeSheet();home()}
home();
