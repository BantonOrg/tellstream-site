'use strict';
const MP_URL='https://vegwferwmyuunwvfqpsf.supabase.co';
const MP_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ3dmZXJ3bXl1dW53dmZxcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODU5NDQsImV4cCI6MjA5Nzk2MTk0NH0.7F3HUEY59BGE5phlD9AukhZzRa3Ied_ZT43j8YZeIy8';
const mpDB=supabase.createClient(MP_URL,MP_KEY);
const mpUser=localStorage.getItem('tellstream_active_user');
let mpRoom=null,mpSeat=null,mpState=null,mpChannel=null,mpGameLaunched=false,mpLastRoundStartAt=null;
const $=id=>document.getElementById(id);
function mpShow(id){['lobbyView','seatingView'].forEach(x=>$(x).classList.toggle('hidden-layout',x!==id));$('mpApp').classList.remove('hidden-layout');$('game').classList.add('hidden-layout')}
function mpCode(){const c='ABCDEFGHIJKLMNOPQRSTUVWXYZ';return Array.from({length:4},()=>c[Math.floor(Math.random()*26)]).join('')}
async function mpCreate(){const code=mpCode(),max=+$('mpMaxPlayers').value;const ps={lobby_roster:[mpUser],creator:mpUser,settings:{max_players:max}};for(let i=1;i<=4;i++)ps['player'+i]={seat:i,name:i===1?mpUser:(i<=max?'Waiting...':'Not In Use'),square:1,finished:false,finish_place:null};const {error}=await mpDB.from('chutes_room').insert([{room_code:code,game_state:'waiting',active_turn:1,players:ps,connected_spectators:[],board_layout:{},finish_order:[],last_action:{}}]);if(error)return alert('Error creating room: '+error.message);mpSeat=1;mpEnter(code)}
async function mpJoin(){const code=$('mpRoomCode').value.trim().toUpperCase();if(code.length!==4)return alert('Please enter a valid 4-letter room code.');const {data,error}=await mpDB.from('chutes_room').select('*').eq('room_code',code).single();if(error||!data)return alert('Room not found!');const ps=data.players||{};ps.lobby_roster=ps.lobby_roster||[];if(!ps.lobby_roster.includes(mpUser))ps.lobby_roster.push(mpUser);await mpDB.from('chutes_room').update({players:ps}).eq('room_code',code);mpEnter(code)}
function mpEnter(code){mpRoom=code;localStorage.setItem('tellstream_active_game','chutes');$('mpRoomDisplay').textContent=code;mpSubscribe();mpFetch();mpShow('seatingView')}
async function mpFetch(){if(!mpRoom)return;const {data}=await mpDB.from('chutes_room').select('*').eq('room_code',mpRoom).single();if(data)mpHandle(data)}
function mpSubscribe(){if(mpChannel)mpDB.removeChannel(mpChannel);mpChannel=mpDB.channel('chutes:'+mpRoom).on('postgres_changes',{event:'*',schema:'public',table:'chutes_room',filter:`room_code=eq.${mpRoom}`},p=>p.new&&mpHandle(p.new)).subscribe()}
async function mpUpdate(fields){if(!mpRoom)return;const {error}=await mpDB.from('chutes_room').update(fields).eq('room_code',mpRoom);if(error)console.error(error)}
function mpHandle(row){
 mpState=row;const ps=row.players||{};mpSeat=null;
 for(let i=1;i<=4;i++)if(ps['player'+i]?.name===mpUser)mpSeat=i;
 if(row.game_state==='waiting'){mpRenderSeating();return}
 if(row.game_state==='playing'||row.game_state==='finished')mpLaunchGame(row);
}
function mpRenderSeating(){const ps=mpState.players||{},max=ps.settings?.max_players||4,isHost=ps.creator===mpUser,roster=ps.lobby_roster||[];$('mpRoster').replaceChildren();roster.forEach(name=>{const li=document.createElement('li');let seat=null;for(let i=1;i<=4;i++)if(ps['player'+i]?.name===name)seat=i;li.textContent=name;if(seat){const b=document.createElement('span');b.className='mp-badge';b.textContent='Seat '+seat;li.appendChild(b)}if(isHost&&name!==ps.creator){li.classList.add('host-clickable');li.onclick=()=>mpToggleSeat(name)}$('mpRoster').appendChild(li)});$('mpSeats').replaceChildren();for(let i=1;i<=max;i++){const d=document.createElement('div'),name=ps['player'+i]?.name||'Waiting...';d.className='seat-card'+(name!=='Waiting...'?' claimed':'');d.innerHTML=`<div class="seat-header">Seat ${i}${i===1?' (Host)':''}</div><div class="seat-player-name">${name}</div>`;$('mpSeats').appendChild(d)}const seated=Array.from({length:max},(_,i)=>ps['player'+(i+1)]?.name).filter(n=>n&&n!=='Waiting...'&&n!=='Not In Use');$('mpStart').disabled=!(isHost&&seated.length>=2);$('mpSeatHint').textContent=isHost?'Lobby seating is managed by the game host.':'Lobby seating is managed by the game host.';if($('mpRosterHelper'))$('mpRosterHelper').style.display=isHost?'block':'none';const specs=roster.filter(n=>!seated.includes(n));$('mpSpectatorList').textContent=specs.length?specs.join(', '):'None'}
async function mpToggleSeat(name){const ps=structuredClone(mpState.players),max=ps.settings?.max_players||4;let found=null;for(let i=2;i<=max;i++)if(ps['player'+i]?.name===name)found=i;if(found)ps['player'+found].name='Waiting...';else{let empty=null;for(let i=2;i<=max;i++)if(ps['player'+i]?.name==='Waiting...'){empty=i;break}if(!empty)return alert('All player seats are full.');ps['player'+empty].name=name}await mpUpdate({players:ps})}
async function mpStart(){if(mpState?.players?.creator!==mpUser)return;const ps=structuredClone(mpState.players),max=ps.settings?.max_players||4;const active=[];for(let i=1;i<=max;i++)if(ps['player'+i]?.name&&ps['player'+i].name!=='Waiting...')active.push(i);if(active.length<2)return;const design=generateBoard();active.forEach(i=>{ps['player'+i].square=1;ps['player'+i].finished=false;ps['player'+i].finish_place=null});await mpUpdate({game_state:'playing',active_turn:active[0],players:ps,board_layout:design,finish_order:[],last_action:{type:'start',at:Date.now()}})}
function mpLaunchGame(row){
 $('mpApp').classList.add('hidden-layout');$('game').classList.remove('hidden-layout');
 boardDesign=row.board_layout&&row.board_layout.trees?row.board_layout:generateBoard();renderDesign();
 const ps=row.players||{},max=ps.settings?.max_players||4;
 players.forEach((p,i)=>{const rp=ps['player'+(i+1)];p.hidden=i>=max||!rp||rp.name==='Waiting...'||rp.name==='Not In Use';p.square=rp?.square||1;p.finished=!!rp?.finished;p.finishPlace=rp?.finish_place||null});
 finishCount=Math.max(0,...players.filter(p=>!p.hidden).map(p=>Number(p.finishPlace)||0));
 currentPlayer=Math.max(0,(row.active_turn||1)-1);
 renderPieces();updateCamera(null,true);mpRenderPlayerStatus(row);
 const b=$('rollButton'),restart=$('restartButton');
 if(row.game_state==='finished'){
  gameStarted=false;b.disabled=true;b.textContent='GAME OVER';restart.hidden=false;mpGameLaunched=true;return;
 }
 restart.hidden=true;b.disabled=true;b.textContent=mpSeat===row.active_turn?'ROLL':(mpSeat?'WAIT':'SPECTATING');
 const roundAction=row.last_action||{};
 const roundStart=(roundAction.type==='start'||roundAction.type==='restart')?roundAction.at:null;
 const needsCountdown=!mpGameLaunched||(roundStart&&roundStart!==mpLastRoundStartAt);
 if(roundStart)mpLastRoundStartAt=roundStart;
 if(needsCountdown){
  mpGameLaunched=true;gameStarted=false;startCountdown().then(()=>mpApplyTurn(mpState||row));
 }else{gameStarted=true;mpApplyTurn(row)}
}
function mpRenderPlayerStatus(row){
 const bar=$('playerStatusBar');if(!bar)return;
 const ps=row.players||{},max=ps.settings?.max_players||4;
 const glow=['#63d66b','#ffd84d','#ff6157','#65a8ff'];
 bar.replaceChildren();
 for(let i=1;i<=max;i++){
  const rp=ps['player'+i];
  if(!rp||!rp.name||rp.name==='Waiting...'||rp.name==='Not In Use')continue;
  const card=document.createElement('div');card.className='player-status'+(row.active_turn===i?' active':'')+(rp.finished?' finished':'');card.style.setProperty('--piece-glow',glow[i-1]);
  const mask=document.createElement('div');mask.className='player-status-piece-mask';
  const img=document.createElement('img');img.className='player-status-piece';img.src=players[i-1].asset.src;img.alt='';mask.appendChild(img);
  const name=document.createElement('div');name.className='player-status-name';name.textContent=rp.name;
  card.append(mask,name);bar.appendChild(card);
 }
}
function mpApplyTurn(row){
 mpRenderPlayerStatus(row);const b=$('rollButton'),restart=$('restartButton');
 if(row.game_state==='finished'){b.disabled=true;b.textContent='GAME OVER';restart.hidden=false;return}
 restart.hidden=true;b.disabled=!mpSeat||mpSeat!==row.active_turn||players[mpSeat-1]?.finished;
 b.textContent=mpSeat===row.active_turn?'ROLL':(mpSeat?'WAIT':'SPECTATING');
}
async function mpRestart(){
 if(!mpRoom||!mpState||!mpSeat)return;
 const ps=structuredClone(mpState.players||{}),max=ps.settings?.max_players||4,active=[];
 for(let i=1;i<=max;i++){
  const rp=ps['player'+i];
  if(!rp||!rp.name||rp.name==='Waiting...'||rp.name==='Not In Use')continue;
  rp.square=1;rp.finished=false;rp.finish_place=null;active.push(i);
 }
 if(active.length<2)return;
 const at=Date.now();
 await mpUpdate({game_state:'playing',active_turn:active[0],players:ps,board_layout:generateBoard(),finish_order:[],last_action:{type:'restart',seat:mpSeat,at}});
}
async function mpLeave(){if(mpChannel){mpDB.removeChannel(mpChannel);mpChannel=null}if(mpRoom&&mpState){const ps=structuredClone(mpState.players||{});ps.lobby_roster=(ps.lobby_roster||[]).filter(n=>n!==mpUser);if(mpSeat&&ps['player'+mpSeat])ps['player'+mpSeat].name='Waiting...';if(ps.creator===mpUser){await mpDB.from('chutes_room').delete().eq('room_code',mpRoom)}else await mpUpdate({players:ps})}localStorage.removeItem('tellstream_active_game');mpRoom=null;mpSeat=null;mpState=null;mpGameLaunched=false;mpLastRoundStartAt=null;mpShow('lobbyView')}
function mpBack(){localStorage.removeItem('tellstream_active_game');window.top.location.href='/index.html'}
window.CHUTES_MP={get active(){return !!mpRoom},get seat(){return mpSeat},get state(){return mpState},update:mpUpdate,restart:mpRestart};
window.addEventListener('DOMContentLoaded',()=>{$('mpUsername').value=mpUser;$('mpCreate').onclick=mpCreate;$('mpJoin').onclick=mpJoin;$('mpStart').onclick=mpStart;$('mpLeave').onclick=mpLeave;$('backToLounge').onclick=mpBack;mpShow('lobbyView')});
