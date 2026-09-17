export const SUBJECTS = ['math', 'reading', 'english', 'science', 'curio'];

export const STRINGS = {
  vi: {
    tagline: 'Mình giúp bạn nghĩ — không chỉ trả lời',
    startOver: 'Bắt đầu lại',
    langToggle: 'EN',
    railTitle: 'Chủ đề',
    welcomeLead: 'Chào bạn! Mình là Sparkle ✨',
    welcomeBody: 'Mình sẽ không đưa đáp án ngay — mình giúp bạn <strong>tự tìm ra đáp án</strong> từng bước nhỏ, có hình minh họa dễ thương. Chọn một chủ đề hoặc hỏi mình bất cứ điều gì nhé!',
    inputPlaceholder: 'Hỏi mình bất cứ điều gì, ví dụ "25 + 17 = ?"',
    nextStep: 'Xem bước tiếp theo',
    needHint: 'Cho mình gợi ý',
    reveal: 'Mình làm thử rồi — xem đáp án',
    hintLead: 'Đây là gợi ý nhỏ nè…',
    hintGeneric1: 'Đọc lại chậm bước đang sáng lên. Nó đang hỏi mình làm gì đầu tiên?',
    hintGeneric2: 'Dùng hình minh họa phía trên — chỉ tay vào từng phần khi đếm hoặc đánh vần nhé.',
    allDone: 'Bạn đã đi hết các bước — tư duy tuyệt vời!',
    revealLead: 'Bạn đã thật lòng thử — đây là cách tất cả ghép lại với nhau:',
    tryAnother: 'Thử một câu khác nhé! Mình luôn sẵn sàng.',
    tryAgain: 'Gần rồi — chưa đúng lắm. Xem lại và thử lần nữa nhé!',
    judgeFail: 'Mình chưa đọc được câu trả lời — bạn thử nói theo cách khác nhé!',
    errorOnce: 'Ơ, Sparkle đang nghĩ lâu quá. Thử lại nhé!',
    retry: 'Thử lại',
    inputLabel: 'Nhập câu hỏi của bạn',
    sendAria: 'Gửi',
    signInTitle: 'Chào bố mẹ! 👋',
    signInBody: 'Đăng nhập một lần bằng Google để mở khóa Sparkle cho bé. Phiên sẽ được ghi nhớ trên thiết bị này.',
    signInPrivacy: 'Thông tin chỉ dùng để lưu hồ sơ học của bé trong gia đình bạn — không chia sẻ, không quảng cáo.',
    signInButton: 'Đăng nhập bằng Google',
    signOut: 'Đăng xuất',
    gateConfigError: 'Chưa cấu hình Firebase — xem public/firebase-config.js và README.',
    chooseProfile: 'Ai học hôm nay?',
    chooseProfileLead: 'Chọn hồ sơ của bé để bắt đầu nhé!',
    manageProfiles: 'Quản lý hồ sơ',
    addProfile: 'Tạo hồ sơ mới',
    profileNameLabel: 'Tên bé (biệt danh)',
    profileNamePlaceholder: 'VD: Bé Bi',
    ageBandLabel: 'Độ tuổi',
    ageBand6to8: '6–8 tuổi',
    ageBand9to12: '9–12 tuổi',
    saveProfile: 'Lưu hồ sơ',
    deleteProfile: 'Xóa hồ sơ',
    editProfile: 'Sửa',
    profilesMax: 'Tối đa 5 hồ sơ nhé!',
    switchProfile: 'Đổi hồ sơ',
    rateLimited: 'Sparkle cần nghỉ một chút nhé! Chờ tí rồi hỏi tiếp nha.',
    langAria: 'Đổi ngôn ngữ',
    cheers: ['Chính xác! Đúng rồi!', 'Bạn giỏi quá! 🎉', 'Chuẩn luôn — suy luận cực đỉnh!', 'Tuyệt vời, chính là thế!'],
    aidBlocks: 'Khối số — que cao là 10, khối nhỏ là 1',
    aidGroups: 'Nhóm chấm — đếm thử từng nhóm nhé',
    aidTiles: 'Ô chữ cái — ô vàng là nguyên âm (a, e, i, o, u, ơ, ư, â, ê, ô)',
    aidFlow: 'Các bước diễn ra theo trình tự',
    fallbackPlan: {
      intro: 'Mình chưa đọc được câu hỏi — nhưng cứ làm thám tử thôi! Trước hết hãy hiểu đề bài đã nhé.',
      steps: [
        { question: 'Đề bài đang hỏi mình phải tìm điều gì?', tip: 'Hãy đọc lại đề và nói lại bằng lời của bạn.' },
        { question: 'Mình đã biết những số hoặc manh mối nào?', tip: 'Gạch chân hoặc liệt kê chúng ra giấy.' },
        { question: 'Mình có thể làm gì với các số đó — cộng, bớt, chia hay nhóm?', tip: 'Nối câu chuyện của đề bài với một phép tính.' },
      ],
      answerLine: 'Hãy thử làm theo các bước trên rồi gửi cách nghĩ của bạn — mình sẽ cùng kiểm tra!',
    },
  },
  en: {
    tagline: 'I help you think — not just answer',
    startOver: 'Start over',
    langToggle: 'VI',
    railTitle: 'Subjects',
    welcomeLead: "Hi! I'm Sparkle ✨",
    welcomeBody: "I won't just give you answers — I'll help you <strong>figure them out</strong> with little steps and hints. Pick a subject, or just ask me anything!",
    inputPlaceholder: 'Ask me anything, like "How do I calculate 25 + 17?"',
    nextStep: 'Show next step',
    needHint: 'I need a hint',
    reveal: 'I tried — reveal the answer',
    hintLead: "Here's a little hint…",
    hintGeneric1: 'Read the highlighted step again slowly. What is it asking you to do first?',
    hintGeneric2: 'Try using the picture above. Point to each piece as you count or sound it out.',
    allDone: 'You worked through every step — amazing thinking!',
    revealLead: "You gave it a real try — here's how it all comes together:",
    tryAnother: "Want to try another one? I'm ready when you are!",
    tryAgain: 'So close — not quite yet. Take another look and try again!',
    judgeFail: "I couldn't quite read that — try saying it another way!",
    errorOnce: 'Oops, Sparkle is thinking too long. Try again!',
    retry: 'Try again',
    inputLabel: 'Type your question',
    sendAria: 'Send',
    signInTitle: "Hi parents! 👋",
    signInBody: 'Sign in once with Google to unlock Sparkle for your child. The device stays signed in.',
    signInPrivacy: 'Your info is only used to store your family profiles — never shared, no ads.',
    signInButton: 'Sign in with Google',
    signOut: 'Sign out',
    gateConfigError: 'Firebase is not configured — see public/firebase-config.js and README.',
    chooseProfile: "Who's learning today?",
    chooseProfileLead: 'Pick a profile to start!',
    manageProfiles: 'Manage profiles',
    addProfile: 'New profile',
    profileNameLabel: "Child's name (nickname)",
    profileNamePlaceholder: 'e.g. Mia',
    ageBandLabel: 'Age range',
    ageBand6to8: 'Ages 6–8',
    ageBand9to12: 'Ages 9–12',
    saveProfile: 'Save profile',
    deleteProfile: 'Delete profile',
    editProfile: 'Edit',
    profilesMax: 'Up to 5 profiles!',
    switchProfile: 'Switch profile',
    rateLimited: 'Sparkle needs a little rest! Wait a moment and ask again.',
    langAria: 'Change language',
    cheers: ["Yes! That's exactly right!", 'You got it! 🎉', 'Spot on — great reasoning!', 'Brilliant! That is correct!'],
    aidBlocks: 'Number blocks — tall rods are 10, small cubes are 1',
    aidGroups: 'Dot groups — try counting each group',
    aidTiles: 'Letter tiles — yellow ones are vowels (a, e, i, o, u)',
    aidFlow: 'The steps happen in this order',
    fallbackPlan: {
      intro: "I couldn't quite read that — but let's be thinking detectives anyway! First, let's understand the question.",
      steps: [
        { question: 'What is the question really asking you to find?', tip: 'Say it back in your own words.' },
        { question: 'What numbers or clues do we already know?', tip: 'Underline or list them.' },
        { question: 'What could we do with those numbers — add, take away, share, or group?', tip: 'Match the story to an action.' },
      ],
      answerLine: 'Try the steps above, then send me your thinking — I will check it with you!',
    },
  },
};

