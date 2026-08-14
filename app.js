const KEY = 'kings92_data_v2';
const OLD_KEYS = ['kings92_data_v1'];

const today = () => new Date().toISOString().slice(0,10);
const monthKey = d => String(d || '').slice(0,7);
const clone = x => JSON.parse(JSON.stringify(x));
const norm = v => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const uid = p => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const brDate = v => { const [y,m,d]=String(v||'').slice(0,10).split('-'); return y&&m&&d?`${d}/${m}/${y}`:String(v||''); };
const num = v => Math.max(0, Number(String(v ?? '').replace(',','.')) || 0);

const seed = {
  cuts: [],
  clients: [
    {id:'c1',name:'João Silva',phone:'(11) 99999-9999'},
    {id:'c2',name:'Maria Santos',phone:'(11) 98888-8888'},
    {id:'c3',name:'Pedro Oliveira',phone:'(11) 97777-7777'},
    {id:'c4',name:'Lucas Mendes',phone:'(11) 96666-6666'},
    {id:'c5',name:'Gabriel Lima',phone:'(11) 95555-5555'},
    {id:'c6',name:'Felipe Rocha',phone:'(11) 94444-4444'}
  ],
  revenues: [
    {id:'r1',client:'João Silva',desc:'Serviço de Barba',value:150,date:'2026-08-20',status:'A receber'},
    {id:'r2',client:'Maria Santos',desc:'Coloração',value:80,date:'2026-08-18',status:'A receber'},
    {id:'r3',client:'Pedro Oliveira',desc:'Corte + Barba',value:200,date:'2026-08-25',status:'A receber'},
    {id:'r4',client:'Lucas Mendes',desc:'Corte',value:120,date:'2026-08-30',status:'A receber'},
    {id:'r5',client:'Gabriel Lima',desc:'Pigmentação',value:160,date:'2026-08-31',status:'A receber'}
  ],
  expenses: [
    {id:'e1',desc:'Aluguel da loja',value:500,category:'Aluguel',date:'2026-08-14',status:'A vencer'},
    {id:'e2',desc:'Compra de Produtos',value:1250,category:'Mercadorias',date:'2026-08-16',status:'A vencer'},
    {id:'e3',desc:'Conta de Luz',value:180,category:'Contas Fixas',date:'2026-08-18',status:'A vencer'},
    {id:'e4',desc:'Internet',value:120,category:'Contas Fixas',date:'2026-08-20',status:'Pago'},
    {id:'e5',desc:'Cartão Nubank',value:835,category:'Cartão',date:'2026-08-25',status:'A vencer'},
    {id:'e6',desc:'Material de Barbearia',value:320,category:'Materiais',date:'2026-08-28',status:'Pago'},
    {id:'e7',desc:'Salário Funcionário',value:2000,category:'Folha de Pagamento',date:'2026-08-31',status:'A vencer'}
  ],
  movements: [
    {id:'m1',type:'in',desc:'Pagamento - João Silva',value:120,date:'2026-08-14'},
    {id:'m2',type:'out',desc:'Aluguel da loja',value:500,date:'2026-08-14'},
    {id:'m3',type:'in',desc:'Serviço - Maria Santos',value:80,date:'2026-08-13'},
    {id:'m4',type:'out',desc:'Material de limpeza',value:45,date:'2026-08-13'},
    {id:'m5',type:'in',desc:'Pix - Pedro Oliveira',value:150,date:'2026-08-12'}
  ],
  goal: 0,
  categories: ['Aluguel','Mercadorias','Contas Fixas','Cartão','Materiais','Folha de Pagamento','Outros']
};

let data = load();
let page = 'home';
let expenseFilter = 'Todas';
let revenueFilter = 'Todas';

