'use strict';
const PetDemo = (() => {
  const labels = {draft:'Em preenchimento', submitted:'Aguardando validação', approved:'Validada'};
  const roles = {student:'Estudante', advisor:'Orientador(a)', preceptor:'Preceptor(a)', coordinator:'Coordenação'};
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const duration = n => `${Math.floor(n/60)}h ${String(n%60).padStart(2,'0')}min`;
  const monthName = m => `${months[Number(m.slice(5))-1]} de ${m.slice(0,4)}`;
  const dateLabel = d => d.split('-').reverse().join('/');
  const liveSignatures = a => a.status === 'draft' ? [] : a.signatures.filter(s => s.revision === a.revision);
  const total = (sheet, validated=false) => sheet.activities.filter(a => !validated || a.status === 'approved').reduce((n,a) => n + (a.status === 'draft' ? a.minutes : a.snapshot.minutes), 0);
  const sheetStatus = s => s.activities.length && s.activities.every(a => a.status === 'approved') ? 'approved' : s.activities.some(a => a.status === 'submitted') ? 'submitted' : 'draft';
  function fresh() {
    const people = [];
    for (let g=1; g<=5; g++) {
      for (let n=1; n<=8; n++) people.push({id:`s${g}${n}`, name:g===5&&n===1?'Ana Exemplo':`Estudante ${g}.${n} Exemplo`, username:`aluno.g${g}.${n}`, email:`aluno.g${g}.${n}@example.org`, role:'student', groups:[g], course:'Enfermagem'});
      for (let n=1; n<=2; n++) people.push({id:`o${g}${n}`, name:g===5&&n===1?'Marina Exemplo':`Orientador ${g}.${n} Exemplo`, username:`orientador.g${g}.${n}`, email:`orientador.g${g}.${n}@example.org`, role:'advisor', groups:[g]});
      people.push({id:`p${g}`, name:`Preceptor ${g} Exemplo`, username:`preceptor.g${g}`, email:`preceptor.g${g}@example.org`, role:'preceptor', groups:[g]});
    }
    people.push({id:'pc', name:'Carlos Exemplo', username:'carlos.exemplo', email:'carlos@example.org', role:'preceptor', groups:[1,2,3,4,5]});
    const activities = [
      {id:1,date:'2026-11-05',minutes:240,location:'Unidade de saúde · Exemplo',description:'Oficina sobre prevenção durante ondas de calor',reviewers:['o51','pc'],status:'draft',revision:0,signatures:[],history:[],correction:''},
      {id:2,date:'2026-11-06',minutes:120,location:'Universidade · Exemplo',description:'Planejamento das ações no território',reviewers:['o51'],status:'approved',revision:1,signatures:[{id:'s51',name:'Ana Exemplo',role:'student',revision:1,at:'06/11/2026 12:00'},{id:'o51',name:'Marina Exemplo',role:'advisor',revision:1,at:'06/11/2026 14:00'}],history:[],correction:''},
      {id:3,date:'2026-11-10',minutes:180,location:'Comunidade · Exemplo',description:'Mapeamento participativo de riscos ambientais',reviewers:['o52','pc'],status:'submitted',revision:1,signatures:[{id:'s51',name:'Ana Exemplo',role:'student',revision:1,at:'10/11/2026 15:00'}],history:[],correction:''}
    ];
    activities.filter(a=>a.status!=='draft').forEach(a=>a.snapshot={date:a.date,minutes:a.minutes,location:a.location,description:a.description,reviewers:[...a.reviewers]});
    return {schema:2,profile:'student',person:'s51',group:5,year:'',month:'',people,sheets:[{id:'s51_2026-11',student:'s51',month:'2026-11',activities}]};
  }
  const headers = ['nome','email','usuario','funcao','grupo','curso'];
  function parseCSV(text) {
    const delimiter=text.split(/\r?\n/)[0].includes(';')?';':',', records=[];
    let row=[], value='', quoted=false;
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='"') { if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted; }
      else if(!quoted&&(c===delimiter||c==='\n')) {row.push(value.trim());value='';if(c==='\n'){if(row.some(Boolean))records.push(row);row=[];}}
      else if(c!=='\r')value+=c;
    }
    if(quoted)throw Error('Há aspas sem fechamento na planilha.');
    row.push(value.trim());if(row.some(Boolean))records.push(row);
    if(records.shift()?.map(v=>v.replace(/^\uFEFF/,'')).join('|')!==headers.join('|'))throw Error('Use as colunas do modelo: '+headers.join(', '));
    if(!records.length||records.length>250||records.some(r=>r.length!==6))throw Error('Use de 1 a 250 linhas, com as seis colunas do modelo.');
    return records.map(r=>Object.fromEntries(headers.map((k,i)=>[k,r[i]])));
  }
  function registrationPlan(state, rows) {
    const people=structuredClone(state.people), seen=new Set();
    for(const [i,row] of rows.entries()) {
      const role={estudante:'student',orientador:'advisor',preceptor:'preceptor'}[row.funcao?.toLowerCase()],group=Number(row.grupo),username=row.usuario?.trim().toLowerCase(),email=row.email?.trim().toLowerCase();
      if(!role||![1,2,3,4,5].includes(group)||!row.nome?.trim()||!username||!/^[-\w.@+]+$/.test(username)||!/^\S+@\S+\.\S+$/.test(email)||role==='student'&&!row.curso?.trim())throw Error(`Linha ${i+2}: confira nome, email, usuário, função, grupo e curso.`);
      const key=`${username}:${role}:${group}`;if(seen.has(key))throw Error(`Linha ${i+2}: vínculo duplicado.`);seen.add(key);
      let person=people.find(p=>p.username===username);
      if(person&&(person.name!==row.nome.trim()||person.email!==email||person.role!==role))throw Error(`Linha ${i+2}: a conta já existe com outros dados ou função.`);
      if(people.some(p=>p.email===email&&p.username!==username))throw Error(`Linha ${i+2}: email em outra conta.`);
      if(person&&role==='student'&&!person.groups.includes(group))throw Error('O estudante só pode pertencer a um grupo.');
      if(!person||!person.groups.includes(group)) {
        const count=people.filter(p=>p.role===role&&p.groups.includes(group)).length;
        if(role==='student'&&count>=8||role==='advisor'&&count>=2)throw Error(`Grupo ${group}: limite de ${role==='student'?8:2} ${role==='student'?'estudantes':'orientadores'} atingido.`);
      }
      if(!person){person={id:`demo-${username}`,name:row.nome.trim(),email,username,role,groups:[],course:row.curso?.trim()||''};people.push(person);}
      if(!person.groups.includes(group))person.groups.push(group);
    }
    return people;
  }
  return {labels,roles,months,escape,duration,monthName,dateLabel,liveSignatures,total,sheetStatus,fresh,parseCSV,registrationPlan};
})();
if (typeof module !== 'undefined') module.exports = PetDemo;
