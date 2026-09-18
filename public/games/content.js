// Nội dung tĩnh cho Word Quest + Puzzle Detective (song ngữ vi/en).
// Treasure sinh câu hỏi bằng code (xem treasure.js).

export const WQ_SENTENCES = [
  // Zone 1 · 3 từ
  { zone: 1, words: ['The', 'cat', 'sleeps'], vi: 'Con mèo ngủ.', en: 'The cat sleeps.' },
  { zone: 1, words: ['I', 'like', 'dogs'], vi: 'Tớ thích chó.', en: 'I like dogs.' },
  { zone: 1, words: ['We', 'play', 'ball'], vi: 'Chúng tớ chơi bóng.', en: 'We play ball.' },
  { zone: 1, words: ['She', 'is', 'happy'], vi: 'Cô bé vui.', en: 'She is happy.' },
  // Zone 2 · 4 từ
  { zone: 2, words: ['The', 'dog', 'is', 'running'], vi: 'Con chó đang chạy.', en: 'The dog is running.' },
  { zone: 2, words: ['My', 'mom', 'reads', 'books'], vi: 'Mẹ tớ đọc sách.', en: 'My mom reads books.' },
  { zone: 2, words: ['The', 'sun', 'is', 'bright'], vi: 'Mặt trời thật sáng.', en: 'The sun is bright.' },
  { zone: 2, words: ['He', 'has', 'two', 'cats'], vi: 'Cậu ấy có hai con mèo.', en: 'He has two cats.' },
  // Zone 3 · 5 từ
  { zone: 3, words: ['We', 'walk', 'to', 'school', 'together'], vi: 'Chúng tớ cùng đi bộ đến trường.', en: 'We walk to school together.' },
  { zone: 3, words: ['The', 'bird', 'sings', 'a', 'song'], vi: 'Chim hót một bài hát.', en: 'The bird sings a song.' },
  { zone: 3, words: ['I', 'can', 'see', 'the', 'moon'], vi: 'Tớ thấy mặt trăng.', en: 'I can see the moon.' },
  { zone: 3, words: ['She', 'drinks', 'milk', 'every', 'morning'], vi: 'Cô bé uống sữa mỗi sáng.', en: 'She drinks milk every morning.' },
  // Zone 4 · 6 từ
  { zone: 4, words: ['Yesterday', 'we', 'played', 'in', 'the', 'park'], vi: 'Hôm qua chúng tớ chơi trong công viên.', en: 'Yesterday we played in the park.' },
  { zone: 4, words: ['My', 'brother', 'wants', 'a', 'new', 'bicycle'], vi: 'Em trai tớ muốn một chiếc xe đạp mới.', en: 'My brother wants a new bicycle.' },
  { zone: 4, words: ['The', 'little', 'fish', 'swims', 'very', 'fast'], vi: 'Con cá nhỏ bơi rất nhanh.', en: 'The little fish swims very fast.' },
  { zone: 4, words: ['They', 'are', 'eating', 'ice', 'cream', 'now'], vi: 'Các bạn ấy đang ăn kem.', en: 'They are eating ice cream now.' },
  // Zone 5 · 7 từ
  { zone: 5, words: ['Every', 'morning', 'the', 'rooster', 'crows', 'very', 'loudly'], vi: 'Mỗi sáng gà trống gáy rất to.', en: 'Every morning the rooster crows very loudly.' },
  { zone: 5, words: ['My', 'best', 'friend', 'always', 'shares', 'her', 'toys'], vi: 'Bạn thân của tớ luôn chia sẻ đồ chơi.', en: 'My best friend always shares her toys.' },
  { zone: 5, words: ['We', 'watched', 'a', 'funny', 'movie', 'last', 'night'], vi: 'Tối qua chúng tớ xem một phim hài.', en: 'We watched a funny movie last night.' },
  { zone: 5, words: ['The', 'old', 'turtle', 'walks', 'to', 'the', 'pond'], vi: 'Con rùa già đi về phía cái ao.', en: 'The old turtle walks to the pond.' },
];