function ensureShape(d){
  d = d && typeof d === 'object' ? d : clone(seed);
  ['cuts','clients','revenues','expenses','movements'].forEach(k=>{ if(!Array.isArray(d[k])) d[k]=[]; });
  if(!Array.isArray(d.categories)) d.categories = clone(seed.categories);
  if(typeof d.goal !== 'number') d.goal = num(d.goal);
  d.clients = d.clients.map(x=>({...x,id:x.id||uid('c')}));
  d.cuts = d.cuts.map(x=>({...x,id:x.id||uid('cut'),value:num(x.value),date:x.date||today(),payment:x.payment||'Recebido'}));
  d.revenues = d.revenues.map(x=>({...x,id:x.id||uid('r'),value:num(x.value),date:x.date||today(),status:x.status||'A receber'}));
  d.expenses = d.expenses.map(x=>({...x,id:x.id||uid('e'),value:num(x.value),date:x.date||today(),status:x.status||'A vencer'}));
  d.movements = d.movements.map(x=>({...x,id:x.id||uid('m'),value:num(x.value),date:x.date||today(),type:x.type==='out'?'out':'in'}));
  return d;
}

function signature(o, fields){
  return fields.map(k=>{
    let v=o[k];
    if(k==='value') v=num(v).toFixed(2);
    if(k==='date') v=String(v||'').slice(0,10);
    return norm(v);
  }).join('|');
}
function dedupe(arr, fields){
  const seen=new Set(), out=[];
  for(const item of Array.isArray(arr)?arr:[]){
    const s=signature(item,fields);
    if(!seen.has(s)){seen.add(s);out.push(item);}
  }
  return out;
}
function dedupeAll(d){
  d.clients=dedupe(d.clients,['name','phone']);
  d.revenues=dedupe(d.revenues,['client','desc','value','date']);
  d.expenses=dedupe(d.expenses,['desc','value','category','date']);
  d.movements=dedupe(d.movements,['type','desc','value','date','sourceId']);
  d.cuts=dedupe(d.cuts,['client','value','date','service','payment']);
  return d;
}
function persist(){ data=ensureShape(dedupeAll(data)); localStorage.setItem(KEY,JSON.stringify(data)); }
function load(){
  try{
    let raw=localStorage.getItem(KEY);
    if(!raw){ for(const k of OLD_KEYS){ raw=localStorage.getItem(k); if(raw) break; } }
    if(raw){ const d=ensureShape(JSON.parse(raw)); localStorage.setItem(KEY,JSON.stringify(dedupeAll(d))); return dedupeAll(d); }
  }catch(e){}
  const d=clone(seed); localStorage.setItem(KEY,JSON.stringify(d)); return d;
}

function totals(){
  const incoming=data.movements.filter(x=>x.type==='in').reduce((a,x)=>a+num(x.value),0);
  const outgoing=data.movements.filter(x=>x.type==='out').reduce((a,x)=>a+num(x.value),0);
  const receivable=data.revenues.filter(x=>x.status!=='Recebida').reduce((a,x)=>a+num(x.value),0);
  const payable=data.expenses.filter(x=>x.status!=='Pago').reduce((a,x)=>a+num(x.value),0);
  return {incoming,outgoing,receivable,payable,balance:incoming-outgoing,profit:incoming-outgoing};
}
function periodCuts(days=7){
  const end=new Date(); end.setHours(23,59,59,999);
  const start=new Date(end); start.setDate(start.getDate()-(days-1));
  return data.cuts.filter(x=>{const d=new Date(x.date+'T12:00:00');return d>=start&&d<=end;});
}
function todayCuts(){return data.cuts.filter(x=>x.date===today()).length;}
function todayRevenue(){return data.cuts.filter(x=>x.date===today()).reduce((a,x)=>a+num(x.value),0);}
function weekCuts(){return periodCuts(7).length;}
function weekRevenue(){return periodCuts(7).reduce((a,x)=>a+num(x.value),0);}
function monthRevenue(){const mk=monthKey(today());return data.cuts.filter(x=>monthKey(x.date)===mk).reduce((a,x)=>a+num(x.value),0);}
function monthCuts(){const mk=monthKey(today());return data.cuts.filter(x=>monthKey(x.date)===mk).length;}

