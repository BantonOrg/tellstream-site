'use strict';

// Playability guard: keep generated action squares unique and keep square 100 safe.
// This deliberately changes only board generation; the existing movement/animation code remains untouched.
generateBoard=function generateBoard(){
 for(let attempt=0;attempt<1000;attempt++){
  const occupied=[];
  const trees=[];
  const pits=[];
  const diags=[];
  const usedTreeRows=new Set();
  const usedTreeCols=new Set();
  const actionSquares=new Set([100]);
  const treeKinds=shuffle(['tree2','tree3','tree4','tree4']);
  let fail=false;

  for(const kind of treeKinds){
   const a=ASSETS[kind];
   const candidates=shuffle(Array.from({length:100},(_,i)=>i+1)).filter(s=>{
    const c=squareToCell(s);
    return s>=2 &&
      c.rowFromBottom+a.levels<=9 &&
      !usedTreeRows.has(c.rowFromBottom) &&
      !usedTreeCols.has(c.col) &&
      !actionSquares.has(s);
   });
   let placed=null;
   for(const s of candidates){
    const c=squareToCell(s);
    const p=squareBottomCenter(s);
    const dx=a.dxPx*BU_PER_PX;
    const dy=a.dyPx*BU_PER_PX;
    const r=rectForAsset(a,CAL.tree,p,dx,dy);
    const bubble=padded(r,45);
    if(!insideGrid(r) || occupied.some(o=>intersects(bubble,o)))continue;
    placed={square:s,kind,target:treeTarget(s,a.levels),rect:bubble};
    break;
   }
   if(!placed){fail=true;break;}
   trees.push(placed);
   occupied.push(placed.rect);
   actionSquares.add(placed.square);
   const c=squareToCell(placed.square);
   usedTreeRows.add(c.rowFromBottom);
   usedTreeCols.add(c.col);
  }
  if(fail)continue;

  const pitSquares=[];
  let highPit=null;
  for(const s of shuffle([96,97,98,99])){
   if(actionSquares.has(s))continue;
   const a=ASSETS.pits[0];
   const r=padded(rectForAsset(a,CAL.pit,squareCenter(s)),35);
   if(occupied.some(o=>intersects(r,o)))continue;
   highPit={square:s,rect:r};
   break;
  }
  if(!highPit)continue;
  pitSquares.push(highPit.square);
  occupied.push(highPit.rect);
  actionSquares.add(highPit.square);

  const normal=shuffle(Array.from({length:56},(_,i)=>40+i)).filter(s=>s<96 && !actionSquares.has(s));
  for(const s of normal){
   if(pitSquares.length===4)break;
   const a=ASSETS.pits[pitSquares.length%3];
   const r=padded(rectForAsset(a,CAL.pit,squareCenter(s)),35);
   if(occupied.some(o=>intersects(r,o)))continue;
   pitSquares.push(s);
   occupied.push(r);
   actionSquares.add(s);
  }
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
   const candidates=shuffle(Array.from({length:99},(_,i)=>i+1)).filter(s=>{
    if(!endings.has(s%10) || actionSquares.has(s))return false;
    const target=diagTarget(s,orient.vertical,orient.horizontal);
    return target && !actionSquares.has(target);
   });
   let placed=null;
   for(const s of candidates){
    const target=diagTarget(s,orient.vertical,orient.horizontal);
    if(!target || actionSquares.has(s) || actionSquares.has(target))continue;
    const draft={square:s,target,vertical:orient.vertical,horizontal:orient.horizontal,assetIndex:di%2};
    const visual=diagVisualAnchor(draft);
    const asset=draft.assetIndex===0?ASSETS.diag1:ASSETS.diag2;
    let r;
    if(!visual.mirror){
     r=rectForAsset(asset,CAL.diag,squareBottomLeft(visual.anchorSquare));
    }else{
     const p=squareBottomRight(visual.anchorSquare);
     const w=asset.w*CAL.diag.scale;
     const h=asset.h*CAL.diag.scale;
     r={x:p.x-CAL.diag.dx-w,y:p.y+CAL.diag.dy-h,w,h};
    }
    const bubble=padded(r,45);
    if(!insideGrid(r) || occupied.some(o=>intersects(bubble,o)))continue;
    placed={...draft,rect:bubble};
    break;
   }
   if(!placed){fail=true;break;}
   diags.push(placed);
   occupied.push(placed.rect);
   actionSquares.add(placed.square);
   actionSquares.add(placed.target);
  }
  if(fail)continue;

  const triggerSquares=[
   ...trees.map(x=>x.square),
   ...pits.map(x=>x.square),
   ...diags.flatMap(x=>[x.square,x.target])
  ];
  if(triggerSquares.includes(100) || new Set(triggerSquares).size!==triggerSquares.length)continue;

  return{trees,pits,diags};
 }
 throw new Error('Could not generate a complete legal board.');
};
