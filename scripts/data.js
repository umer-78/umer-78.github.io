/**
 * The project list. Kept as a module rather than a fetched JSON file so the page
 * works from the filesystem as well as from a server, and so the tests can import
 * exactly what the page renders.
 */
const site = {
  "owner": "umer-78",
  "name": "Umer Hashmi",
  "tagline": "Software engineer — security tooling, machine learning, and applications that hold up under test.",
  "intro": "Every project here runs. Each one has a README with real output, a test suite, and CI that builds it on a clean machine. Pick a card to read the code.",
  "categories": [
    "Security & networking",
    "Machine learning & AI",
    "Data & analytics",
    "Applications & services",
    "Games & interactive"
  ],
  "projects": [
    {
      "name": "text-search",
      "title": "Text Search",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "A search engine from the index up: positions, BM25, phrase and boolean queries, Porter stemming and typo tolerance, with no dependencies.",
      "highlights": ["Textbook BM25 idf measures -1.4351 on a term in 10 of 12 documents \u2014 the clamped form is used instead", "Phrase search carries the query's own stopword gaps, so \"state of the art\" matches the phrase and not \"state art\"", "115 tests, standard library only"],
      "topics": ["python", "search-engine", "information-retrieval", "bm25", "inverted-index"]
    },
    {
      "name": "anomaly-detection",
      "title": "Anomaly Detection",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Statistical detectors and an isolation forest for metrics, with scoring that shows how much point-adjusted F1 flatters a detector.",
      "highlights": ["Ships a random detector to prove the point: pure noise scores 0.46 on point-adjusted F1 against a real 0.08", "Thresholds come from training scores, never from the labels being scored", "27 tests, 2,688 labelled hours with four kinds of injected fault"],
      "topics": ["python", "anomaly-detection", "monitoring", "isolation-forest", "time-series"]
    },
    {
      "name": "image-toolkit",
      "title": "Image Toolkit",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Image processing from scratch in NumPy: convolution, Gaussian and median filters, Otsu thresholding and Canny-style edges.",
      "highlights": ["True convolution and correlation kept apart \u2014 the Sobel sign difference is pinned by a test", "Separable Gaussian is 11x faster and matches the full 2D pass to 1e-13", "42 tests, three generated sample images"],
      "topics": ["python", "computer-vision", "numpy", "convolution", "edge-detection"]
    },
    {
      "name": "gradient-boosting",
      "title": "Gradient Boosting",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Gradient boosting written from scratch: histogram trees, Newton leaf values, early stopping and honest feature importance.",
      "highlights": ["Every analytic gradient checked against finite differences", "Gain importance ranks a planted noise column third of six; permutation importance scores it zero", "38 tests, early stopping that refuses to run without a held-out set"],
      "topics": ["python", "gradient-boosting", "machine-learning", "numpy", "from-scratch"]
    },
    {
      "name": "timeseries-forecasting",
      "title": "Time Series Forecasting",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Baselines, exponential smoothing, parameter search and rolling-origin backtesting with no dependencies.",
      "highlights": ["MASE scaled by the training window, so a hard test period cannot flatter a model", "A test proves no backtest fold ever sees data past its own origin", "50 tests; tuning is scored at the horizon actually forecast"],
      "topics": ["python", "time-series", "forecasting", "holt-winters", "backtesting"]
    },
    {
      "name": "recommender-engine",
      "title": "Recommender Engine",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Popularity and random baselines, item-item CF, matrix factorisation and BPR, scored on a temporal split.",
      "highlights": ["Rating-trained factorisation ranks worse than random; the same model on a pairwise loss is 13x better", "Split is by time per user \u2014 a random split leaks the future", "32 tests; coverage reported next to accuracy"],
      "topics": ["python", "recommender-system", "collaborative-filtering", "bpr", "ranking"]
    },
    {
      "name": "password-strength-checker",
      "title": "Password Strength Checker",
      "category": "Security & networking",
      "language": "Python",
      "summary": "Offline password strength analyzer: entropy, leetspeak, keyboard walks, dates and actionable feedback.",
      "highlights": [
        "Pattern detection: common passwords, leetspeak, keyboard walks, sequences, years",
        "Per-word passphrase scoring",
        "CLI with batch mode and --min-score for CI gates"
      ],
      "topics": [
        "python",
        "security",
        "cli",
        "entropy"
      ]
    },
    {
      "name": "log-sentinel",
      "title": "Log Sentinel",
      "category": "Security & networking",
      "language": "Python",
      "summary": "Detects SSH brute-force, password spraying and success-after-failure logins in Linux auth logs.",
      "highlights": [
        "Parses OpenSSH auth logs in both syslog and RFC5424 shapes",
        "Sliding-window brute force and spray detection",
        "JSON and table reporting for pipelines"
      ],
      "topics": [
        "python",
        "blue-team",
        "ssh",
        "intrusion-detection"
      ]
    },
    {
      "name": "file-integrity-monitor",
      "title": "File Integrity Monitor",
      "category": "Security & networking",
      "language": "Python",
      "summary": "SHA-256 baselines with HMAC signing, change detection and a watch mode.",
      "highlights": [
        "Baselines are HMAC-signed, so a tampered baseline is detected too",
        "Reports added, modified, removed and permission-changed files",
        "Watch mode for continuous checking"
      ],
      "topics": [
        "python",
        "integrity",
        "hashing",
        "monitoring"
      ]
    },
    {
      "name": "security-headers-scanner",
      "title": "Security Headers Scanner",
      "category": "Security & networking",
      "language": "Python",
      "summary": "Grades a site's HTTP security headers and cookies A–F, with the exact fix for each finding.",
      "highlights": [
        "Checks CSP, HSTS, frame options, referrer policy, permissions policy and cookie flags",
        "Every finding comes with the header line that fixes it",
        "Exit codes make it a CI gate; tests run against a local server, no internet needed"
      ],
      "topics": [
        "python",
        "http",
        "headers",
        "csp"
      ]
    },
    {
      "name": "subnet-calculator",
      "title": "IPv4 Subnet Calculator",
      "category": "Security & networking",
      "language": "JavaScript",
      "summary": "Subnet, equal-split and VLSM calculator in the browser. No framework, tested core.",
      "highlights": [
        "VLSM allocation that fits the largest requirement first",
        "Equal-split mode with usable-host counts",
        "The maths module has no DOM in it and is unit tested"
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
      "summary": "End-to-end churn prediction: reproducible dataset, feature pipeline, four models compared honestly.",
      "highlights": [
        "Four models compared on the same split, with the baseline shown too",
        "Threshold chosen from the cost of a false negative, not from accuracy",
        "Feature importance and calibration plots generated by the pipeline"
      ],
      "topics": [
        "python",
        "scikit-learn",
        "classification",
        "churn"
      ]
    },
    {
      "name": "neural-network-from-scratch",
      "title": "Neural Network From Scratch",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Feed-forward network in pure NumPy: hand-derived backprop verified by numerical gradient checking.",
      "highlights": [
        "Every gradient is checked against a numerical estimate — the test fails if the maths is wrong",
        "ReLU, sigmoid, softmax, cross-entropy and L2, all written out",
        "Trains on real data and reports the confusion matrix"
      ],
      "topics": [
        "python",
        "numpy",
        "backpropagation",
        "deep-learning"
      ]
    },
    {
      "name": "sentiment-analyzer",
      "title": "Sentiment Analyzer",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Naive Bayes sentiment classifier written from scratch, with a review-aware tokeniser.",
      "highlights": [
        "From-scratch model scored beside scikit-learn's on the same data",
        "Handles negation scope, so \"not good\" is not read as \"good\"",
        "Per-prediction explanation showing the words that decided it"
      ],
      "topics": [
        "python",
        "nlp",
        "naive-bayes",
        "text-classification"
      ]
    },
    {
      "name": "rag-document-qa",
      "title": "RAG Document Q&A",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Ask questions about your own documents: structure-aware chunking, BM25 + TF-IDF hybrid retrieval, cited answers.",
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
      ]
    },
    {
      "name": "ml-model-serving-api",
      "title": "ML Model Serving API",
      "category": "Machine learning & AI",
      "language": "Python",
      "summary": "Production-shaped FastAPI service for a scikit-learn model: validation, versioning and rollback.",
      "highlights": [
        "Pydantic v2 request validation with useful error bodies",
        "Model versioning with rollback to the previous artifact",
        "Health, readiness and metrics endpoints; batch prediction"
      ],
      "topics": [
        "python",
        "fastapi",
        "mlops",
        "rest-api"
      ]
    },
    {
      "name": "mini-sql-engine",
      "title": "minisql — a SQL engine",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "A SQL engine written from scratch: tokenizer, recursive-descent parser and executor, running SELECT queries over CSV files.",
      "highlights": ["Joins, grouping, aggregates, ordering and three-valued NULL logic — no SQLite underneath", "Parse errors point at the character that caused them", "113 tests at 94% coverage, no dependencies"],
      "topics": ["python", "sql", "parser", "query-engine", "interpreter"]
    },
    {
      "name": "sales-insights",
      "title": "Sales Insights",
      "category": "Data & analytics",
      "language": "Python",
      "summary": "Sales analysis in pandas: cleaning with an audit trail, cohort retention, RFM segmentation, seasonality.",
      "highlights": [
        "Cleaning writes an audit trail: every row dropped is counted and explained",
        "Cohort retention and RFM segmentation",
        "Generates a chart pack from the committed dataset"
      ],
      "topics": [
        "python",
        "pandas",
        "analytics",
        "cohort-analysis",
        "rfm"
      ]
    },
    {
      "name": "ta-indicators",
      "title": "TA Indicators",
      "category": "Data & analytics",
      "language": "TypeScript",
      "summary": "Dependency-free technical analysis indicators in strict TypeScript: SMA, EMA, RSI, MACD, Bollinger and more.",
      "highlights": [
        "Values checked against published worked examples, not against itself",
        "Streaming-friendly: feed one candle at a time",
        "No dependencies, works in Node and the browser"
      ],
      "topics": [
        "typescript",
        "technical-analysis",
        "trading",
        "indicators"
      ]
    },
    {
      "name": "bank-ledger-csharp",
      "title": "Bank Ledger",
      "category": "Applications & services",
      "language": "C#",
      "summary": "Append-only account ledger in C#/.NET 8: decimal money, overdrafts, transfers, interest, statements, CSV.",
      "highlights": [
        "Money is decimal with a currency guard — the test that 0.1 + 0.2 is 0.3 fails the day someone uses double",
        "Entries are never edited; a reversal is its own entry",
        "audit replays every entry from zero to prove the balance still agrees"
      ],
      "topics": [
        "csharp",
        "dotnet",
        "ledger",
        "xunit"
      ]
    },
    {
      "name": "kv-store",
      "title": "kv — a storage engine",
      "category": "Applications & services",
      "language": "Go",
      "summary": "A log-structured key-value store: write-ahead log, memtable, SSTables with bloom filters, compaction and crash recovery.",
      "highlights": ["Reading an absent key is 50x faster than a present one \u2014 the bloom filter answers 82% of lookups without a disk read", "A torn record after a crash is discarded; damage mid-file is reported rather than skipped", "56 tests, all passing under the race detector"],
      "topics": ["go", "database", "lsm-tree", "storage-engine", "bloom-filter"]
    },
    {
      "name": "loadgun",
      "title": "loadgun",
      "category": "Applications & services",
      "language": "Go",
      "summary": "HTTP load testing tool: worker pool, rate cap, latency percentiles and histogram, with a non-zero exit code for CI.",
      "highlights": ["Nearest-rank percentiles \u2014 p95 is a latency that actually happened", "Failed requests are counted, but kept out of the latency distribution", "48 tests at 94% coverage on the runner, all passing under the race detector"],
      "topics": ["go", "load-testing", "performance", "concurrency", "cli"]
    },
    {
      "name": "url-shortener-go",
      "title": "URL Shortener",
      "category": "Applications & services",
      "language": "Go",
      "summary": "URL shortener in Go: JSON API, redirects, visit counting, custom codes, expiring links, single binary.",
      "highlights": [
        "Visit counting is an atomic UPDATE, so 50 concurrent hits count 50",
        "SQLite with no cgo; the whole service is one static binary",
        "Distroless non-root Docker image"
      ],
      "topics": [
        "go",
        "sqlite",
        "rest-api",
        "docker"
      ]
    },
    {
      "name": "inventory-management-system",
      "title": "Inventory Management",
      "category": "Applications & services",
      "language": "Python",
      "summary": "Stock control on a movement-ledger design: products, suppliers, purchase orders, valuation, reorder alerts.",
      "highlights": [
        "Stock on hand is derived from movements, never a field that can drift",
        "Weighted-average valuation and reorder-point alerts",
        "SQLite schema with foreign keys and CHECK constraints"
      ],
      "topics": [
        "python",
        "sqlite",
        "inventory",
        "erp"
      ]
    },
    {
      "name": "project-tracker",
      "title": "Project Tracker",
      "category": "Applications & services",
      "language": "JavaScript",
      "summary": "Team project management: kanban with drag and drop, sprints, burndown, workload and roles.",
      "highlights": [
        "Sprint planning with a burndown chart drawn from the task history",
        "Workload view per assignee",
        "Role-based permissions; state is kept in one place and rendered from it"
      ],
      "topics": [
        "javascript",
        "kanban",
        "project-management",
        "dashboard"
      ]
    },
    {
      "name": "task-board",
      "title": "Task Board",
      "category": "Applications & services",
      "language": "TypeScript",
      "summary": "Kanban board in React and TypeScript: keyboard moves as well as drag and drop, inline tags, filtering.",
      "highlights": [
        "Every drag has a keyboard equivalent, so the board is usable without a mouse",
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
      "name": "weather-now",
      "title": "Weather Now",
      "category": "Applications & services",
      "language": "JavaScript",
      "summary": "Weather dashboard on the keyless Open-Meteo API: current conditions, hourly strip, seven-day outlook.",
      "highlights": [
        "No API key, so it runs anywhere",
        "Hourly strip starts at the current hour, not at midnight",
        "Geocoding search with keyboard navigation"
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
      "summary": "Installable crypto markets site: live prices, charts, signals, multi-year comparison and an on-device forecast.",
      "highlights": [
        "Works offline as an installed app (service worker, manifest)",
        "Falls back to a second exchange when the first is unreachable",
        "No API keys, no trading, no wallet access"
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
      "summary": "Unity maze game: procedurally generated levels, enemies with line of sight, collectibles and traps.",
      "highlights": [
        "Recursive-backtracker maze carved at runtime",
        "Enemies check line of sight before firing",
        "Per-scene game manager: levels reset cleanly instead of leaking state"
      ],
      "topics": [
        "unity",
        "csharp",
        "game-development",
        "3d"
      ]
    }
  ]
};

export default site;