function render(){
  const root=document.getElementById('main');
  root.innerHTML=(pages[page]||pages.home)();
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
  bindActions();
}
function header(title,sub=''){return `<div class="page-head"><h1 class="page-title">${esc(title)}</h1><div class="page-sub">${esc(sub)}</div></div>`;}
function pageHome(){
  const t=totals(), goal=num(data.goal), pct=goal?Math.min(100,todayRevenue()/goal*100):0;
  return `<div class="page">${header('Central Financeira',`Hoje, ${brDate(today())}`)}
    <section class="hero"><div class="hero-kicker">FATURAMENTO DE HOJE</div><h1>${money(todayRevenue())}</h1><div class="accent">${todayCuts()} cortes registrados</div><div class="progress"><i style="width:${pct}%"></i></div><div class="progress-row"><span>${goal?`Meta diária ${money(goal)}`:'Meta diária não definida'}</span><span>${Math.round(pct)}%</span></div></section>
    <div class="grid2"><div class="card"><div class="label">ÚLTIMOS 7 DIAS</div><div class="big">${money(weekRevenue())}</div><small>${weekCuts()} cortes</small></div><div class="card"><div class="label">MÊS ATUAL</div><div class="big">${money(monthRevenue())}</div><small>${monthCuts()} cortes</small></div></div>
    <section class="fin-card"><div class="fin-head"><div><div class="page-sub">VISÃO FINANCEIRA</div><h2>Central Financeira</h2></div><button data-nav="cash">Ver caixa →</button></div>
    <div class="fin-grid"><div class="stat"><small>Entradas</small><b class="green">${money(t.incoming)}</b></div><div class="stat"><small>Saídas</small><b class="red">${money(t.outgoing)}</b></div><div class="stat"><small>A Receber</small><b class="blue">${money(t.receivable)}</b></div><div class="stat"><small>A Pagar</small><b class="gold">${money(t.payable)}</b></div></div>
    <div class="quick-grid"><button class="quick greenbtn" data-action="quickIn"><span class="qi">＋</span>Entrada</button><button class="quick redbtn" data-action="quickOut"><span class="qi">−</span>Saída</button><button class="quick bluebtn" data-action="addClient"><span class="qi">♙</span>Cliente</button></div></section>
    <div class="section-title">Movimentações recentes</div>${movementRows(data.movements.slice().reverse().slice(0,8))}
  </div>`;
}
function movementRows(arr){return arr.map(x=>`<div class="row"><div class="row-icon ${x.type==='in'?'green':'red'}">${x.type==='in'?'↑':'↓'}</div><div class="row-main"><b>${esc(x.desc)}</b><small>${brDate(x.date)}</small></div><div class="row-price ${x.type==='in'?'green':'red'}">${money(x.value)}</div><button class="mini danger-mini" data-action="deleteMovement" data-id="${x.id}">×</button></div>`).join('')||`<div class="empty"><strong>Nenhuma movimentação</strong><br>Registre uma entrada ou saída.</div>`;}

function pageCash(){const t=totals();return `<div class="page">${header('Caixa','Controle de entradas e saídas')}<div class="grid2"><button class="quick greenbtn" data-action="quickIn">＋ Entrada rápida</button><button class="quick redbtn" data-action="quickOut">− Saída rápida</button></div><div class="metric-row"><div class="metric"><span>Total Entradas</span><b class="green">${money(t.incoming)}</b></div><div class="metric"><span>Total Saídas</span><b class="red">${money(t.outgoing)}</b></div></div><div class="fin-card balance-card"><div class="page-sub">SALDO DO PERÍODO</div><div class="balance-big ${t.balance>=0?'green':'red'}">${money(t.balance)}</div></div><div class="section-title">Movimentações recentes</div>${movementRows(data.movements.slice().reverse())}</div>`;}

