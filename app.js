const KEY='kings_cuts_v3', EXP='kings_expenses_v3', CFG='kings_cfg_v3', CLI='kings_clients_v1';
let cuts=JSON.parse(localStorage.getItem(KEY)||'[]');
let expenses=JSON.parse(localStorage.getItem(EXP)||'[]');
let clients=JSON.parse(localStorage.getItem(CLI)||'[]');
clients=[...new Set([...clients,...cuts.map(c=>c.client).filter(Boolean)])];
let cfg=Object.assign({name:'KINGS',corte:40,barba:25,combo:60,metaDia:0,metaMes:0,barbers:[]},JSON.parse(localStorage.getItem(CFG)||'{}'));
const brl=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dateKey=d=>new Date(d).toLocaleDateString('en-CA');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const nowLocal=()=>{let d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
function renderDate(){document.getElementById('date').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'short'}).toUpperCase().replace('.','')}
function saveAll(){localStorage.setItem(KEY,JSON.stringify(cuts));localStorage.setItem(EXP,JSON.stringify(expenses));localStorage.setItem(CFG,JSON.stringify(cfg));localStorage.setItem(CLI,JSON.stringify(clients))}
function buildClientSuggestions(){document.getElementById('clientSuggestions').innerHTML=clients.map(n=>`<option value="${esc(n)}"></option>`).join('')}
function buildServices(){buildClientSuggestions();document.getElementById('serviceButtons').innerHTML=[['Corte',cfg.corte],['Barba',cfg.barba],['Corte + Barba',cfg.combo]].map((s,i)=>`<button class="service ${i===0?'sel':''}" onclick="chooseService(this,${s[1]})">${s[0]}<small>${brl(s[1])}</small></button>`).join('');document.getElementById('price').value=cfg.corte}
function buildBarbers(){let opts='<option value="">Selecionar barbeiro</option>'+cfg.barbers.map(b=>`<option>${esc(b)}</option>`).join('');document.getElementById('barber').innerHTML=opts;document.getElementById('barberList').innerHTML=cfg.barbers.length?cfg.barbers.map(b=>`<span class="chip">${esc(b)} <button class="mini red" onclick="removeBarber('${esc(b).replace(/'/g,"\\'")}')">×</button></span>`).join(''):'<span class="chip">Nenhum barbeiro cadastrado</span>'}
function chooseService(el,p){document.querySelectorAll('.service').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');document.getElementById('price').value=p}
function choosePay(el,p){document.querySelectorAll('.pay').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');el.dataset.pay=p}
function selectedPay(){let b=document.querySelector('.pay.sel');return b?.dataset.pay||'pix'}
function openCut(){buildServices();buildBarbers();document.getElementById('cutTime').value=nowLocal();document.getElementById('client').value='';document.querySelectorAll('.pay').forEach(x=>x.classList.remove('sel'));document.querySelector('.pay').classList.add('sel');document.getElementById('payButtons').querySelector('.pay').dataset.pay='pix';document.getElementById('modalCut').classList.add('open');setTimeout(()=>document.getElementById('price').focus(),50)}
function openExpense(){document.getElementById('expenseValue').value='';document.getElementById('expenseDesc').value='';document.getElementById('expenseTime').value=nowLocal();document.getElementById('modalExpense').classList.add('open');setTimeout(()=>document.getElementById('expenseValue').focus(),50)}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function saveCut(){let price=Number(document.getElementById('price').value)||0,client=document.getElementById('client').value.trim(),pay=selectedPay(),barber=document.getElementById('barber').value,dt=document.getElementById('cutTime').value;if(!price)return alert('Informe o valor.');if(pay==='fiado'&&!client)return alert('Informe o nome do cliente para registrar como fiado.');cuts.unshift({id:Date.now(),price,client,fiado:pay==='fiado',payment:pay,barber,date:dt?new Date(dt).toISOString():new Date().toISOString()});if(client&&!clients.includes(client))clients.unshift(client);saveAll();closeModal('modalCut');render()}
function saveExpense(){let value=Number(document.getElementById('expenseValue').value)||0,desc=document.getElementById('expenseDesc').value.trim(),cat=document.getElementById('expenseCat').value,dt=document.getElementById('expenseTime').value;if(!value)return alert('Informe o valor da saída.');if(!desc)return alert('Informe a descrição da despesa.');expenses.unshift({id:Date.now(),value,desc,cat,date:dt?new Date(dt).toISOString():new Date().toISOString()});saveAll();closeModal('modalExpense');render()}
function periodFilter(period){let now=new Date();if(period==='day')return {from:new Date(now.getFullYear(),now.getMonth(),now.getDate()),to:new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)};if(period==='week'){let from=new Date(now);from.setHours(0,0,0,0);from.setDate(now.getDate()-6);return {from,to:new Date()}}return {from:new Date(now.getFullYear(),now.getMonth(),1),to:new Date(now.getFullYear(),now.getMonth()+1,1)}}
function inPeriod(date,p){let d=new Date(date);return !Number.isNaN(d.getTime())&&d>=p.from&&d<p.to}
function amountOf(o){return Number(o?.value ?? o?.price ?? o?.amount ?? o?.valor ?? 0)||0}
function total(arr,key='price'){return arr.reduce((s,c)=>s+amountOf(key==='value'?c:{...c,value:c[key]}),0)}
function paymentLabel(p){return ({pix:'Pix',dinheiro:'Dinheiro',cartao:'Cartão',fiado:'Fiado'}[p]||'Pago')}
function cutRow(c,actions=true){let d=new Date(c.date);return `<div class="row"><div><b>${esc(c.client||'Cliente avulso')}</b><small>${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${paymentLabel(c.payment)}${c.barber?' · '+esc(c.barber):''}</small>${actions?`<div class="actions">${c.fiado?`<button class="mini green" onclick="markPaid(${c.id})">Marcar pago</button>`:''}<button class="mini red" onclick="deleteCut(${c.id})">Excluir</button></div>`:''}</div><div class="price">${brl(c.price)}</div></div>`}
function expenseRow(e){let d=new Date(e.date);return `<div class="row"><div><b>− ${brl(amountOf(e))}</b><small>${esc(e.desc)} · ${esc(e.cat)}<br>${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small><div class="actions"><button class="mini red" onclick="deleteExpense(${e.id})">Excluir</button></div></div><div class="price" style="color:var(--red)">SAÍDA</div></div>`}
function markPaid(id){let c=cuts.find(x=>x.id===id);if(c){c.fiado=false;c.payment='pix';c.paidAt=new Date().toISOString();saveAll();render()}}
function deleteCut(id){if(confirm('Excluir este corte?')){cuts=cuts.filter(c=>c.id!==id);saveAll();render()}}
function deleteExpense(id){if(confirm('Excluir esta saída de caixa?')){expenses=expenses.filter(e=>e.id!==id);saveAll();render()}}
function show(id,btn){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');else{let map={home:0,reports:1,cash:2,expenses:3,clients:4,debt:3};if(map[id]!=null)document.querySelectorAll('.nav button')[map[id]].classList.add('active')}if(id==='settings')loadSettings();render()}
function renderHome(){let now=new Date(),pDay=periodFilter('day'),pWeek=periodFilter('week'),pMonth=periodFilter('month'),tc=cuts.filter(c=>inPeriod(c.date,pDay)),wc=cuts.filter(c=>inPeriod(c.date,pWeek)),mc=cuts.filter(c=>inPeriod(c.date,pMonth));let today=total(tc),week=total(wc),month=total(mc);document.getElementById('today').textContent=brl(today);document.getElementById('todayCount').textContent=tc.length;document.getElementById('week').textContent=brl(week);document.getElementById('weekCount').textContent=wc.length+' cortes';document.getElementById('month').textContent=brl(month);document.getElementById('monthCount').textContent=mc.length+' cortes';let dp=cfg.metaDia?Math.min(100,today/cfg.metaDia*100):0,mp=cfg.metaMes?Math.min(100,month/cfg.metaMes*100):0;document.getElementById('dayProgress').style.width=dp+'%';document.getElementById('monthProgress').style.width=mp+'%';document.getElementById('dayGoalText').textContent=cfg.metaDia?'Meta diária '+brl(cfg.metaDia):'Meta diária não definida';document.getElementById('dayGoalPct').textContent=Math.round(dp)+'%';document.getElementById('recent').innerHTML=cuts.length?`<div class="list">${cuts.slice(0,6).map(c=>cutRow(c)).join('')}</div>`:`<div class="empty"><div class="icon">✂️</div><h3>Nenhum corte ainda</h3><p>Registre seu primeiro corte usando o +</p></div>`}
function setReportPeriod(btn,period){document.querySelectorAll('#reports .tabs button').forEach(x=>x.classList.remove('sel'));btn.classList.add('sel');renderReports(period)}
function renderReports(period='day'){let p=periodFilter(period),ins=cuts.filter(c=>inPeriod(c.date,p)),outs=expenses.filter(e=>inPeriod(e.date,p)),iv=ins.reduce((s,c)=>s+Number(c.price||0),0),ov=outs.reduce((s,e)=>s+amountOf(e),0);document.getElementById('rIn').textContent=brl(iv);document.getElementById('rOut').textContent=brl(ov);document.getElementById('rNet').textContent=brl(iv-ov);document.getElementById('rCuts').textContent=ins.length;let days=period==='month'?new Date().getDate():period==='week'?7:1,labels=[];for(let i=days-1;i>=0;i--){let d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);labels.push(d)}if(period==='day')labels=[new Date()];let vals=labels.map(d=>{let from=new Date(d);from.setHours(0,0,0,0);let to=new Date(from);to.setDate(to.getDate()+1);return [total(cuts.filter(c=>inPeriod(c.date,{from,to}))),expenses.filter(e=>inPeriod(e.date,{from,to})).reduce((s,e)=>s+amountOf(e),0)]});let max=Math.max(1,...vals.flat());document.getElementById('chart').innerHTML=labels.map((d,i)=>`<div class="bar-col"><div style="display:flex;align-items:end;gap:3px;height:150px"><div class="bar" title="${brl(vals[i][0])}" style="height:${Math.max(3,vals[i][0]/max*140)}px"></div><div class="bar out" title="${brl(vals[i][1])}" style="height:${Math.max(3,vals[i][1]/max*140)}px"></div></div><div class="bar-label">${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div></div>`).join('')}
let cashPeriod='day';
function setCashPeriod(btn,period){cashPeriod=period;document.querySelectorAll('#cash .tabs button').forEach(x=>x.classList.remove('sel'));btn.classList.add('sel');renderCash()}
function cashFilter(period){if(period==='all')return {from:new Date(0),to:new Date(8640000000000000)};return periodFilter(period)}
function renderCash(){let p=cashFilter(cashPeriod),ins=cuts.filter(c=>inPeriod(c.date,p)),outs=expenses.filter(e=>inPeriod(e.date,p)),iv=ins.reduce((s,c)=>s+Number(c.price||0),0),ov=outs.reduce((s,e)=>s+amountOf(e),0),received=ins.filter(c=>!c.fiado).reduce((s,c)=>s+Number(c.price||0),0),paid=outs.reduce((s,e)=>s+amountOf(e),0),bal=iv-ov;document.getElementById('cashIn').textContent=brl(iv);document.getElementById('cashOut').textContent=brl(ov);document.getElementById('cashSold').textContent=brl(iv);document.getElementById('cashExpenses').textContent=brl(ov);document.getElementById('cashReceived').textContent=brl(received);document.getElementById('cashPaid').textContent=brl(paid);document.getElementById('cashQuickIn').textContent=brl(iv);document.getElementById('cashQuickOut').textContent=brl(ov);let b=document.getElementById('cashBalance');b.textContent=brl(bal);b.className='cash-highlight-value '+(bal>=0?'':'neg');let all=[...cuts.map(c=>({type:'in',date:c.date,data:c})),...expenses.map(e=>({type:'out',date:e.date,data:e}))].sort((a,b)=>new Date(b.date)-new Date(a.date));let filtered=all.filter(x=>inPeriod(x.date,p));document.getElementById('cashList').innerHTML=filtered.length?filtered.slice(0,30).map(x=>x.type==='in'?cutRow(x.data):expenseRow(x.data)).join(''):`<div class="empty"><div class="icon">▤</div><h3>Caixa vazio</h3><p>Registre entradas e saídas para acompanhar seu saldo.</p></div>`}

function searchClients(){let q=prompt('Digite o nome do cliente para filtrar:');let el=document.querySelector('.client-search');el.dataset.q=(q||'').trim();renderClients()}
function renderClients(){let q=(document.querySelector('.client-search')?.dataset.q||'').toLowerCase();let shown=clients.filter(n=>!q||n.toLowerCase().includes(q));document.getElementById('clientCount').textContent=clients.length+' clientes';document.getElementById('clientList').innerHTML=shown.map(n=>{let cs=cuts.filter(c=>c.client===n);return `<div class="row client-row"><div class="client-avatar">♙</div><div class="client-main"><b>${esc(n)}</b><small>${cs.length} corte(s) · ${brl(total(cs))}</small><div class="client-actions"><button class="mini blue" onclick="editClient('${esc(n).replace(/'/g,"\'")}')">Editar</button><button class="mini red" onclick="deleteClient('${esc(n).replace(/'/g,"\'")}')">Excluir</button></div></div></div>`}).join('');document.getElementById('clientEmpty').style.display=shown.length?'none':'block'}
function addClient(){let n=document.getElementById('newClient').value.trim();if(!n)return alert('Informe o nome do cliente.');if(!clients.includes(n))clients.unshift(n);document.getElementById('newClient').value='';saveAll();renderClients()}
let expensePeriod='day';
function setExpensePeriod(btn,period){expensePeriod=period;document.querySelectorAll('#expenses .expense-filter button').forEach(x=>x.classList.remove('sel'));btn.classList.add('sel');renderExpenses()}
function renderExpenses(){let p=expensePeriod==='all'?{from:new Date(0),to:new Date(8640000000000000)}:cashFilter(expensePeriod),arr=expenses.filter(e=>inPeriod(e.date,p)).sort((a,b)=>new Date(b.date)-new Date(a.date));let totalOut=arr.reduce((s,e)=>s+amountOf(e),0);document.getElementById('expensePageTotal').textContent=brl(totalOut);document.getElementById('expenseList').innerHTML=arr.length?arr.map(expenseRow).join(''):'';document.getElementById('expenseEmpty').style.display=arr.length?'none':'block'}
function renderDebt(){let debts=cuts.filter(c=>c.fiado),clients=new Set(debts.map(c=>c.client||'Sem nome'));document.getElementById('debtTotal').textContent=brl(total(debts));document.getElementById('debtSub').textContent=debts.length+' cortes pendentes · '+clients.size+' clientes';document.getElementById('debtList').innerHTML=debts.map(c=>cutRow(c)).join('');document.getElementById('debtEmpty').style.display=debts.length?'none':'block'}
function render(){document.getElementById('appName').textContent=cfg.name;renderHome();renderReports();renderCash();renderExpenses();renderDebt();renderClients()}
function loadSettings(){document.getElementById('cfgName').value=cfg.name;document.getElementById('cfgCorte').value=cfg.corte;document.getElementById('cfgBarba').value=cfg.barba;document.getElementById('cfgCombo').value=cfg.combo;document.getElementById('cfgMetaDia').value=cfg.metaDia;document.getElementById('cfgMetaMes').value=cfg.metaMes;buildBarbers()}
function saveSettings(){cfg={...cfg,name:document.getElementById('cfgName').value.trim()||'KINGS',corte:Number(document.getElementById('cfgCorte').value)||0,barba:Number(document.getElementById('cfgBarba').value)||0,combo:Number(document.getElementById('cfgCombo').value)||0,metaDia:Number(document.getElementById('cfgMetaDia').value)||0,metaMes:Number(document.getElementById('cfgMetaMes').value)||0};saveAll();buildServices();buildBarbers();render();alert('Configurações salvas!')}
function addBarber(){let n=document.getElementById('newBarber').value.trim();if(!n)return;if(!cfg.barbers.includes(n))cfg.barbers.push(n);document.getElementById('newBarber').value='';saveAll();buildBarbers()}
function removeBarber(n){cfg.barbers=cfg.barbers.filter(x=>x!==n);saveAll();buildBarbers()}
function editClient(n){document.getElementById('oldClient').value=n;document.getElementById('editClientName').value=n;document.getElementById('modalEditClient').classList.add('open')}
function saveClientEdit(){let old=document.getElementById('oldClient').value,n=document.getElementById('editClientName').value.trim();if(!n)return alert('Informe o nome.');clients=clients.map(x=>x===old?n:x);cuts.forEach(c=>{if(c.client===old)c.client=n});clients=[...new Set(clients)];saveAll();closeModal('modalEditClient');render()}
function deleteClient(n){if(!confirm('Excluir este cliente? Os cortes serão mantidos no histórico, mas o cliente será removido do cadastro.'))return;clients=clients.filter(x=>x!==n);saveAll();render()}
function clearData(){if(confirm('Apagar TODOS os cortes, clientes, fiados e saídas de caixa? Esta ação não pode ser desfeita.')){cuts=[];expenses=[];clients=[];saveAll();render();alert('Dados apagados.')}}
renderDate();loadSettings();render();if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=kings9v9.1',{updateViaCache:'none'}).catch(()=>{});

/* KINGS v9 — arquitetura financeira completa */
let revenues=JSON.parse(localStorage.getItem('kings_revenues_v9')||'[]');
let calCursor=new Date(); calCursor.setDate(1);
expenses=expenses.map(e=>Object.assign({type:'Variável',dueDate:e.date?.slice(0,10)||dateKey(new Date()),paidDate:e.date?.slice(0,10)||dateKey(new Date()),installment:1,totalInstallments:1,recurrence:'Não recorrente',status:'paid'},e));
function saveAllV9(){saveAll();localStorage.setItem('kings_revenues_v9',JSON.stringify(revenues));}
function allIncome(){return [...cuts.map(c=>({amount:Number(c.price)||0,date:c.date,source:'cut',fiado:!!c.fiado})),...revenues.map(r=>({amount:Number(r.value)||0,date:r.date,source:'revenue',fiado:false}))]}
function allPaidExpenses(){return expenses.filter(e=>e.status!=='pending');}
function availableBalance(){let i=allIncome().filter(x=>!x.fiado).reduce((s,x)=>s+x.amount,0);let o=allPaidExpenses().reduce((s,e)=>s+Number(e.value||0),0);return i-o}
function receivable(){return cuts.filter(c=>c.fiado).reduce((s,c)=>s+Number(c.price||0),0)}
function payable(){return expenses.filter(e=>e.status==='pending').reduce((s,e)=>s+Number(e.value||0),0)}
function renderCentral(){let m=new Date(),from=new Date(m.getFullYear(),m.getMonth(),1),to=new Date(m.getFullYear(),m.getMonth()+1,1);let mi=allIncome().filter(x=>new Date(x.date)>=from&&new Date(x.date)<to&&!x.fiado).reduce((s,x)=>s+x.amount,0);let mo=allPaidExpenses().filter(e=>new Date(e.date)>=from&&new Date(e.date)<to).reduce((s,e)=>s+Number(e.value||0),0);document.getElementById('v9Available').textContent=brl(availableBalance());document.getElementById('v9Receivable').textContent=brl(receivable());document.getElementById('v9Payable').textContent=brl(payable());document.getElementById('v9Profit').textContent=brl(mi-mo)}
function openRevenue(){document.getElementById('revDesc').value='';document.getElementById('revValue').value='';document.getElementById('revDate').value=nowLocal();document.getElementById('modalRevenue').classList.add('open')}
function saveRevenue(){let desc=document.getElementById('revDesc').value.trim(),value=Number(document.getElementById('revValue').value)||0,cat=document.getElementById('revCat').value,pay=document.getElementById('revPay').value,dt=document.getElementById('revDate').value;if(!desc)return alert('Informe a descrição.');if(!value)return alert('Informe o valor.');revenues.unshift({id:Date.now(),desc,value,cat,pay,date:dt?new Date(dt).toISOString():new Date().toISOString()});saveAllV9();closeModal('modalRevenue');render()}
let revenuePeriod='month';function setRevenuePeriod(btn,p){revenuePeriod=p;document.querySelectorAll('#revenue .expense-filter button').forEach(x=>x.classList.remove('sel'));btn.classList.add('sel');renderRevenue()}
function renderRevenue(){let p=revenuePeriod==='all'?{from:new Date(0),to:new Date(8640000000000000)}:cashFilter(revenuePeriod);let arr=revenues.filter(r=>inPeriod(r.date,p)).sort((a,b)=>new Date(b.date)-new Date(a.date));document.getElementById('revenueTotal').textContent=brl(arr.reduce((s,r)=>s+Number(r.value||0),0));document.getElementById('revenueList').innerHTML=arr.map(r=>`<div class="row"><div><b>+ ${brl(r.value)}</b><small>${esc(r.desc)} · ${esc(r.cat)} · ${esc(r.pay)}<br>${new Date(r.date).toLocaleDateString('pt-BR')}</small><div class="actions"><button class="mini red" onclick="deleteRevenue(${r.id})">Excluir</button></div></div><div class="price" style="color:var(--green)">ENTRADA</div></div>`).join('');document.getElementById('revenueEmpty').style.display=arr.length?'none':'block'}
function deleteRevenue(id){if(confirm('Excluir esta receita?')){revenues=revenues.filter(r=>r.id!==id);saveAllV9();render()}}
function openExpense(){document.getElementById('v9ExpDesc').value='';document.getElementById('v9ExpValue').value='';document.getElementById('v9ExpDue').value=dateKey(new Date());document.getElementById('v9ExpPaid').value='';document.getElementById('v9ExpPart').value=1;document.getElementById('v9ExpParts').value=1;document.getElementById('v9ExpStatus').value='pending';document.getElementById('modalExpenseV9').classList.add('open')}
function saveExpenseV9(){let desc=document.getElementById('v9ExpDesc').value.trim(),value=Number(document.getElementById('v9ExpValue').value)||0,type=document.getElementById('v9ExpType').value,cat=document.getElementById('v9ExpCat').value,due=document.getElementById('v9ExpDue').value,part=Number(document.getElementById('v9ExpPart').value)||1,totalPart=Number(document.getElementById('v9ExpParts').value)||1,rec=document.getElementById('v9ExpRec').value,status=document.getElementById('v9ExpStatus').value,paid=document.getElementById('v9ExpPaid').value;if(!desc)return alert('Informe a descrição da despesa.');if(!value)return alert('Informe o valor.');if(!due)return alert('Informe o vencimento.');if(part>totalPart)return alert('A parcela atual não pode ser maior que o total.');let d=new Date(due+'T12:00:00');expenses.unshift({id:Date.now(),value,desc,cat,type,dueDate:due,installment:part,totalInstallments:totalPart,recurrence:rec,status,paidDate:paid||null,date:d.toISOString()});saveAllV9();closeModal('modalExpenseV9');render()}
function expenseRow(e){let due=e.dueDate||e.date?.slice(0,10)||dateKey(new Date()),status=e.status==='pending'?'PENDENTE':'PAGA',today=dateKey(new Date()),late=e.status==='pending'&&due<today;return `<div class="row v9-exp-row"><div><b>− ${brl(e.value)}</b><small>${esc(e.desc)} · ${esc(e.cat)} · ${esc(e.type)}<br>Vence: ${new Date(due+'T12:00:00').toLocaleDateString('pt-BR')} · Parcela ${e.installment||1}/${e.totalInstallments||1} · ${esc(e.recurrence||'Não recorrente')}</small><div class="actions"><button class="mini ${e.status==='pending'?'green':'blue'}" onclick="toggleExpenseStatus(${e.id})">${status}</button>${late?'<span class="mini red">VENCIDA</span>':''}<button class="mini red" onclick="deleteExpense(${e.id})">Excluir</button></div></div><div class="price" style="color:${e.status==='pending'?'#ffb45f':'var(--red)'}">${e.status==='pending'?'A PAGAR':'SAÍDA'}</div></div>`}
function toggleExpenseStatus(id){let e=expenses.find(x=>x.id===id);if(!e)return;e.status=e.status==='pending'?'paid':'pending';e.paidDate=e.status==='paid'?dateKey(new Date()):null;saveAllV9();render()}
function renderExpenses(){let p=expensePeriod==='all'?{from:new Date(0),to:new Date(8640000000000000)}:cashFilter(expensePeriod),arr=expenses.filter(e=>inPeriod(e.date,p)).sort((a,b)=>new Date((b.dueDate||b.date))-new Date((a.dueDate||a.date)));let totalOut=arr.reduce((s,e)=>s+Number(e.value||0),0);document.getElementById('expensePageTotal').textContent=brl(totalOut);document.getElementById('expenseList').innerHTML=arr.length?arr.map(expenseRow).join(''):'';document.getElementById('expenseEmpty').style.display=arr.length?'none':'block'}
function renderCash(){let p=cashFilter(cashPeriod),inc=allIncome().filter(x=>inPeriod(x.date,p)),outs=expenses.filter(e=>inPeriod(e.date,p)),iv=inc.reduce((s,x)=>s+x.amount,0),ov=outs.filter(e=>e.status!=='pending').reduce((s,e)=>s+Number(e.value||0),0),pending=outs.filter(e=>e.status==='pending').reduce((s,e)=>s+Number(e.value||0),0),received=inc.filter(x=>!x.fiado).reduce((s,x)=>s+x.amount,0),bal=received-ov;document.getElementById('cashIn').textContent=brl(iv);document.getElementById('cashOut').textContent=brl(ov);document.getElementById('cashSold').textContent=brl(iv);document.getElementById('cashExpenses').textContent=brl(ov+pending);document.getElementById('cashReceived').textContent=brl(received);document.getElementById('cashPaid').textContent=brl(ov);document.getElementById('cashQuickIn').textContent=brl(iv);document.getElementById('cashQuickOut').textContent=brl(ov);let b=document.getElementById('cashBalance');b.textContent=brl(bal);b.className='cash-highlight-value '+(bal>=0?'':'neg');let all=[...cuts.map(c=>({type:'in',date:c.date,data:c})),...revenues.map(r=>({type:'in',date:r.date,data:r})),...expenses.map(e=>({type:'out',date:e.date,data:e}))].filter(x=>inPeriod(x.date,p)).sort((a,b)=>new Date(b.date)-new Date(a.date));document.getElementById('cashList').innerHTML=all.length?all.slice(0,40).map(x=>x.type==='out'?expenseRow(x.data):x.data.desc?`<div class="row"><div><b>+ ${brl(x.data.value)}</b><small>${esc(x.data.desc)} · ${esc(x.data.cat)}<br>${new Date(x.data.date).toLocaleDateString('pt-BR')}</small></div><div class="price" style="color:var(--green)">ENTRADA</div></div>`:cutRow(x.data)).join(''):`<div class="empty"><div class="icon">▤</div><h3>Caixa vazio</h3><p>Registre entradas e saídas para acompanhar seu saldo.</p></div>`}
function renderReports(period='day'){let p=periodFilter(period),ins=allIncome().filter(c=>inPeriod(c.date,p)&&!c.fiado),outs=expenses.filter(e=>inPeriod(e.date,p)&&e.status!=='pending'),iv=ins.reduce((s,c)=>s+c.amount,0),ov=outs.reduce((s,e)=>s+Number(e.value||0),0);document.getElementById('rIn').textContent=brl(iv);document.getElementById('rOut').textContent=brl(ov);document.getElementById('rNet').textContent=brl(iv-ov);document.getElementById('rCuts').textContent=cuts.filter(c=>inPeriod(c.date,p)).length;let days=period==='month'?new Date().getDate():period==='week'?7:1,labels=[];for(let i=days-1;i>=0;i--){let d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);labels.push(d)}if(period==='day')labels=[new Date()];let vals=labels.map(d=>{let from=new Date(d);from.setHours(0,0,0,0);let to=new Date(from);to.setDate(to.getDate()+1);return [allIncome().filter(c=>inPeriod(c.date,{from,to})&&!c.fiado).reduce((s,c)=>s+c.amount,0),expenses.filter(e=>inPeriod(e.date,{from,to})&&e.status!=='pending').reduce((s,e)=>s+Number(e.value||0),0)]});let max=Math.max(1,...vals.flat());document.getElementById('chart').innerHTML=labels.map((d,i)=>`<div class="bar-col"><div style="display:flex;align-items:end;gap:3px;height:150px"><div class="bar" title="${brl(vals[i][0])}" style="height:${Math.max(3,vals[i][0]/max*140)}px"></div><div class="bar out" title="${brl(vals[i][1])}" style="height:${Math.max(3,vals[i][1]/max*140)}px"></div></div><div class="bar-label">${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div></div>`).join('')}
function moveCalendar(delta){calCursor.setMonth(calCursor.getMonth()+delta);renderCalendar()}
function renderCalendar(){let y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7,days=last.getDate(),names=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];let html=names.map(n=>`<div class="cal-week">${n}</div>`).join('');for(let i=0;i<start;i++)html+='<div class="cal-cell muted"></div>';for(let d=1;d<=days;d++){let key=dateKey(new Date(y,m,d)),ci=cuts.filter(c=>dateKey(new Date(c.date))===key).reduce((s,c)=>s+Number(c.price||0),0)+revenues.filter(r=>dateKey(new Date(r.date))===key).reduce((s,r)=>s+Number(r.value||0),0),co=expenses.filter(e=>(e.dueDate||dateKey(new Date(e.date)))===key).reduce((s,e)=>s+Number(e.value||0),0),pend=expenses.some(e=>(e.dueDate||dateKey(new Date(e.date)))===key&&e.status==='pending');html+=`<div class="cal-cell"><b>${d}</b>${ci?`<span class="cal-pill in">+ ${brl(ci)}</span>`:''}${co?`<span class="cal-pill out">− ${brl(co)}</span>`:''}${pend?'<span class="cal-pending">Pendente</span>':''}</div>`}document.getElementById('calTitle').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());document.getElementById('calendarGrid').innerHTML=html}
function show(id,btn){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');else{let map={home:0,cash:1,expenses:2,clients:3,more:4};if(map[id]!=null)document.querySelectorAll('.nav button')[map[id]].classList.add('active')}if(id==='settings')loadSettings();render();if(id==='calendar')renderCalendar();if(id==='revenue')renderRevenue()}
function render(){document.getElementById('appName').textContent=cfg.name;renderHome();renderReports();renderCash();renderExpenses();renderDebt();renderClients();renderCentral();renderRevenue()}
function renderHome(){let now=new Date(),pDay=periodFilter('day'),pWeek=periodFilter('week'),pMonth=periodFilter('month'),tc=cuts.filter(c=>inPeriod(c.date,pDay)),wc=cuts.filter(c=>inPeriod(c.date,pWeek)),mc=cuts.filter(c=>inPeriod(c.date,pMonth));let today=total(tc),week=total(wc),month=total(mc);document.getElementById('today').textContent=brl(today);document.getElementById('todayCount').textContent=tc.length;document.getElementById('week').textContent=brl(week);document.getElementById('weekCount').textContent=wc.length+' cortes';document.getElementById('month').textContent=brl(month);document.getElementById('monthCount').textContent=mc.length+' cortes';let dp=cfg.metaDia?Math.min(100,today/cfg.metaDia*100):0,mp=cfg.metaMes?Math.min(100,month/cfg.metaMes*100):0;document.getElementById('dayProgress').style.width=dp+'%';document.getElementById('monthProgress').style.width=mp+'%';document.getElementById('dayGoalText').textContent=cfg.metaDia?'Meta diária '+brl(cfg.metaDia):'Meta diária não definida';document.getElementById('dayGoalPct').textContent=Math.round(dp)+'%';document.getElementById('recent').innerHTML=cuts.length?`<div class="list">${cuts.slice(0,6).map(c=>cutRow(c)).join('')}</div>`:`<div class="empty"><div class="icon">✂️</div><h3>Nenhum corte ainda</h3><p>Registre seu primeiro corte usando o +</p></div>`}
saveAllV9();renderCentral();


/* KINGS 9.1 — correções de estabilidade, caixa, despesas, clientes e cache */
(function(){
  'use strict';

  // Evita falhas quando o app encontra dados antigos/incompletos no localStorage.
  function safeArray(key){
    try { const v=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(v)?v:[]; }
    catch(e){ return []; }
  }
  function safeObject(key, fallback){
    try { const v=JSON.parse(localStorage.getItem(key)||'null'); return v && typeof v==='object' ? v : fallback; }
    catch(e){ return fallback; }
  }

  // Migração idempotente: preserva dados já cadastrados e normaliza despesas.
  try {
    const ex=safeArray('kings_expenses_v3').map(function(e){
      e=Object.assign({},e);
      e.value=Number(e.value ?? e.amount ?? e.valor ?? 0)||0;
      e.desc=String(e.desc ?? e.description ?? e.descricao ?? '').trim();
      e.cat=String(e.cat ?? e.category ?? e.categoria ?? 'Outros');
      e.type=String(e.type ?? 'Variável');
      e.dueDate=e.dueDate || (e.date ? String(e.date).slice(0,10) : new Date().toISOString().slice(0,10));
      e.installment=Math.max(1,Number(e.installment)||1);
      e.totalInstallments=Math.max(e.installment,Number(e.totalInstallments)||1);
      e.recurrence=e.recurrence || 'Não recorrente';
      e.status=e.status==='pending' ? 'pending' : 'paid';
      e.paidDate=e.status==='paid' ? (e.paidDate || e.date || new Date().toISOString()) : null;
      e.date=e.date || (e.paidDate || e.dueDate);
      return e;
    });
    localStorage.setItem('kings_expenses_v3',JSON.stringify(ex));
  } catch(e){}

  // Impede duplo registro acidental ao tocar rapidamente em salvar.
  window.__kingsSaveLock = window.__kingsSaveLock || {};
  function once(key, fn){
    const now=Date.now();
    if(window.__kingsSaveLock[key] && now-window.__kingsSaveLock[key]<700) return;
    window.__kingsSaveLock[key]=now;
    fn();
  }

  // Expõe uma função de manutenção simples para depuração local.
  window.KINGS9 = window.KINGS9 || {};
  window.KINGS9.version='9.1.0';
  window.KINGS9.storage={
    cuts:'kings_cuts_v3',
    expenses:'kings_expenses_v3',
    config:'kings_cfg_v3',
    clients:'kings_clients_v1',
    revenues:'kings_revenues_v9'
  };

  // Corrige registro do Service Worker: atualização imediata e limpeza de cache antigo.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js?v=kings9.1.0',{updateViaCache:'none'})
      .then(function(reg){ try{reg.update();}catch(e){} })
      .catch(function(){});
  }
})();



