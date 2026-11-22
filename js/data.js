// Original lesson content for learners aged 11-15.
// Words: [english, ipa, vietnamese]. Sentences: [english, vietnamese].
const TOPIC_SOURCE = [
  {
    id: "school", icon: "🏫", title: "School Life", vi: "Cuộc sống ở trường", color: "#4f7cff",
    words: [
      ["classmate", "/ˈklɑːsmeɪt/", "bạn cùng lớp"], ["homework", "/ˈhəʊmwɜːk/", "bài tập về nhà"],
      ["subject", "/ˈsʌbdʒɪkt/", "môn học"], ["science", "/ˈsaɪəns/", "khoa học"],
      ["library", "/ˈlaɪbrəri/", "thư viện"], ["exam", "/ɪɡˈzæm/", "kỳ thi"],
      ["timetable", "/ˈtaɪmteɪbl/", "thời khoá biểu"], ["uniform", "/ˈjuːnɪfɔːm/", "đồng phục"],
      ["teacher", "/ˈtiːtʃə/", "giáo viên"], ["break time", "/breɪk taɪm/", "giờ ra chơi"]
    ],
    sentences: [
      ["My favourite subject is science.", "Môn học yêu thích của mình là khoa học."],
      ["I have a math test tomorrow.", "Mai mình có bài kiểm tra toán."],
      ["Can I borrow your pen, please?", "Cho mình mượn cây bút được không?"],
      ["We usually play football at break time.", "Bọn mình thường đá bóng vào giờ ra chơi."],
      ["I finished my homework before dinner.", "Mình làm xong bài tập trước bữa tối."],
      ["Could you explain that again, please?", "Thầy/cô giải thích lại giúp em được không ạ?"]
    ]
  },
  {
    id: "hobbies", icon: "🎮", title: "Hobbies & Games", vi: "Sở thích và trò chơi", color: "#a35cff",
    words: [
      ["hobby", "/ˈhɒbi/", "sở thích"], ["video game", "/ˈvɪdiəʊ ɡeɪm/", "trò chơi điện tử"],
      ["drawing", "/ˈdrɔːɪŋ/", "vẽ tranh"], ["guitar", "/ɡɪˈtɑː/", "đàn ghi-ta"],
      ["level", "/ˈlevl/", "cấp độ, màn chơi"], ["team", "/tiːm/", "đội"],
      ["puzzle", "/ˈpʌzl/", "câu đố, trò ghép hình"], ["character", "/ˈkærəktə/", "nhân vật"],
      ["practice", "/ˈpræktɪs/", "luyện tập"], ["collection", "/kəˈlekʃn/", "bộ sưu tập"]
    ],
    sentences: [
      ["In my free time, I like drawing comics.", "Lúc rảnh mình thích vẽ truyện tranh."],
      ["I'm learning to play the guitar.", "Mình đang học chơi ghi-ta."],
      ["This level is really hard to beat.", "Màn này khó qua thật."],
      ["Do you want to play a game with me?", "Bạn có muốn chơi một ván với mình không?"],
      ["We won the match as a team.", "Bọn mình thắng trận nhờ cả đội."],
      ["I practise for thirty minutes every day.", "Mình luyện tập ba mươi phút mỗi ngày."]
    ]
  },
  {
    id: "sports", icon: "⚽", title: "Sports & Health", vi: "Thể thao và sức khoẻ", color: "#16a37f",
    words: [
      ["football", "/ˈfʊtbɔːl/", "bóng đá"], ["badminton", "/ˈbædmɪntən/", "cầu lông"],
      ["swimming", "/ˈswɪmɪŋ/", "bơi lội"], ["coach", "/kəʊtʃ/", "huấn luyện viên"],
      ["healthy", "/ˈhelθi/", "khoẻ mạnh"], ["exercise", "/ˈeksəsaɪz/", "tập thể dục"],
      ["score", "/skɔː/", "ghi điểm"], ["tired", "/ˈtaɪəd/", "mệt"],
      ["stretch", "/stretʃ/", "giãn cơ"], ["champion", "/ˈtʃæmpiən/", "nhà vô địch"]
    ],
    sentences: [
      ["I play badminton with my dad on Sundays.", "Chủ nhật mình chơi cầu lông với bố."],
      ["Our team scored three goals.", "Đội mình ghi được ba bàn."],
      ["Drinking water keeps you healthy.", "Uống nước giúp bạn khoẻ mạnh."],
      ["I'm too tired to run any more.", "Mình mệt quá không chạy nổi nữa."],
      ["Let's stretch before we start.", "Mình giãn cơ trước khi bắt đầu nhé."],
      ["She wants to be a swimming champion.", "Bạn ấy muốn trở thành nhà vô địch bơi lội."]
    ]
  },
  {
    id: "food", icon: "🍜", title: "Food & Drinks", vi: "Đồ ăn và thức uống", color: "#ff8a3d",
    words: [
      ["breakfast", "/ˈbrekfəst/", "bữa sáng"], ["delicious", "/dɪˈlɪʃəs/", "ngon"],
      ["noodles", "/ˈnuːdlz/", "mì, phở, bún"], ["vegetables", "/ˈvedʒtəblz/", "rau củ"],
      ["snack", "/snæk/", "đồ ăn vặt"], ["spicy", "/ˈspaɪsi/", "cay"],
      ["juice", "/dʒuːs/", "nước ép"], ["chicken", "/ˈtʃɪkɪn/", "thịt gà"],
      ["dessert", "/dɪˈzɜːt/", "món tráng miệng"], ["hungry", "/ˈhʌŋɡri/", "đói"]
    ],
    sentences: [
      ["I usually have noodles for breakfast.", "Mình thường ăn phở hoặc bún vào bữa sáng."],
      ["This soup is a little too spicy.", "Món súp này hơi cay quá."],
      ["Can I have an orange juice, please?", "Cho mình một ly nước cam nhé."],
      ["My mum cooks the best fried chicken.", "Mẹ mình nấu gà rán ngon nhất."],
      ["I'm so hungry, let's eat now.", "Đói quá, mình ăn luôn đi."],
      ["Ice cream is my favourite dessert.", "Kem là món tráng miệng mình thích nhất."]
    ]
  },
  {
    id: "travel", icon: "✈️", title: "Travel & Places", vi: "Du lịch và địa điểm", color: "#0ea5e9",
    words: [
      ["airport", "/ˈeəpɔːt/", "sân bay"], ["passport", "/ˈpɑːspɔːt/", "hộ chiếu"],
      ["beach", "/biːtʃ/", "bãi biển"], ["museum", "/mjuˈziːəm/", "bảo tàng"],
      ["ticket", "/ˈtɪkɪt/", "vé"], ["hotel", "/həʊˈtel/", "khách sạn"],
      ["map", "/mæp/", "bản đồ"], ["mountain", "/ˈmaʊntən/", "núi"],
      ["souvenir", "/ˌsuːvəˈnɪə/", "quà lưu niệm"], ["direction", "/dəˈrekʃn/", "phương hướng"]
    ],
    sentences: [
      ["Excuse me, where is the train station?", "Xin lỗi, ga tàu ở đâu ạ?"],
      ["We went to the beach last summer.", "Hè năm ngoái nhà mình đi biển."],
      ["How much is a ticket to the museum?", "Vé vào bảo tàng bao nhiêu tiền ạ?"],
      ["I bought a souvenir for my best friend.", "Mình mua quà lưu niệm cho bạn thân."],
      ["Turn left at the next corner.", "Rẽ trái ở góc đường tiếp theo."],
      ["I'd love to visit Japan one day.", "Mình rất muốn một ngày được đến Nhật Bản."]
    ]
  },
  {
    id: "tech", icon: "📱", title: "Tech & Social Media", vi: "Công nghệ và mạng xã hội", color: "#ec4899",
    words: [
      ["smartphone", "/ˈsmɑːtfəʊn/", "điện thoại thông minh"], ["password", "/ˈpɑːswɜːd/", "mật khẩu"],
      ["download", "/ˌdaʊnˈləʊd/", "tải xuống"], ["message", "/ˈmesɪdʒ/", "tin nhắn"],
      ["video", "/ˈvɪdiəʊ/", "video"], ["online", "/ˌɒnˈlaɪn/", "trực tuyến"],
      ["screen", "/skriːn/", "màn hình"], ["battery", "/ˈbætəri/", "pin"],
      ["follow", "/ˈfɒləʊ/", "theo dõi"], ["upload", "/ˌʌpˈləʊd/", "tải lên"]
    ],
    sentences: [
      ["Never share your password with anyone.", "Đừng bao giờ chia sẻ mật khẩu với ai."],
      ["My phone battery is almost dead.", "Điện thoại mình sắp hết pin rồi."],
      ["I'll send you a message later.", "Lát nữa mình nhắn tin cho bạn."],
      ["We watched a funny video online.", "Bọn mình xem một video vui trên mạng."],
      ["Too much screen time hurts your eyes.", "Nhìn màn hình quá nhiều sẽ hại mắt."],
      ["Think before you post anything.", "Suy nghĩ kỹ trước khi đăng bất cứ thứ gì."]
    ]
  },
  {
    id: "friends", icon: "🤝", title: "Friends & Feelings", vi: "Bạn bè và cảm xúc", color: "#f59e0b",
    words: [
      ["friendly", "/ˈfrendli/", "thân thiện"], ["excited", "/ɪkˈsaɪtɪd/", "háo hức"],
      ["nervous", "/ˈnɜːvəs/", "lo lắng, hồi hộp"], ["proud", "/praʊd/", "tự hào"],
      ["funny", "/ˈfʌni/", "hài hước"], ["kind", "/kaɪnd/", "tốt bụng"],
      ["worried", "/ˈwʌrid/", "lo lắng"], ["surprised", "/səˈpraɪzd/", "ngạc nhiên"],
      ["helpful", "/ˈhelpfl/", "hay giúp đỡ"], ["birthday", "/ˈbɜːθdeɪ/", "sinh nhật"]
    ],
    sentences: [
      ["My best friend is really funny and kind.", "Bạn thân mình rất hài hước và tốt bụng."],
      ["I feel nervous before every exam.", "Mình thấy hồi hộp trước mỗi kỳ thi."],
      ["Thanks for helping me with this.", "Cảm ơn bạn đã giúp mình việc này."],
      ["Don't worry, everything will be fine.", "Đừng lo, mọi chuyện sẽ ổn thôi."],
      ["I'm so proud of you!", "Mình rất tự hào về bạn!"],
      ["Happy birthday! I hope you like the gift.", "Chúc mừng sinh nhật! Mong bạn thích món quà."]
    ]
  },
  {
    id: "future", icon: "🚀", title: "Dreams & Future", vi: "Ước mơ và tương lai", color: "#6366f1",
    words: [
      ["dream", "/driːm/", "ước mơ"], ["future", "/ˈfjuːtʃə/", "tương lai"],
      ["engineer", "/ˌendʒɪˈnɪə/", "kỹ sư"], ["doctor", "/ˈdɒktə/", "bác sĩ"],
      ["designer", "/dɪˈzaɪnə/", "nhà thiết kế"], ["university", "/ˌjuːnɪˈvɜːsəti/", "đại học"],
      ["goal", "/ɡəʊl/", "mục tiêu"], ["career", "/kəˈrɪə/", "sự nghiệp"],
      ["skill", "/skɪl/", "kỹ năng"], ["successful", "/səkˈsesfl/", "thành công"]
    ],
    sentences: [
      ["I want to be an engineer in the future.", "Sau này mình muốn trở thành kỹ sư."],
      ["My goal this year is to speak English well.", "Mục tiêu năm nay của mình là nói tiếng Anh tốt."],
      ["Learning new skills makes me stronger.", "Học kỹ năng mới làm mình mạnh mẽ hơn."],
      ["She hopes to study at a good university.", "Bạn ấy mong được học ở một trường đại học tốt."],
      ["Never give up on your dreams.", "Đừng bao giờ từ bỏ ước mơ."],
      ["Hard work is the key to success.", "Chăm chỉ là chìa khoá thành công."]
    ]
  }
];

