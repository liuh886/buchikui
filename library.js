(()=>{
  'use strict';

  const STORAGE_KEY='buchikui-library-v1';
  const cases=window.BUCHIKUI_CASES||[];
  if(!cases.length) return;

  const byId=id=>document.getElementById(id);
  const dialog=byId('libraryDialog');
  const openActions=[...document.querySelectorAll('[data-library-open]')];
  const closeActions=dialog?[...dialog.querySelectorAll('[data-library-close]')]:[];
  let lastTrackedSlug='';

  function escapeHtml(value){
    return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function emptyState(){
    return {favorites:[],recent:[]};
  }

  function readState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {
        favorites:Array.isArray(parsed.favorites)?parsed.favorites.filter(Boolean):[],
        recent:Array.isArray(parsed.recent)?parsed.recent.filter(item=>item&&item.slug):[]
      };
    }catch(error){
      return emptyState();
    }
  }

  function writeState(state){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  }

  function caseBySlug(slug){
    return cases.find(item=>item.slug===slug);
  }

  function currentCase(){
    const text=(byId('caseSwitcherId')?.textContent||'').trim();
    const id=text.replace(/^CASE\s*/i,'');
    return cases.find(item=>String(item.id)===id)||null;
  }

  function recordRecent(item){
    if(!item||item.slug===lastTrackedSlug) return;
    lastTrackedSlug=item.slug;
    const state=readState();
    state.recent=[
      {slug:item.slug,at:Date.now()},
      ...state.recent.filter(entry=>entry.slug!==item.slug)
    ].slice(0,6);
    writeState(state);
    if(dialog?.open) render();
  }

  function toggleFavorite(slug){
    const item=caseBySlug(slug);
    if(!item) return;
    const state=readState();
    if(state.favorites.includes(slug)) state.favorites=state.favorites.filter(itemSlug=>itemSlug!==slug);
    else state.favorites=[slug,...state.favorites.filter(itemSlug=>itemSlug!==slug)];
    writeState(state);
    render();
  }

  function removeFavorite(slug){
    const state=readState();
    state.favorites=state.favorites.filter(itemSlug=>itemSlug!==slug);
    writeState(state);
    render();
  }

  function evidenceProgress(item){
    const evidenceItems=item?.evidence?.items||[];
    if(!evidenceItems.length) return {count:0,total:0};
    let saved={};
    try{
      saved=JSON.parse(localStorage.getItem(`buchikui-${item.slug}-evidence-v1`)||'{}');
    }catch(error){}
    return {
      count:evidenceItems.filter(evidence=>saved[evidence.key]).length,
      total:evidenceItems.length
    };
  }

  function openCase(slug){
    const item=caseBySlug(slug);
    if(!item) return;
    const url=new URL(location.href);
    url.searchParams.set('case',item.slug);
    url.hash='';
    dialog?.close();
    location.assign(url.toString());
  }

  function caseRow(item,meta=''){
    return `<button class="library-row" type="button" data-library-case="${escapeHtml(item.slug)}">
      <span class="library-row-id">CASE ${escapeHtml(item.id)}</span>
      <span class="library-row-copy"><strong>${escapeHtml(item.name)}</strong>${meta?`<small>${escapeHtml(meta)}</small>`:''}</span>
      <span class="library-row-arrow" aria-hidden="true">→</span>
    </button>`;
  }

  function favoriteRow(item){
    return `<div class="library-favorite-row">
      ${caseRow(item,'已收藏')}
      <button class="library-remove" type="button" data-library-remove="${escapeHtml(item.slug)}" aria-label="取消收藏 ${escapeHtml(item.name)}">移除</button>
    </div>`;
  }

  function progressRow(item,progress){
    const percent=progress.total?Math.round(progress.count/progress.total*100):0;
    return `<button class="library-progress-row" type="button" data-library-case="${escapeHtml(item.slug)}">
      <span class="library-progress-copy">
        <span><b>CASE ${escapeHtml(item.id)}</b><strong>${escapeHtml(item.name)}</strong></span>
        <small>${progress.count}/${progress.total} 项证据</small>
      </span>
      <span class="library-progress-track" aria-hidden="true"><i style="width:${percent}%"></i></span>
    </button>`;
  }

  function render(){
    if(!dialog) return;
    const state=readState();
    const active=currentCase();
    const favoriteCases=state.favorites.map(caseBySlug).filter(Boolean);
    const recentCases=state.recent.map(entry=>caseBySlug(entry.slug)).filter(Boolean);
    const evidenceCases=cases
      .map(item=>({item,progress:evidenceProgress(item)}))
      .filter(entry=>entry.progress.total>0);
    const savedEvidence=evidenceCases.reduce((sum,entry)=>sum+entry.progress.count,0);
    const totalEvidence=evidenceCases.reduce((sum,entry)=>sum+entry.progress.total,0);

    byId('libraryFavoriteCount').textContent=String(favoriteCases.length);
    byId('libraryRecentCount').textContent=String(recentCases.length);
    byId('libraryEvidenceCount').textContent=`${savedEvidence}/${totalEvidence}`;

    if(active){
      byId('libraryCurrentId').textContent=`CASE ${active.id}`;
      byId('libraryCurrentName').textContent=active.name;
      const favoriteButton=byId('libraryFavoriteCurrent');
      const favorite=state.favorites.includes(active.slug);
      favoriteButton.dataset.libraryFavorite=active.slug;
      favoriteButton.setAttribute('aria-pressed',favorite?'true':'false');
      favoriteButton.textContent=favorite?'已收藏 · 取消':'收藏当前 CASE';
    }

    byId('libraryFavorites').innerHTML=favoriteCases.length
      ?favoriteCases.map(favoriteRow).join('')
      :'<p class="library-empty">还没有收藏。遇到需要反复核对的 CASE 时，再把它留下。</p>';

    byId('libraryRecent').innerHTML=recentCases.length
      ?recentCases.map(item=>caseRow(item,'最近打开')).join('')
      :'<p class="library-empty">最近阅读会自动出现在这里。</p>';

    byId('libraryEvidence').innerHTML=evidenceCases.length
      ?evidenceCases.map(entry=>progressRow(entry.item,entry.progress)).join('')
      :'<p class="library-empty">当前还没有可汇总的证据清单。</p>';
  }

  function openLibrary(){
    if(!dialog) return;
    render();
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  openActions.forEach(action=>action.addEventListener('click',openLibrary));
  closeActions.forEach(action=>action.addEventListener('click',()=>dialog?.close()));

  dialog?.addEventListener('click',event=>{
    if(event.target===dialog) dialog.close();
    const favorite=event.target.closest('[data-library-favorite]');
    if(favorite){
      toggleFavorite(favorite.dataset.libraryFavorite);
      return;
    }
    const remove=event.target.closest('[data-library-remove]');
    if(remove){
      removeFavorite(remove.dataset.libraryRemove);
      return;
    }
    const row=event.target.closest('[data-library-case]');
    if(row) openCase(row.dataset.libraryCase);
  });

  const caseId=byId('caseSwitcherId');
  if(caseId){
    new MutationObserver(()=>recordRecent(currentCase())).observe(caseId,{childList:true,characterData:true,subtree:true});
  }

  recordRecent(currentCase());
})();