/* KINGS 9.2 — deduplicação automática segura */
(function(){
  'use strict';

  function readArray(key){
    try {
      const v=JSON.parse(localStorage.getItem(key)||'[]');
      return Array.isArray(v)?v:[];
    } catch(e){ return []; }
  }
  function writeArray(key,v){ localStorage.setItem(key,JSON.stringify(v)); }

  function normText(v){
    return String(v ?? '').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
  }
  function money(v){
    const n=Number(v ?? 0);
    return Number.isFinite(n) ? Math.round(n*100)/100 : 0;
  }
  function dateMs(v){
    const n=new Date(v).getTime();
    return Number.isFinite(n)?n:0;
  }
  function dateDay(v){
    const d=new Date(v);
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0,10) : '';
  }

  // Mantém o registro mais recente quando houver cópias idênticas.
  function uniqueBy(arr,keyFn){
    const seen=new Set(), out=[];
    for(let i=arr.length-1;i>=0;i--){
      const k=keyFn(arr[i]);
      if(!seen.has(k)){ seen.add(k); out.push(arr[i]); }
    }
    return out.reverse();
  }

  // Cortes: só remove duplicatas com os mesmos dados essenciais.
  function dedupeCuts(){
    const a=readArray('kings_cuts_v3');
    return uniqueBy(a,c=>{
      const payment=normText(c.payment||'');
      const barber=normText(c.barber||'');
      const client=normText(c.client||'');
      const dt=dateMs(c.date);
      const minute=dt ? Math.floor(dt/60000) : 0;
      return [client,money(c.price),payment,barber,minute,!!c.fiado].join('|');
    });
  }

  // Clientes: normaliza espaços/maiúsculas e mantém apenas um cadastro por nome.
  function dedupeClients(){
    const a=readArray('kings_clients_v1');
    const out=[],seen=new Set();
    for(const c of a){
      const original=String(c??'').trim().replace(/\s+/g,' ');
      const k=normText(original);
      if(!k||seen.has(k)) continue;
      seen.add(k); out.push(original);
    }
    return out;
  }

  // Receitas: ID é prioridade; sem ID, usa combinação de dados.
  function dedupeRevenues(){
    const a=readArray('kings_revenues_v9');
    return uniqueBy(a,r=>{
      if(r.id!=null) return 'id:'+String(r.id);
      return ['rev',normText(r.desc),money(r.value),normText(r.cat),normText(r.pay),dateMs(r.date)].join('|');
    });
  }

  // Despesas: usa ID quando existente; sem ID, combinação de descrição/valor/categoria/
  // tipo/vencimento/parcela/status. Assim, despesas legítimas iguais em datas diferentes não somem.
  function dedupeExpenses(){
    const a=readArray('kings_expenses_v3');
    return uniqueBy(a,e=>{
      if(e.id!=null) return 'id:'+String(e.id);
      return [
        'exp',normText(e.desc),money(e.value),normText(e.cat),normText(e.type),
        String(e.dueDate||dateDay(e.date)),String(e.installment||1),
        String(e.totalInstallments||1),normText(e.recurrence),normText(e.status)
      ].join('|');
    });
  }

  function reconcileClients(clients,cuts){
    const out=clients.slice(), seen=new Set(out.map(normText));
    for(const c of cuts){
      const n=String(c.client??'').trim().replace(/\s+/g,' ');
      const k=normText(n);
      if(n && !seen.has(k)){ seen.add(k); out.unshift(n); }
    }
    return out;
  }

  function runDedup(){
    const cuts=dedupeCuts();
    const expenses=dedupeExpenses();
    const revenues=dedupeRevenues();
    const clients=reconcileClients(dedupeClients(),cuts);

    writeArray('kings_cuts_v3',cuts);
    writeArray('kings_expenses_v3',expenses);
    writeArray('kings_revenues_v9',revenues);
    writeArray('kings_clients_v1',clients);

    // Registra somente estatísticas, sem apagar outros dados/configurações.
    const stats={
      version:'9.2.0',
      cuts:cuts.length,
      expenses:expenses.length,
      revenues:revenues.length,
      clients:clients.length,
      at:new Date().toISOString()
    };
    localStorage.setItem('kings_dedupe_v92',JSON.stringify(stats));
    return stats;
  }

  // Executa uma vez por carregamento e depois permite executar manualmente.
  try { window.KINGS92_STATS=runDedup(); } catch(e) { window.KINGS92_STATS={error:String(e)}; }

  window.KINGS92=window.KINGS92||{};
  window.KINGS92.version='9.2.0';
  window.KINGS92.deduplicate=runDedup;

  // Atualiza o app imediatamente após a troca do arquivo.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(function(regs){
      regs.forEach(function(r){ try{r.update();}catch(e){} });
    }).catch(function(){});
  }
})();

