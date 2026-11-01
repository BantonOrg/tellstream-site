'use strict';

const BOARD={width:3600,height:3600};
const GRID={left:155.25,top:192.25,width:3317.5,height:3127.5,tileWidth:331.75,tileHeight:312.75};
const DISPLAY_CAL_WIDTH=1823;
const BU_PER_PX=BOARD.width/DISPLAY_CAL_WIDTH;

const ASSETS={
 pits:[{src:'imgs/pit1.png',w:268,h:274},{src:'imgs/pit2.png',w:266,h:276},{src:'imgs/pit3.png',w:282,h:273}],
 pitExit:{src:'imgs/pit_exit.png',w:284,h:289},
 diag1:{src:'imgs/diag1.png',w:353,h:315},diag2:{src:'imgs/diag2.png',w:316,h:312},
 tree2:{src:'imgs/2lvl_tree.png',w:293,h:417,levels:2,dxPx:0,dyPx:10},
 tree3:{src:'imgs/3lvl_tree.png',w:288,h:585,levels:3,dxPx:5,dyPx:4},
 tree4:{src:'imgs/4lvl_tree.png',w:370,h:713,levels:4,dxPx:37,dyPx:-7},
 pieces:[{src:'imgs/green_piece.png',w:259,h:489},{src:'imgs/yellow_piece.png',w:265,h:485},{src:'imgs/red_piece.png',w:268,h:490},{src:'imgs/blue_piece.png',w:270,h:490}],
 dice:[{src:'imgs/die1.png',w:219,h:243},{src:'imgs/die2.png',w:224,h:244},{src:'imgs/die3.png',w:251,h:246},{src:'imgs/die4.png',w:220,h:245},{src:'imgs/die5.png',w:221,h:245},{src:'imgs/die6.png',w:229,h:255}],
 plaque:{src:'imgs/plaque.png',w:1207,h:662},
 startBG:{src:'imgs/_mainBG.jpg'}
};
const CAL={
 pit:{scale:1.30,anchorX:50,anchorY:50,dx:0,dy:0},
 pitExit:{scale:1.30,anchorX:50,anchorY:50,dx:0,dy:0},
 diag:{scale:1.30,anchorX:0,anchorY:100,dx:-100.7131102578,dy:0},
 tree:{scale:2.0,anchorX:40.45,anchorY:94.45,dx:-23.6972024136,dy:-43.4448710916},
 piece:{scale:.40},die:{width:235}
};

let boardDesign=null;
const players=ASSETS.pieces.map((asset,index)=>({asset,index,square:1,hidden:false,finished:false,finishPlace:null}));
let currentPlayer=0,rolling=false,gameStarted=false;
let finishCount=0;
const CAMERA={minZoom:1,maxZoom:2,padding:260,leadMs:500};

function pct(v,axis=3600){return v/axis*100}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function assetMoveTo(player,target){player.square=target;renderPieces();await sleep(420)}
function rand(a){return a[Math.floor(Math.random()*a.length)]}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function squareToCell(square){const rb=Math.floor((square-1)/10),i=(square-1)%10,col=rb%2===0?i:9-i;return{rowFromBottom:rb,rowFromTop:9-rb,col}}
function cellToSquare(rowFromBottom,col){if(rowFromBottom<0||rowFromBottom>9||col<0||col>9)return null;const i=rowFromBottom%2===0?col:9-col;return rowFromBottom*10+i+1}
function squareCenter(s){const c=squareToCell(s);return{x:GRID.left+c.col*GRID.tileWidth+GRID.tileWidth/2,y:GRID.top+c.rowFromTop*GRID.tileHeight+GRID.tileHeight/2}}
function squareBottomLeft(s){const c=squareToCell(s);return{x:GRID.left+c.col*GRID.tileWidth,y:GRID.top+(c.rowFromTop+1)*GRID.tileHeight}}
function squareBottomRight(s){const c=squareToCell(s);return{x:GRID.left+(c.col+1)*GRID.tileWidth,y:GRID.top+(c.rowFromTop+1)*GRID.tileHeight}}
function squareBottomCenter(s){const p=squareBottomLeft(s);return{x:p.x+GRID.tileWidth/2,y:p.y}}
function treeTarget(square,levels){const c=squareToCell(square);return cellToSquare(c.rowFromBottom+levels,c.col)}
function diagTarget(square,vertical,horizontal){
 const c=squareToCell(square);
 const nr=c.rowFromBottom+(vertical==='up'?1:-1);
 const nc=c.col+(horizontal==='right'?2:-2);
 if(nr<0||nr>9||nc<0||nc>9)return null;
 return cellToSquare(nr,nc);
}
function diagVisualAnchor(diag){
 const from=squareToCell(diag.square),to=squareToCell(diag.target);
 const lower=from.rowFromBottom<to.rowFromBottom?from:to;
 const midCol=(from.col+to.col)/2;
 const anchorSquare=cellToSquare(lower.rowFromBottom,midCol);
 const lowerToUpperRight=(to.rowFromBottom>from.rowFromBottom?to.col>from.col:from.col>to.col);
 return{anchorSquare,mirror:!lowerToUpperRight};
}
function pitExitSquare(square){const c=squareToCell(square),row=c.rowFromBottom-3;if(row<0)return null;return cellToSquare(row,Math.floor(Math.random()*10))}