function pageExpenses(){
  const filtered=data.expenses.filter(e=>expenseFilter==='Todas'||e.status===expenseFilter||(expenseFilter==='Vencidas'&&e.status==='A vencer'&&e.date<today()));
  return `<div class="page">${header('Despesas','Gerencie suas despesas')}<div class="filter">${['Todas','A vencer','Vencidas','Pagas'].map(f=>`<button class="${expenseFilter===f?'active':''}" data-action="expenseFilter" data-filter="${f}">${f}</button>`).join('')}</div>${filtered.map(expenseRow).join('')||`<div class="empty">Nenhuma despesa encontrada.</div>`}<button class="fab" data-action="addExpense">＋</button></div>`;
}
function expenseRow(e){return `<div class="row"><div class="row-icon">${iconFor(e.category)}</div><div class="row-main"><b>${esc(e.desc)}</b><small>Venc: ${brDate(e.date)} · ${esc(e.category)}</small><div class="actions"><button class="mini ${e.status==='Pago'?'green':''}" data-action="toggleExpense" data-id="${e.id}">${e.status==='Pago'?'Pago':'Marcar como pago'}</button><button class="mini red" data-action="deleteExpense" data-id="${e.id}">Excluir</button></div></div><div style="text-align:right"><div class="row-price red">${money(e.value)}</div><small class="${e.status==='Pago'?'green':'gold'}">${e.status}</small></div></div>`;}

function pageReceivables(){
  const filtered=data.revenues.filter(r=>revenueFilter==='Todas'||(revenueFilter==='A receber'&&r.status!=='Recebida')||(revenueFilter==='Recebidas'&&r.status==='Recebida'));
  return `<div class="page">${header('Receitas','Contas a receber')}<div class="filter">${['Todas','A receber','Recebidas'].map(f=>`<button class="${revenueFilter===f?'active':''}" data-action="revenueFilter" data-filter="${f}">${f}</button>`).join('')}</div>${filtered.map(revenueRow).join('')||`<div class="empty">Nenhuma receita encontrada.</div>`}<button class="fab" data-action="addRevenue">＋</button></div>`;
}
function revenueRow(r){return `<div class="row"><div class="row-icon">♙</div><div class="row-main"><b>${esc(r.client)}</b><small>${brDate(r.date)}<br>${esc(r.desc)}</small><div class="actions"><button class="mini ${r.status==='Recebida'?'green':''}" data-action="toggleRevenue" data-id="${r.id}">${r.status==='Recebida'?'Recebida':'Marcar como recebida'}</button><button class="mini red" data-action="deleteRevenue" data-id="${r.id}">Excluir</button></div></div><div style="text-align:right"><div class="row-price ${r.status==='Recebida'?'green':'red'}">${money(r.value)}</div><small class="${r.status==='Recebida'?'green':'gold'}">${r.status}</small></div></div>`;}

function pageClients(){return `<div class="page">${header('Clientes','Seus clientes cadastrados')}<input class="search" id="clientSearch" placeholder="⌕  Buscar cliente..."><div id="clientList">${clientRows(data.clients)}</div><button class="fab" data-action="addClient">＋</button></div>`;}
function clientStats(c){
  const cuts=data.cuts.filter(x=>norm(x.client)===norm(c.name));
  const rev=data.revenues.filter(x=>norm(x.client)===norm(c.name));
  const spent=cuts.reduce((a,x)=>a+num(x.value),0)+rev.filter(x=>x.status==='Recebida').reduce((a,x)=>a+num(x.value),0);
  const open=rev.filter(x=>x.status!=='Recebida').reduce((a,x)=>a+num(x.value),0)+cuts.filter(x=>x.payment!=='Recebido').reduce((a,x)=>a+num(x.value),0);
  return {spent,open};
}
function clientRows(arr){return arr.map(c=>{const s=clientStats(c);return `<div class="row"><div class="row-icon">♙</div><div class="row-main"><b>${esc(c.name)}</b><small>${esc(c.phone||'')}<br>Total gasto: ${money(s.spent)}</small><div class="actions"><button class="mini blue" data-action="addCut" data-client="${esc(c.name)}">Novo corte</button><button class="mini red" data-action="deleteClient" data-id="${c.id}">Excluir</button></div></div><div style="text-align:right"><small class="${s.open?'red':'green'}">${s.open?'Em aberto':'✓'}</small><div class="row-price ${s.open?'red':'green'}">${money(s.open)}</div></div></div>`;}).join('')||`<div class="empty">Nenhum cliente cadastrado.</div>`;}

