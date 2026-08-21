const KEY = 'kings92_data_v4';
const OLD_KEYS = ['kings92_data_v2','kings92_data_v1','kings92_data','kings_data_v2','kings_data'];
const LEGACY_CUTS='kings_cuts_v3', LEGACY_EXPENSES='kings_expenses_v3', LEGACY_CFG='kings_cfg_v3';
const APP_VERSION='9.2.11';

const today = () => { const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const monthKey = d => String(d || '').slice(0,7);
const clone = x => JSON.parse(JSON.stringify(x));
const norm = v => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const uid = p => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const brDate = v => { const [y,m,d]=String(v||'').slice(0,10).split('-'); return y&&m&&d?`${d}/${m}/${y}`:String(v||''); };
const num = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(0, v) : 0;
  const raw = String(v ?? '').trim().replace(/R\$\s?/gi,'').replace(/\s/g,'');
  if (!raw) return 0;
  // Aceita 30, 30.50, 30,50 e valores digitados no padrão brasileiro.
  const normalized = raw.includes(',') && raw.includes('.')
    ? raw.replace(/\./g,'').replace(',','.')
    : raw.replace(',','.');
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};
const amountFromInput = el => {
  if (!el) return 0;
  const n = typeof el.valueAsNumber === 'number' && Number.isFinite(el.valueAsNumber) ? el.valueAsNumber : num(el.value);
  return Math.round(n * 100) / 100;
};

const seed = {
  cuts: [],
  clients: [],
  revenues: [],
  expenses: [],
  movements: [],
  goal: 0,
  categories: ['Aluguel','Mercadorias','Contas Fixas','Internet','Cartão','Materiais','Folha de Pagamento','Água','Energia','Transporte','Marketing','Impostos','Manutenção','Limpeza','Outros'],
  accounts: [],
  paymentMethods: [],
  security: {appLock:false, hideValues:false}
};

let data = load();
let page = 'home';
let expenseFilter = 'Todas';
let revenueFilter = 'Todas';

