'use strict';
(() => {
  const KEY = 'pet-clima-simulacao-v1';
  const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const labels = { draft: 'Em preenchimento', submitted: 'Aguardando validação', approved: 'Validada' };
  const main = document.getElementById('conteudo');
  const dialog = document.getElementById('demo-dialog');
  let notice = '';
  let editing = null;
  let state = freshState();
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved?.schema === 1 && Array.isArray(saved.sheets) && saved.sheets.every(validSheet)) state = saved;
  } catch { /* A demonstração também funciona quando o armazenamento está desativado. */ }

  function freshState() {
    return { schema: 1, profile: 'student', sheets: [
      { month: '2026-11', status: 'draft', revision: 0, signatures: [], history: [], correction: '', activities: [
        { id: 1, date: '2026-11-05', minutes: 240, location: 'Unidade de saúde · Demonstração', description: 'Oficina sobre prevenção e cuidado durante ondas de calor' },
        { id: 2, date: '2026-11-06', minutes: 120, location: 'Universidade · Demonstração', description: 'Planejamento das ações de saúde no território' },
        { id: 3, date: '2026-11-10', minutes: 180, location: 'Comunidade · Demonstração', description: 'Mapeamento participativo de riscos ambientais' }
      ] },
      { month: '2026-10', status: 'approved', revision: 1, correction: '', activities: [
        { id: 4, date: '2026-10-15', minutes: 180, location: 'Universidade · Demonstração', description: 'Encontro de formação sobre saúde e clima' }
      ], signatures: [{ name: 'Ana Exemplo', role: 'Estudante', at: '20/10/2026 às 14:00', revision: 1 }, { name: 'Marina Exemplo', role: 'Preceptora / orientadora', at: '21/10/2026 às 10:30', revision: 1 }], history: [{ text: 'Ficha de exemplo validada. Assinaturas fictícias.', at: '21/10/2026 às 10:30' }] }
    ] };
  }
  function validSheet(sheet) {
    return /^202[6-8]-(0[1-9]|1[0-2])$/.test(sheet.month) && Object.hasOwn(labels, sheet.status) && Number.isInteger(sheet.revision) && Array.isArray(sheet.activities) && Array.isArray(sheet.signatures) && Array.isArray(sheet.history) && sheet.activities.every(a => Number.isInteger(a.minutes) && a.minutes > 0 && a.minutes <= 1440 && typeof a.date === 'string' && typeof a.location === 'string' && typeof a.description === 'string');
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Mantém a simulação na memória. */ } }
  function escape(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function monthName(value) { const [y,m] = value.split('-'); return `${names[Number(m)-1]} de ${y}`; }
  function duration(value) { return `${Math.floor(value/60)}h ${String(value%60).padStart(2,'0')}min`; }
  function dateLabel(value) { return value.split('-').reverse().join('/'); }
  function total(sheet) { return sheet.activities.reduce((sum,a) => sum+a.minutes, 0); }
  function timestamp() { const now = new Date(); return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`; }
  function record(sheet, text) { sheet.history.unshift({ text, at: timestamp() }); }
  function badge(sheet) { return `<span class="badge ${sheet.status}"><span aria-hidden="true">${sheet.status==='approved'?'✓':sheet.status==='submitted'?'◷':'✎'}</span>${labels[sheet.status]}</span>`; }
  function requireSheet(month) { return state.sheets.find(s => s.month===month); }
  function link(month) { return `#ficha/${month}`; }
  function showNotice() { return notice ? `<div class="message demo-alert" role="status"><span aria-hidden="true">✓</span><p>${escape(notice)}</p></div>` : ''; }
  function signName() { return state.profile==='student'?'Ana Exemplo':'Marina Exemplo'; }
  function updateProfile() {
    state.profile = state.profile === 'responsible' ? 'responsible' : 'student';
    document.getElementById('profile-name').textContent = signName();
    document.querySelectorAll('[data-profile]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.profile===state.profile)));
  }
  function route() {
    updateProfile();
    const match = location.hash.match(/^#(ficha|relatorio)\/(202[6-8]-(?:0[1-9]|1[0-2]))$/);
    const sheet = match && requireSheet(match[2]);
    main.innerHTML = showNotice() + (sheet ? (match[1]==='relatorio' ? report(sheet) : sheetView(sheet)) : dashboard());
    document.title = `${sheet ? monthName(sheet.month)+' · ' : ''}Demonstração PET-Saúde Clima`;
  }
  function navigate(hash) { editing=null; if (location.hash===hash) route(); else location.hash=hash; }
  function dashboard() {
    const pending = state.sheets.filter(s=>s.status==='submitted');
    const draft = state.sheets.find(s=>s.status==='draft');
    const next = state.profile==='responsible' ? pending[0] : draft;
    return `<section class="page-heading"><div><p class="eyebrow">${state.profile==='student'?'ÁREA DO ESTUDANTE':'ÁREA DO RESPONSÁVEL'} · SIMULAÇÃO</p><h1>Olá, ${state.profile==='student'?'Ana':'Marina'}.</h1><p class="muted">${state.profile==='student'?'Registre sua participação e acompanhe a assinatura do responsável.':'Confira as atividades dos estudantes e experimente a validação da ficha.'}</p></div><span class="role-chip">Conta fictícia</span></section>
      ${next?`<section class="next-step"><div class="step-icon" aria-hidden="true">${state.profile==='student'?'✎':'↗'}</div><div><p class="eyebrow">SUA PRÓXIMA AÇÃO</p><h2>${state.profile==='student'?'Continue '+monthName(next.month).toLowerCase():'Há uma ficha aguardando sua validação'}</h2><p>${state.profile==='student'?'Suas atividades de demonstração estão salvas neste navegador.':'Revise as atividades e simule uma assinatura ou devolução para correção.'}</p></div><a class="button" href="${link(next.month)}">${state.profile==='student'?'Continuar ficha':'Revisar ficha'} →</a></section>`:''}
      <div class="stats" aria-label="Resumo das fichas">${[['draft','Em preenchimento','Ainda podem ser editadas'],['submitted','Aguardando validação','Enviadas ao responsável'],['approved','Validadas','Comprovante simulado disponível']].map(([status,title,detail])=>`<div class="stat"><span class="stat-symbol ${status}" aria-hidden="true">${status==='approved'?'✓':status==='submitted'?'◷':'✎'}</span><span>${title}</span><strong>${String(state.sheets.filter(s=>s.status===status).length).padStart(2,'0')}</strong><small>${detail}</small></div>`).join('')}</div>
      ${state.profile==='student'?`<section class="card open-month"><div><p class="eyebrow">PET-SAÚDE CLIMA · DEMONSTRAÇÃO</p><h2>Qual mês você quer preencher?</h2><p class="muted">Enfermagem · Grupo 5</p><p class="help">Vigência fictícia: 01/01/2026 a 31/12/2028</p></div><form id="open-month"><label for="month">Mês de referência</label><div class="inline"><select id="month" name="month">${Array.from({length:36},(_,i)=>{const key=`${2026+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;return `<option value="${key}" ${key==='2026-11'?'selected':''}>${monthName(key)}</option>`;}).join('')}</select><button class="button">Abrir ficha →</button></div><p class="field-help">Se a ficha já existir, você continuará de onde parou.</p></form></section>`:`<p class="demo-role-message">Para experimentar um envio, troque para <strong>Estudante</strong>. Depois volte a este perfil para validar.</p>`}
      <section class="section-heading"><div><p class="eyebrow">ACOMPANHAMENTO</p><h2>${state.profile==='student'?'Suas fichas mensais':'Fichas dos estudantes'}</h2></div><span class="list-count">${state.sheets.length} fichas fictícias</span></section><div class="sheet-grid">${[...state.sheets].sort((a,b)=>b.month.localeCompare(a.month)).map(sheet=>`<a class="card sheet-card" href="${link(sheet.month)}"><div class="card-top">${badge(sheet)}<span class="arrow" aria-hidden="true">↗</span></div><h3>${monthName(sheet.month)}</h3><p class="student-name">Ana Exemplo</p><p class="muted">Enfermagem · Grupo 5</p><div class="card-bottom"><strong>${duration(total(sheet))}</strong><span>${sheet.activities.length} atividade${sheet.activities.length===1?'':'s'}</span></div><p class="card-action">${sheet.status==='approved'?'Ver comprovante simulado':sheet.status==='draft'?'Continuar preenchimento':'Acompanhar validação'} →</p></a>`).join('')}</div>`;
  }
  function sheetView(sheet) {
    const owner=state.profile==='student';
    const editable=owner&&sheet.status==='draft';
    const current=sheet.signatures.filter(s=>s.revision===sheet.revision);
    const activity=editing!==null?sheet.activities.find(a=>a.id===editing):null;
    return `<a class="back" href="#inicio">← Voltar para as fichas</a><section class="page-heading"><div><p class="eyebrow">FICHA MENSAL · SIMULAÇÃO</p><h1>${monthName(sheet.month)}</h1><p class="muted">Ana Exemplo · Enfermagem · Grupo 5</p></div><a class="button secondary" href="#relatorio/${sheet.month}">Ver relatório / PDF ↗</a></section>
      <div class="sheet-summary">${badge(sheet)}<span><strong>${duration(total(sheet))}</strong> registradas</span><span>${sheet.activities.length} atividade${sheet.activities.length===1?'':'s'}</span><span class="version">Versão ${sheet.revision}</span></div>
      <ol class="workflow" aria-label="Etapas da ficha"><li class="${sheet.status==='draft'?'current':'done'}"><span>1</span>Registrar atividades</li><li class="${sheet.status!=='draft'?'done':''}"><span>2</span>Assinar e enviar</li><li class="${sheet.status==='approved'?'done':sheet.status==='submitted'?'current':''}"><span>3</span>Validar frequência</li></ol>
      ${sheet.status==='draft'&&sheet.correction?`<section class="notice warning"><span class="notice-icon" aria-hidden="true">!</span><div><h2>Seu responsável pediu uma correção</h2><p>${escape(sheet.correction)}</p><p class="help">Ajuste a ficha e simule um novo envio. As versões anteriores ficam no histórico.</p></div></section>`:''}
      <section class="next-step compact"><div><p class="eyebrow">${sheet.status==='approved'?'ETAPA CONCLUÍDA':'O QUE FAZER AGORA'}</p><h2>${sheet.status==='approved'?'Frequência validada nesta simulação':sheet.status==='draft'?(owner?'Registre, confira e envie suas atividades':'O estudante está preenchendo a ficha'):(owner?'Aguardando a assinatura de Marina Exemplo':'Confira as atividades antes de assinar')}</h2><p>${sheet.status==='approved'?'O relatório fictício está disponível para consulta.':sheet.status==='draft'?'Você pode editar como estudante enquanto a ficha estiver em preenchimento.':owner?'Experimente trocar o perfil acima para Responsável.':'Você pode simular a assinatura ou solicitar uma correção.'}</p></div>${editable?`<a class="button" href="#adicionar-atividade" data-jump="adicionar-atividade">Adicionar atividade +</a>`:''}</section>
      <div class="detail-layout"><section><div class="section-heading" id="atividades"><h2>Atividades do mês</h2><span class="list-count">${duration(total(sheet))} no total</span></div><div class="activities">${sheet.activities.length?sheet.activities.map(a=>`<article class="card activity"><div class="activity-date"><strong>${a.date.slice(8)}</strong><span>${names[Number(a.date.slice(5,7))-1].slice(0,3)}</span></div><div class="activity-content"><h3>${escape(a.description)}</h3><p class="muted">${escape(a.location)}</p><strong class="duration">${duration(a.minutes)}</strong>${editable?`<div class="activity-actions"><button type="button" class="link-button" data-edit="${a.id}">Editar</button><button type="button" class="link-button danger" data-delete="${a.id}">Excluir</button></div>`:''}</div></article>`).join(''):`<div class="card empty"><span class="empty-icon" aria-hidden="true">✎</span><h3>Ainda não há atividades neste mês</h3><p class="muted">Adicione uma atividade fictícia para experimentar.</p></div>`}</div>
      ${editable?activityForm(sheet,activity):''}</section><aside><section class="card validation" id="assinatura"><p class="eyebrow">VALIDAÇÃO DA FREQUÊNCIA</p><h2>Assinaturas da ficha</h2><p class="muted">Responsável: <strong>Marina Exemplo</strong><br>Preceptora / orientadora fictícia.</p>
      ${current.length?current.map(s=>`<div class="signature"><span class="check" aria-hidden="true">✓</span><div><strong>${escape(s.name)}</strong><small>${escape(s.role)}</small><small>${escape(s.at)}</small><small>Assinatura simulada · versão ${s.revision}</small>${sheet.status==='draft'?'<span class="previous-label">Versão anterior</span>':''}</div></div>`).join(''):`<div class="signature pending"><span class="check" aria-hidden="true">1</span><div><strong>Estudante</strong><small>Simula a assinatura ao enviar.</small></div></div><div class="signature pending"><span class="check" aria-hidden="true">2</span><div><strong>Responsável</strong><small>Simula a assinatura após a conferência.</small></div></div>`}
      ${editable||(!owner&&sheet.status==='submitted')?`<form id="sign-form" class="sign-form"><div class="sign-review"><h3>${owner?'Antes de enviar':'O que sua assinatura confirma'}</h3><p>Esta versão contém <strong>${sheet.activities.length} atividade${sheet.activities.length===1?'':'s'}</strong>, totalizando <strong>${duration(total(sheet))}</strong>.</p><p>${owner?'Após o envio, a edição ficará bloqueada até uma devolução.':'Sua confirmação abrange todas as atividades desta versão.'}</p></div><div class="signature-consent"><input type="checkbox" id="sign-consent" required><label for="sign-consent">Conferi as atividades e desejo simular ${owner?'o envio':'a validação'} desta ficha.</label></div><p class="demo-sign-note">Esta demonstração não pede senha e não produz uma assinatura real.</p><button class="button wide" ${!sheet.activities.length?'disabled':''}>${owner?'Simular assinatura e envio →':'Simular assinatura e validação ✓'}</button>${!sheet.activities.length?'<p class="field-help">Adicione uma atividade antes de enviar.</p>':''}</form>`:''}
      ${!owner&&sheet.status==='submitted'?`<details class="return"><summary>Alguma informação precisa de correção?</summary><form id="return-form"><label for="return-note">O que precisa ser corrigido?</label><textarea id="return-note" name="note" maxlength="1000" required rows="4" placeholder="Ex.: Confira a duração da oficina."></textarea><button class="button secondary wide">Devolver para correção</button></form></details>`:''}
      ${sheet.status==='approved'?'<div class="success-note"><span aria-hidden="true">✓</span><p><strong>Validação simulada concluída</strong><br>Este resultado não tem validade oficial.</p></div>':''}</section><details class="card history"><summary>Histórico e versões da ficha</summary>${sheet.history.length?sheet.history.map(e=>`<div class="event"><strong>${escape(e.text)}</strong><small>${escape(e.at)}</small></div>`).join(''):'<p class="muted">Nenhuma ação simulada registrada.</p>'}</details></aside></div>`;
  }
  function activityForm(sheet,activity) {
    const lastDay=new Date(Number(sheet.month.slice(0,4)),Number(sheet.month.slice(5)),0).getDate();
    return `<section class="card form-card" id="adicionar-atividade"><p class="eyebrow">REGISTRO DE PARTICIPAÇÃO · SIMULAÇÃO</p><h2>${activity?'Editar atividade':'Adicionar atividade'}</h2><p class="muted">Use somente informações fictícias. Todos os campos são obrigatórios.</p><form id="activity-form"><div id="activity-error" hidden role="alert" tabindex="-1" class="error-summary"></div><div class="field"><label for="activity-date">Data</label><input type="date" id="activity-date" name="date" min="${sheet.month}-01" max="${sheet.month}-${lastDay}" value="${activity?escape(activity.date):''}" required><p class="field-help">Escolha um dia deste mês.</p></div><fieldset class="field duration-field"><legend>Duração</legend><div class="duration-inputs"><div><label for="activity-hours">Horas</label><input id="activity-hours" name="hours" type="number" inputmode="numeric" min="0" max="24" placeholder="0" value="${activity?Math.floor(activity.minutes/60):''}"></div><div><label for="activity-minutes">Minutos</label><input id="activity-minutes" name="minutes" type="number" inputmode="numeric" min="0" max="59" placeholder="0" value="${activity?activity.minutes%60:''}"></div></div><p class="field-help">Exemplo: para 2 horas e meia, informe 2 horas e 30 minutos.</p></fieldset><div class="field"><label for="activity-location">Local</label><input id="activity-location" name="location" maxlength="180" placeholder="Ex.: Universidade · Demonstração" value="${activity?escape(activity.location):''}" required></div><div class="field"><label for="activity-description">Atividade realizada</label><textarea id="activity-description" name="description" rows="3" maxlength="500" placeholder="Descreva uma atividade fictícia." required>${activity?escape(activity.description):''}</textarea><p class="field-help">Não inclua nomes ou dados de pacientes.</p></div><button class="button wide">${activity?'Salvar alterações':'Salvar atividade'} +</button>${activity?'<button type="button" class="link-button" data-cancel-edit>Cancelar edição</button>':''}<p class="field-help">Salvar ainda não envia a ficha. As alterações ficam somente nesta sessão do navegador.</p></form></section>`;
  }
  function report(sheet) {
    const signatures=sheet.status==='draft'?[]:sheet.signatures.filter(s=>s.revision===sheet.revision);
    return `<div class="report-tools"><a class="back" href="${link(sheet.month)}">← Voltar à ficha</a><button type="button" class="button" data-print>Imprimir / salvar PDF</button></div><article class="report"><header><img class="report-logo" src="assets/brand/logo-horizontal.svg" width="260" height="68" alt="PET-Saúde Clima"><p class="eyebrow">DEMONSTRAÇÃO COM DADOS FICTÍCIOS</p><h1>Registro de frequência</h1><p>${monthName(sheet.month)} · Versão ${sheet.revision}</p><p><strong>${labels[sheet.status]}</strong></p><p class="demo-report-warning">SIMULAÇÃO SEM VALIDADE OFICIAL. As assinaturas deste relatório são fictícias.</p></header><dl><dt>Estudante</dt><dd>Ana Exemplo</dd><dt>Curso / Grupo</dt><dd>Enfermagem / Grupo 5</dd><dt>Responsável</dt><dd>Marina Exemplo</dd><dt>Vigência fictícia</dt><dd>01/01/2026 a 31/12/2028</dd></dl><p class="report-scroll-hint help">No celular, deslize a tabela para ver todas as colunas.</p><div class="table-wrap" role="region" tabindex="0" aria-label="Atividades fictícias e validações"><table><caption>Atividades de ${monthName(sheet.month).toLowerCase()}</caption><thead><tr><th scope="col">Data</th><th scope="col">Duração</th><th scope="col">Local e atividade</th><th scope="col">Validação simulada</th></tr></thead><tbody>${sheet.activities.map(a=>`<tr><td>${dateLabel(a.date)}</td><td>${duration(a.minutes)}</td><td><strong>${escape(a.location)}</strong><br>${escape(a.description)}</td><td>${signatures.length?signatures.map(s=>`${escape(s.name)}<br><small>${escape(s.role)} · ${escape(s.at)} · Simulação</small>`).join('<br>'):'Sem assinatura vigente'}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="4">Total: ${duration(total(sheet))}</th></tr></tfoot></table></div><h2>Assinaturas simuladas</h2>${signatures.length?signatures.map(s=>`<div class="report-signature"><strong>${escape(s.name)} · ${escape(s.role)}</strong><p>${escape(s.at)} · Versão ${s.revision}</p><p class="report-demo-mark">ASSINATURA FICTÍCIA</p></div>`).join(''):'<p>Esta ficha de demonstração ainda não possui assinaturas vigentes.</p>'}<p class="help">Esta página não consulta o sistema oficial, não autentica participantes e não envia registros ao projeto.</p></article>`;
  }
  function activeSheet() { return requireSheet(location.hash.split('/')[1]); }
  function scrollToId(id) { document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); }
  function ask(message,label) {
    document.getElementById('dialog-description').textContent=message;
    document.getElementById('dialog-accept').textContent=label;
    dialog.returnValue='cancel'; dialog.showModal();
    return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));
  }
  document.querySelectorAll('[data-profile]').forEach(button=>button.addEventListener('click',()=>{
    state.profile=button.dataset.profile; editing=null; notice=`Você está experimentando o perfil de ${state.profile==='student'?'estudante':'responsável'}.`;save();route();
  }));
  document.getElementById('reset-demo').addEventListener('click',async()=>{
    if(!await ask('As alterações fictícias desta sessão serão substituídas pelos exemplos iniciais. Nenhum registro do projeto será alterado.','Recomeçar demonstração'))return;
    state=freshState();save();notice='Demonstração reiniciada com os exemplos fictícios.';navigate('#inicio');
  });
  main.addEventListener('click',async event=>{
    const button=event.target.closest('[data-edit],[data-delete],[data-cancel-edit],[data-jump],[data-print]');
    if(!button)return;
    if(button.hasAttribute('data-print')){window.print();return;}
    if(button.hasAttribute('data-jump')){event.preventDefault();scrollToId(button.dataset.jump);return;}
    const sheet=activeSheet();
    if(!sheet||state.profile!=='student'||sheet.status!=='draft')return;
    if(button.hasAttribute('data-cancel-edit')){editing=null;route();scrollToId('adicionar-atividade');return;}
    if(button.hasAttribute('data-edit')){editing=Number(button.dataset.edit);route();scrollToId('adicionar-atividade');return;}
    const id=Number(button.dataset.delete);
    if(await ask('Excluir esta atividade fictícia da simulação?','Excluir atividade')){
      sheet.activities=sheet.activities.filter(a=>a.id!==id);record(sheet,'Atividade fictícia excluída.');editing=null;save();notice='Atividade excluída da demonstração.';route();
    }
  });
  main.addEventListener('submit',async event=>{
    const form=event.target;event.preventDefault();
    if(form.id==='open-month'){
      const month=new FormData(form).get('month');
      if(!/^202[6-8]-(0[1-9]|1[0-2])$/.test(month))return;
      if(!requireSheet(month))state.sheets.push({month,status:'draft',revision:0,activities:[],signatures:[],history:[],correction:''});
      save();notice='Ficha de demonstração aberta.';navigate(link(month));return;
    }
    const sheet=activeSheet();if(!sheet)return;
    if(form.id==='activity-form'&&state.profile==='student'&&sheet.status==='draft'){
      const data=new FormData(form), hours=Number(data.get('hours')||0), minutes=Number(data.get('minutes')||0), amount=hours*60+minutes;
      const date=String(data.get('date')), locationText=String(data.get('location')).trim(), description=String(data.get('description')).trim();
      const otherMinutes=sheet.activities.filter(a=>a.date===date&&a.id!==editing).reduce((n,a)=>n+a.minutes,0);
      let error='';
      if(!Number.isInteger(hours)||!Number.isInteger(minutes)||hours<0||minutes<0||minutes>59||amount<1||amount>1440)error='Informe uma duração entre 1 minuto e 24 horas, com minutos de 0 a 59.';
      else if(!date.startsWith(sheet.month+'-'))error='Escolha uma data do mês desta ficha.';
      else if(otherMinutes+amount>1440)error='A soma das atividades de um dia não pode superar 24 horas.';
      else if(!locationText||!description)error='Preencha o local e a descrição da atividade fictícia.';
      if(error){const box=document.getElementById('activity-error');box.textContent=error;box.hidden=false;box.focus();return;}
      const activity={id:editing??Date.now(),date,minutes:amount,location:locationText,description};
      if(editing!==null)sheet.activities=sheet.activities.map(a=>a.id===editing?activity:a);else sheet.activities.push(activity);
      sheet.activities.sort((a,b)=>a.date.localeCompare(b.date));record(sheet,editing!==null?'Atividade fictícia atualizada.':'Atividade fictícia registrada.');editing=null;save();notice='Atividade salva nesta simulação.';route();scrollToId('atividades');return;
    }
    if(form.id==='sign-form'&&sheet.activities.length){
      const student=state.profile==='student';
      if((student&&sheet.status!=='draft')||(!student&&sheet.status!=='submitted'))return;
      if(!await ask(`Você vai simular ${student?'o envio':'a validação'} de ${sheet.activities.length} atividade(s), com total de ${duration(total(sheet))}. Nenhuma assinatura real será criada.`,student?'Simular envio':'Simular validação'))return;
      if(student){sheet.revision++;sheet.status='submitted';sheet.correction='';record(sheet,`Estudante simulou a assinatura e o envio da versão ${sheet.revision}.`);}else{sheet.status='approved';record(sheet,`Responsável simulou a validação da versão ${sheet.revision}.`);}
      sheet.signatures.push({name:signName(),role:student?'Estudante':'Preceptora / orientadora',at:timestamp(),revision:sheet.revision});
      save();notice=student?'Envio simulado. Troque para Responsável para continuar o teste.':'Validação simulada concluída. O relatório fictício está disponível.';route();main.focus();return;
    }
    if(form.id==='return-form'&&state.profile==='responsible'&&sheet.status==='submitted'){
      const note=String(new FormData(form).get('note')).trim();if(!note)return;
      sheet.status='draft';sheet.correction=note;record(sheet,`Responsável devolveu para correção: ${note}`);save();notice='Ficha devolvida na simulação. Troque para Estudante para corrigir.';route();main.focus();
    }
  });
  window.addEventListener('hashchange',()=>{editing=null;route();window.scrollTo({top:0,behavior:'instant'});});
  route();
})();