function pageCalendar(){
  const now=new Date(); const y=now.getFullYear(),m=now.getMonth(); const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
  let cells=''; ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].forEach(x=>cells+=`<div class="cal-head">${x}</div>`);
  for(let i=0;i<first;i++) cells+=`<div class="cal-cell muted"></div>`;
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ins=data.movements.filter(x=>x.type==='in'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
    const outs=data.movements.filter(x=>x.type==='out'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
    cells+=`<div class="cal-cell"><b>${d}</b>${ins?`<span class="pill in">+${money(ins)}</span>`:''}${outs?`<span class="pill out">-${money(outs)}</span>`:''}</div>`;
  }
  return `<div class="page">${header('Calendário','Visualize entradas e saídas')}<div class="calendar">${cells}</div></div>`;
}
function pageReports(){
  const t=totals(), margin=t.incoming?((t.profit/t.incoming)*100):0;
  const cats={}; data.expenses.forEach(e=>cats[e.category]=(cats[e.category]||0)+num(e.value));
  return `<div class="page">${header('Relatórios','Análises e gráficos')}<div class="metric-row"><div class="metric"><span>Entradas</span><b class="green">${money(t.incoming)}</b></div><div class="metric"><span>Saídas</span><b class="red">${money(t.outgoing)}</b></div><div class="metric"><span>Lucro</span><b class="blue">${money(t.profit)}</b></div><div class="metric"><span>Margem</span><b class="gold">${margin.toFixed(2).replace('.',',')}%</b></div></div><div class="fin-card"><b>Despesas por categoria</b>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><div class="row-main"><b>${esc(k)}</b></div><div class="row-price red">${money(v)}</div></div>`).join('')||'<div class="empty">Sem despesas.</div>'}</div></div>`;
}
function pageCategories(){const map={};data.expenses.forEach(e=>map[e.category]=(map[e.category]||0)+num(e.value));return `<div class="page">${header('Despesas por Categoria',`Mês ${brMonth(today())}`)}${Object.entries(map).map(([k,v])=>`<div class="row"><div class="row-icon">${iconFor(k)}</div><div class="row-main"><b>${esc(k)}</b><small>Despesas registradas</small></div><div class="row-price red">${money(v)}</div></div>`).join('')||'<div class="empty">Sem despesas.</div>'}</div>`;}
function pageMore(){return `<div class="page">${header('Mais','Configurações e ferramentas')}<div class="more-list">${[['Categorias','Gerencie categorias','categories'],['Calendário','Visualize o fluxo por dia','calendar'],['Relatórios','Veja resultados e indicadores','reports'],['Configurações','Meta, deduplicação e backup','settings'],['Sobre o KINGS','Versão 9.2.1','about']].map(x=>`<button class="row" style="width:100%;text-align:left" data-nav="${x[2]}"><div class="row-icon">◆</div><div class="row-main"><b>${x[0]}</b><small>${x[1]}</small></div><span>›</span></button>`).join('')}</div></div>`;}
function pageSettings(){return `<div class="page">${header('Configurações','KINGS 9.2.1')}<div class="fin-card"><div class="section-title" style="margin-top:0">Meta diária</div><input id="goalInput" class="search" type="number" step="0.01" value="${data.goal||''}" placeholder="Ex.: 1000"><button class="save" data-action="saveGoal">Salvar meta</button></div><div class="fin-card"><div class="section-title" style="margin-top:0">Deduplicação automática</div><p class="page-sub">O sistema verifica cortes, clientes, receitas, despesas e movimentações antes de salvar.</p><button class="save" data-action="dedupe">Verificar e eliminar duplicados</button></div><div class="fin-card"><div class="section-title" style="margin-top:0">Backup</div><button class="save" data-action="export">Exportar backup JSON</button><button class="save secondary" data-action="import">Importar backup JSON</button><input id="importFile" type="file" accept="application/json" hidden></div></div>`;}
function pageAbout(){return `<div class="page">${header('Sobre o KINGS','Sistema Financeiro')}<div class="hero"><div class="hero-kicker">KINGS 9.2.1</div><h1 style="font-size:32px">Completo e funcional</h1><div class="accent">Offline • PWA • Dados salvos no aparelho</div><div class="section-title">✓ Entradas e saídas</div><div class="section-title">✓ Receitas e despesas</div><div class="section-title">✓ Clientes e cortes</div><div class="section-title">✓ Deduplicação automática</div></div></div>`;}
const pages={home:pageHome,cash:pageCash,expenses:pageExpenses,clients:pageClients,receivables:pageReceivables,calendar:pageCalendar,reports:pageReports,categories:pageCategories,more:pageMore,settings:pageSettings,about:pageAbout};

function bindActions(){
  const s=document.getElementById('clientSearch');
  if(s) s.addEventListener('input',()=>{const q=norm(s.value);document.getElementById('clientList').innerHTML=clientRows(data.clients.filter(c=>norm(c.name).includes(q)||norm(c.phone).includes(q)));});
}
function openModal(html){document.getElementById('modalBody').innerHTML=html;document.getElementById('modal').classList.add('open');}
function closeModal(){document.getElementById('modal').classList.remove('open');document.getElementById('modalBody').innerHTML='';}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');}
function field(label,id,type='text',value='',extra=''){return `<div class="field"><label>${label}</label><input id="${id}" class="input" type="${type}" value="${esc(value)}" ${extra}></div>`;}
function requireValue(id,label){const el=document.getElementById(id);if(!el||!String(el.value).trim()){alert(`Informe ${label}.`);el?.focus();return false;}return true;}

function openEntry(type){
  openModal(`<h2>${type==='in'?'Nova Entrada':'Nova Saída'}</h2>${field('DESCRIÇÃO','fDesc','text','')}${field('VALOR','fValue','number','','step="0.01" min="0.01"')}${field('DATA','fDate','date',today())}<button class="save" id="modalSave">Salvar</button>`);
  document.getElementById('modalSave').onclick=()=>{
    if(!requireValue('fDesc','a descrição')||!requireValue('fValue','o valor')||!requireValue('fDate','a data'))return;
    data.movements.push({id:uid('m'),type,desc:document.getElementById('fDesc').value.trim(),value:num(document.getElementById('fValue').value),date:document.getElementById('fDate').value});
    persist();closeModal();render();
  };
}
function openClient(){
  openModal(`<h2>Novo Cliente</h2>${field('NOME','cName')}${field('TELEFONE','cPhone') }<button class="save" id="modalSave">Salvar cliente</button>`);
  document.getElementById('modalSave').onclick=()=>{if(!requireValue('cName','o nome'))return;data.clients.push({id:uid('c'),name:document.getElementById('cName').value.trim(),phone:document.getElementById('cPhone').value.trim()});persist();closeModal();render();};
}
function openCut(clientName=''){
  const opts=data.clients.map(c=>`<option ${norm(c.name)===norm(clientName)?'selected':''}>${esc(c.name)}</option>`).join('');
  openModal(`<h2>Novo Corte</h2><div class="field"><label>CLIENTE</label><select id="cutClient" class="input">${opts||'<option>Cliente avulso</option>'}</select></div>${field('SERVIÇO','cutService','text','Corte')}${field('VALOR','cutValue','number','','step="0.01" min="0.01"')}${field('DATA','cutDate','date',today())}<div class="field"><label>PAGAMENTO</label><select id="cutPay" class="input"><option>Recebido</option><option>A receber</option></select></div><button class="save" id="modalSave">Salvar corte</button>`);
  document.getElementById('modalSave').onclick=()=>{
    if(!requireValue('cutValue','o valor')||!requireValue('cutService','o serviço'))return;
    const cut={id:uid('cut'),client:document.getElementById('cutClient').value,service:document.getElementById('cutService').value.trim(),value:num(document.getElementById('cutValue').value),date:document.getElementById('cutDate').value,payment:document.getElementById('cutPay').value};
    data.cuts.push(cut);
    if(cut.payment==='Recebido') data.movements.push({id:uid('m'),type:'in',desc:`${cut.service} - ${cut.client}`,value:cut.value,date:cut.date,sourceId:cut.id});
    else data.revenues.push({id:uid('r'),client:cut.client,desc:cut.service,value:cut.value,date:cut.date,status:'A receber',sourceId:cut.id});
    persist();closeModal();render();
  };
}
function openExpense(){
  const cats=data.categories.map(c=>`<option>${esc(c)}</option>`).join('');
  openModal(`<h2>Nova Despesa</h2>${field('DESCRIÇÃO','eDesc')}${field('VALOR','eValue','number','','step="0.01" min="0.01"')}<div class="field"><label>CATEGORIA</label><select id="eCat" class="input">${cats}</select></div>${field('VENCIMENTO','eDate','date',today())}<div class="field"><label>STATUS</label><select id="eStatus" class="input"><option>A vencer</option><option>Pago</option></select></div><button class="save" id="modalSave">Salvar despesa</button>`);
  document.getElementById('modalSave').onclick=()=>{
    if(!requireValue('eDesc','a descrição')||!requireValue('eValue','o valor')||!requireValue('eDate','a data'))return;
    const e={id:uid('e'),desc:document.getElementById('eDesc').value.trim(),value:num(document.getElementById('eValue').value),category:document.getElementById('eCat').value,date:document.getElementById('eDate').value,status:document.getElementById('eStatus').value};
    data.expenses.push(e);
    if(e.status==='Pago') data.movements.push({id:uid('m'),type:'out',desc:e.desc,value:e.value,date:e.date,sourceId:e.id});
    persist();closeModal();render();
  };
}
function openRevenue(){
  const opts=data.clients.map(c=>`<option>${esc(c.name)}</option>`).join('');
  openModal(`<h2>Nova Receita</h2><div class="field"><label>CLIENTE</label><input id="rClient" class="input" list="clientOptions" placeholder="Nome do cliente"><datalist id="clientOptions">${opts}</datalist></div>${field('DESCRIÇÃO','rDesc')}${field('VALOR','rValue','number','','step="0.01" min="0.01"')}${field('VENCIMENTO','rDate','date',today())}<div class="field"><label>STATUS</label><select id="rStatus" class="input"><option>A receber</option><option>Recebida</option></select></div><button class="save" id="modalSave">Salvar receita</button>`);
  document.getElementById('modalSave').onclick=()=>{
    if(!requireValue('rClient','o cliente')||!requireValue('rDesc','a descrição')||!requireValue('rValue','o valor')||!requireValue('rDate','a data'))return;
    const r={id:uid('r'),client:document.getElementById('rClient').value.trim(),desc:document.getElementById('rDesc').value.trim(),value:num(document.getElementById('rValue').value),date:document.getElementById('rDate').value,status:document.getElementById('rStatus').value};
    data.revenues.push(r);
    if(r.status==='Recebida') data.movements.push({id:uid('m'),type:'in',desc:`${r.desc} - ${r.client}`,value:r.value,date:r.date,sourceId:r.id});
    persist();closeModal();render();
  };
}

function markRevenue(id){
  const r=data.revenues.find(x=>x.id===id); if(!r)return;
  if(r.status==='Recebida'){r.status='A receber';data.movements=data.movements.filter(m=>m.sourceId!==id);}
  else {r.status='Recebida';if(!data.movements.some(m=>m.sourceId===id))data.movements.push({id:uid('m'),type:'in',desc:`${r.desc} - ${r.client}`,value:r.value,date:today(),sourceId:r.id});}
  persist();render();
}
function markExpense(id){
  const e=data.expenses.find(x=>x.id===id);if(!e)return;
  if(e.status==='Pago'){e.status='A vencer';data.movements=data.movements.filter(m=>m.sourceId!==id);}
  else {e.status='Pago';if(!data.movements.some(m=>m.sourceId===id))data.movements.push({id:uid('m'),type:'out',desc:e.desc,value:e.value,date:today(),sourceId:e.id});}
  persist();render();
}
function remove(type,id){data[type]=data[type].filter(x=>x.id!==id);persist();render();}
function countAll(d){return ['cuts','clients','revenues','expenses','movements'].reduce((a,k)=>a+(d[k]?.length||0),0);}
function brMonth(v){const [y,m]=String(v).slice(0,7).split('-');return `${m}/${y}`;}
function iconFor(k){return ({Aluguel:'⌂',Mercadorias:'🛒','Contas Fixas':'●',Cartão:'▣',Materiais:'✂','Folha de Pagamento':'$'}[k]||'◆');}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function importBackup(file){const reader=new FileReader();reader.onload=()=>{try{const incoming=ensureShape(JSON.parse(reader.result));data=incoming;persist();alert('Backup restaurado com sucesso.');render();}catch(e){alert('Arquivo de backup inválido.');}};reader.readAsText(file);}

// Delegação única: evita botões perderem eventos após cada renderização.
document.addEventListener('click', e=>{
  const nav=e.target.closest('[data-nav]');
  if(nav){e.preventDefault();page=nav.dataset.nav;closeDrawer();closeModal();render();return;}
  const a=e.target.closest('[data-action]'); if(!a)return;
  const act=a.dataset.action;
  if(act==='menu')document.getElementById('drawer').classList.add('open');
  else if(act==='closeDrawer')closeDrawer();
  else if(act==='settings'){page='settings';render();}
  else if(act==='closeModal')closeModal();
  else if(act==='quickIn')openEntry('in');
  else if(act==='quickOut')openEntry('out');
  else if(act==='addClient')openClient();
  else if(act==='addCut')openCut(a.dataset.client||'');
  else if(act==='addExpense')openExpense();
  else if(act==='addRevenue')openRevenue();
  else if(act==='toggleRevenue')markRevenue(a.dataset.id);
  else if(act==='toggleExpense')markExpense(a.dataset.id);
  else if(act==='deleteRevenue'&&confirm('Excluir esta receita?'))remove('revenues',a.dataset.id);
  else if(act==='deleteExpense'&&confirm('Excluir esta despesa?'))remove('expenses',a.dataset.id);
  else if(act==='deleteClient'&&confirm('Excluir este cliente? Os cortes e receitas serão mantidos.'))remove('clients',a.dataset.id);
  else if(act==='deleteMovement'&&confirm('Excluir esta movimentação?'))remove('movements',a.dataset.id);
  else if(act==='expenseFilter'){expenseFilter=a.dataset.filter;render();}
  else if(act==='revenueFilter'){revenueFilter=a.dataset.filter;render();}
  else if(act==='saveGoal'){data.goal=num(document.getElementById('goalInput')?.value);persist();alert('Meta salva.');render();}
  else if(act==='dedupe'){const before=countAll(data);data=dedupeAll(data);persist();alert(`${before-countAll(data)} duplicado(s) removido(s).`);render();}
  else if(act==='export'){download(`kings-9.2.1-backup-${today()}.json`,JSON.stringify(data,null,2),'application/json');}
  else if(act==='import')document.getElementById('importFile')?.click();
});
document.addEventListener('change',e=>{if(e.target.id==='importFile'&&e.target.files[0])importBackup(e.target.files[0]);});
document.getElementById('modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=9.2.1').catch(()=>{});