const SUBJECT_LABELS = {
  vi: { math: 'Toán', reading: 'Đọc & Viết', english: 'Tiếng Anh', science: 'Khoa học', curio: 'Tò mò' },
  en: { math: 'Math', reading: 'Reading', english: 'English', science: 'Science', curio: 'Curiosity' },
};

const PLACEHOLDERS = {
  vi: {
    math: 'Hỏi bài toán nhé, ví dụ "25 + 17 = ?"',
    reading: 'Hỏi đánh vần một từ nhé, ví dụ: đánh vần "hoa"',
    english: 'Hỏi tiếng Anh nhé, ví dụ "cat đánh vần thế nào?"',
    science: 'Hỏi khoa học nhé, ví dụ "Tại sao trời xanh?"',
    curio: 'Hỏi bất cứ điều bạn tò mò nhé!',
  },
  en: {
    math: 'Ask me a math question, like "How do I calculate 25 + 17?"',
    reading: 'Ask me to spell a word, like spell "rabbit"',
    english: 'Ask me English questions, like "How do you spell cat?"',
    science: 'Ask me a science question, like "Why is the sky blue?"',
    curio: "Ask me anything you're curious about!",
  },
};

const SUGGESTS = {
  vi: {
    math: ['25 + 17 = ?', '43 − 18 = ?', '6 × 4 = ?'],
    reading: ['Đánh vần "hoa"', 'Giúp mình đánh vần "mèo"', 'Đánh vần "bạn bè"'],
    english: ['Đánh vần "rabbit"', '"cat" nghĩa là gì?', 'Cách hỏi "Bạn tên gì?" tiếng Anh'],
    science: ['Tại sao trời lại màu xanh?', 'Mưa từ đâu ra?', 'Tại sao thuyền nổi được?'],
    curio: ['Tại sao mình nằm mơ?', 'Chim tìm đường bay bằng cách nào?', 'Vì sao phải đi ngủ?'],
  },
  en: {
    math: ['How do I calculate 25 + 17?', 'What is 43 − 18?', 'What is 6 × 4?'],
    reading: ['How do you spell "rabbit"?', 'Help me sound out "sunshine"', 'Spell "friend"'],
    english: ['How do you spell "cat"?', 'What does "hungry" mean?', 'How do I say "hello"?'],
    science: ['Why is the sky blue?', 'Where does rain come from?', 'Why do boats float?'],
    curio: ['Why do we dream?', 'How do birds know where to fly?', 'Why do we have to sleep?'],
  },
};

export function t(lang, key) {
  const L = STRINGS[lang] || STRINGS.vi;
  return L[key];
}

export function subjectLabel(lang, subject) {
  const L = SUBJECT_LABELS[lang] || SUBJECT_LABELS.vi;
  return L[subject];
}

export function placeholderFor(lang, subject) {
  return PLACEHOLDERS[lang][subject] || STRINGS[lang].inputPlaceholder;
}

export function suggestsFor(lang, subject) {
  return SUGGESTS[lang][subject] || SUGGESTS[lang].curio;
}
