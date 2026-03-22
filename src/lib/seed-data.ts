import type { Post } from "./types";

// Seed posts with demo content — used for rendering before Firebase is connected
export const SEED_POSTS: Omit<Post, "id" | "createdAt" | "updatedAt">[] = [
  {
    slug: "strategic-mandala-quad-2-f8k2j",
    title: "The Strategic Mandala of Quad 2.0",
    titleHi: "क्वाड 2.0 का रणनीतिक मंडला",
    summary: "How New Delhi is redefining center-state relationships on a global scale through spiritual diplomacy and strategic autonomy.",
    summaryHi: "कैसे नई दिल्ली आध्यात्मिक कूटनीति और रणनीतिक स्वायत्तता के माध्यम से वैश्विक स्तर पर केंद्र-राज्य संबंधों को पुनर्परिभाषित कर रही है।",
    content: `<p class="text-xl font-newsreader italic mb-8">In the ancient art of statecraft, the mandala theory of Kautilya envisioned concentric circles of allies and adversaries. Today, the Quad represents a modern mandala — a strategic geometry reshaping the Indo-Pacific.</p>

<h2>The New Geometry of Power</h2>
<p>The Quadrilateral Security Dialogue has evolved far beyond its origins as a tsunami-relief coordination mechanism. In 2026, it stands as the most significant multilateral framework in the Indo-Pacific, with India at its strategic center.</p>

<p>Prime Minister's vision of a "free, open, and inclusive Indo-Pacific" has found resonance across capitals from Canberra to Washington. But what makes Quad 2.0 distinctly different from its predecessor is the incorporation of civilizational soft power alongside hard security frameworks.</p>

<h2>Digital Dharma: The Tech Pillar</h2>
<p>The Quad's technology working group has emerged as a counter-narrative to the Digital Silk Road. India's UPI, Japan's robotics expertise, Australia's critical minerals, and American semiconductor prowess form what analysts call the "Silicon Mandala" — a tech ecosystem built on democratic values.</p>

<h2>The Ancient Meets the Algorithm</h2>
<p>What distinguishes India's approach is the conscious blending of ancient strategic wisdom with modern geopolitical calculus. The concept of "Vasudhaiva Kutumbakam" (the world is one family) isn't just rhetoric — it's being operationalized through the Global South leadership framework.</p>

<blockquote>"The Quad is not against anyone. It is for something — for a rules-based order rooted in dharmic principles of fairness and mutual respect."</blockquote>

<h2>Looking Ahead: The 2027 Horizon</h2>
<p>As the Quad prepares for its annual summit, the agenda has expanded to include AI governance, space cooperation, climate resilience, and pandemic preparedness. The mandala is expanding, and at its center, India is learning to be comfortable with centrality — a role its civilizational history prepared it for, but its post-colonial modesty had avoided.</p>`,
    contentHi: `<p class="text-xl font-newsreader italic mb-8">राजनीति की प्राचीन कला में, कौटिल्य के मंडला सिद्धांत ने सहयोगियों और विरोधियों के संकेंद्रित वृत्तों की परिकल्पना की थी। आज, क्वाड एक आधुनिक मंडला का प्रतिनिधित्व करता है — एक रणनीतिक ज्यामिति जो हिंद-प्रशांत को नया आकार दे रही है।</p>

<h2>शक्ति की नई ज्यामिति</h2>
<p>चतुर्भुज सुरक्षा वार्ता अपने सुनामी-राहत समन्वय तंत्र के रूप में उत्पत्ति से बहुत आगे विकसित हो चुकी है। 2026 में, यह हिंद-प्रशांत में सबसे महत्वपूर्ण बहुपक्षीय ढांचे के रूप में खड़ी है, जिसके रणनीतिक केंद्र में भारत है।</p>

<h2>डिजिटल धर्म: तकनीकी स्तंभ</h2>
<p>क्वाड के प्रौद्योगिकी कार्य समूह ने डिजिटल सिल्क रोड के लिए एक प्रति-कथा के रूप में उभरा है। भारत का UPI, जापान की रोबोटिक्स विशेषज्ञता, ऑस्ट्रेलिया के महत्वपूर्ण खनिज, और अमेरिकी सेमीकंडक्टर कौशल मिलकर "सिलिकॉन मंडला" बनाते हैं।</p>

<h2>आगे देखते हुए</h2>
<p>जैसे-जैसे क्वाड अपने वार्षिक शिखर सम्मेलन की तैयारी करता है, एजेंडा AI शासन, अंतरिक्ष सहयोग, जलवायु लचीलापन और महामारी तैयारी को शामिल करने के लिए विस्तारित हो गया है।</p>`,
    category: "Geopolitics",
    section: "Neo Bharat",
    author: "Aditya Vani",
    authorRole: "admin",
    imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bbaa?w=1200",
    status: "published",
    tags: ["quad", "indo-pacific", "geopolitics", "diplomacy"],
    readingTimeMin: 6,
    reactions: { fire: 342, india: 891, bulb: 156, clap: 267 },
    viewCount: 15420,
  },
  {
    slug: "silk-routes-silicon-spies-a9m3x",
    title: "Silk Routes & Silicon Spies",
    titleHi: "सिल्क रूट और सिलिकॉन जासूस",
    summary: "The intelligence war behind China's Belt and Road Initiative and India's counter-strategy through the IMEC corridor.",
    summaryHi: "चीन की बेल्ट एंड रोड पहल और IMEC गलियारे के माध्यम से भारत की प्रति-रणनीति के पीछे खुफिया युद्ध।",
    content: `<p>The modern Silk Road isn't paved with silk — it's built with fiber optic cables, surveillance tech, and debt diplomacy. India's counter-move through the India-Middle East-Europe Economic Corridor represents the most ambitious infrastructure play since independence.</p>

<h2>The Cable War</h2>
<p>Beneath the ocean floors, a silent war for data sovereignty rages. Undersea cables carry 97% of intercontinental data, and the race to control these digital arteries has become the defining geopolitical contest of our era.</p>

<h2>IMEC: India's Masterstroke</h2>
<p>The India-Middle East-Europe Economic Corridor isn't just an infrastructure project — it's a civilizational bridge connecting the cradle of democracy with the engines of modernity, through the crossroads of ancient trade routes.</p>`,
    contentHi: `<p>आधुनिक सिल्क रोड रेशम से नहीं बनी है — यह फाइबर ऑप्टिक केबल, निगरानी तकनीक और कर्ज कूटनीति से बनी है।</p>`,
    category: "IR",
    section: "Neo Bharat",
    author: "Meera Iyer",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
    status: "published",
    tags: ["belt-and-road", "IMEC", "intelligence", "infrastructure"],
    readingTimeMin: 5,
    reactions: { fire: 198, india: 567, bulb: 234, clap: 145 },
    viewCount: 8930,
  },
  {
    slug: "bhagavad-gita-productivity-manual-k7p2q",
    title: "Why the Bhagavad Gita is the Ultimate Productivity Manual",
    titleHi: "भगवद्गीता क्यों सर्वश्रेष्ठ उत्पादकता पुस्तिका है",
    summary: "Ancient wisdom meets modern hustle culture. How Nishkama Karma can cure your burnout better than any Silicon Valley biohack.",
    summaryHi: "प्राचीन ज्ञान आधुनिक हसल संस्कृति से मिलता है। कैसे निष्काम कर्म सिलिकॉन वैली के किसी भी बायोहैक से बेहतर आपकी बर्नआउट का इलाज कर सकता है।",
    content: `<p class="text-xl font-newsreader italic mb-8">Before there was "Deep Work" by Cal Newport, before "Atomic Habits" by James Clear, before the Pomodoro Technique — there was Chapter 2, Verse 47 of the Bhagavad Gita.</p>

<h2>Nishkama Karma: The OG Flow State</h2>
<p>"Karmanye vadhikaraste Ma Phaleshu Kadachana" — You have a right to perform your actions, but you are not entitled to the fruits of the actions. This isn't just philosophy. This is the most sophisticated productivity framework ever devised.</p>

<h2>Why GenZ Needs This</h2>
<p>In an era of anxiety-driven hustle culture, where every LinkedIn post screams "grindset" and every Instagram story flexes achievements, the Gita offers a radical counter-narrative: detach from outcomes, attach to process.</p>

<h2>The Science Behind It</h2>
<p>Modern psychology calls it "process orientation" vs "outcome orientation." Mihaly Csikszentmihalyi called it "flow." The Gita called it "yoga" — literally meaning "union" with your work.</p>`,
    contentHi: `<p class="text-xl font-newsreader italic mb-8">कैल न्यूपोर्ट की "डीप वर्क" से पहले, जेम्स क्लियर की "एटॉमिक हैबिट्स" से पहले — भगवद्गीता का अध्याय 2, श्लोक 47 था।</p>

<h2>निष्काम कर्म: मूल फ्लो स्टेट</h2>
<p>"कर्मण्येवाधिकारस्ते मा फलेषु कदाचन" — यह सिर्फ दर्शन नहीं है। यह अब तक तैयार किया गया सबसे परिष्कृत उत्पादकता ढांचा है।</p>`,
    category: "GenZ",
    section: "Trending",
    author: "Arjun Kapil",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200",
    status: "published",
    tags: ["gita", "productivity", "genz", "ancient-wisdom", "mental-health"],
    readingTimeMin: 4,
    reactions: { fire: 1240, india: 2100, bulb: 890, clap: 670 },
    viewCount: 45000,
  },
  {
    slug: "direct-citizen-dissent-platforms-r4n8w",
    title: "Direct Citizen Dissent Platforms",
    titleHi: "प्रत्यक्ष नागरिक असंतोष मंच",
    summary: "How decentralized technology is enabling new forms of democratic participation beyond the ballot box.",
    summaryHi: "विकेंद्रीकृत तकनीक मतपेटी से परे लोकतांत्रिक भागीदारी के नए रूपों को कैसे सक्षम कर रही है।",
    content: `<p>Democracy is evolving. The ancient Athenian agora has found a digital reincarnation in blockchain-powered citizen platforms that enable direct participation in governance — from local panchayats to national policy debates.</p>

<h2>The Indian Experiment</h2>
<p>India's "Digital Loktantra" initiative has created the world's largest participatory democracy platform, where 200 million citizens actively vote on policy proposals, submit grievances, and shape legislation.</p>`,
    contentHi: `<p>लोकतंत्र विकसित हो रहा है। प्राचीन एथेनियन अगोरा ने ब्लॉकचेन-संचालित नागरिक प्लेटफार्मों में एक डिजिटल पुनर्जन्म पाया है।</p>`,
    category: "Politics",
    section: "Neo Bharat",
    author: "Nandini Rao",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=1200",
    status: "published",
    tags: ["democracy", "blockchain", "civic-tech", "governance"],
    readingTimeMin: 4,
    reactions: { fire: 156, india: 423, bulb: 312, clap: 189 },
    viewCount: 6700,
  },
  {
    slug: "vedic-logic-quantum-age-m2k9p",
    title: "Vedic Logic in the Quantum Age",
    titleHi: "क्वांटम युग में वैदिक तर्क",
    summary: "How ancient Indian mathematical frameworks are influencing modern quantum computing research at IITs and beyond.",
    summaryHi: "कैसे प्राचीन भारतीय गणितीय ढांचे IITs और उससे आगे आधुनिक क्वांटम कंप्यूटिंग अनुसंधान को प्रभावित कर रहे हैं।",
    content: `<p>When researchers at IIT Madras published their breakthrough paper on "Paninian Grammar for Quantum Circuit Optimization," the world took notice. The intersection of ancient Indian logic systems with cutting-edge quantum computing isn't just poetic — it's producing real results.</p>

<h2>The Sanskrit Connection</h2>
<p>Panini's Ashtadhyayi, written 2,500 years ago, is the most sophisticated formal grammar system in human history. Its rule-based structure mirrors the logic gates that power quantum circuits.</p>`,
    contentHi: `<p>जब IIT मद्रास के शोधकर्ताओं ने "क्वांटम सर्किट अनुकूलन के लिए पाणिनीय व्याकरण" पर अपना सफलतापूर्ण पेपर प्रकाशित किया, तो दुनिया ने ध्यान दिया।</p>`,
    category: "Tech",
    section: "Trending",
    author: "Arjun Kapil",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200",
    status: "published",
    tags: ["quantum", "vedic", "technology", "IIT", "research"],
    readingTimeMin: 5,
    reactions: { fire: 234, india: 678, bulb: 890, clap: 345 },
    viewCount: 12300,
  },
  {
    slug: "decentralized-dharma-dao-communities-t5v2n",
    title: "Decentralized Dharma: How DAOs are Rebuilding Local Communities",
    titleHi: "विकेंद्रीकृत धर्म: कैसे DAOs स्थानीय समुदायों का पुनर्निर्माण कर रहे हैं",
    summary: "From digital sanghas to blockchain-powered panchayats — Web3 meets ancient Indian community governance.",
    summaryHi: "डिजिटल संघों से ब्लॉकचेन-संचालित पंचायतों तक — Web3 प्राचीन भारतीय सामुदायिक शासन से मिलता है।",
    content: `<p>The concept of "sangha" — a community organized around shared principles — predates the internet by 2,500 years. Now, Decentralized Autonomous Organizations are essentially digital sanghas, and Indian developers are leading this convergence.</p>

<h2>The Panchayat Protocol</h2>
<p>A team of IIT Delhi graduates has built "PanchayatDAO" — a governance protocol that digitizes the 73rd Amendment's vision of grassroots democracy using smart contracts on the Polygon network.</p>`,
    contentHi: `<p>"संघ" की अवधारणा — साझा सिद्धांतों के आसपास संगठित समुदाय — इंटरनेट से 2,500 साल पुरानी है। अब, विकेंद्रीकृत स्वायत्त संगठन अनिवार्य रूप से डिजिटल संघ हैं।</p>`,
    category: "GenZ",
    section: "Main Feed",
    author: "Priya Sharma",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200",
    status: "published",
    tags: ["web3", "dao", "community", "blockchain", "panchayat"],
    readingTimeMin: 5,
    reactions: { fire: 456, india: 234, bulb: 567, clap: 123 },
    viewCount: 9800,
  },
  {
    slug: "modern-mandala-5g-guru-cartoon-h3j7y",
    title: "The Modern Mandala of the 5G Guru",
    titleHi: "5G गुरु का आधुनिक मंडला",
    summary: "Satirical commentary on India's digital paradox — where ancient gurus meet modern tech evangelists.",
    summaryHi: "भारत के डिजिटल विरोधाभास पर व्यंग्यात्मक टिप्पणी — जहां प्राचीन गुरु आधुनिक तकनीकी प्रचारकों से मिलते हैं।",
    content: `<p class="text-xl font-newsreader italic mb-8">In this week's Cartoon Mandala, we explore the curious convergence of tech evangelism and spiritual entrepreneurship in modern India.</p>

<p>The cartoon depicts a figure seated in lotus position atop a cell tower, conducting a Zoom satsang to thousands of followers while simultaneously launching an NFT collection of sacred mantras.</p>

<p>It's satire, yes — but barely. In a nation where a yoga guru runs one of the largest FMCG companies and a meditation app has more daily users than most news platforms, the line between spiritual guidance and tech startup culture has blurred beyond recognition.</p>`,
    contentHi: `<p class="text-xl font-newsreader italic mb-8">इस सप्ताह के कार्टून मंडला में, हम आधुनिक भारत में तकनीकी प्रचारवाद और आध्यात्मिक उद्यमशीलता के उत्सुक संगम का पता लगाते हैं।</p>`,
    category: "Cartoon Mandala",
    section: "Main Feed",
    author: "Aditya Vani",
    authorRole: "admin",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
    status: "published",
    tags: ["cartoon", "satire", "tech", "spirituality", "humor"],
    readingTimeMin: 3,
    reactions: { fire: 890, india: 345, bulb: 234, clap: 1200 },
    viewCount: 23000,
  },
  {
    slug: "silicon-saint-cartoon-q9w4m",
    title: "The Silicon Saint",
    titleHi: "सिलिकॉन संत",
    summary: "A satirical look at the new-age tech messiahs promising salvation through subscription models.",
    summaryHi: "सदस्यता मॉडल के माध्यम से मोक्ष का वादा करने वाले नए युग के तकनीकी मसीहाओं पर एक व्यंग्यात्मक नज़र।",
    content: `<p>This week's Cartoon Mandala presents "The Silicon Saint" — a figure who has achieved enlightenment through series funding and promises digital nirvana at just ₹999/month (annual plan recommended).</p>

<p>In the tradition of great Indian satirists, we hold a mirror to the cult of personality that has engulfed both Silicon Valley and Haridwar.</p>`,
    contentHi: `<p>इस सप्ताह का कार्टून मंडला "सिलिकॉन संत" प्रस्तुत करता है — एक ऐसी शख्सियत जिसने सीरीज फंडिंग के माध्यम से ज्ञान प्राप्त किया है।</p>`,
    category: "Cartoon Mandala",
    section: "Main Feed",
    author: "Aditya Vani",
    authorRole: "admin",
    imageUrl: "https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=1200",
    status: "published",
    tags: ["cartoon", "satire", "tech-culture", "startup"],
    readingTimeMin: 2,
    reactions: { fire: 567, india: 123, bulb: 345, clap: 890 },
    viewCount: 18500,
  },
  {
    slug: "global-south-soft-power-bharat-n6r1e",
    title: "Global South Soft Power: Bharat Leading the Multipolar World",
    titleHi: "ग्लोबल साउथ सॉफ्ट पावर: बहुध्रुवीय विश्व का नेतृत्व करता भारत",
    summary: "From G20 presidency to Voice of the Global South summit — how India is rewriting the rules of international diplomacy.",
    summaryHi: "G20 की अध्यक्षता से लेकर ग्लोबल साउथ शिखर सम्मेलन तक — कैसे भारत अंतर्राष्ट्रीय कूटनीति के नियमों को फिर से लिख रहा है।",
    content: `<p>The era of unipolarity is over. In its place, a new world order is emerging — one where the Global South, led by India, is no longer content to be a rule-taker but insists on being a rule-maker.</p>

<h2>The G20 Legacy</h2>
<p>India's G20 presidency wasn't just a diplomatic achievement — it was a civilizational statement. By hosting the summit at Pragati Maidan with Nalanda-inspired architecture, India signaled that modernity need not come at the cost of identity.</p>`,
    contentHi: `<p>एकध्रुवीयता का युग समाप्त हो गया है। इसके स्थान पर, एक नई विश्व व्यवस्था उभर रही है — जहां भारत के नेतृत्व में ग्लोबल साउथ अब नियम-स्वीकार करने वाला नहीं बल्कि नियम-बनाने वाला बनना चाहता है।</p>`,
    category: "IR",
    section: "Neo Bharat",
    author: "Meera Iyer",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
    status: "published",
    tags: ["global-south", "diplomacy", "G20", "multipolar", "soft-power"],
    readingTimeMin: 5,
    reactions: { fire: 445, india: 1230, bulb: 234, clap: 567 },
    viewCount: 14200,
  },
  {
    slug: "geopolitics-chai-tapri-cartoon-w8k3v",
    title: "Geopolitics of the Chai Tapri",
    titleHi: "चाय टपरी की भू-राजनीति",
    summary: "Where more policy is debated than in Parliament — the humble chai tapri as India's true democratic institution.",
    summaryHi: "जहां संसद से अधिक नीति पर बहस होती है — भारत की सच्ची लोकतांत्रिक संस्था के रूप में विनम्र चाय टपरी।",
    content: `<p class="text-xl font-newsreader italic mb-8">This cartoon captures the essence of Indian democracy — not in the hallowed halls of Parliament, but at the street-corner chai tapri where every citizen is a policy analyst.</p>

<p>Our illustration shows a chai wallah serving "diplomatic cutting chai" to representatives of the UN Security Council, while explaining India's position on the Ukraine crisis using only metaphors involving cricket and Bollywood.</p>`,
    contentHi: `<p class="text-xl font-newsreader italic mb-8">यह कार्टून भारतीय लोकतंत्र के सार को दर्शाता है — संसद के पवित्र हॉल में नहीं, बल्कि गली के कोने पर चाय टपरी पर जहां हर नागरिक एक नीति विश्लेषक है।</p>`,
    category: "Cartoon Mandala",
    section: "Trending",
    author: "Aditya Vani",
    authorRole: "admin",
    imageUrl: "https://images.unsplash.com/photo-1556740758-90de940ce450?w=1200",
    status: "published",
    tags: ["cartoon", "satire", "chai", "democracy", "humor"],
    readingTimeMin: 2,
    reactions: { fire: 1500, india: 2300, bulb: 400, clap: 1800 },
    viewCount: 35000,
  },
  {
    slug: "elections-2026-genz-voter-analysis-p3m7n",
    title: "Elections 2026: The GenZ Voter Manifesto",
    titleHi: "चुनाव 2026: जेनज़ी मतदाता घोषणापत्र",
    summary: "First-time voters want climate action, digital rights, and ancient governance models. Political parties are scrambling to catch up.",
    summaryHi: "पहली बार मतदाता जलवायु कार्रवाई, डिजिटल अधिकार और प्राचीन शासन मॉडल चाहते हैं। राजनीतिक दल पकड़ने के लिए हाथ-पैर मार रहे हैं।",
    content: `<p>The 2026 state elections will be remembered as the "GenZ Election." For the first time, voters aged 18-25 constitute 22% of the electorate, and their demands are unlike anything traditional political parties have encountered.</p>

<h2>The Unexpected Demands</h2>
<p>GenZ voters don't fit neatly into the traditional left-right spectrum. They want aggressive climate policy AND economic growth. Digital privacy AND Aadhaar-linked services. Modern governance AND sabha-style community decision-making.</p>`,
    contentHi: `<p>2026 के राज्य चुनावों को "जेनज़ी चुनाव" के रूप में याद किया जाएगा। पहली बार, 18-25 आयु वर्ग के मतदाता मतदाताओं का 22% हैं।</p>`,
    category: "Politics",
    section: "Trending",
    author: "Nandini Rao",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=1200",
    status: "published",
    tags: ["elections", "genz", "voters", "democracy", "youth"],
    readingTimeMin: 4,
    reactions: { fire: 678, india: 890, bulb: 345, clap: 456 },
    viewCount: 21000,
  },
  {
    slug: "ancient-india-ai-ethics-framework-j2h8c",
    title: "Why Ancient India's Ethical Frameworks Should Guide AI Governance",
    titleHi: "क्यों प्राचीन भारत के नैतिक ढांचे को AI शासन का मार्गदर्शन करना चाहिए",
    summary: "From Dharmashastra to Digital Ethics — a case for civilizational wisdom in regulating artificial intelligence.",
    summaryHi: "धर्मशास्त्र से डिजिटल नैतिकता तक — कृत्रिम बुद्धिमत्ता को विनियमित करने में सभ्यतागत ज्ञान के लिए एक तर्क।",
    content: `<p>As the world grapples with AI regulation — from the EU's AI Act to America's executive orders — India has a unique civilizational advantage: thousands of years of formalized ethical reasoning.</p>

<h2>The Dharma Framework</h2>
<p>The concept of "svadharma" — contextual duty — provides a nuanced framework for AI ethics that Western utilitarian and deontological approaches lack. An AI system's "dharma" would depend on its context, purpose, and the relationships it serves.</p>`,
    contentHi: `<p>जब दुनिया AI विनियमन से जूझ रही है, भारत के पास एक अनूठा सभ्यतागत लाभ है: हजारों वर्षों का औपचारिक नैतिक तर्क।</p>`,
    category: "Ancient India",
    section: "Neo Bharat",
    author: "Priya Sharma",
    authorRole: "author",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200",
    status: "published",
    tags: ["AI", "ethics", "dharma", "ancient-india", "governance"],
    readingTimeMin: 6,
    reactions: { fire: 345, india: 567, bulb: 890, clap: 234 },
    viewCount: 11500,
  },
];

export function getSeedPostBySlug(slug: string) {
  return SEED_POSTS.find((p) => p.slug === slug) || null;
}

export function getSeedPostsByCategory(category: string) {
  return SEED_POSTS.filter((p) => p.category === category);
}

export function getFeaturedSeedPost() {
  return SEED_POSTS[0];
}