// Mỗi vụ án: suspects (3, theo thứ tự hiển thị), clues[{who: chỉ số nghi phạm,
// flag: manh mối then chốt — viền vàng}], steps[{q, options (đúng 1 mục
// correct), hint}], culprit (chỉ số thủ phạm), nudge (gợi ý khi tố sai),
// closing (lời chúc mừng, cho phép <strong>). Mọi văn bản đều {vi, en}.
export const DETECTIVE_CASES = [
  {
    id: 'cookie',
    emoji: '🍪',
    title: { vi: 'Bánh quy mất tích', en: 'The Missing Cookie' },
    intro: {
      vi: 'Ai đó đã lấy miếng bánh quy cuối cùng trong bếp! Đọc từng manh mối rồi giúp mình <strong>suy luận</strong> nhé — mình không nói thủ phạm đâu, mình cùng tìm ra!',
      en: 'Someone took the last cookie from the kitchen! Read each clue and help me <strong>reason</strong> — I won\'t tell you who, we\'ll figure it out together!',
    },
    suspects: [
      { emoji: '🐶', name: 'Max' },
      { emoji: '🐱', name: 'Luna' },
      { emoji: '🐰', name: 'Bunny' },
    ],
    clues: [
      { who: 0, text: { vi: '“Tớ chơi ngoài sân suốt lúc đó.”', en: '"I was playing outside the whole time."' } },
      { who: 1, flag: true, text: { vi: '“Tớ thấy Bunny ở trong bếp.”', en: '"I saw Bunny in the kitchen."' } },
      { who: 2, flag: true, text: { vi: '“Tớ không hề vào bếp.”', en: '"I never went into the kitchen."' } },
    ],
    steps: [
      {
        q: { vi: 'Hai manh mối cuối đang mâu thuẫn nhau. Điều đó nói lên điều gì?', en: 'The last two clues disagree. What does that tell us?' },
        options: [
          { text: { vi: 'Hai chuyện không thể đồng thời đúng — có ai đó chưa nói thật', en: "Both can't be true — someone isn't telling the truth" }, correct: true },
          { text: { vi: 'Cả hai đều đúng', en: 'They both must be true' } },
          { text: { vi: 'Không nói lên điều gì cả', en: 'It tells us nothing' } },
        ],
        hint: { vi: 'Luna nói thấy Bunny ở bếp, còn Bunny nói không vào bếp — so hai câu này xem.', en: 'Luna says she saw Bunny in the kitchen, but Bunny says he never went in — compare the two.' },
      },
      {
        q: { vi: 'Nếu Luna nói thật, ai đã vào bếp?', en: 'If Luna is telling the truth, who was in the kitchen?' },
        options: [
          { text: { vi: 'Bunny', en: 'Bunny' }, correct: true },
          { text: { vi: 'Max', en: 'Max' } },
          { text: { vi: 'Không ai cả', en: 'Nobody' } },
        ],
        hint: { vi: 'Manh mối của Luna chỉ tên một bạn thôi đó.', en: "Luna's clue names just one friend." },
      },
    ],
    culprit: 2,
    nudge: { vi: 'Đọc lại lời của Bunny — nó mâu thuẫn với lời của ai nhỉ?', en: 'Read Bunny\'s words again — whose story do they clash with?' },
    closing: {
      vi: '🎉 <strong>Phá án thành công!</strong> Nhân chứng thấy Bunny ở bếp, còn Bunny lại chối — thủ phạm chính là <strong>Bunny</strong>! Bạn đã tự suy luận ra hết, thám tử!',
      en: '🎉 <strong>Case closed!</strong> A witness saw Bunny there, but Bunny denied it — the culprit is <strong>Bunny</strong>. You reasoned it all out yourself, detective!',
    },
  },
  {
    id: 'vase',
    emoji: '🏺',
    title: { vi: 'Lọ hoa vỡ', en: 'The Broken Vase' },
    intro: {
      vi: 'Chiếc lọ hoa bên cửa sổ bị vỡ vụn! Ba bạn nhỏ đều kể chuyện của mình. Cùng mình soi từng manh mối nhé!',
      en: 'The vase by the window is broken into pieces! All three friends told their story. Let\'s look at every clue!',
    },
    suspects: [
      { emoji: '🐈', name: 'Miu' },
      { emoji: '🐕', name: 'Lu' },
      { emoji: '🐦', name: 'Cu' },
    ],
    clues: [
      { who: 1, text: { vi: '“Lúc đó tớ đang đi dạo cùng bố — bố tớ xác nhận đó!”', en: '"I was out on a walk with dad — he confirms it!"' } },
      { who: 0, text: { vi: '“Tớ ngủ trên ghế sofa suốt buổi, Lu có thể làm chứng.”', en: '"I was asleep on the sofa the whole time, Lu can confirm."' } },
      { who: 2, flag: true, text: { vi: '“Lông vũ nhỏ nằm ngay cạnh mảnh lọ hoa…”', en: '"A small feather lies right next to the vase pieces…"' } },
    ],
    steps: [
      {
        q: { vi: 'Lu đi cùng bố, Miu ngủ trên sofa. Ai còn lại khả nghi nhất?', en: 'Lu was with dad, Miu was asleep. Who is left as a suspect?' },
        options: [
          { text: { vi: 'Cu', en: 'Cu' }, correct: true },
          { text: { vi: 'Lu', en: 'Lu' } },
          { text: { vi: 'Miu', en: 'Miu' } },
        ],
        hint: { vi: 'Hai bạn đã có người chứng kiến — còn ai chưa có bằng chứng ngoại phạm?', en: 'Two friends have witnesses — who is left without an alibi?' },
      },
      {
        q: { vi: 'Sợi lông vũ cạnh lọ hoa gợi ý thủ phạm là ai?', en: 'What does the feather by the vase hint at?' },
        options: [
          { text: { vi: 'Một con chim — rất có thể là Cu', en: 'A bird — very likely Cu' }, correct: true },
          { text: { vi: 'Một con mèo', en: 'A cat' } },
          { text: { vi: 'Không gợi ý gì cả', en: 'It hints at nothing' } },
        ],
        hint: { vi: 'Loại nào trong ba bạn có lông vũ nhỉ?', en: 'Which of the three friends has feathers?' },
      },
    ],
    culprit: 2,
    nudge: { vi: 'Suy nghĩ xem ai trong ba bạn để lại lông vũ?', en: 'Think — which of the three leaves feathers behind?' },
    closing: {
      vi: '🎉 <strong>Phá án thành công!</strong> Miu có người ngủ làm chứng, Lu đi cùng bố, còn <strong>Cu</strong> — bạn để lại lông vũ ngay hiện trường! Thám tử giỏi!',
      en: '🎉 <strong>Case closed!</strong> Miu was asleep, Lu was with dad, and <strong>Cu</strong> — the feather gave it away! Great detecting!',
    },
  },
  {
    id: 'teddy',
    emoji: '🧸',
    title: { vi: 'Gấu bông biến mất', en: 'The Missing Teddy' },
    intro: {
      vi: 'Gấu bông của Noka biến mất sau bữa trưa! Hóa ra có bạn cầm đi giấu. Tìm manh mối nào!',
      en: 'Noka\'s teddy bear vanished after lunch! Someone hid it. Let\'s hunt for clues!',
    },
    suspects: [
      { emoji: '👦', name: 'Tí' },
      { emoji: '👧', name: 'Noka' },
      { emoji: '🤖', name: 'Bee' },
    ],
    clues: [
      { who: 0, text: { vi: '“Tớ tập bóng đá ở sân trường cả buổi — huấn luyện viên biết điều đó.”', en: '"I was at soccer practice all afternoon — the coach knows."' } },
      { who: 2, text: { vi: '“Tớ đứng yên trên tủ sách từ 12h đến 14h, pin của tớ hết nên không di chuyển được.”', en: '"I stood still on the bookshelf from 12 to 2 — my battery was dead so I couldn\'t move."' } },
      { who: 1, flag: true, text: { vi: 'Dưới gầm giường có dấu chân đất nhỏ dẫn từ vườn vào phòng… và đất dính trên đôi giày màu hồng.', en: 'Small muddy footprints lead from the garden into the room… and there is mud on a pair of pink shoes.' } },
    ],
    steps: [
      {
        q: { vi: 'Tí có huấn luyện viên làm chứng, Bee hết pin không di chuyển được. Ai còn khả nghi?', en: 'Tí has the coach as a witness, Bee couldn\'t move. Who is left?' },
        options: [
          { text: { vi: 'Noka', en: 'Noka' }, correct: true },
          { text: { vi: 'Tí', en: 'Tí' } },
          { text: { vi: 'Bee', en: 'Bee' } },
        ],
        hint: { vi: 'Hai bạn kia có lý do rất chắc chắn — còn bạn nào thì chưa?', en: 'Two friends have solid alibis — who doesn\'t?' },
      },
      {
        q: { vi: 'Dấu chân đất và đôi giày hồng nói lên điều gì?', en: 'What do the muddy prints and the pink shoes tell us?' },
        options: [
          { text: { vi: 'Ai đi giày hồng đã từ vườn vào phòng — và giấu gấu ở đó', en: 'Whoever wore the pink shoes came in from the garden — and hid the teddy there' }, correct: true },
          { text: { vi: 'Gấu bông tự đi được', en: 'The teddy walked by itself' } },
          { text: { vi: 'Không nói lên điều gì', en: 'Nothing at all' } },
        ],
        hint: { vi: 'Trong ba bạn, ai hay mang giày màu hồng nhỉ?', en: 'Which of the three often wears pink shoes?' },
      },
    ],
    culprit: 1,
    nudge: { vi: 'Đôi giày màu hồng là của ai trong ba bạn?', en: 'Whose are the pink shoes among the three?' },
    closing: {
      vi: '🎉 <strong>Phá án thành công!</strong> <strong>Noka</strong> tự giấu gấu bông để chơi trốn tìm! Dấu chân đất và giày hồng đã tố chuyện. Thám tử xuất sắc!',
      en: '🎉 <strong>Case closed!</strong> <strong>Noka</strong> hid her own teddy to play a hiding game! The muddy prints and pink shoes gave it away. Excellent detecting!',
    },
  },
];
