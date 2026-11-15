(function(root){
  'use strict';

  const CHOICES = new Set(['yes', 'no']);

  function shanghaiDate(now = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(now);
      const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
      if (map.year && map.month && map.day) return `${map.year}-${map.month}-${map.day}`;
    } catch (error) {}
    const utc8 = new Date(now.getTime() + 8 * 3600 * 1000);
    return utc8.toISOString().slice(0, 10);
  }

  function validateLevel(level) {
    if (!level || typeof level.id !== 'string' || !level.id.trim()) return '关卡缺少 id';
    if (!level.version || !['yes', 'no'].includes(level.answer)) return `${level.id}: 关卡答案或版本无效`;
    if (typeof level.prompt !== 'string' || !level.prompt.trim() || /^你是否遭遇过：/.test(level.prompt.trim())) {
      return `${level.id}: 题面无效`;
    }
    if (typeof level.goal !== 'string' || !level.goal.trim()) return `${level.id}: 缺少玩家目标`;
    if (!level.productSnapshot?.title || !level.productSnapshot?.priceOrCondition || !Array.isArray(level.productSnapshot.details) || !level.productSnapshot.details.length) {
      return `${level.id}: 交易快照不完整`;
    }
    if (!Array.isArray(level.observableClues) || !level.observableClues.length) return `${level.id}: 缺少购买前可见线索`;
    if (!level.offer?.yesLabel || !level.offer?.noLabel) return `${level.id}: 缺少 YES/NO 操作文案`;
    if (!level.revealSteps?.twist || !level.revealSteps?.factDetail || !level.revealSteps?.scope) {
      return `${level.id}: 揭晓内容不完整`;
    }
    if (typeof level.nextTimeSignal !== 'string' || !level.nextTimeSignal.trim()) return `${level.id}: 缺少下次识别法`;
    if (!Array.isArray(level.sources) || !level.sources.length) return `${level.id}: 缺少来源依据`;
    for (const s of level.sources) {
      try {
        const u = new URL(s?.href);
        if (!['http:', 'https:'].includes(u.protocol)) return `${level.id}: 来源链接协议无效`;
      } catch (error) {
        return `${level.id}: 来源链接无效`;
      }
    }
    return '';
  }

  function validate(daily) {
    const errors = [];
    if (!daily || daily.schema !== 4 || daily.mode !== 'daily-challenge') return ['挑战内容结构或版本无效'];
    if (!Array.isArray(daily.packs) || !daily.packs.length) return ['暂无可玩每日题包'];
    if (!daily.companions || typeof daily.companions !== 'object') return ['缺少伙伴角色资源'];
    for (const pack of daily.packs) {
      if (!pack?.id || !pack.title || !pack.revision || !Array.isArray(pack.levels) || pack.levels.length !== 5) {
        errors.push(`题包无效：${pack?.id || 'unknown'}`);
        continue;
      }
      if (!daily.companions[pack.companionId]) errors.push(`${pack.id}: 缺少伙伴角色`);
      const seen = new Set();
      for (const level of pack.levels) {
        if (seen.has(level?.id)) errors.push(`${pack.id}: 关卡重复 ${level?.id}`);
        seen.add(level?.id);
        const err = validateLevel(level);
        if (err) errors.push(err);
      }
    }
    return errors;
  }

  function resolveActivePack(daily, requestedPackId = '', isChallengeInvite = false, now = new Date()) {
    const today = shanghaiDate(now);
    const schedule = Array.isArray(daily?.schedule) ? daily.schedule : [];
    const scheduled = schedule.find(item => item.date === today)?.packId || daily?.defaultPackId || daily?.packs?.[0]?.id || '';

    if (requestedPackId) {
      const target = (daily?.packs || []).find(p => p.id === requestedPackId);
      if (!target) return { status: 'missing-pack', todayDate: today, scheduledPackId: scheduled };
      if (target.state !== 'approved') return { status: 'paused-source-invalid', pack: target, todayDate: today, isArchive: target.id !== scheduled, isChallengeInvite };
      return {
        status: 'ready',
        pack: target,
        todayDate: today,
        isArchive: target.id !== scheduled,
        isChallengeInvite: !!isChallengeInvite
      };
    }

    const pack = (daily?.packs || []).find(p => p.id === scheduled) || (daily?.packs || [])[0];
    if (!pack) return { status: 'missing-pack', todayDate: today, scheduledPackId: '' };
    if (pack.state !== 'approved') return { status: 'paused-source-invalid', pack, todayDate: today, isArchive: false, isChallengeInvite: false };
    return {
      status: 'ready',
      pack,
      todayDate: today,
      isArchive: false,
      isChallengeInvite: false
    };
  }

  function startRun(pack, mode = 'daily') {
    return {
      schema: 1,
      packId: pack.id,
      revision: pack.revision,
      mode,
      status: 'ready',
      activeIndex: 0,
      viewIndex: 0,
      revealStep: 0,
      records: [],
      levelIds: pack.levels.map(l => l.id),
      levelVersions: pack.levels.map(l => l.version),
      completedAt: ''
    };
  }

  function restoreRun(saved, pack, mode = 'daily') {
    const fresh = startRun(pack, mode);
    if (!saved || saved.schema !== 1 || saved.packId !== pack.id) {
      return { run: fresh, notice: '' };
    }
    if (!Array.isArray(saved.records) || !Array.isArray(saved.levelIds) || !Array.isArray(saved.levelVersions) || !Number.isInteger(saved.activeIndex)) {
      return { run: fresh, notice: '' };
    }
    if (saved.activeIndex < 0 || saved.activeIndex > 5 || saved.records.length !== saved.activeIndex) {
      return { run: fresh, notice: '' };
    }
    const validRecords = saved.records.every((rec, i) => (
      rec && rec.levelId === saved.levelIds[i] && rec.version === saved.levelVersions[i] && CHOICES.has(rec.choice) && typeof rec.correct === 'boolean'
    ));
    if (!validRecords) return { run: fresh, notice: '' };

    const matchingRecords = [];
    let mismatchAt = -1;
    for (let i = 0; i < saved.records.length; i++) {
      const level = pack.levels[i];
      const rec = saved.records[i];
      if (!level || rec.levelId !== level.id || rec.version !== level.version) {
        mismatchAt = i;
        break;
      }
      matchingRecords.push({
        ...rec,
        correct: rec.choice === level.answer
      });
    }

    if (mismatchAt >= 0) {
      const activeIndex = matchingRecords.length;
      const status = activeIndex >= 5 ? 'completed' : 'ready';
      return {
        run: {
          ...fresh,
          mode: saved.mode || mode,
          status,
          activeIndex,
          viewIndex: activeIndex,
          revealStep: 0,
          records: matchingRecords,
          completedAt: status === 'completed' ? (saved.completedAt || new Date().toISOString()) : ''
        },
        notice: '关卡来源或内容已更新，未变更关卡的首次作答已保留，请继续完成当前关卡。'
      };
    }

    const activeIndex = matchingRecords.length;
    const isCompleted = activeIndex >= 5;
    let status = saved.status;
    let revealStep = Number.isInteger(saved.revealStep) ? saved.revealStep : 0;
    let viewIndex = Number.isInteger(saved.viewIndex) ? saved.viewIndex : activeIndex;

    if (isCompleted) {
      viewIndex = Math.max(0, Math.min(5, viewIndex));
      status = viewIndex < 5 ? 'resolved' : 'completed';
      revealStep = viewIndex < 5 ? 2 : 0;
    } else {
      viewIndex = Math.max(0, Math.min(activeIndex, viewIndex));
      if (viewIndex < activeIndex) {
        status = 'resolved';
        revealStep = 2;
      } else {
        status = 'ready';
        revealStep = 0;
      }
    }

    return {
      run: {
        ...fresh,
        mode: saved.mode || mode,
        status,
        activeIndex,
        viewIndex,
        revealStep,
        records: matchingRecords,
        completedAt: isCompleted ? (saved.completedAt || '') : ''
      },
      notice: ''
    };
  }

  function currentLevel(run, pack) {
    if (!run || !pack || !Array.isArray(pack.levels)) return null;
    if (run.viewIndex < 0 || run.viewIndex >= pack.levels.length) return null;
    return pack.levels[run.viewIndex];
  }

  function choose(run, pack, choice, levelId, now = new Date()) {
    if (!run || !pack || !CHOICES.has(choice)) return run;
    if (pack.state !== 'approved') return run;
    if (run.status !== 'ready' || run.viewIndex !== run.activeIndex || run.activeIndex >= 5) return run;
    if (run.records[run.activeIndex]) return run;
    const level = pack.levels[run.activeIndex];
    if (!level || level.id !== levelId) return run;

    const record = {
      levelId: level.id,
      version: level.version,
      choice,
      correct: choice === level.answer,
      lockedAt: now.toISOString()
    };
    return {
      ...run,
      status: 'revealing',
      revealStep: 1,
      records: [...run.records, record]
    };
  }

  function expandReveal(run) {
    if (!run || (run.status !== 'revealing' && run.status !== 'choice-locked')) return run;
    return {
      ...run,
      status: 'resolved',
      revealStep: 2
    };
  }

  function nextStep(run, now = new Date()) {
    if (!run) return run;
    if (run.viewIndex < run.activeIndex - 1) {
      const nextView = run.viewIndex + 1;
      return { ...run, viewIndex: nextView, status: 'resolved', revealStep: 2 };
    }
    if (run.viewIndex === run.activeIndex - 1) {
      const nextStatus = run.activeIndex >= 5 ? 'completed' : 'ready';
      return { ...run, viewIndex: run.activeIndex, status: nextStatus, revealStep: 0 };
    }
    if (run.viewIndex === run.activeIndex && run.records[run.activeIndex]) {
      const nextActive = run.activeIndex + 1;
      const done = nextActive >= 5;
      return {
        ...run,
        activeIndex: nextActive,
        viewIndex: nextActive,
        revealStep: 0,
        status: done ? 'completed' : 'ready',
        completedAt: done ? (run.completedAt || now.toISOString()) : ''
      };
    }
    return run;
  }

  function goToLevel(run, index) {
    if (!run || !Number.isInteger(index)) return run;
    if (index < 0 || index > 5) return run;
    if (index < run.records.length) {
      return { ...run, viewIndex: index, status: 'resolved', revealStep: 2 };
    }
    if (index === run.activeIndex) {
      const hasLockedFrontier = !!run.records[run.activeIndex];
      return {
        ...run,
        viewIndex: index,
        status: index >= 5 ? 'completed' : hasLockedFrontier ? 'resolved' : 'ready',
        revealStep: hasLockedFrontier ? 2 : 0
      };
    }
    return run;
  }

  function scoreOf(run) {
    if (!run || !Array.isArray(run.records)) return 0;
    return run.records.reduce((sum, rec) => sum + (rec?.correct ? 1 : 0), 0);
  }

  function scoreTier(score) {
    if (score >= 5) return { title: '五关全破', summary: '本次五个消费抉择全部判断一致，可以带走完整证据档案。' };
    if (score >= 4) return { title: '稳健判断', summary: '看穿了多数细节与反转，漏掉的那一关也值得收下识别线索。' };
    if (score >= 3) return { title: '过关斩将', summary: '识破了过半关键陷阱或隐藏好选择，错题里的线索能帮下次更省心。' };
    return { title: '真实试炼', summary: '这一局有不少反常识细节——答错不丢人，关键是现在看清了真实依据。' };
  }

  function unspoileredGrid(run) {
    return Array.from({ length: 5 }, (_, i) => {
      const rec = run?.records?.[i];
      if (!rec) return 'pending';
      return rec.correct ? 'hit' : 'miss';
    });
  }

  function buildShareText(pack, run, challengeUrl) {
    const score = scoreOf(run);
    const grid = unspoileredGrid(run).map(cell => (cell === 'hit' ? '🟩' : cell === 'miss' ? '⬜' : '▫️')).join('');
    return `不吃亏 · ${pack.title}\n成绩：${score}/5  ${grid}\n${pack.shareHook}\n同局挑战（无剧透）：${challengeUrl}`;
  }

  const api = {
    shanghaiDate,
    validate,
    resolveActivePack,
    startRun,
    restoreRun,
    currentLevel,
    choose,
    expandReveal,
    nextStep,
    goToLevel,
    scoreOf,
    scoreTier,
    unspoileredGrid,
    buildShareText
  };

  root.BuchikuiGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