export const TOPICS = TOPIC_SOURCE.map((t) => ({
  id: t.id, icon: t.icon, title: t.title, vi: t.vi, color: t.color,
  items: [
    ...t.words.map(([text, ipa, vi], i) => ({ id: `${t.id}-w${i}`, type: "word", text, ipa, vi, topic: t.id })),
    ...t.sentences.map(([text, vi], i) => ({ id: `${t.id}-s${i}`, type: "sentence", text, vi, topic: t.id }))
  ]
}));

// Sounds that Vietnamese learners often find hard. Each pair: [target, contrast].
const SOUND_SOURCE = [
  {
    id: "th", icon: "👅", title: "TH /θ/ & /ð/", vi: "Âm th",
    how: "Đặt đầu lưỡi giữa hai hàm răng, thổi hơi nhẹ. /θ/ (think) không rung cổ, /ð/ (this) có rung cổ. Không đọc thành \"t\", \"s\" hay \"d\".",
    pairs: [["think", "sink"], ["three", "tree"], ["thank", "tank"], ["mouth", "mouse"], ["they", "day"], ["then", "den"]],
    sentences: [["I think three is the right answer.", "Mình nghĩ ba là đáp án đúng."], ["They brought their brother with them.", "Họ dẫn theo anh trai của họ."]]
  },
  {
    id: "sh", icon: "🤫", title: "S /s/ vs SH /ʃ/", vi: "Âm s và sh",
    how: "/s/: lưỡi gần lợi trên, môi dẹt, tiếng xì nhẹ. /ʃ/: môi chu tròn ra trước, lưỡi lùi lại, tiếng \"suỵt\".",
    pairs: [["she", "see"], ["ship", "sip"], ["shoe", "sue"], ["shave", "save"], ["sheet", "seat"], ["wash", "was"]],
    sentences: [["She sells shells by the shore.", "Cô ấy bán vỏ sò bên bờ biển."], ["Please wash the dishes.", "Làm ơn rửa bát giúp nhé."]]
  },
  {
    id: "ii", icon: "🐑", title: "Long /iː/ vs short /ɪ/", vi: "I dài và i ngắn",
    how: "/iː/ (sheep): kéo dài, môi cười rộng. /ɪ/ (ship): ngắn, gọn, miệng thả lỏng hơn.",
    pairs: [["sheep", "ship"], ["leave", "live"], ["seat", "sit"], ["feet", "fit"], ["beat", "bit"], ["heel", "hill"]],
    sentences: [["The sheep is on the ship.", "Con cừu ở trên tàu."], ["Please take a seat and sit down.", "Mời bạn ngồi xuống ghế."]]
  },
  {
    id: "ae", icon: "🐱", title: "/æ/ vs /e/", vi: "Âm a bẹt và e",
    how: "/æ/ (cat): mở miệng rộng, hạ hàm, giống giữa \"a\" và \"e\". /e/ (bed): miệng mở vừa.",
    pairs: [["bad", "bed"], ["man", "men"], ["sad", "said"], ["pan", "pen"], ["had", "head"], ["bag", "beg"]],
    sentences: [["The man has a black bag.", "Người đàn ông có một chiếc túi đen."], ["My cat sat on the mat.", "Con mèo của mình ngồi trên tấm thảm."]]
  },
  {
    id: "rl", icon: "🌀", title: "R /r/ vs L /l/", vi: "Âm r và l",
    how: "/r/: cong lưỡi về sau, không chạm vòm miệng, môi hơi tròn. /l/: đầu lưỡi chạm lợi trên.",
    pairs: [["right", "light"], ["rock", "lock"], ["read", "lead"], ["rice", "lice"], ["road", "load"], ["fry", "fly"]],
    sentences: [["Turn right at the red light.", "Rẽ phải ở đèn đỏ."], ["I really like learning English.", "Mình thực sự thích học tiếng Anh."]]
  },
  {
    id: "final", icon: "🔚", title: "Final sounds", vi: "Âm cuối",
    how: "Người Việt hay nuốt âm cuối. Bật nhẹ các âm /t/, /d/, /k/, /s/, /z/ ở cuối từ để người nghe phân biệt được nghĩa.",
    pairs: [["cat", "cap"], ["bike", "bite"], ["cards", "car"], ["rice", "rise"], ["played", "play"], ["books", "book"]],
    sentences: [["I like cats and dogs.", "Mình thích chó và mèo."], ["She watched two movies last night.", "Tối qua bạn ấy xem hai bộ phim."]]
  },
  {
    id: "vw", icon: "🦇", title: "V /v/ vs W /w/", vi: "Âm v và w",
    how: "/v/: răng trên chạm môi dưới, rung cổ. /w/: chu tròn môi như nói \"u\", không chạm răng.",
    pairs: [["very", "wary"], ["vest", "west"], ["vine", "wine"], ["vet", "wet"], ["verse", "worse"], ["vow", "wow"]],
    sentences: [["We visit the village every week.", "Tuần nào bọn mình cũng về làng."], ["Very well, we will wait.", "Được rồi, chúng tôi sẽ đợi."]]
  },
  {
    id: "z", icon: "🐝", title: "Z /z/ vs S /s/", vi: "Âm z và s",
    how: "/z/ giống /s/ nhưng có rung cổ họng, như tiếng ong \"zzz\". Đặt tay lên cổ để cảm nhận độ rung.",
    pairs: [["zoo", "sue"], ["zip", "sip"], ["prize", "price"], ["eyes", "ice"], ["lazy", "lacy"], ["buzz", "bus"]],
    sentences: [["The zoo is busy on Sundays.", "Sở thú đông vào chủ nhật."], ["She won a prize at the quiz.", "Bạn ấy đoạt giải trong cuộc thi đố vui."]]
  }
];