function rectForAsset(asset,cal,point,extraDx=0,extraDy=0){const w=asset.w*cal.scale,h=asset.h*cal.scale;return{x:point.x+cal.dx+extraDx-w*cal.anchorX/100,y:point.y+cal.dy+extraDy-h*cal.anchorY/100,w,h}}
function padded(r,pad){return{x:r.x-pad,y:r.y-pad,w:r.w+pad*2,h:r.h+pad*2}}
function intersects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function insideGrid(r){return r.x>=GRID.left&&r.y>=GRID.top&&r.x+r.w<=GRID.left+GRID.width&&r.y+r.h<=GRID.top+GRID.height}

function generateBoard(){
 for(let attempt=0;attempt<1000;attempt++){
  const occupied=[]; const trees=[]; const pits=[]; const diags=[]; const usedTreeRows=new Set(),usedTreeCols=new Set();
  const treeKinds=shuffle(['tree2','tree3','tree4','tree4']); let fail=false;
  for(const kind of treeKinds){
   const a=ASSETS[kind]; const candidates=shuffle(Array.from({length:100},(_,i)=>i+1)).filter(s=>{const c=squareToCell(s);return s>=2&&c.rowFromBottom+a.levels<=9&&!usedTreeRows.has(c.rowFromBottom)&&!usedTreeCols.has(c.col)});
   let placed=null;
   for(const s of candidates){const c=squareToCell(s),p=squareBottomCenter(s),dx=a.dxPx*BU_PER_PX,dy=a.dyPx*BU_PER_PX,r=rectForAsset(a,CAL.tree,p,dx,dy),bubble=padded(r,45);if(!insideGrid(r)||occupied.some(o=>intersects(bubble,o)))continue;placed={square:s,kind,target:treeTarget(s,a.levels),rect:bubble};break}
   if(!placed){fail=true;break} trees.push(placed);occupied.push(placed.rect);const c=squareToCell(placed.square);usedTreeRows.add(c.rowFromBottom);usedTreeCols.add(c.col);
  }
  if(fail)continue;
  const pitSquares=[];
  const high=rand([96,97,98,99]); pitSquares.push(high);
  const normal=shuffle(Array.from({length:56},(_,i)=>40+i)).filter(s=>s<96);
  for(const s of normal){if(pitSquares.length===4)break;const p=squareCenter(s),a=ASSETS.pits[pitSquares.length%3],r=padded(rectForAsset(a,CAL.pit,p),35);if(occupied.some(o=>intersects(r,o)))continue;pitSquares.push(s);occupied.push(r)}
  if(pitSquares.length!==4)continue;
  pitSquares.forEach((s,i)=>pits.push({square:s,assetIndex:i%3}));
  const endings=new Set([2,3,4,5,6]);
  const diagOrientations=shuffle([
   {vertical:'up',horizontal:'right'},
   {vertical:'up',horizontal:'left'},
   {vertical:'down',horizontal:'right'},
   {vertical:'down',horizontal:'left'}
  ]);
  for(let di=0;di<diagOrientations.length;di++){
   const orient=diagOrientations[di];
   const candidates=shuffle(Array.from({length:99},(_,i)=>i+1)).filter(s=>endings.has(s%10)&&diagTarget(s,orient.vertical,orient.horizontal));
   let placed=null;
   for(const s of candidates){
    const target=diagTarget(s,orient.vertical,orient.horizontal);
    const draft={square:s,target,vertical:orient.vertical,horizontal:orient.horizontal,assetIndex:di%2};
    const visual=diagVisualAnchor(draft),asset=draft.assetIndex===0?ASSETS.diag1:ASSETS.diag2;
    let r;
    if(!visual.mirror)r=rectForAsset(asset,CAL.diag,squareBottomLeft(visual.anchorSquare));
    else{const p=squareBottomRight(visual.anchorSquare),w=asset.w*CAL.diag.scale,h=asset.h*CAL.diag.scale;r={x:p.x-CAL.diag.dx-w,y:p.y+CAL.diag.dy-h,w,h}}
    const bubble=padded(r,45);
    if(!insideGrid(r)||occupied.some(o=>intersects(bubble,o)))continue;
    placed={...draft,rect:bubble};break;
   }
   if(!placed){fail=true;break}diags.push(placed);occupied.push(placed.rect);
  }
  if(fail)continue;
  return{trees,pits,diags};
 }
 throw new Error('Could not generate a complete legal board.');
}


