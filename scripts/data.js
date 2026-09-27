/**
 * The project list. Kept as a module rather than a fetched JSON file so the page
 * works from the filesystem as well as from a server, and so the tests can import
 * exactly what the page renders.
 */
const site = {
  "owner": "umer-78",
  "name": "Umer Hashmi",
  "tagline": "I build security tools, machine learning and LLM systems, and applications that hold up when you put them through real tests.",
  "intro": "Every project below runs today. You'll find real output in the README, a test suite that catches regressions, and CI that proves it builds on a clean machine. Click through to the code.",
  "categories": [
    "Security & networking",
    "Machine learning & AI",
    "LLM engineering",
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
      "demo": "https://umer-78.github.io/regex-engine/",
      "preview": "assets/previews/regex-engine.webp"
    },
    {
      "name": "route-planner",
      "title": "Route Planner",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Shortest and fastest routes across a real road network. Dijkstra, A* and bidirectional search share one implementation, and every result comes with search statistics so you can see what the algorithm actually did.",
      "highlights": ["The heuristic's admissibility is tested against the actual network — not just asserted in a comment", "A four-node graph where an admissible but inconsistent heuristic makes plain A* return a route 8% too long", "Weighting the heuristic 1.2 expands more nodes than not weighting it at all: re-expansions cost more than the greed saves", "69 tests; CI regenerates a 1,600-intersection network byte for byte"],
      "topics": ["python", "dijkstra", "a-star", "pathfinding", "graph-algorithms"],
      "demo": "https://umer-78.github.io/route-planner/",
      "preview": "assets/previews/route-planner.webp"
    },
    {
      "name": "diffkit",
      "title": "Diffkit",
      "category": "Applications & services",
      "language": "Go",
      "summary": "Diff, patch and three-way merge written from scratch in Go. Myers' O(ND) algorithm, patience diff, unified output that matches GNU diff byte for byte, and a diff3-style merge — zero dependencies.",
      "highlights": ["Tests compare output directly against GNU diff, not just round-trip it through our own parser", "The textbook LCS table is 158× slower and uses 59× the memory of Myers' algorithm for the same 11 edits", "Patience diff is never shorter than Myers, but it runs longer on 17.5% of random inputs — up to 2.67× the optimal edit length", "148 tests under -race, 86–100% coverage"],
      "topics": ["go", "diff", "merge", "myers-diff", "cli", "from-scratch"],
      "demo": "https://umer-78.github.io/diffkit/",
      "preview": "assets/previews/diffkit.webp"
    },
    {
      "name": "pebble-lang",
      "title": "Pebble",
      "category": "Applications & services",
      "language": "Python",
      "summary": "A small programming language built end to end: lexer, Pratt parser, static scope resolver and tree-walking interpreter, with closures and an interactive REPL.",
      "highlights": ["Run with --no-resolve and you reproduce the closure late-binding bug the resolver fixes — so the difference is measured, not claimed", "Each for-loop iteration gets its own binding: you get [0, 1, 2], not [3, 3, 3]", "217 tests; the call-depth limit is calibrated against a measured 7 host frames per guest call"],
      "topics": ["python", "interpreter", "programming-language", "pratt-parser", "from-scratch"],
      "demo": "https://umer-78.github.io/pebble-lang/",
      "preview": "assets/previews/pebble-lang.webp"
    },
    {
      "name": "text-search",
      "title": "Text Search",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "A search engine built from the index up: positional postings, BM25 ranking, phrase and boolean queries, Porter stemming and typo tolerance. Standard library only, no dependencies.",
      "highlights": ["Textbook BM25 idf goes negative (-1.4351) on a term in 10 of 12 documents, so we use the clamped form instead", "Phrase search keeps the query's own stopword gaps intact — \"state of the art\" matches the full phrase, not just \"state art\"", "115 tests, standard library only"],
      "topics": ["python", "search-engine", "information-retrieval", "bm25", "inverted-index"],
      "demo": "https://umer-78.github.io/text-search/",
      "preview": "assets/previews/text-search.webp"
    },
    {
      "name": "anomaly-detection",
      "title": "Anomaly Detection",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Statistical detectors and an isolation forest for metric data, with scoring built to show how much point-adjusted F1 flatters a detector.",
      "highlights": ["A random detector is shipped alongside the real ones: pure noise reaches 0.46 on point-adjusted F1, beating the isolation forest's honest 0.42", "Thresholds come from training scores, never from the labels being scored", "27 tests, 2,688 labelled hours with four kinds of injected fault"],
      "topics": ["python", "anomaly-detection", "monitoring", "isolation-forest", "time-series"],
      "demo": "https://umer-78.github.io/anomaly-detection/",
      "preview": "assets/previews/anomaly-detection.webp"
    },
    {
      "name": "image-toolkit",
      "title": "Image Toolkit",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Image processing from scratch in NumPy: true convolution kept distinct from correlation, Gaussian and median filters, Otsu thresholding and Canny-style edge detection.",
      "highlights": ["Convolution and correlation are kept genuinely separate — a test pins down the Sobel sign difference", "The separable Gaussian does 50 multiplies per pixel instead of 625 — 14.5× faster in the README benchmark — and matches the full 2D pass to within 1e-13", "42 tests, three generated sample images"],
      "topics": ["python", "computer-vision", "numpy", "convolution", "edge-detection"],
      "demo": "https://umer-78.github.io/image-toolkit/",
      "preview": "assets/previews/image-toolkit.webp"
    },
    {
      "name": "gradient-boosting",
      "title": "Gradient Boosting",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Gradient boosting written from scratch: histogram-based trees, Newton leaf values, early stopping and feature importance that doesn't flatter itself.",
      "highlights": ["Every analytic gradient is checked against finite differences", "Gain importance ranks a planted noise column third out of six; permutation importance scores it zero", "38 tests, and early stopping refuses to run without a held-out set"],
      "topics": ["python", "gradient-boosting", "machine-learning", "numpy", "from-scratch"],
      "demo": "https://umer-78.github.io/gradient-boosting/",
      "preview": "assets/previews/gradient-boosting.webp"
    },
    {
      "name": "timeseries-forecasting",
      "title": "Time Series Forecasting",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Baselines, exponential smoothing, parameter search and rolling-origin backtesting. No dependencies, no black boxes.",
      "highlights": ["MASE is scaled by the training window, so a hard test period can't quietly flatter a model", "A test proves no backtest fold ever sees data past its own origin", "50 tests; tuning is scored at the horizon actually being forecast"],
      "topics": ["python", "time-series", "forecasting", "holt-winters", "backtesting"],
      "demo": "https://umer-78.github.io/timeseries-forecasting/",
      "preview": "assets/previews/timeseries-forecasting.webp"
    },
    {
      "name": "recommender-engine",
      "title": "Recommender Engine",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Popularity and random baselines, item-item collaborative filtering, matrix factorisation and BPR, all scored on a temporal split.",
      "highlights": ["Rating-trained factorisation ranks worse than random; the same model trained with a pairwise loss ranks 13× better", "Split is by time per user — a random split would leak the future", "32 tests; catalogue coverage reported next to ranking accuracy"],
      "topics": ["python", "recommender-system", "collaborative-filtering", "bpr", "ranking"],
      "demo": "https://umer-78.github.io/recommender-engine/",
      "preview": "assets/previews/recommender-engine.webp"
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
      "demo": "https://umer-78.github.io/password-strength-checker/",
      "preview": "assets/previews/password-strength-checker.webp"
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
      "demo": "https://umer-78.github.io/log-sentinel/",
      "preview": "assets/previews/log-sentinel.webp"
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
      "demo": "https://umer-78.github.io/file-integrity-monitor/",
      "preview": "assets/previews/file-integrity-monitor.webp"
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
      "demo": "https://umer-78.github.io/security-headers-scanner/",
      "preview": "assets/previews/security-headers-scanner.webp"
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
      "demo": "https://umer-78.github.io/subnet-calculator/",
      "preview": "assets/previews/subnet-calculator.webp"
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
      "demo": "https://umer-78.github.io/customer-churn-prediction/",
      "preview": "assets/previews/customer-churn-prediction.webp"
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
      "demo": "https://umer-78.github.io/neural-network-from-scratch/",
      "preview": "assets/previews/neural-network-from-scratch.webp"
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
      "demo": "https://umer-78.github.io/sentiment-analyzer/",
      "preview": "assets/previews/sentiment-analyzer.webp"
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
      "demo": "https://umer-78.github.io/rag-document-qa/",
      "preview": "assets/previews/rag-document-qa.webp"
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
      "demo": "https://umer-78.github.io/ml-model-serving-api/",
      "preview": "assets/previews/ml-model-serving-api.webp"
    },
    {
      "name": "mini-sql-engine",
      "title": "minisql — a SQL engine",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "A SQL engine written from scratch (tokenizer, recursive-descent parser, executor) that runs queries over CSV files and edits them with INSERT, UPDATE and DELETE.",
      "highlights": ["Joins, grouping, aggregates, UNION, CASE and three-valued NULL logic — no SQLite underneath", "Writes are type-checked and all-or-nothing, and only reach the CSV files when you save", "Parse errors point at the exact character that caused them", "139 tests at 95% coverage, zero dependencies"],
      "topics": ["python", "sql", "parser", "query-engine", "interpreter"],
      "demo": "https://umer-78.github.io/mini-sql-engine/",
      "preview": "assets/previews/mini-sql-engine.webp"
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
      "demo": "https://umer-78.github.io/sales-insights/",
      "preview": "assets/previews/sales-insights.webp"
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
      "demo": "https://umer-78.github.io/ta-indicators/",
      "preview": "assets/previews/ta-indicators.webp"
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
      "demo": "https://umer-78.github.io/bank-ledger-csharp/",
      "preview": "assets/previews/bank-ledger-csharp.webp"
    },
    {
      "name": "kv-store",
      "title": "kv — a storage engine",
      "category": "Applications & services",
      "language": "Go",
      "summary": "A log-structured key-value store with a write-ahead log, memtable, bloom-filtered SSTables, compaction and crash recovery.",
      "highlights": ["Reading an absent key is 50× faster than a present one — the bloom filter eliminates 82% of negative lookups without touching disk", "A torn record after a crash is discarded; damage mid-file is reported rather than skipped", "56 tests, all passing under the race detector"],
      "topics": ["go", "database", "lsm-tree", "storage-engine", "bloom-filter"],
      "demo": "https://umer-78.github.io/kv-store/",
      "preview": "assets/previews/kv-store.webp"
    },
    {
      "name": "loadgun",
      "title": "loadgun",
      "category": "Applications & services",
      "language": "Go",
      "summary": "HTTP load testing tool with a worker pool, rate cap, latency percentiles and histogram, and a non-zero exit code for CI.",
      "highlights": ["Nearest-rank percentiles — p95 is a latency that actually happened, not an interpolation", "Failed requests are counted but kept out of the latency distribution", "48 tests at 88% coverage on the runner, all passing under the race detector"],
      "topics": ["go", "load-testing", "performance", "concurrency", "cli"],
      "demo": "https://umer-78.github.io/loadgun/",
      "preview": "assets/previews/loadgun.webp"
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
      "demo": "https://umer-78.github.io/url-shortener-go/",
      "preview": "assets/previews/url-shortener-go.webp"
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
      "demo": "https://umer-78.github.io/inventory-management-system/",
      "preview": "assets/previews/inventory-management-system.webp"
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
      "demo": "https://umer-78.github.io/project-tracker/",
      "preview": "assets/previews/project-tracker.webp"
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
      "demo": "https://umer-78.github.io/task-board/",
      "preview": "assets/previews/task-board.webp"
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
      "demo": "https://umer-78.github.io/ui-lab/",
      "preview": "assets/previews/ui-lab.webp"
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
      "demo": "https://umer-78.github.io/weather-now/",
      "preview": "assets/previews/weather-now.webp"
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
      "demo": "https://umer-78.github.io/snake-game/",
      "preview": "assets/previews/snake-game.webp"
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
      "title": "Treasure Hunt",
      "category": "Games & interactive",
      "language": "JavaScript",
      "summary": "A 3D maze game: five temple levels of seeded mazes, sentries whose line of sight is drawn on the floor and cut off by walls, telegraphed spike traps, and coins that open the exit. Built in Unity with C#, and ported to three.js so it plays in any browser.",
      "highlights": [
        "Sentries turn red when they see you, charge for 0.75 s, then fire a slow orb; every hit is named on screen with an arrow to where it came from",
        "A third-person camera that always stays above the wall tops, so it never ends up inside a wall; the explorer shows through walls as a silhouette",
        "Keyboard, touch or gamepad, a map that fills in as you explore, and about 220 KB to download",
        "11 of its tests drive the real game in a headless browser"
      ],
      "topics": [
        "threejs",
        "javascript",
        "unity",
        "csharp",
        "game-development",
        "3d"
      ],
      "demo": "https://umer-78.github.io/GD_PROJECT/play/",
      "preview": "assets/previews/GD_PROJECT.webp"
    },
    {
      "name": "umer-78-llm-gateway",
      "title": "LLM Gateway",
      "category": "LLM engineering",
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
    },
    {
      "name": "groundtruth",
      "title": "Groundtruth",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A retrieval evaluation harness for a legal research assistant: 100 questions over 510 real contracts (CUAD), each answered by passages lawyers labelled, so a retrieval change is measured instead of argued.",
      "highlights": [
        "The configuration it recommends puts the labelled passage in the top 10 for 70.0% of questions, against 36.8% for plain BM25",
        "Chunking, hybrid retrieval, a reranker and contract expansion compared on recall, MRR, nDCG and latency on the same questions",
        "CI fails any change that costs more than a point of recall"
      ],
      "topics": [
        "python",
        "rag",
        "retrieval",
        "evaluation",
        "bm25",
        "legal"
      ],
      "demo": "https://umer-78.github.io/groundtruth/",
      "preview": "assets/previews/groundtruth.webp"
    },
    {
      "name": "doorman",
      "title": "Doorman",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Prompt-injection defences for an AI recruiting agent that reads applicants' resumes and pages, measured against 60 red-team attacks and 303 injections written by other people, with a model that obeys any instruction it can read.",
      "highlights": [
        "Isolating what the agent reads from what it may do stopped 60 of 60 suite attacks and 303 of 303 held-out ones, with no benign application flagged",
        "Input filtering alone still let 15% of the held-out injections through; hidden-text stripping alone stopped half the suite and none of the held-out set",
        "The live demo opens each attack's PDF and shows what every defence did"
      ],
      "topics": [
        "python",
        "llm",
        "security",
        "prompt-injection",
        "guardrails",
        "agents"
      ],
      "demo": "https://umer-78.github.io/doorman/",
      "preview": "assets/previews/doorman.webp"
    },
    {
      "name": "warmstart",
      "title": "Warmstart",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A semantic cache for a bank's LLM support assistant at 400,000 questions a month: exact and paraphrase hits, answers built from one customer's account kept away from everyone else, and invalidation when the prompt or fee schedule changes.",
      "highlights": [
        "Replayed on 10,000 real support questions it answered 29.4% from the cache and cut the cost per 1,000 questions from $6.72 to $2.61",
        "4 wrong answers (0.65% of paraphrase hits) thanks to a neighbour-agreement check; a similarity threshold alone could not get under 1%",
        "Leaked nothing across customers and served nothing stale after a change"
      ],
      "topics": [
        "python",
        "llm",
        "caching",
        "embeddings",
        "onnx",
        "cost"
      ],
      "demo": "https://umer-78.github.io/warmstart/",
      "preview": "assets/previews/warmstart.webp"
    },
    {
      "name": "llm-cost-autopilot",
      "title": "LLM Cost Autopilot",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A router that sends each LLM request to the cheapest model likely to get it right, trained and measured on 4,551 questions whose answers from six models were recorded by HELM Lite.",
      "highlights": [
        "Matched GPT-4o's accuracy (77.8% against 77.6%) at 23% of the cost with US-hosted models, and at 10.5% when DeepSeek-V3 is allowed",
        "Beats a cascade and a fixed task-to-model map on the same held-out questions",
        "CI fails if the router drops more than a point below GPT-4o or loses its saving"
      ],
      "topics": [
        "python",
        "llm",
        "routing",
        "cost",
        "scikit-learn",
        "helm"
      ],
      "demo": "https://umer-78.github.io/llm-cost-autopilot/",
      "preview": "assets/previews/llm-cost-autopilot.webp"
    },
    {
      "name": "llm-regression-detector",
      "title": "LLM Regression Detector",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Catches the tasks a model upgrade breaks before it ships: every question is compared across the old and new version, McNemar's exact test with Holm's correction decides per task, and CI fails on a regression of 2+ points.",
      "highlights": [
        "On Llama 3 → 3.1 70B, overall accuracy moved 0.7 points while legal questions fell from 69.2% to 58.3%; the detector flags it, an average would not",
        "Six real upgrades replayed from HELM Lite's recorded answers, with the broken questions shown for each regression",
        "A demo branch shows the CI gate failing on that upgrade"
      ],
      "topics": [
        "python",
        "llm",
        "evaluation",
        "statistics",
        "ci",
        "helm"
      ],
      "demo": "https://umer-78.github.io/llm-regression-detector/",
      "preview": "assets/previews/llm-regression-detector.webp"
    },
    {
      "name": "ai-feature-flags",
      "title": "AI Feature Flags",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Feature flags for AI features: roll a new model or prompt out to 1, 5, 25 and 50% of users, compare it with the current one while the rollout runs, and roll back automatically when it is measurably worse, overall or in any segment.",
      "highlights": [
        "Rolled back the three clearly worse model upgrades in 100 of 100 replays, after 5 to 42 extra wrong answers, against 563 to 6,574 for switching everyone at once",
        "An always-valid sequential test: with an identical candidate it rolled back 3.8% of rollouts, where re-running an ordinary test every 50 requests rolled back 45.9%",
        "Per-segment guardrails caught Llama 3.1's legal regression in 100 of 100 replays; the overall score alone caught it once"
      ],
      "topics": [
        "python",
        "llm",
        "feature-flags",
        "canary",
        "statistics",
        "sequential-testing"
      ],
      "demo": "https://umer-78.github.io/ai-feature-flags/",
      "preview": "assets/previews/ai-feature-flags.webp"
    },
    {
      "name": "prompt-ab-platform",
      "title": "Prompt A/B Platform",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A/B/n testing for prompts: versioned templates, uniform or Thompson-sampling allocation, and an always-valid test that drops losing prompts while the experiment runs. Measured on HELM's recorded prompt ablations.",
      "highlights": [
        "The prompt format alone moved accuracy by up to 63.8 points (GPT-J 6B on toxicity: 12.4% to 76.2%)",
        "A uniform split chose a prompt within a point of the best in 99.0% of replays; Thompson sampling lost a third as much on the way but never isolated one winner",
        "With identical prompts, 1.3% of runs wrongly dropped one, under the 5% bound"
      ],
      "topics": [
        "python",
        "llm",
        "prompts",
        "ab-testing",
        "bandits",
        "statistics"
      ],
      "demo": "https://umer-78.github.io/prompt-ab-platform/",
      "preview": "assets/previews/prompt-ab-platform.webp"
    },
    {
      "name": "llm-arbitration",
      "title": "LLM Arbitration",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A second opinion on LLM answers: a panel of critics checks each answer in parallel, disagreements are flagged, and an adjudicator weighs each critic by its record to return a calibrated verdict, with an audit log.",
      "highlights": [
        "Verdicts separate right from wrong answers with an AUROC of 0.79 to 0.96, and their probabilities are calibrated (error 0.04 to 0.08)",
        "Weighing critics beats counting them: 57% of Llama 3.1 70B's wrong answers caught, against 43% for a majority vote, at the same precision",
        "When the panel splits, the answer is right only 43 to 64% of the time: disagreement is the signal"
      ],
      "topics": [
        "python",
        "llm",
        "evaluation",
        "agents",
        "calibration",
        "helm"
      ],
      "demo": "https://umer-78.github.io/llm-arbitration/",
      "preview": "assets/previews/llm-arbitration.webp"
    },
    {
      "name": "judge-calibration",
      "title": "Judge Calibration",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "How far can an LLM judge be trusted? GPT-4 as a judge against two pools of human raters on 1,399 real outputs: weighted kappa, length and self-preference bias, and a calibration tested on raters it never saw.",
      "highlights": [
        "The judge agrees with each human pool about as well as the pools agree with each other",
        "On completeness it favours its own model family by 0.38 points beyond what humans do; its apparent preference on helpfulness disappears once human noise is accounted for",
        "Quantile mapping onto the human scale raised helpfulness kappa from 0.36 to 0.44"
      ],
      "topics": [
        "python",
        "llm",
        "llm-as-judge",
        "evaluation",
        "statistics",
        "helm"
      ],
      "demo": "https://umer-78.github.io/judge-calibration/",
      "preview": "assets/previews/judge-calibration.webp"
    },
    {
      "name": "distill",
      "title": "Distill",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Distils a frontier model's labels into a small model that runs on a CPU, and finds the request volume above which owning it beats renting the teacher.",
      "highlights": [
        "The bge-small student reaches 94.9% on held-out movie reviews, against 95.3% for GPT-3.5 Turbo, and agrees with it 93% of the time",
        "Owning is cheaper above 16,865 requests a month, labelling cost included",
        "The same student trained on human labels scores 94.4%: distillation gave nothing up here"
      ],
      "topics": [
        "python",
        "llm",
        "distillation",
        "onnx",
        "cost",
        "embeddings"
      ],
      "demo": "https://umer-78.github.io/distill/",
      "preview": "assets/previews/distill.webp"
    },
    {
      "name": "text-to-sql-guardrails",
      "title": "Text-to-SQL Guardrails",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Two layers between LLM-written SQL and a database: a guard that parses every query and blocks writes, admin statements, invented tables and columns, withheld columns and expensive plans, and a sandbox where the database itself refuses.",
      "highlights": [
        "Together they stopped 40 of 40 attacks, and all 20 ordinary analytics queries ran",
        "No Spider gold query was blocked wrongly, and 308 of 308 planted hallucinated columns were caught before running",
        "The sandbox alone stops 38 of the 40 attacks, so either layer can miss without harm"
      ],
      "topics": [
        "python",
        "llm",
        "sql",
        "sqlite",
        "security",
        "sqlglot"
      ],
      "demo": "https://umer-78.github.io/text-to-sql-guardrails/",
      "preview": "assets/previews/text-to-sql-guardrails.webp"
    },
    {
      "name": "pipeline-forensics",
      "title": "Pipeline Forensics",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Traces multi-step AI pipelines span by span and blames the step a bad answer came from, with failures fed back into an evaluation set.",
      "highlights": [
        "Gemini 1.5 Flash 002's 46-point maths 'regression': 98% of the broken questions were cut off by a stop sequence added between benchmark releases",
        "32 to 40% of two Gemini versions' failures were the harness extracting the wrong number from a right answer",
        "Faults injected on purpose into real traces are blamed on the right step every time"
      ],
      "topics": [
        "python",
        "llm",
        "observability",
        "tracing",
        "evaluation",
        "helm"
      ],
      "demo": "https://umer-78.github.io/pipeline-forensics/",
      "preview": "assets/previews/pipeline-forensics.webp"
    },
    {
      "name": "self-healing-docs",
      "title": "Self-Healing Docs",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A GitHub Action that fails a pull request whose API changes leave documentation wrong, says which sections and why, and patches renames.",
      "highlights": [
        "Replayed over httpx's whole history: of 38 breaking changes the docs used, 13 were documented in the same commit and 33 sections went stale, for a median of 52 days",
        "Found two sections still wrong in httpx's docs today; its 3 false alarms are listed in the README",
        "Its rename fix matched the maintainers' own edit in 8 of 11 cases"
      ],
      "topics": [
        "python",
        "github-actions",
        "documentation",
        "ast",
        "git",
        "ci"
      ],
      "demo": "https://umer-78.github.io/self-healing-docs/",
      "preview": "assets/previews/self-healing-docs.webp"
    },
    {
      "name": "eval-dataset-generator",
      "title": "Eval Dataset Generator",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Turns production LLM logs into an evaluation set worth labelling: redaction, near-duplicate collapsing, clustering into request types, and sampling that finds failures while still estimating quality without bias.",
      "highlights": [
        "Boosting toward low-confidence answers captured 25.6 of the model's failures per 200 labelled cases, against 14.8 for a uniform sample",
        "Weighted by inclusion probability the estimate stays unbiased (-0.16 points); averaging the same set naively is off by 5.5",
        "Outliers fail three times as often as clustered traffic (12.6% against 4.3%)"
      ],
      "topics": [
        "python",
        "llm",
        "evaluation",
        "sampling",
        "clustering",
        "pii"
      ],
      "demo": "https://umer-78.github.io/eval-dataset-generator/",
      "preview": "assets/previews/eval-dataset-generator.webp"
    },
    {
      "name": "casefile",
      "title": "Casefile",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Multi-agent claims triage that stays bounded: a supervisor over extractor, investigator and reviewer agents, typed handoffs, a snapshot per step, cost ceilings enforced in code, and a human gate on every payout.",
      "highlights": [
        "Across 900 claims every run stopped, the longest after 9 of 10 allowed steps, and no claim crossed its cost ceiling",
        "A claim resumed from a stored snapshot reached the same end state; the reviewer sent 290 claims back and they still finished",
        "Planted problems caught 89 to 100% with no false flags; the claims are synthetic because real ones are private"
      ],
      "topics": [
        "python",
        "agents",
        "llm",
        "orchestration",
        "sqlite",
        "human-in-the-loop"
      ],
      "demo": "https://umer-78.github.io/casefile/",
      "preview": "assets/previews/casefile.webp"
    },
    {
      "name": "graph-rag",
      "title": "Graph RAG",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Knowledge-graph and vector retrieval over the same chunks with a router, for questions that need hops the question never names. Built on the top 500 Python packages' PyPI records.",
      "highlights": [
        "Vector search found 38.3% of what hop questions need; routed retrieval found 99.7%",
        "Entity resolution (PEP 503 names, aliases) links 1,112 of 1,231 dependency mentions, against 1,042 taken as written",
        "Idempotent upserts, and every graph answer cites the chunk behind its edge"
      ],
      "topics": [
        "python",
        "rag",
        "knowledge-graph",
        "retrieval",
        "embeddings",
        "llm"
      ],
      "demo": "https://umer-78.github.io/graph-rag/",
      "preview": "assets/previews/graph-rag.webp"
    },
    {
      "name": "research-agents",
      "title": "Research Agents",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "A multi-agent research assistant built around durable state, budgets enforced in the graph and step-level tracing, with every finding carrying its source, snippet and retrieval time.",
      "highlights": [
        "Answered 94% of sub-questions with 15% of tool calls failing, and reported the rest as gaps instead of guessing",
        "20 of 20 runs killed at a random step resumed from the store to the same report",
        "Budgets held: median 4,706 tokens against a 20,000 ceiling, one send-back at most"
      ],
      "topics": [
        "python",
        "agents",
        "llm",
        "research",
        "tracing",
        "sqlite"
      ],
      "demo": "https://umer-78.github.io/research-agents/",
      "preview": "assets/previews/research-agents.webp"
    },
    {
      "name": "slotfill",
      "title": "Slotfill",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Strict-schema extraction from noisy scanned documents: a small trained extractor against hand-written rules, with schema validity, field accuracy, latency and cost on 200 held-out receipts.",
      "highlights": [
        "98.5% of outputs validate against the schema, against 83.5% for the rules; totals right 94% of the time and dates 98%",
        "Under 4 ms per receipt on a CPU; company and address are capped by OCR errors, and the README measures that ceiling",
        "Joining OCR boxes into printed rows took total accuracy from 43% to 94%"
      ],
      "topics": [
        "python",
        "extraction",
        "ocr",
        "scikit-learn",
        "schema",
        "llm"
      ],
      "demo": "https://umer-78.github.io/slotfill/",
      "preview": "assets/previews/slotfill.webp"
    },
    {
      "name": "fieldnote",
      "title": "Fieldnote",
      "category": "LLM engineering",
      "language": "Python",
      "summary": "Answers whose evidence exists only inside a picture: page images indexed through their own encoder (OCR run locally), retrieval across modalities, and every answer returned with a crop of where it came from.",
      "highlights": [
        "The right scanned receipt comes first for 87.5% of total questions and is in the top 5 for 99%",
        "63.5% of totals read correctly end to end, against 69% with a perfect transcription",
        "Every answer is cited with its row's crop; p95 query latency 2.3 ms at k = 20"
      ],
      "topics": [
        "python",
        "rag",
        "multimodal",
        "ocr",
        "retrieval",
        "llm"
      ],
      "demo": "https://umer-78.github.io/fieldnote/",
      "preview": "assets/previews/fieldnote.webp"
    }
  ]
};

export default site;