export const SOUNDS = SOUND_SOURCE.map((s) => ({
  id: s.id, icon: s.icon, title: s.title, vi: s.vi, how: s.how,
  pairs: s.pairs,
  items: [
    ...s.pairs.map(([text, contrast], i) => ({ id: `snd-${s.id}-w${i}`, type: "word", text, contrast, vi: `Phân biệt với "${contrast}"`, topic: `snd-${s.id}` })),
    ...s.sentences.map(([text, vi], i) => ({ id: `snd-${s.id}-s${i}`, type: "sentence", text, vi, topic: `snd-${s.id}` }))
  ]
}));

// Role-play: bot lines and suggested replies the learner can say.
export const ROLEPLAYS = [
  {
    id: "new-classmate", icon: "👋", title: "New classmate", vi: "Làm quen bạn mới",
    intro: "Có một bạn mới chuyển đến lớp. Hãy làm quen nhé!",
    turns: [
      { bot: ["Hi! I'm new here. My name is Alex.", "Chào! Mình mới đến. Mình tên Alex."], replies: [["Hi Alex, nice to meet you. I'm Minh.", "Chào Alex, rất vui được gặp bạn. Mình là Minh."], ["Hello, welcome to our class!", "Xin chào, chào mừng bạn đến lớp mình!"]] },
      { bot: ["Where do you sit?", "Bạn ngồi ở đâu?"], replies: [["I sit next to the window.", "Mình ngồi cạnh cửa sổ."], ["You can sit with me.", "Bạn có thể ngồi với mình."]] },
      { bot: ["What's your favourite subject?", "Bạn thích môn gì nhất?"], replies: [["I love English and math.", "Mình thích tiếng Anh và toán."], ["My favourite subject is art.", "Môn mình thích nhất là mỹ thuật."]] },
      { bot: ["Cool! What do you do after school?", "Hay đấy! Tan học bạn làm gì?"], replies: [["I usually play football with my friends.", "Mình thường đá bóng với bạn bè."], ["I go home and do my homework.", "Mình về nhà làm bài tập."]] },
      { bot: ["Can you show me the library later?", "Lát nữa bạn chỉ mình thư viện được không?"], replies: [["Sure, I'll show you at break time.", "Được chứ, giờ ra chơi mình chỉ cho."], ["Of course, let's go together.", "Tất nhiên, mình đi cùng nhau nhé."]] }
    ]
  },
  {
    id: "bubble-tea", icon: "🧋", title: "Ordering a drink", vi: "Gọi đồ uống",
    intro: "Bạn đang ở quán trà sữa khi đi du lịch nước ngoài.",
    turns: [
      { bot: ["Hi there! What can I get for you?", "Xin chào! Bạn muốn gọi gì?"], replies: [["Can I have a milk tea, please?", "Cho mình một ly trà sữa nhé."], ["I'd like a mango smoothie, please.", "Mình muốn một ly sinh tố xoài."]] },
      { bot: ["Sure. What size would you like?", "Được. Bạn muốn cỡ nào?"], replies: [["A large one, please.", "Cho mình cỡ lớn."], ["Medium, please.", "Cỡ vừa nhé."]] },
      { bot: ["Would you like less sugar or less ice?", "Bạn muốn ít đường hay ít đá không?"], replies: [["Less sugar, please.", "Ít đường giúp mình."], ["No ice, please.", "Không đá nhé."]] },
      { bot: ["That's four dollars. Cash or card?", "Bốn đô. Tiền mặt hay thẻ?"], replies: [["Cash, please. Here you are.", "Tiền mặt. Gửi bạn."], ["Can I pay by card?", "Mình trả bằng thẻ được không?"]] },
      { bot: ["Here's your drink. Have a nice day!", "Đồ uống của bạn đây. Chúc một ngày vui!"], replies: [["Thank you, you too!", "Cảm ơn, bạn cũng vậy nhé!"], ["Thanks a lot, bye!", "Cảm ơn nhiều, tạm biệt!"]] }
    ]
  },
  {
    id: "directions", icon: "🗺️", title: "Asking for directions", vi: "Hỏi đường",
    intro: "Bạn bị lạc ở một thành phố lạ và cần tìm bảo tàng.",
    turns: [
      { bot: ["You look lost. Can I help you?", "Trông bạn như bị lạc. Tôi giúp được gì không?"], replies: [["Yes, please. Where is the museum?", "Vâng ạ. Bảo tàng ở đâu ạ?"], ["Excuse me, how can I get to the museum?", "Xin lỗi, làm sao để đến bảo tàng ạ?"]] },
      { bot: ["Go straight and turn left at the bank.", "Đi thẳng rồi rẽ trái ở ngân hàng."], replies: [["Go straight and turn left. Got it.", "Đi thẳng rồi rẽ trái. Cháu hiểu rồi."], ["Sorry, could you say that again?", "Xin lỗi, cô nói lại được không ạ?"]] },
      { bot: ["It's about ten minutes on foot.", "Đi bộ khoảng mười phút."], replies: [["Is there a bus I can take?", "Có xe buýt nào cháu đi được không ạ?"], ["Great, I'll walk there.", "Tuyệt, cháu sẽ đi bộ."]] },
      { bot: ["Bus number five stops right there.", "Xe buýt số năm dừng ngay đó."], replies: [["Thank you so much for your help.", "Cảm ơn cô rất nhiều."], ["Thanks, that's very kind of you.", "Cảm ơn, cô thật tốt bụng."]] }
    ]
  },
  {
    id: "gaming", icon: "🕹️", title: "Gaming with a friend", vi: "Chơi game cùng bạn",
    intro: "Bạn đang chơi game online với một người bạn nước ngoài.",
    turns: [
      { bot: ["Hey! Are you ready for the next match?", "Ê! Sẵn sàng cho trận tiếp chưa?"], replies: [["Yes, I'm ready. Let's go!", "Rồi, mình sẵn sàng. Đi thôi!"], ["Wait a minute, I need to change my character.", "Đợi chút, mình cần đổi nhân vật."]] },
      { bot: ["Which role do you want to play?", "Bạn muốn chơi vai trò nào?"], replies: [["I'll be the healer this time.", "Lần này mình làm người hồi máu."], ["I want to attack from the front.", "Mình muốn tấn công tuyến đầu."]] },
      { bot: ["Watch out! Enemies on the left!", "Cẩn thận! Địch bên trái!"], replies: [["I see them. Cover me!", "Thấy rồi. Yểm trợ mình!"], ["Thanks, I'm moving back.", "Cảm ơn, mình lùi lại đây."]] },
      { bot: ["We won! That was awesome!", "Thắng rồi! Đỉnh quá!"], replies: [["Good game! You played really well.", "Trận hay! Bạn chơi giỏi thật."], ["Yes! Great teamwork!", "Yeah! Phối hợp tuyệt vời!"]] },
      { bot: ["Want to play again tomorrow?", "Mai chơi tiếp không?"], replies: [["Sure, but after I finish my homework.", "Được, nhưng sau khi mình làm xong bài tập."], ["Maybe on the weekend. See you!", "Chắc cuối tuần nhé. Hẹn gặp lại!"]] }
    ]
  },
  {
    id: "weekend", icon: "🌤️", title: "Talking about the weekend", vi: "Kể về cuối tuần",
    intro: "Thứ Hai đến rồi, cô giáo hỏi về cuối tuần của bạn.",
    turns: [
      { bot: ["Good morning! How was your weekend?", "Chào buổi sáng! Cuối tuần của em thế nào?"], replies: [["It was great, thank you.", "Rất vui ạ, cảm ơn cô."], ["It was a bit boring, but okay.", "Hơi chán một chút, nhưng cũng ổn ạ."]] },
      { bot: ["What did you do?", "Em đã làm gì?"], replies: [["I visited my grandparents.", "Em về thăm ông bà."], ["I went to the cinema with my family.", "Em đi xem phim với gia đình."]] },
      { bot: ["That sounds nice. Did you enjoy it?", "Nghe hay đấy. Em có thích không?"], replies: [["Yes, I really enjoyed it.", "Có ạ, em rất thích."], ["Yes, it was a lot of fun.", "Có ạ, rất vui."]] },
      { bot: ["What are you going to do next weekend?", "Cuối tuần tới em định làm gì?"], replies: [["I'm going to play badminton.", "Em sẽ chơi cầu lông."], ["I'm going to study for my exam.", "Em sẽ ôn thi."]] }
    ]
  },
  {
    id: "sneakers", icon: "👟", title: "Buying sneakers", vi: "Mua giày thể thao",
    intro: "Bạn vào cửa hàng để mua một đôi giày mới.",
    turns: [
      { bot: ["Hello! Are you looking for anything special?", "Chào bạn! Bạn tìm gì đặc biệt không?"], replies: [["I'm looking for some running shoes.", "Mình đang tìm giày chạy bộ."], ["Just looking, thanks.", "Mình chỉ xem thôi, cảm ơn."]] },
      { bot: ["What size do you wear?", "Bạn đi cỡ bao nhiêu?"], replies: [["Size thirty eight, please.", "Cỡ ba mươi tám."], ["I'm not sure. Can you check?", "Mình không chắc. Bạn đo giúp được không?"]] },
      { bot: ["Here you go. How do they feel?", "Đây bạn. Đi thấy thế nào?"], replies: [["They feel comfortable.", "Đi thấy thoải mái."], ["They're a little too small.", "Hơi chật một chút."]] },
      { bot: ["They're on sale for fifty dollars.", "Đang giảm giá còn năm mươi đô."], replies: [["Great, I'll take them.", "Tuyệt, mình lấy đôi này."], ["Do you have them in black?", "Có màu đen không bạn?"]] }
    ]
  }
];

export const ALL_ITEMS = [...TOPICS.flatMap((t) => t.items), ...SOUNDS.flatMap((s) => s.items)];

export function findItem(id) {
  return ALL_ITEMS.find((i) => i.id === id) || null;
}