function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function playerBounds(player,squareOverride=null){
 const s=squareOverride??player.square,c=squareToCell(s),a=player.asset,w=a.w*CAL.piece.scale,h=a.h*CAL.piece.scale;
 const x=GRID.left+c.col*GRID.tileWidth+GRID.tileWidth*.5;
 const y=GRID.top+(c.rowFromTop+1)*GRID.tileHeight-GRID.tileHeight*.035;
 return{x:x-w/2,y:y-h,w,h};
}
function cameraTarget(overrides=null){
 const visible=players.filter(p=>!p.hidden&&!p.finished);
 if(!visible.length)visible.push(...players.filter(p=>!p.hidden));
 if(!visible.length)return{zoom:1,left:0,top:0};
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 visible.forEach(p=>{
  const override=overrides&&overrides.has(p.index)?overrides.get(p.index):null;
  const r=playerBounds(p,override);
  minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h);
 });
 minX=clamp(minX-CAMERA.padding,0,BOARD.width);minY=clamp(minY-CAMERA.padding,0,BOARD.height);
 maxX=clamp(maxX+CAMERA.padding,0,BOARD.width);maxY=clamp(maxY+CAMERA.padding,0,BOARD.height);
 const spanX=Math.max(1,maxX-minX),spanY=Math.max(1,maxY-minY);
 let zoom=Math.min(CAMERA.maxZoom,BOARD.width/spanX,BOARD.height/spanY);
 zoom=clamp(zoom,CAMERA.minZoom,CAMERA.maxZoom);
 const viewW=BOARD.width/zoom,viewH=BOARD.height/zoom;
 const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
 const left=clamp(centerX-viewW/2,0,BOARD.width-viewW);
 const top=clamp(centerY-viewH/2,0,BOARD.height-viewH);
 return{zoom,left,top};
}
function applyCamera(target,instant=false){
 const world=document.getElementById('boardWorld');
 if(!world)return;
 const old=world.style.transition;
 if(instant)world.style.transition='none';
 const tx=-target.left*target.zoom/BOARD.width*100;
 const ty=-target.top*target.zoom/BOARD.height*100;
 world.style.transform=`translate(${tx}%,${ty}%) scale(${target.zoom})`;
 if(instant)requestAnimationFrame(()=>{world.style.transition=old||''});
}
let cameraLocked=false;
function updateCamera(overrides=null,instant=false,force=false){
 if(cameraLocked&&!force)return;
 applyCamera(cameraTarget(overrides),instant);
}
async function beginActionCamera(overrides=null){
 cameraLocked=false;
 updateCamera(overrides);
 cameraLocked=true;
 await sleep(CAMERA.leadMs);
}
function endActionCamera(){
 cameraLocked=false;
 updateCamera();
}

