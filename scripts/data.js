/**
 * The project list. Kept as a module rather than a fetched JSON file so the page
 * works from the filesystem as well as from a server, and so the tests can import
 * exactly what the page renders.
 */
const site = {
  "owner": "umer-78",
  "name": "Umer Hashmi",
  "tagline": "I build security tools, machine learning systems and applications that hold up when you put them through real tests.",
  "intro": "Every project below runs today. You'll find real output in the README, a test suite that catches regressions, and CI that proves it builds on a clean machine. Click through to the code.",
  "categories": [
    "Security & networking",
    "Machine learning & AI",
    "Data & analytics",
    "Applications & services",
    "Games & interactive"
  ],
  "projects": [
    {
      "name": "regex-engine",
      "title": "Rex",
      "category": "Security & networking",
      "language": "Python",
      "summary": "A regex engine I wrote from scratch: a parser, a backtracking matcher, Thompson's NFA and a lazy DFA over one pattern. Catastrophic backtracking becomes something you can measure, not just read about.",
      "highlights": ["On twenty characters, backtracking burns through 16,777,194 steps while the Thompson NFA needs only 592 — reproduce the gap yourself in the live demo", "Python's re module is a backtracking engine too: it takes 25 seconds on the same input at n=28", "The safety checker flags nested quantifiers and ambiguous alternations — the two patterns behind almost every reported ReDoS — and is honest about when it might be wrong", "217 tests, including a differential run of 600 random patterns against Python's re that caught a real bug in the DFA"],
      "topics": ["python", "regex", "nfa", "dfa", "redos", "security"],
      "demo": "https://umer-78.github.io/regex-engine/"
    },
    {
      "name": "route-planner",
      "title": "Route Planner",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Shortest and fastest routes across a real road network. Dijkstra, A* and bidirectional search share one implementation, and every result comes with search statistics so you can see what the algorithm actually did.",
      "highlights": ["The heuristic's admissibility is tested against the actual network — not just asserted in a comment", "A four-node graph where an admissible but inconsistent heuristic makes plain A* return a route 8% too long", "Weighting the heuristic 1.2 expands more nodes than not weighting it at all: re-expansions cost more than the greed saves", "69 tests; CI regenerates a 1,600-intersection network byte for byte"],
      "topics": ["python", "dijkstra", "a-star", "pathfinding", "graph-algorithms"],
      "demo": "https://umer-78.github.io/route-planner/"
    },
    {
      "name": "diffkit",
      "title": "Diffkit",
      "category": "Applications & services",
      "language": "Go",
      "summary": "Diff, patch and three-way merge written from scratch in Go. Myers' O(ND) algorithm, patience diff, unified output that matches GNU diff byte for byte, and a diff3-style merge — zero dependencies.",
      "highlights": ["Tests compare output directly against GNU diff, not just round-trip it through our own parser", "The textbook LCS table is 158× slower and uses 59× the memory of Myers' algorithm for the same 11 edits", "Patience diff is never shorter than Myers, but it runs longer on 17.5% of random inputs — up to 2.67× the optimal edit length", "148 tests under -race, 86–100% coverage"],
      "topics": ["go", "diff", "merge", "myers-diff", "cli", "from-scratch"],
      "demo": "https://umer-78.github.io/diffkit/"
    },
    {
      "name": "pebble-lang",
      "title": "Pebble",
      "category": "Applications & services",
      "language": "Python",
      "summary": "A small programming language built end to end: lexer, Pratt parser, static scope resolver and tree-walking interpreter, with closures and an interactive REPL.",
      "highlights": ["Run with --no-resolve and you reproduce the closure late-binding bug the resolver fixes — so the difference is measured, not claimed", "Each for-loop iteration gets its own binding: you get [0, 1, 2], not [3, 3, 3]", "217 tests; the call-depth limit is calibrated against a measured 7 host frames per guest call"],
      "topics": ["python", "interpreter", "programming-language", "pratt-parser", "from-scratch"],
      "demo": "https://umer-78.github.io/pebble-lang/"
    },
    {
      "name": "text-search",
      "title": "Text Search",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "A search engine built from the index up: positional postings, BM25 ranking, phrase and boolean queries, Porter stemming and typo tolerance. Standard library only, no dependencies.",
      "highlights": ["Textbook BM25 idf goes negative (-1.4351) on a term in 10 of 12 documents, so we use the clamped form instead", "Phrase search keeps the query's own stopword gaps intact — \"state of the art\" matches the full phrase, not just \"state art\"", "115 tests, standard library only"],
      "topics": ["python", "search-engine", "information-retrieval", "bm25", "inverted-index"],
      "demo": "https://umer-78.github.io/text-search/"
    },
    {
      "name": "anomaly-detection",
      "title": "Anomaly Detection",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Statistical detectors and an isolation forest for metric data, with scoring built to show how much point-adjusted F1 flatters a detector.",
      "highlights": ["A random detector is shipped alongside the real ones: pure noise reaches 0.46 on point-adjusted F1, beating the isolation forest's honest 0.42", "Thresholds come from training scores, never from the labels being scored", "27 tests, 2,688 labelled hours with four kinds of injected fault"],
      "topics": ["python", "anomaly-detection", "monitoring", "isolation-forest", "time-series"],
      "demo": "https://umer-78.github.io/anomaly-detection/"
    },
    {
      "name": "image-toolkit",
      "title": "Image Toolkit",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Image processing from scratch in NumPy: true convolution kept distinct from correlation, Gaussian and median filters, Otsu thresholding and Canny-style edge detection.",
      "highlights": ["Convolution and correlation are kept genuinely separate — a test pins down the Sobel sign difference", "The separable Gaussian does 50 multiplies per pixel instead of 625 — 14.5× faster in the README benchmark — and matches the full 2D pass to within 1e-13", "42 tests, three generated sample images"],
      "topics": ["python", "computer-vision", "numpy", "convolution", "edge-detection"],
      "demo": "https://umer-78.github.io/image-toolkit/"
    },
    {
      "name": "gradient-boosting",
      "title": "Gradient Boosting",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Gradient boosting written from scratch: histogram-based trees, Newton leaf values, early stopping and feature importance that doesn't flatter itself.",
      "highlights": ["Every analytic gradient is checked against finite differences", "Gain importance ranks a planted noise column third out of six; permutation importance scores it zero", "38 tests, and early stopping refuses to run without a held-out set"],
      "topics": ["python", "gradient-boosting", "machine-learning", "numpy", "from-scratch"],
      "demo": "https://umer-78.github.io/gradient-boosting/"
    },
    {
      "name": "timeseries-forecasting",
      "title": "Time Series Forecasting",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Baselines, exponential smoothing, parameter search and rolling-origin backtesting. No dependencies, no black boxes.",
      "highlights": ["MASE is scaled by the training window, so a hard test period can't quietly flatter a model", "A test proves no backtest fold ever sees data past its own origin", "50 tests; tuning is scored at the horizon actually being forecast"],
      "topics": ["python", "time-series", "forecasting", "holt-winters", "backtesting"],
      "demo": "https://umer-78.github.io/timeseries-forecasting/"
    },
    {
      "name": "recommender-engine",
      "title": "Recommender Engine",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Popularity and random baselines, item-item collaborative filtering, matrix factorisation and BPR, all scored on a temporal split.",
      "highlights": ["Rating-trained factorisation ranks worse than random; the same model trained with a pairwise loss ranks 13× better", "Split is by time per user — a random split would leak the future", "32 tests; catalogue coverage reported next to ranking accuracy"],
      "topics": ["python", "recommender-system", "collaborative-filtering", "bpr", "ranking"],
      "demo": "https://umer-78.github.io/recommender-engine/"
    },
    {
      "name": "password-strength-checker",
      "title": "Password Strength Checker",
      "category": "Security & networking",
      "language": "Python",
      "summary": "Offline password strength analyzer: entropy, leetspeak, keyboard walks, dates, passphrase scoring, and a --min-score gate you can wire into CI.",
      "highlights": [
        "Catches common passwords, leetspeak substitutions, keyboard walks, sequences and years buried in the middle",
        "Scores passphrases word by word, not just character by character",
        "CLI with batch mode and --min-score for CI gates"
      ],
      "topics": [
        "python",
        "security",
        "cli",
        "entropy"
      ],
      "demo": "https://umer-78.github.io/password-strength-checker/"
    },
    {
      "name": "log-sentinel",
      "title": "Log Sentinel",
      "category": "Security & networking",
      "language": "Python",
      "summary": "Finds SSH brute-force attacks, password spraying, and success-after-failure logins in Linux auth logs.",
      "highlights": [
        "Parses OpenSSH auth logs in both syslog and RFC5424 formats",
        "Sliding-window detection for brute force and password spraying",
        "JSON and table output, ready for pipelines"
      ],
      "topics": [
        "python",
        "blue-team",
        "ssh",
        "intrusion-detection"
      ],
      "demo": "https://umer-78.github.io/log-sentinel/"
    },
    {
      "name": "file-integrity-monitor",
      "title": "File Integrity Monitor",
      "category": "Security & networking",
      "language": "Python",
      "summary": "SHA-256 baselines with HMAC signing, so change detection also catches a tampered baseline. Watch mode included.",
      "highlights": [
        "Baselines are HMAC-signed, so someone who edits the baseline file gets caught too",
        "Reports added, modified, removed and permission-changed files",
        "Watch mode for continuous monitoring"
      ],
      "topics": [
        "python",
        "integrity",
        "hashing",
        "monitoring"
      ],
      "demo": "https://umer-78.github.io/file-integrity-monitor/"
    },
    {
      "name": "security-headers-scanner",
      "title": "Security Headers Scanner",
      "category": "Security & networking",
      "language": "Python",
      "summary": "Grades a site's HTTP security headers and cookies A–F, with the exact header line that fixes each finding.",
      "highlights": [
        "Checks CSP, HSTS, frame options, referrer policy, permissions policy, and cookie flags",
        "Every finding comes with the exact header that fixes it",
        "Exit codes make it a CI gate; tests run against a local server, no internet needed"
      ],
      "topics": [
        "python",
        "http",
        "headers",
        "csp"
      ],
      "demo": "https://umer-78.github.io/security-headers-scanner/"
    },
    {
      "name": "subnet-calculator",
      "title": "IPv4 Subnet Calculator",
      "category": "Security & networking",
      "language": "JavaScript",
      "summary": "Subnet, equal-split, VLSM and route-summarization calculator in the browser. No framework, tested core.",
      "highlights": [
        "VLSM allocation fits the largest requirement first",
        "Equal-split mode with usable-host counts",
        "Route summarization merges networks into the fewest CIDRs",
        "The maths module has no DOM in it, so it's unit tested"
      ],
      "topics": [
        "javascript",
        "networking",
        "ipv4",
        "vlsm"
      ],
      "demo": "https://umer-78.github.io/subnet-calculator/"
    },
    {
      "name": "customer-churn-prediction",
      "title": "Customer Churn Prediction",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "End-to-end churn prediction: a reproducible synthetic dataset, a feature pipeline, and three models compared with a majority-class baseline on one split.",
      "highlights": [
        "Three models on the same split, with the majority-class baseline shown for reference",
        "PR-AUC is the headline metric, because churners are the minority class and missing one is the costly error",
        "ROC and precision-recall curves, a confusion matrix and feature importance, generated by the pipeline"
      ],
      "topics": [
        "python",
        "scikit-learn",
        "classification",
        "churn"
      ],
      "demo": "https://umer-78.github.io/customer-churn-prediction/"
    },
    {
      "name": "neural-network-from-scratch",
      "title": "Neural Network From Scratch",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Feed-forward neural network in pure NumPy with hand-derived backprop, verified by numerical gradient checking.",
      "highlights": [
        "Every gradient is checked against a numerical estimate; the test fails if the calculus is wrong",
        "ReLU, sigmoid, softmax, cross-entropy, and L2 regularization all implemented from scratch",
        "Trains on real data and reports the confusion matrix"
      ],
      "topics": [
        "python",
        "numpy",
        "backpropagation",
        "deep-learning"
      ],
      "demo": "https://umer-78.github.io/neural-network-from-scratch/"
    },
    {
      "name": "sentiment-analyzer",
      "title": "Sentiment Analyzer",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Naive Bayes sentiment classifier written from scratch, with a tokenizer that actually understands review language.",
      "highlights": [
        "From-scratch model scored side by side with scikit-learn's on the same data",
        "Handles negation scope, so \"not good\" doesn't get read as \"good\"",
        "Per-prediction explanation showing which words decided each classification"
      ],
      "topics": [
        "python",
        "nlp",
        "naive-bayes",
        "text-classification"
      ],
      "demo": "https://umer-78.github.io/sentiment-analyzer/"
    },
    {
      "name": "rag-document-qa",
      "title": "RAG Document Q&A",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Ask questions about your own documents: structure-aware chunking, BM25 + TF-IDF hybrid retrieval, cited answers, no API key needed.",
      "highlights": [
        "Chunks on document structure rather than a fixed character count",
        "Hybrid BM25 and TF-IDF retrieval with reciprocal rank fusion",
        "Every answer cites the chunk it came from; no API key required"
      ],
      "topics": [
        "python",
        "rag",
        "retrieval",
        "bm25",
        "nlp"
      ],
      "demo": "https://umer-78.github.io/rag-document-qa/"
    },
    {
      "name": "ml-model-serving-api",
      "title": "ML Model Serving API",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "A FastAPI service that makes a scikit-learn model production-shaped: validation, versioning, rollback, health and metrics.",
      "highlights": [
        "Pydantic v2 request validation with useful error bodies",
        "Model versioning with one-command rollback to the previous artifact",
        "Health, readiness, and metrics endpoints; batch prediction supported"
      ],
      "topics": [
        "python",
        "fastapi",
        "mlops",
        "rest-api"
      ],
      "demo": "https://umer-78.github.io/ml-model-serving-api/"
    },
    {
      "name": "mini-sql-engine",
      "title": "minisql — a SQL engine",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "A SQL engine written from scratch (tokenizer, recursive-descent parser, executor) that runs queries over CSV files and edits them with INSERT, UPDATE and DELETE.",
      "highlights": ["Joins, grouping, aggregates, UNION, CASE and three-valued NULL logic — no SQLite underneath", "Writes are type-checked and all-or-nothing, and only reach the CSV files when you save", "Parse errors point at the exact character that caused them", "139 tests at 95% coverage, zero dependencies"],
      "topics": ["python", "sql", "parser", "query-engine", "interpreter"],
      "demo": "https://umer-78.github.io/mini-sql-engine/"
    },
    {
      "name": "sales-insights",
      "title": "Sales Insights",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Sales analysis in pandas: cleaning with a full audit trail, cohort retention, RFM segmentation and seasonality.",
      "highlights": [
        "Cleaning writes an audit trail: every dropped row is counted and explained",
        "Cohort retention curves and RFM segments exported to CSV",
        "Generates a chart pack from the committed dataset"
      ],
      "topics": [
        "python",
        "pandas",
        "analytics",
        "cohort-analysis",
        "rfm"
      ],
      "demo": "https://umer-78.github.io/sales-insights/"
    },
    {
      "name": "ta-indicators",
      "title": "TA Indicators",
      "category": "Data & analytics",
      "language": "TypeScript",
      "summary": "Dependency-free technical analysis indicators in strict TypeScript: SMA, EMA, RSI, MACD, Bollinger and more.",
      "highlights": [
        "Values checked against published worked examples, not against the implementation's own output",
        "Streaming-friendly: feed one candle at a time",
        "Zero dependencies, works in Node and the browser"
      ],
      "topics": [
        "typescript",
        "technical-analysis",
        "trading",
        "indicators"
      ],
      "demo": "https://umer-78.github.io/ta-indicators/"
    },
    {
      "name": "bank-ledger-csharp",
      "title": "Bank Ledger",
      "category": "Applications & services",
      "language": "C#",
      "summary": "Append-only account ledger in C#/.NET 8: decimal money, overdrafts, transfers, interest, statements, CSV export.",
      "highlights": [
        "Money is decimal with a currency guard — the test that 0.1 + 0.2 is 0.3 fails the day someone switches to double",
        "Entries are never edited; a reversal is its own entry",
        "The audit command replays every entry from zero to prove each balance still agrees with its history"
      ],
      "topics": [
        "csharp",
        "dotnet",
        "ledger",
        "xunit"
      ],
      "demo": "https://umer-78.github.io/bank-ledger-csharp/"
    },
    {
      "name": "kv-store",
      "title": "kv — a storage engine",
      "category": "Applications & services",
      "language": "Go",
      "summary": "A log-structured key-value store with a write-ahead log, memtable, bloom-filtered SSTables, compaction and crash recovery.",
      "highlights": ["Reading an absent key is 50× faster than a present one — the bloom filter eliminates 82% of negative lookups without touching disk", "A torn record after a crash is discarded; damage mid-file is reported rather than skipped", "56 tests, all passing under the race detector"],
      "topics": ["go", "database", "lsm-tree", "storage-engine", "bloom-filter"],
      "demo": "https://umer-78.github.io/kv-store/"
    },
    {
      "name": "loadgun",
      "title": "loadgun",
      "category": "Applications & services",
      "language": "Go",
      "summary": "HTTP load testing tool with a worker pool, rate cap, latency percentiles and histogram, and a non-zero exit code for CI.",
      "highlights": ["Nearest-rank percentiles — p95 is a latency that actually happened, not an interpolation", "Failed requests are counted but kept out of the latency distribution", "48 tests at 88% coverage on the runner, all passing under the race detector"],
      "topics": ["go", "load-testing", "performance", "concurrency", "cli"],
      "demo": "https://umer-78.github.io/loadgun/"
    },
    {
      "name": "url-shortener-go",
      "title": "URL Shortener",
      "category": "Applications & services",
      "language": "Go",
      "summary": "URL shortener in Go: JSON API, redirects, visit counting, custom codes, expiring links, single static binary.",
      "highlights": [
        "Visit counting is an atomic UPDATE, so 50 concurrent hits count exactly 50",
        "SQLite with no cgo; the whole service is one static binary",
        "Distroless non-root Docker image"
      ],
      "topics": [
        "go",
        "sqlite",
        "rest-api",
        "docker"
      ],
      "demo": "https://umer-78.github.io/url-shortener-go/"
    },
    {
      "name": "inventory-management-system",
      "title": "Inventory Management",
      "category": "Applications & services",
      "language": "Python",
      "summary": "Stock control on a movement-ledger design: products, suppliers, purchase orders, valuation, reorder alerts.",
      "highlights": [
        "Stock on hand is derived from movements, never a stored field that can drift",
        "Weighted-average valuation and reorder-point alerts",
        "SQLite schema with foreign keys and CHECK constraints"
      ],
      "topics": [
        "python",
        "sqlite",
        "inventory",
        "erp"
      ],
      "demo": "https://umer-78.github.io/inventory-management-system/"
    },
    {
      "name": "project-tracker",
      "title": "Project Tracker",
      "category": "Applications & services",
      "language": "Python",
      "summary": "Team project management: kanban with drag and drop, sprints, burndown charts, a workload view and role-based permissions.",
      "highlights": [
        "Sprint planning with a burndown chart drawn from the actual task history",
        "Workload view per assignee so nobody silently drowns",
        "Role-based permissions; state lives in one place and everything renders from it"
      ],
      "topics": [
        "javascript",
        "kanban",
        "project-management",
        "dashboard"
      ],
      "demo": "https://umer-78.github.io/project-tracker/"
    },
    {
      "name": "task-board",
      "title": "Task Board",
      "category": "Applications & services",
      "language": "TypeScript",
      "summary": "Kanban board in React and TypeScript with keyboard moves as well as drag and drop, plus inline tags and filtering.",
      "highlights": [
        "Every drag has a keyboard equivalent, so the board works without a mouse",
        "Cards glide between columns with Motion, and reduced-motion settings are respected",
        "Strict TypeScript, no any",
        "Tested with Vitest and Testing Library"
      ],
      "topics": [
        "react",
        "typescript",
        "vite",
        "kanban"
      ],
      "demo": "https://umer-78.github.io/task-board/"
    },
    {
      "name": "ui-lab",
      "title": "UI Lab",
      "category": "Applications & services",
      "language": "TypeScript",
      "summary": "Six animation patterns for React built with Motion, each in one file: shared layout tabs, enter and exit, drag with a spring, a number ticker, expanding rows and scroll progress.",
      "highlights": [
        "Every pattern has a keyboard route: roving tabindex on the tabs, arrow keys and Escape for the drag card",
        "Reduced motion is honoured site-wide by one MotionConfig line",
        "15 tests with Vitest and Testing Library; the non-animation logic lives in a module with no React or DOM"
      ],
      "topics": [
        "react",
        "typescript",
        "motion",
        "animation"
      ],
      "demo": "https://umer-78.github.io/ui-lab/"
    },
    {
      "name": "weather-now",
      "title": "Weather Now",
      "category": "Applications & services",
      "language": "JavaScript",
      "summary": "Weather dashboard on the keyless Open-Meteo API: current conditions, hourly strip, seven-day outlook.",
      "highlights": [
        "No API key, so it runs anywhere",
        "Hourly strip starts at the current hour, not at midnight",
        "Geocoding search with keyboard navigation",
        "Dew point with a comfort level next to humidity"
      ],
      "topics": [
        "javascript",
        "weather",
        "open-meteo",
        "dashboard"
      ],
      "demo": "https://umer-78.github.io/weather-now/"
    },
    {
      "name": "snake-game",
      "title": "Snake",
      "category": "Games & interactive",
      "language": "JavaScript",
      "summary": "Snake on a canvas with the game rules separated from rendering and unit tested.",
      "highlights": [
        "The rules module has no DOM in it, so the game logic is unit tested",
        "Queued turns: two fast key presses can't fold the snake into itself",
        "Wrap mode, pause, and a high score that survives a reload"
      ],
      "topics": [
        "javascript",
        "canvas",
        "game",
        "unit-tested"
      ],
      "demo": "https://umer-78.github.io/snake-game/"
    },
    {
      "name": "coinvantage",
      "title": "CoinVantage",
      "category": "Applications & services",
      "language": "JavaScript",
      "summary": "Installable crypto markets site with live prices, charts, signals, multi-year comparison and an on-device forecast.",
      "highlights": [
        "Works offline as an installed app (service worker, manifest)",
        "Falls back to a second exchange when the first is unreachable",
        "Tools page: coin/currency converter, a DCA backtest on real daily closes and a stop-loss position sizer",
        "No API keys, never places a trade, and wallet connection is read-only (no signatures)"
      ],
      "topics": [
        "javascript",
        "pwa",
        "crypto",
        "charts"
      ],
      "demo": "https://umer-78.github.io/coinvantage/"
    },
    {
      "name": "GD_PROJECT",
      "title": "3D Maze Game",
      "category": "Games & interactive",
      "language": "C#",
      "summary": "Unity 3D maze game: five hand-built levels, NavMesh guards that check line of sight before firing, moving obstacles, and coins that unlock the exit door. Playable in the browser.",
      "highlights": [
        "Five hand-built levels, each with moving or rotating obstacles that damage the player on contact",
        "Enemies check line of sight before firing",
        "Per-scene game manager: levels reset cleanly instead of leaking state"
      ],
      "topics": [
        "unity",
        "csharp",
        "game-development",
        "3d"
      ],
      "demo": "https://umer-78.github.io/GD_PROJECT/"
    },
    {
      "name": "ui-lab",
      "title": "UI Lab",
      "category": "Applications & services",
      "language": "TypeScript",
      "summary": "Six animation patterns for React with Motion: shared layout, enter and exit, drag, springs, animating to height auto and scroll progress. Each pattern lives in one file.",
      "highlights": [
        "Every pattern has a keyboard route and supports reduced motion",
        "React 19, Motion 13, Tailwind 4 and Vite",
        "15 tests, run in CI on every push"
      ],
      "topics": [
        "react",
        "motion",
        "animation",
        "typescript",
        "accessibility",
        "tailwind"
      ],
      "demo": "https://umer-78.github.io/ui-lab/"
    },
    {
      "name": "umer-78-llm-gateway",
      "title": "LLM Gateway",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "A self-healing gateway in front of several LLM providers: one OpenAI-compatible endpoint with circuit breakers, failover, hedged requests and a queue that waits out outages, with every dollar attributed to a tenant and a feature.",
      "highlights": [
        "Through four minutes of scripted provider outages it answered 92.2% of interactive requests, against 74.4% when calling one provider directly, and finished 100% of the deferrable work",
        "Breaker state lives in Redis, so replicas agree: a hard outage opened one in 1.8 s, and half-open probes closed it 6.2 s after the provider recovered",
        "The first version's benchmark exposed four design flaws, including hedges that hid a slow provider from its breaker; the README shows each fix and what it changed",
        "Prometheus metrics, a provisioned Grafana board and a chaos endpoint; CI reruns the outage benchmark on every push"
      ],
      "topics": [
        "python",
        "llm",
        "fastapi",
        "redis",
        "circuit-breaker",
        "observability"
      ]
    }
  ]
};

export default site;
