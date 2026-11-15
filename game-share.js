(function (global) {
  'use strict';

  const C = {
    paper: '#f7f5ef',
    card: '#fffdfa',
    sunken: '#efebe2',
    ink: '#161616',
    muted: '#5e5850',
    line: '#d8d0c3',
    accent: '#9d201f',
    hit: '#1f6a4a',
    hitSoft: '#e4f1ea',
    miss: '#9d201f',
    missSoft: '#f9e5e3',
    pending: '#e2dcd0'
  };
  const SANS = '"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  const SERIF = '"Noto Serif SC","Songti SC","SimSun",serif';

  function wrapLines(ctx, text, maxW, maxLines) {
    const words = String(text || '').trim().replace(/\s+/g, ' ');
    if (!words) return [];
    const lines = [];
    let current = '';
    for (const ch of words) {
      const next = current + ch;
      if (ctx.measureText(next).width > maxW && current) {
        lines.push(current);
        current = ch;
        if (lines.length >= maxLines) break;
      } else {
        current = next;
      }
    }
    if (current && lines.length < maxLines) lines.push(current);
    if (lines.length === maxLines && words.length > lines.join('').length) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
    }
    return lines;
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.closePath();
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function renderCardBlob(options) {
    const { pack, run, companion, score, tier, grid, shareUrl, base } = options;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('浏览器暂不支持画布导出');

    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, 1080, 1440);

    ctx.fillStyle = C.card;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 3;
    roundedRect(ctx, 56, 56, 968, 1328, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.accent;
    ctx.font = `700 26px ${SANS}`;
    ctx.fillText('不吃亏 · 每日 5 关消费决策', 112, 132);

    ctx.fillStyle = C.muted;
    ctx.font = `500 24px ${SANS}`;
    const metaRight = `${pack.publishedDate || ''} · ${pack.id || ''}`;
    const metaW = ctx.measureText(metaRight).width;
    ctx.fillText(metaRight, 968 - metaW, 132);

    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(112, 162);
    ctx.lineTo(968, 162);
    ctx.stroke();

    ctx.fillStyle = C.ink;
    ctx.font = `700 44px ${SERIF}`;
    const titleLines = wrapLines(ctx, pack.title || '今日 5 关', 856, 2);
    titleLines.forEach((line, idx) => ctx.fillText(line, 112, 224 + idx * 58));

    const scoreBoxY = 232 + titleLines.length * 56;
    ctx.fillStyle = C.sunken;
    roundedRect(ctx, 112, scoreBoxY, 856, 226, 22);
    ctx.fill();

    ctx.fillStyle = C.accent;
    ctx.font = `700 96px ${SERIF}`;
    ctx.fillText(`${score}/5`, 156, scoreBoxY + 126);

    ctx.fillStyle = C.ink;
    ctx.font = `700 36px ${SERIF}`;
    ctx.fillText(tier.title, 392, scoreBoxY + 90);

    ctx.fillStyle = C.muted;
    ctx.font = `500 26px ${SANS}`;
    const tierLines = wrapLines(ctx, tier.summary, 536, 2);
    tierLines.forEach((line, idx) => ctx.fillText(line, 392, scoreBoxY + 140 + idx * 38));

    const gridY = scoreBoxY + 264;
    ctx.fillStyle = C.muted;
    ctx.font = `600 24px ${SANS}`;
    ctx.fillText('无剧透结果网格（不含题目选项与答案）', 112, gridY);

    const cellW = 148;
    const gap = 28;
    grid.forEach((cell, idx) => {
      const x = 112 + idx * (cellW + gap);
      const y = gridY + 24;
      ctx.fillStyle = cell === 'hit' ? C.hitSoft : cell === 'miss' ? C.missSoft : C.pending;
      ctx.strokeStyle = cell === 'hit' ? C.hit : cell === 'miss' ? C.miss : C.line;
      ctx.lineWidth = 3;
      roundedRect(ctx, x, y, cellW, 118, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cell === 'hit' ? C.hit : cell === 'miss' ? C.miss : C.muted;
      ctx.font = `700 44px ${SANS}`;
      const glyph = cell === 'hit' ? '✓' : cell === 'miss' ? '×' : '·';
      const gw = ctx.measureText(glyph).width;
      ctx.fillText(glyph, x + (cellW - gw) / 2, y + 66);

      ctx.font = `600 22px ${SANS}`;
      const lbl = `第${idx + 1}关`;
      const lw = ctx.measureText(lbl).width;
      ctx.fillText(lbl, x + (cellW - lw) / 2, y + 102);
    });

    const compY = gridY + 188;
    const imgSrc = companion && companion.image ? `${base || './'}${companion.image.replace(/^\.\//, '')}` : '';
    const img = await loadImage(imgSrc);
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    roundedRect(ctx, 112, compY, 856, 290, 22);
    ctx.fill();
    ctx.stroke();

    if (img) {
      ctx.save();
      roundedRect(ctx, 140, compY + 28, 234, 234, 20);
      ctx.clip();
      ctx.drawImage(img, 140, compY + 28, 234, 234);
      ctx.restore();
    }

    const textX = img ? 404 : 148;
    const textW = img ? 532 : 784;
    ctx.fillStyle = C.accent;
    ctx.font = `700 24px ${SANS}`;
    ctx.fillText(`本期纪念陪伴角色 · ${companion ? companion.name : '今日小动物'}`, textX, compY + 72);

    ctx.fillStyle = C.ink;
    ctx.font = `600 28px ${SERIF}`;
    const hookLines = wrapLines(ctx, pack.shareHook || '这 5 关不用花一分钱，却把常见消费决定提前过了一遍。', textW, 3);
    hookLines.forEach((line, idx) => ctx.fillText(line, textX, compY + 124 + idx * 42));

    ctx.fillStyle = C.muted;
    ctx.font = `500 22px ${SANS}`;
    ctx.fillText('仅用于记录本期通关纪念，不代表消费能力等级或人格评价。', textX, compY + 258);

    const footerY = 1260;
    ctx.strokeStyle = C.line;
    ctx.beginPath();
    ctx.moveTo(112, footerY);
    ctx.lineTo(968, footerY);
    ctx.stroke();

    ctx.fillStyle = C.ink;
    ctx.font = `700 26px ${SANS}`;
    ctx.fillText('不吃亏 buchikui · 来玩同一套 5 关', 112, footerY + 52);

    ctx.fillStyle = C.muted;
    ctx.font = `500 22px ${SANS}`;
    const cleanUrl = String(shareUrl || '').slice(0, 72);
    ctx.fillText(cleanUrl, 112, footerY + 90);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('生成图片失败'));
        else resolve(blob);
      }, 'image/png');
    });
  }

  async function openShareDialog(options) {
    const existing = document.getElementById('dailyShareDialog');
    if (existing) existing.remove();

    const triggerEl = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.id = 'dailyShareDialog';
    dialog.className = 'daily-share-dialog';
    dialog.setAttribute('aria-labelledby', 'dailyShareHeading');
    dialog.innerHTML = `
      <div class="daily-share-dialog-inner">
        <div class="daily-share-dialog-head">
          <h2 id="dailyShareHeading">无剧透成绩卡</h2>
          <button type="button" class="daily-share-close" aria-label="关闭成绩卡弹窗">关闭</button>
        </div>
        <p class="daily-share-hint">卡片只包含得分与 5 格对错，不剧透题目、选项或依据，方便发给朋友来挑战同一期。</p>
        <div class="daily-share-preview"><p class="daily-share-loading">正在绘制成绩卡…</p></div>
        <div class="daily-share-actions">
          <button type="button" class="daily-btn daily-btn-primary" data-action="download" disabled>下载 PNG 卡片</button>
          <button type="button" class="daily-btn" data-action="native-share" hidden>系统分享</button>
          <button type="button" class="daily-btn" data-action="copy-text">复制无剧透战绩</button>
        </div>
        <p class="daily-share-status" role="status" aria-live="polite"></p>
      </div>
    `;
    document.body.appendChild(dialog);

    const closeBtn = dialog.querySelector('.daily-share-close');
    const previewEl = dialog.querySelector('.daily-share-preview');
    const downloadBtn = dialog.querySelector('[data-action="download"]');
    const shareBtn = dialog.querySelector('[data-action="native-share"]');
    const copyBtn = dialog.querySelector('[data-action="copy-text"]');
    const statusEl = dialog.querySelector('.daily-share-status');

    let objectUrl = '';
    let cardBlob = null;

    function cleanup() {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      dialog.remove();
      if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
    }

    dialog.addEventListener('close', cleanup);
    closeBtn.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(options.shareText || options.shareUrl || '');
        statusEl.textContent = '已复制无剧透战绩与挑战链接。';
      } catch (_err) {
        statusEl.textContent = `请手动复制链接：${options.shareUrl || ''}`;
      }
    });

    try {
      cardBlob = await renderCardBlob(options);
      objectUrl = URL.createObjectURL(cardBlob);
      const img = document.createElement('img');
      img.src = objectUrl;
      img.alt = `不吃亏每日 5 关成绩卡，${options.score}/5`;
      previewEl.innerHTML = '';
      previewEl.appendChild(img);
      downloadBtn.disabled = false;

      const file = new File([cardBlob], `buchikui-${options.pack.id || 'daily'}-${options.score}of5.png`, {
        type: 'image/png'
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareBtn.hidden = false;
        shareBtn.addEventListener('click', async () => {
          try {
            await navigator.share({
              title: `不吃亏｜${options.pack.title}`,
              text: options.shareText,
              files: [file]
            });
            statusEl.textContent = '已调起系统分享。';
          } catch (err) {
            if (err && err.name !== 'AbortError') statusEl.textContent = '系统分享未完成，可直接下载 PNG。';
          }
        });
      }

      downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `buchikui-${options.pack.id || 'daily'}-${options.score}of5.png`;
        a.click();
        statusEl.textContent = 'PNG 成绩卡已开始下载。';
      });
    } catch (_err) {
      previewEl.innerHTML = '<p class="daily-share-loading">画布渲染失败，你仍可复制下方无剧透战绩文本与链接。</p>';
    }
  }

  global.BuchikuiGameShare = {
    openShareDialog,
    renderCardBlob
  };
})(window);