function makeImg(layer,asset,r,cls='board-asset'){const img=document.createElement('img');img.className=cls;img.src=asset.src;img.alt='';img.style.left=`${pct(r.x)}%`;img.style.top=`${pct(r.y)}%`;img.style.width=`${pct(r.w)}%`;img.style.height=`${pct(r.h)}%`;layer.appendChild(img);return img}
function renderDesign(){const f=document.getElementById('pitDiagLayer'),t=document.getElementById('treeLayer');f.replaceChildren();t.replaceChildren();
 boardDesign.pits.forEach(p=>{const a=ASSETS.pits[p.assetIndex],r=rectForAsset(a,CAL.pit,squareCenter(p.square));makeImg(f,a,r)});
 boardDesign.diags.forEach(d=>{
  const a=d.assetIndex===0?ASSETS.diag1:ASSETS.diag2,visual=diagVisualAnchor(d);
  if(!visual.mirror){makeImg(f,a,rectForAsset(a,CAL.diag,squareBottomLeft(visual.anchorSquare)))}
  else{const p=squareBottomRight(visual.anchorSquare),w=a.w*CAL.diag.scale,h=a.h*CAL.diag.scale;const img=makeImg(f,a,{x:p.x-CAL.diag.dx-w,y:p.y+CAL.diag.dy-h,w,h});img.style.transform='scaleX(-1)';img.style.transformOrigin='50% 50%'}
 });
 boardDesign.trees.forEach(tr=>{const a=ASSETS[tr.kind],dx=a.dxPx*BU_PER_PX,dy=a.dyPx*BU_PER_PX;makeImg(t,a,rectForAsset(a,CAL.tree,squareBottomCenter(tr.square),dx,dy))});
}
function pieceSlots(n){return n===1?[.5]:n===2?[.34,.66]:n===3?[.2,.5,.8]:[.14,.38,.62,.86]}
function pieceRectAtSquare(player,square,slot=.5){const c=squareToCell(square),a=player.asset,w=a.w*CAL.piece.scale,h=a.h*CAL.piece.scale;return{x:GRID.left+c.col*GRID.tileWidth+GRID.tileWidth*slot,y:GRID.top+(c.rowFromTop+1)*GRID.tileHeight-GRID.tileHeight*.035,w,h}}
function pieceRect(player,slot=.5){return pieceRectAtSquare(player,player.square,slot)}
function renderPieces(){const l=document.getElementById('pieceLayer');l.replaceChildren();const groups=new Map();players.filter(p=>!p.hidden).forEach(p=>{if(!groups.has(p.square))groups.set(p.square,[]);groups.get(p.square).push(p)});for(const [s,g] of groups){const slots=pieceSlots(g.length);g.forEach((p,i)=>{const r=pieceRect(p,slots[i]),img=document.createElement('img');img.className='player-piece';img.dataset.player=String(p.index);img.src=p.asset.src;img.style.left=`${pct(r.x)}%`;img.style.top=`${pct(r.y)}%`;img.style.width=`${pct(r.w)}%`;img.style.height=`${pct(r.h)}%`;l.appendChild(img)})}}
function playerElement(player){return document.querySelector(`#pieceLayer .player-piece[data-player="${player.index}"]`)}
function slotForPlayerOnSquare(player,square){const group=players.filter(p=>!p.hidden&&p.square===square).sort((a,b)=>a.index-b.index),i=group.indexOf(player);return pieceSlots(Math.max(1,group.length))[Math.max(0,i)]??.5}
async function slidePlayerStep(player,nextSquare,duration=205){let img=playerElement(player);if(!img){renderPieces();img=playerElement(player)}const slot=slotForPlayerOnSquare(player,player.square),r=pieceRectAtSquare(player,nextSquare,slot);img.style.transition=`left ${duration}ms linear, top ${duration}ms linear`;requestAnimationFrame(()=>{img.style.left=`${pct(r.x)}%`;img.style.top=`${pct(r.y)}%`});await sleep(duration);player.square=nextSquare;renderPieces()}
async function slideDirect(player,target,duration=480){let img=playerElement(player);if(!img){renderPieces();img=playerElement(player)}const r=pieceRectAtSquare(player,target,.5);img.style.transition=`left ${duration}ms ease-in-out, top ${duration}ms ease-in-out`;requestAnimationFrame(()=>{img.style.left=`${pct(r.x)}%`;img.style.top=`${pct(r.y)}%`});await sleep(duration);player.square=target;renderPieces()}
async function moveTo(player,target){const dir=target>player.square?1:-1;while(player.square!==target)await slidePlayerStep(player,player.square+dir)}
async function assetMoveTo(player,target){await slideDirect(player,target)}
function createDie(face){const a=ASSETS.dice[face-1],w=CAL.die.width,h=w*a.h/a.w,img=document.createElement('img');img.className='die';img.src=a.src;img.style.width=`${pct(w)}%`;img.style.height=`${pct(h)}%`;return img}
async function throwDie(finalFace){
 const layer=document.getElementById('dieLayer');layer.replaceChildren();
 const img=createDie(finalFace);
 // dieLayer is a fixed screen/viewport layer, outside the zoomed boardWorld.
 // These are viewport percentages, so the die is always visible regardless of camera pan/zoom.
 const startX=14+Math.random()*18,startY=18+Math.random()*24;
 const endX=42+Math.random()*20,endY=42+Math.random()*18;
 img.style.left=`${startX}%`;img.style.top=`${startY}%`;
 img.style.transform='translate(-50%,-50%) rotate(0deg) scale(.82)';layer.appendChild(img);
 const duration=1550,start=performance.now(),turns=4+Math.random()*3;
 return new Promise(resolve=>{let lastFace=0;function frame(now){
  const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3),arc=-Math.sin(Math.PI*t)*14;
  const x=startX+(endX-startX)*ease,y=startY+(endY-startY)*ease+arc;
  img.style.left=`${x}%`;img.style.top=`${y}%`;
  img.style.transform=`translate(-50%,-50%) rotate(${turns*360*ease}deg) scale(${.82+.18*ease})`;
  if(now-lastFace>80&&t<.88){img.src=ASSETS.dice[Math.floor(Math.random()*6)].src;lastFace=now}
  if(t<1)requestAnimationFrame(frame);else{img.src=ASSETS.dice[finalFace-1].src;img.style.transform=`translate(-50%,-50%) rotate(${Math.round(turns)*360}deg) scale(1)`;resolve()}
 }requestAnimationFrame(frame)})
}
async function pitAnimation(player,pitSquare){
 const low=document.getElementById('pitPieceLayer'),exitLayer=document.getElementById('pitExitLayer');
 const current=playerElement(player);
 const startRect=pieceRectAtSquare(player,pitSquare,slotForPlayerOnSquare(player,pitSquare));
 player.hidden=true;renderPieces();low.replaceChildren();exitLayer.replaceChildren();

 // FALL: start exactly where the piece was standing. The pit itself never moves.
 const a=player.asset,w=a.w*CAL.piece.scale,h=a.h*CAL.piece.scale;
 const fall=document.createElement('img');
 fall.className='player-piece pit-fall';fall.src=a.src;fall.alt='';
 fall.style.left=`${pct(startRect.x)}%`;fall.style.top=`${pct(startRect.y)}%`;
 fall.style.width=`${pct(w)}%`;fall.style.height=`${pct(h)}%`;
 low.appendChild(fall);
 requestAnimationFrame(()=>{
  fall.style.top=`${pct(startRect.y+GRID.tileHeight*.20)}%`;
  fall.style.transform='translate(-50%,-100%) rotate(540deg) scale(.10)';
  fall.style.opacity='0';
 });
 await sleep(1050);
 low.replaceChildren();

 // Pick the random exit. The turn camera was framed and locked before this action began.
 const dest=pitExitSquare(pitSquare);player.square=dest;

 const ea=ASSETS.pitExit,er=rectForAsset(ea,CAL.pitExit,squareCenter(dest));
 makeImg(exitLayer,ea,er);

 // TEMPORARY MASK: clip the piece to the destination square while it slides
 // down from the physical square above. The clip lives below the pit-exit layer.
 const dc=squareToCell(dest);
 const clip=document.createElement('div');clip.className='pit-emerge-mask';
 clip.style.left=`${pct(GRID.left+dc.col*GRID.tileWidth)}%`;
 clip.style.top=`${pct(GRID.top+dc.rowFromTop*GRID.tileHeight)}%`;
 clip.style.width=`${pct(GRID.tileWidth)}%`;clip.style.height=`${pct(GRID.tileHeight)}%`;
 low.appendChild(clip);

 const rise=document.createElement('img');rise.className='pit-emerge-piece';rise.src=a.src;rise.alt='';
 rise.style.width=`${w/GRID.tileWidth*100}%`;rise.style.height=`${h/GRID.tileHeight*100}%`;
 rise.style.left='50%';
 // Feet begin one whole physical square above the destination and slide to normal feet position.
 rise.style.top='-3.5%';
 clip.appendChild(rise);
 requestAnimationFrame(()=>{rise.style.top='96.5%'});
 await sleep(820);

 low.replaceChildren();exitLayer.replaceChildren();
 player.hidden=false;renderPieces();
 await handleLanding(player);
}
async function handleLanding(player){
 let guard=0;
 while(guard++<6){
  const pit=boardDesign.pits.find(x=>x.square===player.square);
  if(pit){await pitAnimation(player,pit.square);return}

  const tree=boardDesign.trees.find(x=>x.square===player.square);
  if(tree){await assetMoveTo(player,tree.target);continue}

  // Diagonals are bidirectional. Both visible ends are action squares.
  // Arriving at one end sends the piece directly to the opposite end.
  // Stop resolving this landing afterwards so the same diagonal cannot
  // immediately trigger again and bounce the piece back.
  const diag=boardDesign.diags.find(x=>x.square===player.square||x.target===player.square);
  if(diag){
   const destination=player.square===diag.square?diag.target:diag.square;
   await assetMoveTo(player,destination);
   return;
  }
  break;
 }
}
async function showPlaqueMessage(message,duration=1350){
 const l=document.getElementById('messageLayer');l.replaceChildren();
 const img=document.createElement('img');img.className='plaque-message';img.src=ASSETS.plaque.src;img.alt='';l.appendChild(img);
 const text=document.createElement('div');text.className='plaque-text';text.textContent=message;l.appendChild(text);
 await sleep(duration);
 l.replaceChildren();
}
function remainingPlayers(){return players.filter(p=>!p.hidden&&!p.finished)}
function nextActivePlayer(afterIndex){
 for(let step=1;step<=players.length;step++){
  const i=(afterIndex+step)%players.length;
  if(!players[i].hidden&&!players[i].finished)return i;
 }
 return afterIndex;
}
function ordinal(n){return n===1?'1ST':n===2?'2ND':n===3?'3RD':`${n}TH`}
function updateRestartOption(){
 const b=document.getElementById('restartButton');
 if(!b)return;
 b.hidden=remainingPlayers().length>1;
}
async function finishPlayer(player){
 if(player.finished)return;
 player.finished=true;player.finishPlace=++finishCount;
 renderPieces();updateCamera();
 const message=player.finishPlace===1?`PLAYER ${player.index+1} WINS`:`PLAYER ${player.index+1} FINISHES ${ordinal(player.finishPlace)}`;
 await showPlaqueMessage(message,1900);
 updateRestartOption();
}
async function restartGame(){
 if(window.CHUTES_MP?.active){
  const b=document.getElementById('restartButton');b.disabled=true;
  try{await window.CHUTES_MP.restart()}finally{b.disabled=false}
  return;
 }
 finishCount=0;currentPlayer=0;rolling=false;gameStarted=false;
 players.forEach(p=>{p.square=1;p.hidden=false;p.finished=false;p.finishPlace=null});
 boardDesign=generateBoard();renderDesign();renderPieces();updateCamera(null,true);
 document.getElementById('dieLayer').replaceChildren();document.getElementById('messageLayer').replaceChildren();
 document.getElementById('restartButton').hidden=true;
 startCountdown();
}
async function rollTurn(){
 if(rolling||!gameStarted)return;
 if(window.CHUTES_MP?.active && window.CHUTES_MP.seat !== window.CHUTES_MP.state?.active_turn)return;
 const active=remainingPlayers();
 if(!active.length)return;
 if(players[currentPlayer].finished)currentPlayer=nextActivePlayer(currentPlayer);
 rolling=true;const b=document.getElementById('rollButton');b.disabled=true;
 const result=1+Math.floor(Math.random()*6);
 await throwDie(result);await sleep(180);
 const p=players[currentPlayer];
 if(p.square+result<=100){
  // Frame the complete dice destination before anything moves, then lock the camera
  // for the entire movement + any chained tree/diagonal/pit action.
  await beginActionCamera(new Map([[p.index,p.square+result]]));
  await moveTo(p,p.square+result);
  await handleLanding(p);
  endActionCamera();
 }
 if(p.square===100){
  await finishPlayer(p);
  const left=remainingPlayers();
  // Once only one player remains, their final place is already determined.
  // End the game immediately instead of forcing the last player to play alone.
  if(left.length<=1){
   if(left.length===1){const last=left[0];last.finished=true;last.finishPlace=++finishCount;renderPieces();updateCamera()}
   b.disabled=true;b.textContent='GAME OVER';rolling=false;gameStarted=false;updateRestartOption();
   await syncMultiplayerGameOver(result,p);
   return;
  }
  currentPlayer=nextActivePlayer(p.index);
  await syncMultiplayerTurn(result,p);
  b.disabled=false;rolling=false;return;
 }
 if(result===6){
  await showPlaqueMessage('Well done ! Have another go !');
  await syncMultiplayerTurn(result,p,true);
  b.disabled=false;rolling=false;return;
 }
 currentPlayer=nextActivePlayer(currentPlayer);
 await syncMultiplayerTurn(result,p);
 b.disabled=false;rolling=false;
}
function showCountdown(value){
 const l=document.getElementById('startOverlay');
 let frame=l.querySelector('.start-frame');
 let text=l.querySelector('.start-countdown');
 if(!frame){
  l.replaceChildren();
  frame=document.createElement('div');frame.className='start-frame';l.appendChild(frame);
  const img=document.createElement('img');img.className='start-screen';img.src=ASSETS.startBG.src;img.alt='';frame.appendChild(img);
  text=document.createElement('div');text.className='start-countdown';frame.appendChild(text);
 }
 text.textContent=`Game starts in ${value}`;
}
async function startCountdown(){
 const b=document.getElementById('rollButton');b.disabled=true;
 const restart=document.getElementById('restartButton');restart.hidden=true;
 const l=document.getElementById('startOverlay');l.style.display='flex';l.classList.remove('fading');
 for(let n=10;n>=0;n--){showCountdown(n);await sleep(1000)}
 const text=l.querySelector('.start-countdown');
 if(text)text.style.opacity='0';
 l.classList.add('fading');
 await sleep(900);
 l.replaceChildren();
 l.style.display='none';
 gameStarted=true;b.disabled=false;
}