function ensureShape(d){
  d = d && typeof d === 'object' ? d : clone(seed);
  ['cuts','clients','revenues','expenses','movements'].forEach(k=>{ if(!Array.isArray(d[k])) d[k]=[]; });
  if(!Array.isArray(d.categories)) d.categories = clone(seed.categories);
  for(const c of seed.categories) if(!d.categories.some(x=>norm(x)===norm(c))) d.categories.push(c);
  if(!Array.isArray(d.accounts)) d.accounts = clone(seed.accounts);
  if(!Array.isArray(d.paymentMethods)) d.paymentMethods = clone(seed.paymentMethods);
  if(!d.security || typeof d.security!=='object') d.security = clone(seed.security);
  d.security.appLock=!!d.security.appLock; d.security.hideValues=!!d.security.hideValues;
  if(typeof d.goal !== 'number') d.goal = num(d.goal);
  d.clients = d.clients.map(x=>({...x,id:x.id||uid('c')}));
  d.cuts = d.cuts.map(x=>({...x,id:x.id||uid('cut'),value:num(x.value),date:x.date||today(),payment:x.payment||'Recebido'}));
  d.revenues = d.revenues.map(x=>({...x,id:x.id||uid('r'),value:num(x.value),date:x.date||today(),status:x.status||'A receber'}));
  d.expenses = d.expenses.map(x=>({...x,id:x.id||uid('e'),value:num(x.value),date:x.date||today(),status:x.status||'A vencer',installment:Number(x.installment)||1,totalInstallments:Number(x.totalInstallments)||1,parentId:x.parentId||null}));
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
function dedupeByIdentity(arr){
  const seen=new Set(), out=[];
  for(const item of Array.isArray(arr)?arr:[]){
    const id=String(item?.id||'');
    const key=id || JSON.stringify(item);
    if(!seen.has(key)){ seen.add(key); out.push(item); }
  }
  return out;
}
function dedupeAll(d){
  // Clientes: nomes + telefone iguais representam o mesmo cadastro.
  d.clients=dedupe(d.clients,['name','phone']);

  // Registros financeiros NÃO podem ser deduplicados por valor/data/descrição:
  // duas entradas de R$ 30,00 no mesmo dia são duas operações legítimas.
  // A deduplicação segura usa o ID do registro; lançamentos vinculados também
  // preservam o vínculo por sourceId.
  d.revenues=dedupeByIdentity(d.revenues);
  d.expenses=dedupeByIdentity(d.expenses);
  d.movements=dedupeByIdentity(d.movements);
  d.cuts=dedupeByIdentity(d.cuts);
  return d;
}
function removeBuiltInDemoData(d){
  const demoIds=new Set(['c1','c2','c3','c4','c5','c6','r1','r2','r3','r4','r5','e1','e2','e3','e4','e5','e6','e7','m1','m2','m3','m4','m5']);
  for(const k of ['clients','revenues','expenses','movements','cuts']) d[k]=Array.isArray(d[k])?d[k].filter(x=>!demoIds.has(x.id)):[];
  const builtInAccounts=new Set(['Conta principal','Caixa da barbearia']);
  const builtInPayments=new Set(['Dinheiro','Pix','Cartão de débito','Cartão de crédito','Transferência']);
  if(Array.isArray(d.accounts)) d.accounts=d.accounts.filter(x=>!builtInAccounts.has(x));
  if(Array.isArray(d.paymentMethods)) d.paymentMethods=d.paymentMethods.filter(x=>!builtInPayments.has(x));
  return d;
}
function persist(){ data=ensureShape(dedupeAll(removeBuiltInDemoData(data))); localStorage.setItem(KEY,JSON.stringify(data)); }
function migrateLegacy(){
  let d=clone(seed);
  try{
    const legacyCuts=JSON.parse(localStorage.getItem(LEGACY_CUTS)||'[]');
    const legacyExpenses=JSON.parse(localStorage.getItem(LEGACY_EXPENSES)||'[]');
    const legacyCfg=JSON.parse(localStorage.getItem(LEGACY_CFG)||'{}');
    if(Array.isArray(legacyCuts) && legacyCuts.length){
      d.cuts=legacyCuts.map(x=>({id:x.id||uid('cut'),client:x.client||x.cliente||'',service:x.service||x.servico||'Corte',value:num(x.value??x.valor),date:String(x.date||x.data||today()).slice(0,10),payment:x.payment||x.pagamento||'Recebido'}));
      d.movements=d.cuts.filter(x=>x.payment==='Recebido').map(x=>({id:uid('m'),type:'in',desc:`${x.service} - ${x.client||'Cliente'}`,value:x.value,date:x.date,sourceId:x.id}));
      const names=d.cuts.map(x=>norm(x.client)).filter(Boolean);
      d.clients=d.clients.filter(c=>names.includes(norm(c.name)));
      for(const x of d.cuts){ if(x.client && !d.clients.some(c=>norm(c.name)===norm(x.client))) d.clients.push({id:uid('c'),name:x.client,phone:''}); }
      for(const x of d.cuts.filter(x=>x.payment!=='Recebido')) d.revenues.push({id:uid('r'),client:x.client,desc:x.service,value:x.value,date:x.date,status:'A receber',sourceId:x.id});
    }
    if(Array.isArray(legacyExpenses) && legacyExpenses.length){
      d.expenses=legacyExpenses.map(x=>({id:x.id||uid('e'),desc:x.desc||x.description||x.descricao||'Despesa',value:num(x.value??x.valor),category:x.category||x.categoria||'Outros',date:String(x.date||x.data||today()).slice(0,10),status:x.status||'A vencer'}));
      d.movements.push(...d.expenses.filter(x=>x.status==='Pago').map(x=>({id:uid('m'),type:'out',desc:x.desc,value:x.value,date:x.date,sourceId:x.id})));
    }
    if(legacyCfg && typeof legacyCfg==='object'){
      if(num(legacyCfg.metaDia)) d.goal=num(legacyCfg.metaDia);
      if(Array.isArray(legacyCfg.barbers)) d.barbers=legacyCfg.barbers;
    }
  }catch(e){}
  return ensureShape(dedupeAll(d));
}
function load(){
  try{
    let raw=localStorage.getItem(KEY);
    if(!raw){ for(const k of OLD_KEYS){ raw=localStorage.getItem(k); if(raw) break; } }
    if(raw){ const d=ensureShape(JSON.parse(raw)); const clean=dedupeAll(removeBuiltInDemoData(d)); localStorage.setItem(KEY,JSON.stringify(clean)); return clean; }
    const migrated=removeBuiltInDemoData(migrateLegacy());
    localStorage.setItem(KEY,JSON.stringify(migrated));
    return migrated;
  }catch(e){ const d=clone(seed); localStorage.setItem(KEY,JSON.stringify(d)); return d; }
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
function monthTotals(){
  const mk=monthKey(today());
  const rows=data.movements.filter(x=>monthKey(x.date)===mk);
  const incoming=rows.filter(x=>x.type==='in').reduce((a,x)=>a+num(x.value),0);
  const outgoing=rows.filter(x=>x.type==='out').reduce((a,x)=>a+num(x.value),0);
  return {incoming,outgoing,profit:incoming-outgoing};
}
function pageHome(){
  const t=totals(), mt=monthTotals();
  return `<div class="page home-page">
    <div class="home-heading"><div><h1>Central Financeira</h1><div><span class="date-symbol">▣</span> Hoje, ${brDate(today())} <button class="calendar-link" data-nav="calendar">Ver calendário ›</button></div></div></div>
    <div class="home-metrics">
      <div class="home-metric in"><span class="metric-icon">↑</span><div><small>Entradas</small><b>${money(t.incoming)}</b></div></div>
      <div class="home-metric out"><span class="metric-icon">↓</span><div><small>Saídas</small><b>${money(t.outgoing)}</b></div></div>
      <div class="home-metric recv"><span class="metric-icon">▣</span><div><small>A Receber</small><b>${money(t.receivable)}</b></div></div>
      <div class="home-metric pay"><span class="metric-icon">▣</span><div><small>A Pagar</small><b>${money(t.payable)}</b></div></div>
    </div>
    <section class="home-balance">
      <div class="balance-label">Saldo Disponível</div><div class="balance-value ${t.balance>=0?'green':'red'}">${money(t.balance)}</div>
      <div class="balance-crown">♛</div><div class="balance-line"></div>
      <div class="profit-label">Lucro do Mês</div><div class="profit-row"><b class="green">${money(mt.profit)}</b><div class="profit-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><button data-nav="reports">↗</button></div>
    </section>
    <div class="home-quick-title">Atalhos Rápidos</div>
    <div class="home-quick">
      <button class="home-q in" data-action="quickIn"><span>＋</span>Entrada</button>
      <button class="home-q out" data-action="quickOut"><span>−</span>Saída</button>
      <button class="home-q client" data-action="addClient"><span>♙</span>Cliente</button>
    </div>
    <div class="home-summary-title"><span>Resumo do Mês</span><button data-nav="reports">Detalhes ›</button></div>
    <div class="home-summary">
      <div><span>Entradas</span><b class="green">${money(mt.incoming)}</b><i></i></div>
      <div><span>Saídas</span><b class="red">${money(mt.outgoing)}</b><i></i></div>
      <div><span>Lucro</span><b class="green">${money(mt.profit)}</b><i></i></div>
    </div>
    <div class="section-title home-recent-title">Movimentações recentes</div>${movementRows(data.movements.slice().reverse().slice(0,8))}
  </div>`;
}
function movementRows(arr){return arr.map(x=>`<div class="row"><div class="row-icon ${x.type==='in'?'green':'red'}">${x.type==='in'?'↑':'↓'}</div><div class="row-main"><b>${esc(x.sourceId?.startsWith('cut_')?'Corte':x.desc)}</b><small>${brDate(x.date)}${x.sourceId?.startsWith('cut_')?' · Corte registrado':''}</small></div><div class="row-price ${x.type==='in'?'green':'red'}">${money(x.value)}</div><button class="mini danger-mini" data-action="deleteMovement" data-id="${x.id}">×</button></div>`).join('')||`<div class="empty"><strong>Nenhuma movimentação</strong><br>Registre uma entrada ou saída.</div>`;}

function pageCash(){const t=totals();return `<div class="page">${header('Caixa','Controle de entradas e saídas')}<div class="grid2"><button class="quick greenbtn" data-action="quickIn">＋ Entrada rápida</button><button class="quick redbtn" data-action="quickOut">− Saída rápida</button></div><div class="metric-row"><div class="metric"><span>Total Entradas</span><b class="green">${money(t.incoming)}</b></div><div class="metric"><span>Total Saídas</span><b class="red">${money(t.outgoing)}</b></div></div><div class="fin-card balance-card"><div class="page-sub">SALDO DO PERÍODO</div><div class="balance-big ${t.balance>=0?'green':'red'}">${money(t.balance)}</div></div><div class="section-title">Movimentações recentes</div>${movementRows(data.movements.slice().reverse())}</div>`;}

function pageExpenses(){
  const filtered=data.expenses.filter(e=>expenseFilter==='Todas'||e.status===expenseFilter||(expenseFilter==='Vencidas'&&e.status==='A vencer'&&e.date<today()));
  return `<div class="page">${header('Despesas','Gerencie suas despesas')}<div class="filter">${['Todas','A vencer','Vencidas','Pagas'].map(f=>`<button class="${expenseFilter===f?'active':''}" data-action="expenseFilter" data-filter="${f}">${f}</button>`).join('')}</div>${filtered.map(expenseRow).join('')||`<div class="empty">Nenhuma despesa encontrada.</div>`}<button class="fab" data-action="addExpense">＋</button></div>`;
}
function expenseRow(e){return `<div class="row"><div class="row-icon expense-row-icon">${expenseIcon(e.category)}</div><div class="row-main"><b>${esc(e.desc)}</b><small>Venc: ${brDate(e.date)} · ${esc(e.category)}${e.totalInstallments>1?` · Parcela ${e.installment}/${e.totalInstallments}`:''}</small><div class="actions"><button class="mini action-paid ${e.status==='Pago'?'green':''}" data-action="toggleExpense" data-id="${e.id}">${e.status==='Pago'?'Pago':'Marcar como pago'}</button><button class="mini action-delete" data-action="deleteExpense" data-id="${e.id}">Excluir</button></div></div><div style="text-align:right"><div class="row-price red">${money(e.value)}</div><small class="${e.status==='Pago'?'green':'gold'}">${e.status}</small></div></div>`;}

function pageReceivables(){
  const filtered=data.revenues.filter(r=>revenueFilter==='Todas'||(revenueFilter==='A receber'&&r.status!=='Recebida')||(revenueFilter==='Recebidas'&&r.status==='Recebida'));
  return `<div class="page">${header('Receitas','Contas a receber')}<div class="filter">${['Todas','A receber','Recebidas'].map(f=>`<button class="${revenueFilter===f?'active':''}" data-action="revenueFilter" data-filter="${f}">${f}</button>`).join('')}</div>${filtered.map(revenueRow).join('')||`<div class="empty">Nenhuma receita encontrada.</div>`}<button class="fab" data-action="addRevenue">＋</button></div>`;
}
function revenueRow(r){return `<div class="row finance-row revenue-row"><div class="row-icon revenue-icon">▣</div><div class="row-main"><b>${esc(r.client)}</b><small>${brDate(r.date)}<br>${esc(r.desc)}</small><div class="actions"><button class="mini action-paid ${r.status==='Recebida'?'green':''}" data-action="toggleRevenue" data-id="${r.id}">${r.status==='Recebida'?'Recebida':'Marcar como recebida'}</button><button class="mini action-delete" data-action="deleteRevenue" data-id="${r.id}">Excluir</button></div></div><div style="text-align:right"><div class="row-price ${r.status==='Recebida'?'green':'red'}">${money(r.value)}</div><small class="${r.status==='Recebida'?'green':'gold'}">${r.status}</small></div></div>`;}

function pageClients(){return `<div class="page">${header('Clientes','Seus clientes cadastrados')}<input class="search" id="clientSearch" placeholder="⌕  Buscar cliente..."><div id="clientList">${clientRows(data.clients)}</div><button class="fab" data-action="addClient">＋</button></div>`;}
function clientStats(c){
  const name=norm(c.name);
  const cuts=data.cuts.filter(x=>norm(x.client)===name);
  const rev=data.revenues.filter(x=>norm(x.client)===name);
  const cutIds=new Set(cuts.map(x=>x.id));

  // Um corte a receber gera uma receita vinculada por sourceId.
  // Não podemos somar o corte + a receita, pois isso duplica o valor do cliente.
  const spentCuts=cuts.filter(x=>x.payment==='Recebido').reduce((a,x)=>a+num(x.value),0);
  const spentManualRev=rev.filter(x=>x.status==='Recebida' && !cutIds.has(x.sourceId)).reduce((a,x)=>a+num(x.value),0);
  const spent=spentCuts+spentManualRev;

  const openRev=rev.filter(x=>x.status!=='Recebida').reduce((a,x)=>a+num(x.value),0);
  // Compatibilidade com registros antigos que podem ter o corte sem a receita vinculada.
  const openLegacyCuts=cuts.filter(x=>x.payment!=='Recebido' && !rev.some(r=>r.sourceId===x.id)).reduce((a,x)=>a+num(x.value),0);
  const open=openRev+openLegacyCuts;
  return {spent,open};
}
function clientRows(arr){return arr.map(c=>{const s=clientStats(c);return `<div class="row finance-row client-row"><div class="row-icon client-icon">♙</div><div class="row-main"><b>${esc(c.name)}</b><small>${esc(c.phone||'')}<br>Total gasto: ${money(s.spent)}</small><div class="actions"><button class="mini action-primary" data-action="addCut" data-client="${esc(c.name)}">Novo corte</button><button class="mini action-delete" data-action="deleteClient" data-id="${c.id}">Excluir</button></div></div><div style="text-align:right"><small class="${s.open?'red':'green'}">${s.open?'Em aberto':'✓'}</small><div class="row-price ${s.open?'red':'green'}">${money(s.open)}</div></div></div>`;}).join('')||`<div class="empty">Nenhum cliente cadastrado.</div>`;}

function openCalendarDay(ds){
  const incoming=data.movements.filter(x=>x.type==='in'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
  const outgoing=data.movements.filter(x=>x.type==='out'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
  const payable=data.expenses.filter(x=>x.status!=='Pago'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
  const receivable=data.revenues.filter(x=>x.status!=='Recebida'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
  const details=[
    incoming?`<div class="calendar-detail in"><span>Recebidos</span><b>${money(incoming)}</b></div>`:'',
    outgoing?`<div class="calendar-detail out"><span>Saídas</span><b>${money(outgoing)}</b></div>`:'',
    payable?`<div class="calendar-detail pay"><span>A pagar</span><b>${money(payable)}</b></div>`:'',
    receivable?`<div class="calendar-detail recv"><span>A receber</span><b>${money(receivable)}</b></div>`:''
  ].join('');
  openModal(`<h2>${brDate(ds)}</h2>${details||'<div class="empty">Nenhum lançamento neste dia.</div>'}<button class="save" id="calendarClose">Fechar</button>`);
  document.getElementById('calendarClose')?.addEventListener('click',closeModal);
}
function pageCalendar(){
  const now=new Date(); const y=now.getFullYear(),m=now.getMonth(); const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
  let cells=''; ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].forEach(x=>cells+=`<div class="cal-head">${x}</div>`);
  for(let i=0;i<first;i++) cells+=`<div class="cal-cell muted"></div>`;
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ins=data.movements.filter(x=>x.type==='in'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
    const outs=data.movements.filter(x=>x.type==='out'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
    const payable=data.expenses.filter(x=>x.status!=='Pago'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
    const receivable=data.revenues.filter(x=>x.status!=='Recebida'&&x.date===ds).reduce((a,x)=>a+num(x.value),0);
    const cls=ds===today()?' today':'';
    const events=[];
    if(ins) events.push({kind:'in',label:'Recebido',value:ins});
    if(outs) events.push({kind:'out',label:'Saída',value:outs});
    if(payable) events.push({kind:'pay',label:'A pagar',value:payable});
    if(receivable) events.push({kind:'recv',label:'A receber',value:receivable});
    const pills=events.map(ev=>`<span class="pill ${ev.kind}" title="${ev.label} ${money(ev.value)}"><small>${ev.label}</small><strong>${money(ev.value)}</strong></span>`).join('');
    cells+=`<div class="cal-cell${cls}" data-action="calendarDay" data-date="${ds}"><b>${d}</b><div class="cal-events">${pills}</div></div>`;
  }
  return `<div class="page modern-page calendar-page">${header('Calendário','Recebidos, saídas, contas a pagar e a receber')}<div class="calendar-legend"><span><i class="dot in"></i>Recebidos</span><span><i class="dot out"></i>Saídas</span><span><i class="dot pay"></i>A pagar</span><span><i class="dot recv"></i>A receber</span></div><div class="calendar">${cells}</div></div>`;
}
function pageReports(){
  const t=totals(), margin=t.incoming?((t.profit/t.incoming)*100):0;
  const cats={}; data.expenses.forEach(e=>cats[e.category]=(cats[e.category]||0)+num(e.value));
  return `<div class="page modern-page reports-page">${header('Relatórios','Análises e gráficos')}<div class="metric-row"><div class="metric"><span>Entradas</span><b class="green">${money(t.incoming)}</b></div><div class="metric"><span>Saídas</span><b class="red">${money(t.outgoing)}</b></div><div class="metric"><span>Lucro</span><b class="blue">${money(t.profit)}</b></div><div class="metric"><span>Margem</span><b class="gold">${margin.toFixed(2).replace('.',',')}%</b></div></div><div class="fin-card"><b>Despesas por categoria</b>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><div class="row-icon">${expenseIcon(k)}</div><div class="row-main"><b>${esc(k)}</b></div><div class="row-price red">${money(v)}</div></div>`).join('')||'<div class="empty">Sem despesas.</div>'}</div></div>`;
}
function pageCategories(){const map={};data.expenses.forEach(e=>map[e.category]=(map[e.category]||0)+num(e.value));return `<div class="page modern-page categories-page">${header('Despesas por Categoria',`Mês ${brMonth(today())}`)}${Object.entries(map).map(([k,v])=>`<div class="row"><div class="row-icon expense-row-icon">${expenseIcon(k)}</div><div class="row-main"><b>${esc(k)}</b><small>Despesas registradas</small></div><div class="row-price red">${money(v)}</div></div>`).join('')||'<div class="empty">Sem despesas.</div>'}</div>`;}
function pageMore(){
  const items=[
    ['categories','Categorias','Gerencie categorias de receitas e despesas'],
    ['accounts','Contas','Gerencie suas contas e cartões'],
    ['payments','Formas de Pagamento','Dinheiro, Pix, Cartão...'],
    ['backup','Backup e Restauração','Faça backup dos seus dados'],
    ['security','Segurança','Bloqueio do aplicativo'],
    ['about','Sobre o KINGS',`Versão ${APP_VERSION}`]
  ];
  return `<div class="page more-page modern-page">${header('Mais','Configurações e ferramentas')}<div class="more-list">${items.map(([key,title,sub])=>`<button class="row setting-row" style="width:100%;text-align:left" data-nav="${key}">${iconBadge(menuIcon(key),key)}<div class="row-main"><b>${title}</b><small>${sub}</small></div><span class="setting-chevron">›</span></button>`).join('')}</div></div>`;
}
function pageSettings(){
  return `<div class="page settings-page modern-page">${header('Configurações',`KINGS ${APP_VERSION}`)}
    <div class="settings-grid">
      <button class="setting-tile" data-nav="categories">${iconBadge('▣','categories')}<span><b>Categorias</b><small>Gerencie categorias</small></span><i>›</i></button>
      <button class="setting-tile" data-nav="accounts">${iconBadge('▤','accounts')}<span><b>Contas</b><small>Contas e cartões</small></span><i>›</i></button>
      <button class="setting-tile" data-nav="payments">${iconBadge('▣','payments')}<span><b>Formas de Pagamento</b><small>Dinheiro, Pix, Cartão...</small></span><i>›</i></button>
      <button class="setting-tile" data-nav="backup">${iconBadge('↥','backup')}<span><b>Backup e Restauração</b><small>Proteja seus dados</small></span><i>›</i></button>
      <button class="setting-tile" data-nav="security">${iconBadge('♙','security')}<span><b>Segurança</b><small>Bloqueio do aplicativo</small></span><i>›</i></button>
      <button class="setting-tile" data-nav="about">${iconBadge('ⓘ','about')}<span><b>Sobre o KINGS</b><small>Versão ${APP_VERSION}</small></span><i>›</i></button>
    </div>
    <div class="fin-card"><div class="section-title" style="margin-top:0">Meta diária</div><input id="goalInput" class="search" type="number" step="0.01" value="${data.goal||''}" placeholder="Ex.: 1000"><button class="save" data-action="saveGoal">Salvar meta</button></div>
    <div class="fin-card"><div class="section-title" style="margin-top:0">Deduplicação automática</div><p class="page-sub">O sistema verifica cortes, clientes, receitas, despesas e movimentações antes de salvar.</p><button class="save" data-action="dedupe">Verificar e eliminar duplicados</button></div>
  </div>`;
}
function pageAccounts(){
  return `<div class="page modern-page settings-subpage">${header('Contas','Gerencie suas contas e cartões')}<div class="settings-list">${data.accounts.map((x,i)=>`<div class="row setting-row">${iconBadge('▤','accounts')}<div class="row-main"><b>${esc(x)}</b><small>Conta disponível para lançamentos</small></div><button class="mini action-delete" data-action="deleteAccount" data-index="${i}">Excluir</button></div>`).join('')||'<div class="empty">Nenhuma conta cadastrada.</div>'}</div><button class="save" data-action="addAccount">＋ Adicionar conta</button></div>`;
}
function pagePayments(){
  return `<div class="page modern-page settings-subpage">${header('Formas de Pagamento','Dinheiro, Pix, Cartão e outras formas')}<div class="settings-list">${data.paymentMethods.map((x,i)=>`<div class="row setting-row">${iconBadge('▣','payments')}<div class="row-main"><b>${esc(x)}</b><small>Forma de pagamento disponível</small></div><button class="mini action-delete" data-action="deletePayment" data-index="${i}">Excluir</button></div>`).join('')||'<div class="empty">Nenhuma forma cadastrada.</div>'}</div><button class="save" data-action="addPayment">＋ Adicionar forma</button></div>`;
}
function pageBackup(){
  return `<div class="page modern-page settings-subpage">${header('Backup e Restauração','Faça backup dos seus dados')}<div class="fin-card"><div class="section-title" style="margin-top:0">Backup completo</div><p class="page-sub">Exporte cortes, clientes, receitas, despesas, movimentações, categorias e configurações.</p><button class="save" data-action="export">↥ Exportar backup JSON</button><button class="save secondary" data-action="import">↧ Restaurar backup JSON</button><input id="importFile" type="file" accept="application/json" hidden></div></div>`;
}
function pageSecurity(){
  return `<div class="page modern-page settings-subpage">${header('Segurança','Proteja o acesso e a visualização dos seus dados')}<div class="fin-card security-card"><label class="security-option"><span>${iconBadge('♙','security')}<span><b>Bloqueio do aplicativo</b><small>Solicita confirmação ao abrir o KINGS</small></span></span><input type="checkbox" data-security="appLock" ${data.security.appLock?'checked':''}></label><label class="security-option"><span>${iconBadge('◉','security')}<span><b>Ocultar valores</b><small>Esconde valores financeiros nas telas</small></span></span><input type="checkbox" data-security="hideValues" ${data.security.hideValues?'checked':''}></label></div></div>`;
}
function pageAbout(){return `<div class="page modern-page settings-subpage">${header('Sobre o KINGS',`Versão ${APP_VERSION}`)}<div class="fin-card about-card">${iconBadge('ⓘ','about')}<h2>KINGS</h2><p class="page-sub">Sistema financeiro para controle de cortes, clientes, receitas, despesas e caixa.</p><span class="badge">${APP_VERSION}</span></div></div>`;}

const pages={home:pageHome,cash:pageCash,expenses:pageExpenses,clients:pageClients,receivables:pageReceivables,calendar:pageCalendar,reports:pageReports,categories:pageCategories,more:pageMore,settings:pageSettings,accounts:pageAccounts,payments:pagePayments,backup:pageBackup,security:pageSecurity,about:pageAbout};

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
  const isIn = type === 'in';
  const title = isIn ? 'Venda Rápida' : 'Saída Rápida';
  const defaultDesc = isIn ? 'Entrada rápida' : 'Saída rápida';
  const tone = isIn ? 'quick-entry-in' : 'quick-entry-out';
  const nowTime = () => new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const nowDate = () => new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).replace('.','');
  let digits = '';

  const draw = () => {
    const cents = Number(digits || '0');
    const value = cents; // keypad represents whole reais, matching the quick-entry screen
    const formatted = money(value);
    const desc = document.getElementById('qDesc')?.value?.trim() || defaultDesc;
    const valueEl = document.getElementById('quickAmount');
    if(valueEl) valueEl.textContent = formatted;
    const descEl = document.getElementById('quickDescPreview');
    if(descEl) descEl.textContent = desc;
    const countEl = document.getElementById('quickDescCount');
    if(countEl) countEl.textContent = `${Math.min((desc||'').length,120)} / 120`;
    const save = document.getElementById('quickSave');
    if(save) save.disabled = value <= 0;
  };

  openModal(`
    <div class="quick-entry ${tone}">
      <div class="quick-top">
        <button class="quick-help" type="button" aria-label="Ajuda">?</button>
        <h2>${title}</h2>
        <button class="quick-close" data-action="closeModal" type="button" aria-label="Fechar">×</button>
      </div>
      <div class="quick-amount" id="quickAmount">${money(0)}</div>
      <div class="quick-description">
        <label for="qDesc">Descrição:</label>
        <input id="qDesc" maxlength="120" value="${esc(defaultDesc)}" autocomplete="off">
        <span id="quickDescPreview">${esc(defaultDesc)}</span>
        <small id="quickDescCount">${defaultDesc.length} / 120</small>
      </div>
      <div class="quick-meta">
        <div>${nowDate()}</div><div>${nowTime()}</div>
      </div>
      <div class="quick-keypad" aria-label="Teclado numérico">
        ${['1','2','3','4','5','6','7','8','9','0'].map(k=>`<button type="button" class="quick-key" data-quick-key="${k}">${k}</button>`).join('')}
        <button type="button" class="quick-key quick-back" data-quick-back="1" aria-label="Apagar">‹</button>
      </div>
      <button type="button" class="quick-save" id="quickSave" disabled aria-label="Salvar">${isIn?'▣':'▣'}</button>
    </div>
  `);

  const descInput=document.getElementById('qDesc');
  descInput?.addEventListener('input',draw);
  document.querySelectorAll('[data-quick-key]').forEach(btn=>btn.addEventListener('click',()=>{
    if(digits.length < 9) digits += btn.dataset.quickKey;
    draw();
  }));
  document.querySelector('[data-quick-back]')?.addEventListener('click',()=>{
    digits=digits.slice(0,-1);
    draw();
  });
  document.getElementById('quickSave')?.addEventListener('click',()=>{
    const value=Number(digits||'0');
    if(value<=0) return;
    const desc=descInput?.value?.trim()||defaultDesc;
    const save=document.getElementById('quickSave');
    if(save?.dataset.saving==='1') return;
    if(save) { save.dataset.saving='1'; save.disabled=true; }
    data.movements.push({
      id:uid('m'),
      type,
      desc,
      value,
      date:today(),
      createdAt:new Date().toISOString()
    });
    persist();
    closeModal();
    render();
  });
  draw();
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
    const cut={id:uid('cut'),client:document.getElementById('cutClient').value,service:document.getElementById('cutService').value.trim(),value:num(document.getElementById('cutValue').value),date:document.getElementById('cutDate').value,payment:document.getElementById('cutPay').value,createdAt:new Date().toISOString()};
    data.cuts.push(cut);
    if(cut.payment==='Recebido') data.movements.push({id:uid('m'),type:'in',desc:`${cut.service} - ${cut.client}`,value:cut.value,date:cut.date,sourceId:cut.id,createdAt:new Date().toISOString()});
    else data.revenues.push({id:uid('r'),client:cut.client,desc:cut.service,value:cut.value,date:cut.date,status:'A receber',sourceId:cut.id,createdAt:new Date().toISOString()});
    persist();closeModal();render();
  };
}
function openExpense(){
  const cats=data.categories.map(c=>`<option>${esc(c)}</option>`).join('');
  openModal(`<h2>Nova Despesa</h2>${field('DESCRIÇÃO (OPCIONAL)','eDesc')} ${field('VALOR TOTAL','eValue','number','','step="0.01" min="0.01"')}<div class="field"><label>CATEGORIA</label><select id="eCat" class="input">${cats}</select></div>${field('DATA DE VENCIMENTO','eDate','date',today())}<div class="field"><label>PARCELAMENTO</label><select id="eInstallments" class="input"><option value="1">À vista</option><option value="2">2 parcelas</option><option value="3">3 parcelas</option><option value="4">4 parcelas</option><option value="5">5 parcelas</option><option value="6">6 parcelas</option><option value="10">10 parcelas</option><option value="12">12 parcelas</option></select></div><div class="field"><label>STATUS DA 1ª PARCELA</label><select id="eStatus" class="input"><option>A vencer</option><option>Pago</option></select></div><div id="installmentPreview" class="installment-preview"></div><button class="save" id="modalSave">Salvar despesa</button>`);
  const updatePreview=()=>{
    const total=num(document.getElementById('eValue')?.value); const n=Number(document.getElementById('eInstallments')?.value)||1;
    const part=n?total/n:0; const el=document.getElementById('installmentPreview');
    if(el) el.innerHTML=n>1&&total?`Valor aproximado por parcela: <b>${money(part)}</b><br><small>${n} vencimentos mensais a partir de ${brDate(document.getElementById('eDate')?.value)}</small>`:'';
  };
  document.getElementById('eValue')?.addEventListener('input',updatePreview);
  document.getElementById('eInstallments')?.addEventListener('change',updatePreview);
  document.getElementById('eDate')?.addEventListener('change',updatePreview);
  updatePreview();
  document.getElementById('modalSave').onclick=()=>{
    if(!requireValue('eValue','o valor')||!requireValue('eDate','a data'))return;
    const total=num(document.getElementById('eValue').value), n=Number(document.getElementById('eInstallments').value)||1, baseDate=document.getElementById('eDate').value, status=document.getElementById('eStatus').value, desc=document.getElementById('eDesc').value.trim()||'Despesa';
    const category=document.getElementById('eCat').value;
    const cents=Math.round(total*100), base=Math.floor(cents/n), remainder=cents-base*n;
    for(let i=1;i<=n;i++){
      const due=new Date(baseDate+'T12:00:00'); due.setMonth(due.getMonth()+i-1);
      const value=(base+(i===n?remainder:0))/100;
      const e={id:uid('e'),desc:n>1?`${desc} (${i}/${n})`:desc,value,category,date:due.toISOString().slice(0,10),status:(i===1?status:'A vencer'),installment:i,totalInstallments:n,parentId:null,createdAt:new Date().toISOString()};
      data.expenses.push(e);
      if(e.status==='Pago') data.movements.push({id:uid('m'),type:'out',desc:e.desc,value:e.value,date:e.date,sourceId:e.id,createdAt:new Date().toISOString()});
    }
    persist();closeModal();render();
  };
}
function openRevenue(){
  const opts=data.clients.map(c=>`<option>${esc(c.name)}</option>`).join('');
  openModal(`<h2>Nova Receita</h2><div class="field"><label>CLIENTE</label><input id="rClient" class="input" list="clientOptions" placeholder="Nome do cliente"><datalist id="clientOptions">${opts}</datalist></div>${field('DESCRIÇÃO (OPCIONAL)','rDesc')}${field('VALOR','rValue','number','','step="0.01" min="0.01"')}${field('VENCIMENTO','rDate','date',today())}<div class="field"><label>STATUS</label><select id="rStatus" class="input"><option>A receber</option><option>Recebida</option></select></div><button class="save" id="modalSave">Salvar receita</button>`);
  document.getElementById('modalSave').onclick=()=>{
    if(!requireValue('rClient','o cliente')||!requireValue('rValue','o valor')||!requireValue('rDate','a data'))return;
    const r={id:uid('r'),client:document.getElementById('rClient').value.trim(),desc:document.getElementById('rDesc').value.trim()||'Receita',value:num(document.getElementById('rValue').value),date:document.getElementById('rDate').value,status:document.getElementById('rStatus').value,createdAt:new Date().toISOString()};
    data.revenues.push(r);
    if(r.status==='Recebida') data.movements.push({id:uid('m'),type:'in',desc:`${r.desc} - ${r.client}`,value:r.value,date:r.date,sourceId:r.id,createdAt:new Date().toISOString()});
    persist();closeModal();render();
  };
}

function markRevenue(id){
  const r=data.revenues.find(x=>x.id===id); if(!r)return;
  if(r.status==='Recebida'){r.status='A receber';data.movements=data.movements.filter(m=>m.sourceId!==id);}
  else {r.status='Recebida';if(!data.movements.some(m=>m.sourceId===id))data.movements.push({id:uid('m'),type:'in',desc:`${r.desc} - ${r.client}`,value:r.value,date:today(),sourceId:r.id,createdAt:new Date().toISOString()});}
  persist();render();
}
function markExpense(id){
  const e=data.expenses.find(x=>x.id===id);if(!e)return;
  if(e.status==='Pago'){e.status='A vencer';data.movements=data.movements.filter(m=>m.sourceId!==id);}
  else {e.status='Pago';if(!data.movements.some(m=>m.sourceId===id))data.movements.push({id:uid('m'),type:'out',desc:e.desc,value:e.value,date:today(),sourceId:e.id,createdAt:new Date().toISOString()});}
  persist();render();
}
function remove(type,id){
  if(type==='movements'){
    const m=data.movements.find(x=>x.id===id);
    if(m?.sourceId){
      if(m.sourceId.startsWith('cut_')){ data.cuts=data.cuts.filter(x=>x.id!==m.sourceId); data.revenues=data.revenues.filter(x=>x.sourceId!==m.sourceId); }
      if(m.sourceId.startsWith('e_')){ const e=data.expenses.find(x=>x.id===m.sourceId); if(e) e.status='A vencer'; }
      if(m.sourceId.startsWith('r_')){ const r=data.revenues.find(x=>x.id===m.sourceId); if(r) r.status='A receber'; }
    }
  }
  data[type]=data[type].filter(x=>x.id!==id); persist(); render();
}
function countAll(d){return ['cuts','clients','revenues','expenses','movements'].reduce((a,k)=>a+(d[k]?.length||0),0);}
function brMonth(v){const [y,m]=String(v).slice(0,7).split('-');return `${m}/${y}`;}
function expenseIcon(k){
  const map={
    Aluguel:['⌂','house'],Mercadorias:['🛒','cart'],'Contas Fixas':['💡','light'],Internet:['📶','wifi'],Cartão:['▣','card'],Materiais:['✂','scissors'],'Folha de Pagamento':['$','salary'],Água:['💧','water'],Energia:['⚡','energy'],Transporte:['🚗','car'],Marketing:['📣','marketing'],Impostos:['▤','tax'],Manutenção:['🔧','tools'],Limpeza:['🧹','clean'],'Outros':['◆','other']
  };
  const [glyph,cls]=map[k]||map.Outros;
  return `<span class="expense-symbol ${cls}">${glyph}</span>`;
}
function iconFor(k){return expenseIcon(k);}
function menuIcon(k){return ({categories:'▣',accounts:'▤',payments:'▣',backup:'↥',security:'♙',about:'ⓘ',calendar:'▦',reports:'⌁',settings:'⚙'}[k]||'◆');}
function iconBadge(icon,cls=''){return `<span class="setting-icon ${cls}">${icon}</span>`;}
function addSimpleItem(type,title){if(type==='account') data.accounts.push(title); else data.paymentMethods.push(title); persist(); render();}
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
  else if(act==='calendarDay')openCalendarDay(a.dataset.date);
  else if(act==='expenseFilter'){expenseFilter=a.dataset.filter;render();}
  else if(act==='revenueFilter'){revenueFilter=a.dataset.filter;render();}
  else if(act==='addAccount'){const name=prompt('Nome da conta ou cartão:');if(name&&name.trim())addSimpleItem('account',name.trim());}
  else if(act==='deleteAccount'){const i=Number(a.dataset.index);if(confirm('Excluir esta conta?')){data.accounts.splice(i,1);persist();render();}}
  else if(act==='addPayment'){const name=prompt('Nome da forma de pagamento:');if(name&&name.trim())addSimpleItem('payment',name.trim());}
  else if(act==='deletePayment'){const i=Number(a.dataset.index);if(confirm('Excluir esta forma de pagamento?')){data.paymentMethods.splice(i,1);persist();render();}}
  else if(act==='saveGoal'){data.goal=num(document.getElementById('goalInput')?.value);persist();alert('Meta salva.');render();}
  else if(act==='dedupe'){const before=countAll(data);data=dedupeAll(data);persist();alert(`${before-countAll(data)} duplicado(s) removido(s).`);render();}
  else if(act==='export'){download(`kings-9.2.14-backup-${today()}.json`,JSON.stringify(data,null,2),'application/json');}
  else if(act==='import')document.getElementById('importFile')?.click();
});
document.addEventListener('change',e=>{if(e.target.id==='importFile'&&e.target.files[0])importBackup(e.target.files[0]); if(e.target.dataset.security){data.security[e.target.dataset.security]=e.target.checked;persist();render();}});
document.getElementById('modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=9.2.14').catch(()=>{});
