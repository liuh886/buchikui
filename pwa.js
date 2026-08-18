(()=>{
  'use strict';

  const installActions=[...document.querySelectorAll('[data-install-app]')];
  const installDialog=document.getElementById('pwaInstallDialog');
  const dialogCloseButtons=installDialog?[...installDialog.querySelectorAll('[data-pwa-dialog-close]')]:[];
  const toast=document.getElementById('pwaToast');
  const toastTitle=document.getElementById('pwaToastTitle');
  const toastText=document.getElementById('pwaToastText');
  const toastAction=document.getElementById('pwaToastAction');
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredPrompt=null;
  let toastTimer=null;
  let refreshing=false;
  let updateRegistration=null;

  if(standalone) document.body.classList.add('pwa-standalone');

  function setInstallActionsVisible(visible){
    installActions.forEach(action=>{action.hidden=!visible;});
  }

  function clearToastTimer(){
    if(toastTimer){
      clearTimeout(toastTimer);
      toastTimer=null;
    }
  }

  function hideToast(){
    clearToastTimer();
    if(toast) toast.hidden=true;
    if(toastAction){
      toastAction.hidden=true;
      toastAction.onclick=null;
    }
  }

  function showToast(title,text,{actionLabel='',onAction=null,timeout=0}={}){
    if(!toast||!toastTitle||!toastText||!toastAction) return;
    clearToastTimer();
    toastTitle.textContent=title;
    toastText.textContent=text;
    toastAction.hidden=!actionLabel;
    toastAction.textContent=actionLabel;
    toastAction.onclick=actionLabel&&onAction?onAction:null;
    toast.hidden=false;
    if(timeout>0) toastTimer=setTimeout(hideToast,timeout);
  }

  function showIosInstallGuide(){
    if(installDialog?.showModal) installDialog.showModal();
  }

  async function requestInstall(){
    if(deferredPrompt){
      const prompt=deferredPrompt;
      deferredPrompt=null;
      setInstallActionsVisible(false);
      await prompt.prompt();
      const choice=await prompt.userChoice;
      if(choice.outcome!=='accepted') setInstallActionsVisible(true);
      return;
    }
    if(ios&&!standalone) showIosInstallGuide();
  }

  installActions.forEach(action=>action.addEventListener('click',requestInstall));
  dialogCloseButtons.forEach(button=>button.addEventListener('click',()=>installDialog?.close()));
  installDialog?.addEventListener('click',event=>{
    if(event.target===installDialog) installDialog.close();
  });

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    if(!standalone) setInstallActionsVisible(true);
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    setInstallActionsVisible(false);
    showToast('已安装到设备','以后可以直接从主屏幕打开“不吃亏”。',{timeout:3600});
  });

  if(ios&&!standalone) setInstallActionsVisible(true);
  else if(standalone) setInstallActionsVisible(false);

  function showOfflineState(){
    showToast('当前离线','已缓存的案例正文、证据清单和模板仍可阅读；登录、反馈和外部官方链接需要联网。');
  }

  function showOnlineState(){
    showToast('已恢复联网','最新内容和在线功能现在可以继续使用。',{timeout:2200});
  }

  window.addEventListener('offline',showOfflineState);
  window.addEventListener('online',showOnlineState);
  if(!navigator.onLine) showOfflineState();

  function offerUpdate(registration){
    if(!registration.waiting) return;
    updateRegistration=registration;
    showToast('新版本已就绪','更新后会重新打开当前 CASE，已勾选的证据清单仍保存在本机。',{
      actionLabel:'立即更新',
      onAction:()=>{
        const waiting=updateRegistration?.waiting;
        if(waiting) waiting.postMessage({type:'SKIP_WAITING'});
      }
    });
  }

  function watchInstallingWorker(registration){
    const worker=registration.installing;
    if(!worker) return;
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed'&&navigator.serviceWorker.controller) offerUpdate(registration);
    });
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js');
        if(registration.waiting&&navigator.serviceWorker.controller) offerUpdate(registration);
        registration.addEventListener('updatefound',()=>watchInstallingWorker(registration));
        document.addEventListener('visibilitychange',()=>{
          if(document.visibilityState==='visible') registration.update().catch(()=>{});
        });
      }catch(error){
        console.warn('PWA service worker registration failed',error);
      }
    });

    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing) return;
      refreshing=true;
      location.reload();
    });
  }
})();
