(() => {
  'use strict';

  window.HaoAccountConfig = Object.freeze({
    enabled: true,
    billingEnabled: false,
    appName: '不吃亏',
    productCode: 'buchikui',
    supabaseUrl: 'https://blgwlycfcwvsupmqyqwn.supabase.co',
    supabasePublishableKey: 'sb_publishable_n1Va-c_alpkQ0zNuJYUaxA_J0u68RVW',
    redirectUrl: 'https://liuh886.github.io/buchikui/',
    mountSelectors: ['[data-account-slot]'],
    compactTrigger: true,
    title: {
      zh: '不吃亏账户',
      en: 'Buchikui account',
    },
    description: {
      zh: '阅读始终公开。登录只用于把你的真实消费经历补充到具体段落，交给编辑集中审核。',
      en: 'Reading stays public. Sign-in is only used to attach your real consumer experience to a specific passage for editorial review.',
    },
    privacyNote: {
      zh: '反馈不会自动公开，也不会直接改正文；只有经过编辑审核后，精华才会进入正式 CASE。请不要提交不必要的身份证号、手机号、订单号等个人信息。',
      en: 'Feedback is never published automatically or written directly into the guide. Editors review it before useful parts are incorporated. Avoid unnecessary personal identifiers.',
    },
    features: [
      { zh: '选中文字后补充亲身经历、纠错或流程细节', en: 'Attach lived experience, corrections, or process details to selected text' },
      { zh: '反馈只进入编辑收件箱，不形成公开评论区', en: 'Feedback goes to an editorial inbox, not a public comment thread' },
    ],
    feedbackEnabled: false,
  });
})();