async function syncMultiplayerTurn(roll, movedPlayer, keepTurn=false){
 if(!window.CHUTES_MP?.active)return;
 const state=window.CHUTES_MP.state, ps=structuredClone(state.players||{});
 players.forEach((p,i)=>{if(ps['player'+(i+1)]){ps['player'+(i+1)].square=p.square;ps['player'+(i+1)].finished=p.finished;ps['player'+(i+1)].finish_place=p.finishPlace}});
 const nextSeat=keepTurn?window.CHUTES_MP.seat:(currentPlayer+1);
 await window.CHUTES_MP.update({players:ps,active_turn:nextSeat,finish_order:players.filter(p=>p.finished).sort((a,b)=>a.finishPlace-b.finishPlace).map(p=>p.index+1),last_action:{type:'roll',seat:window.CHUTES_MP.seat,roll,final_square:movedPlayer.square,at:Date.now()}});
}

async function syncMultiplayerGameOver(roll,movedPlayer){
 if(!window.CHUTES_MP?.active)return;
 const state=window.CHUTES_MP.state,ps=structuredClone(state.players||{});
 players.forEach((p,i)=>{if(ps['player'+(i+1)]){ps['player'+(i+1)].square=p.square;ps['player'+(i+1)].finished=p.finished;ps['player'+(i+1)].finish_place=p.finishPlace}});
 await window.CHUTES_MP.update({
  game_state:'finished',active_turn:0,players:ps,
  finish_order:players.filter(p=>!p.hidden&&p.finished).sort((a,b)=>a.finishPlace-b.finishPlace).map(p=>p.index+1),
  last_action:{type:'game_over',seat:window.CHUTES_MP.seat,roll,final_square:movedPlayer.square,at:Date.now()}
 });
}

function init(){
 boardDesign=generateBoard();renderDesign();renderPieces();updateCamera(null,true);
 document.getElementById('rollButton').addEventListener('click',rollTurn);
 document.getElementById('restartButton').addEventListener('click',restartGame);
 updateRestartOption();
 // Multiplayer lobby controls when the game becomes visible and starts.
}
document.addEventListener('DOMContentLoaded',init);
