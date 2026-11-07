(function(root){
  'use strict';
  let objectUrl='',opening=false;
  function wrap(ctx,text,x,y,maxWidth,lineHeight){
    let line='';
    for(const char of Array.from(text)){
      if(ctx.measureText(line+char).width>maxWidth&&line){ctx.fillText(line,x,y);line=char;y+=lineHeight;}else line+=char;
    }
    if(line)ctx.fillText(line,x,y);
    return y+lineHeight;
  }
  async function createCard(portrait,base){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas_unavailable');
    if(document.fonts?.ready)await document.fonts.ready;
    ctx.fillStyle='#f7f5ef';ctx.fillRect(0,0,1080,1440);
    ctx.strokeStyle='#ddd8cd';ctx.lineWidth=2;ctx.strokeRect(50,50,980,1340);
    ctx.textAlign='center';ctx.fillStyle='#6b665d';ctx.font='28px sans-serif';ctx.fillText('不 吃 亏  /  消 费 经 历 角 色',540,140);
    let imageAvailable=false;
    try{
      const url=new URL(portrait.image,new URL(base,location.origin));
      if(url.origin!==location.origin||!/^portraits\/[a-z-]+\.[a-f0-9]{12}\.webp$/.test(portrait.image))throw new Error('unsafe_image');
      const img=new Image();img.src=url.href;await img.decode();ctx.drawImage(img,230,210,620,620);imageAvailable=true;
    }catch(error){ctx.fillStyle='#ece8dd';ctx.beginPath();ctx.arc(540,520,220,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6b665d';ctx.font='34px sans-serif';ctx.fillText('一张属于你的角色卡',540,530);}
    ctx.fillStyle='#292923';ctx.font='bold 72px serif';ctx.fillText(portrait.name,540,940,900);
    ctx.font='32px sans-serif';ctx.fillStyle='#555449';wrap(ctx,portrait.description,540,1020,800,52);
    ctx.font='26px sans-serif';ctx.fillStyle='#777268';ctx.fillText('测测你的角色，不花钱，也买教训。',540,1210);
    ctx.font='23px sans-serif';ctx.fillText(new URL(base,location.origin).href,540,1270,900);
    ctx.font='21px sans-serif';ctx.fillText('本次问卷的趣味表达 · 不代表消费能力',540,1330);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('export_failed');
    return {blob,imageAvailable};
  }
  async function open(portrait,base,trigger){
    if(opening)return;opening=true;
    const priorLabel=trigger?.textContent;if(trigger){trigger.disabled=true;trigger.textContent='正在准备角色卡…';}
    let dialog;
    try{
      const {blob,imageAvailable}=await createCard({id:portrait.id,name:portrait.name,description:portrait.description,image:portrait.image},base);
      if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);
      dialog=document.createElement('dialog');dialog.className='portrait-share';dialog.setAttribute('aria-labelledby','portraitShareTitle');
      const heading=document.createElement('h2');heading.id='portraitShareTitle';heading.textContent='你的角色卡';
      const note=document.createElement('p');note.textContent=imageAvailable?'卡片会公开角色名称和插画，不包含你的具体回答。':'插画暂未能加载，当前预览是文字版角色卡，不包含具体回答。';
      const preview=document.createElement('img');preview.src=objectUrl;preview.alt=`${portrait.name}的分享卡预览`;preview.width=1080;preview.height=1440;
      const actions=document.createElement('div');actions.className='portrait-share-actions';
      const save=document.createElement('a');save.className='portrait-action';save.href=objectUrl;save.download=`buchikui-${portrait.id}.png`;save.textContent='保存图片';
      const view=document.createElement('a');view.href=objectUrl;view.target='_blank';view.rel='noopener';view.textContent='打开大图，可长按保存';
      const file=new File([blob],`buchikui-${portrait.id}.png`,{type:'image/png'});
      const status=document.createElement('p');status.setAttribute('role','status');status.className='portrait-share-status';
      if(navigator.canShare?.({files:[file]})){
        const share=document.createElement('button');share.type='button';share.className='portrait-action portrait-action-quiet';share.textContent='系统分享';
        share.onclick=async()=>{try{await navigator.share({files:[file],title:'不吃亏｜我的消费经历角色'});}catch(error){if(error.name!=='AbortError')status.textContent='暂未能打开系统分享，可以保存图片。';}};actions.append(share);
      }
      const copy=document.createElement('button');copy.type='button';copy.className='text-button';copy.textContent='复制问卷链接';
      copy.onclick=async()=>{const url=new URL(base,location.origin).href;try{await navigator.clipboard.writeText(url);status.textContent='问卷链接已复制。';}catch(error){const input=document.createElement('input');input.type='url';input.readOnly=true;input.value=url;input.setAttribute('aria-label','可复制问卷链接');status.replaceChildren(input);input.select();}};
      const close=document.createElement('button');close.type='button';close.className='text-button';close.textContent='关闭预览';close.onclick=()=>dialog.close();
      actions.prepend(save);actions.append(copy);dialog.append(heading,note,preview,actions,view,status,close);document.body.append(dialog);
      dialog.addEventListener('close',()=>{if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}dialog.remove();trigger?.focus();},{once:true});
      dialog.showModal();close.focus();
    }catch(error){if(trigger){const status=document.createElement('p');status.setAttribute('role','status');status.textContent='角色卡暂未能生成，请重试；你仍可分享问卷链接。';trigger.parentElement.append(status);}}
    finally{opening=false;if(trigger){trigger.disabled=false;trigger.textContent=priorLabel;}}
  }
  root.BuchikuiPortraitShare={open,createCard};
})(window);
