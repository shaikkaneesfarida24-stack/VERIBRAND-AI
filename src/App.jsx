import { useState } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Database,
  FileText,
  ShieldAlert,
  Lightbulb,
  ClipboardCheck,
  History,
  Network,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Menu,
  ArrowUpRight,
  Sparkles,
  Package,
  Activity,
  Send,
} from "lucide-react";
import "./App.css";

const initialFacts = [
  {
    id: 1,
    product: "Organic Millet Cookies",
    brand: "Aurelia Foods",
    price: "₹199",
    category: "Food",
    status: "Approved",
  },
  {
    id: 2,
    product: "Herbal Face Wash",
    brand: "Aurelia Foods",
    price: "₹249",
    category: "Personal Care",
    status: "Approved",
  },
];

const initialRecords = [
  {
    id: 1,
    title: "Millet Cookies Price Advertisement",
    brand: "Aurelia Foods",
    score: 92,
    status: "Approved",
    date: "Today",
    finding: "Disclaimer wording needs attention",
  },
];

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Brand Knowledge Hub", icon: Database },
  { name: "Content Workspace", icon: FileText },
  { name: "Compliance Engine", icon: ShieldAlert },
  { name: "Correction Suggestions", icon: Lightbulb },
  { name: "Review & Approval", icon: ClipboardCheck },
  { name: "Verification History", icon: History },
  { name: "Brand Truth Engine", icon: ShieldCheck },
  { name: "Dependency Graph", icon: Network },
  { name: "AI Brand Assistant", icon: Sparkles },
  { name: "Scam Intelligence Centre", icon: ShieldAlert },
];

const demoScamReports = [
  {
    id: "SC-001",
    title: "Look-alike shopping website",
    type: "Website impersonation",
    target: "Aurelia Foods",
    status: "Under review",
    date: "Demo record",
    risk: "High",
    description: "A sample report describing a website that imitates a brand's identity.",
  },
  {
    id: "SC-002",
    title: "Unverified prize message",
    type: "Message / social engineering",
    target: "General public",
    status: "Reported",
    date: "Demo record",
    risk: "Medium",
    description: "A sample message claims the recipient has won a prize and requests personal details.",
  },
  {
    id: "SC-003",
    title: "Impersonation social profile",
    type: "Social media impersonation",
    target: "Aurelia Foods",
    status: "Monitoring",
    date: "Demo record",
    risk: "Medium",
    description: "A sample social profile uses a similar brand name and copied visual identity.",
  },
];
function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [facts, setFacts] = useState(initialFacts);
  const [records, setRecords] = useState(initialRecords);
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("Aurelia Foods");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [scamSearch, setScamSearch] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am VERIBRAND AI. I can help you understand brand consistency checks and content verification.",
    },
  ]);

  const approvedCount = records.filter(
    (record) => record.status === "Approved"
  ).length;

  const pendingCount = records.filter(
    (record) => record.status === "Pending"
  ).length;

  function verifyContent() {
    if (!productName.trim() || !content.trim()) {
      setResult({
        score: 0,
        status: "Incomplete",
        findings: ["Please enter both the product name and advertisement content."],
        suggestions: ["Complete the required fields and try again."],
      });
      return;
    }

    const product = facts.find(
      (fact) =>
        fact.product.toLowerCase() === productName.trim().toLowerCase()
    );

    const findings = [];
    const suggestions = [];
    let score = 100;

    if (!product) {
      findings.push("Product name was not found in the brand knowledge hub.");
      suggestions.push("Check the product name or add its approved details.");
      score -= 25;
    } else {
      if (
        product.brand.toLowerCase() !== brandName.trim().toLowerCase()
      ) {
        findings.push("Brand name does not match the approved product record.");
        suggestions.push(`Use the approved brand name: ${product.brand}.`);
        score -= 20;
      }

      if (!content.toLowerCase().includes(product.price.toLowerCase())) {
        findings.push(`Approved price ${product.price} was not found in the content.`);
        suggestions.push(`Verify the price and use ${product.price} if correct.`);
        score -= 25;
      }

      if (
        !content.toLowerCase().includes(product.product.toLowerCase())
      ) {
        findings.push("Exact approved product name is missing.");
        suggestions.push(`Include the full product name: ${product.product}.`);
        score -= 15;
      }
    }

    if (
      !content.toLowerCase().includes("terms and conditions") &&
      !content.toLowerCase().includes("conditions apply")
    ) {
      findings.push("A standard disclaimer was not detected.");
      suggestions.push("Add an appropriate disclaimer, if required.");
      score -= 10;
    }

    score = Math.max(0, score);

    const status =
      score >= 90 ? "Approved" : score >= 70 ? "Needs Review" : "Rejected";

    const finalFindings =
      findings.length > 0 ? findings : ["No issues detected by the demo checks."];

    const finalSuggestions =
      suggestions.length > 0
        ? suggestions
        : ["The submitted content matches the available demo checks."];

    const verification = {
      score,
      status,
      findings: finalFindings,
      suggestions: finalSuggestions,
    };

    setResult(verification);

    setRecords((previous) => [
      {
        id: Date.now(),
        title: `${productName} Advertisement`,
        brand: brandName,
        score,
        status: status === "Approved" ? "Approved" : "Pending",
        date: "Just now",
        finding: finalFindings[0],
      },
      ...previous,
    ]);
  }

  function addFact() {
    const name = window.prompt("Enter approved product name:");
    if (!name || !name.trim()) return;

    const brand = window.prompt("Enter brand name:", "Aurelia Foods");
    if (!brand || !brand.trim()) return;

    const price = window.prompt("Enter approved price:", "₹199");
    if (!price || !price.trim()) return;

    setFacts((previous) => [
      ...previous,
      {
        id: Date.now(),
        product: name.trim(),
        brand: brand.trim(),
        price: price.trim(),
        category: "General",
        status: "Approved",
      },
    ]);
  }

  function updateRecord(id, status) {
    setRecords((previous) =>
      previous.map((record) =>
        record.id === id ? { ...record, status } : record
      )
    );
  }

  function sendMessage() {
    if (!chatInput.trim()) return;

    const question = chatInput.trim();
    const q = question.toLowerCase();
    let reply =
      "I can explain the features in this VERIBRAND AI prototype. Try asking about approved products, prices, verification results, or scam-report examples.";

    if (q.includes("product") || q.includes("brand") || q.includes("price") || q.includes("fact")) {
      const factsText = facts
        .map((fact) => `${fact.product} — ${fact.brand} — ${fact.price} (${fact.status})`)
        .join("; ");
      reply = facts.length
        ? `Here are the brand facts currently stored in this browser session: ${factsText}. These are sample project records; confirm them with the brand owner before real-world use.`
        : "There are no brand facts saved in this session yet. Add approved information in the Brand Knowledge Hub.";
    } else if (q.includes("score") || q.includes("result") || q.includes("verification") || q.includes("compliance")) {
      reply = result
        ? `Your latest demo verification scored ${result.score}/100 with status "${result.status}". Finding: ${result.findings.join(" ")} Suggested action: ${result.suggestions.join(" ")}`
        : "No verification has been run in this session yet. Open Compliance Engine, enter a product and its content, then select Verify Content.";
    } else if (q.includes("scam") || q.includes("fraud") || q.includes("fake") || q.includes("impersonat")) {
      reply = "The Scam Intelligence Centre currently contains fictional demonstration reports only. They are not live scam alerts or independently verified incidents. Check official company channels and relevant cybercrime authorities before acting on a real report.";
    } else if (q.includes("help") || q.includes("how")) {
      reply = "You can add approved product facts in Brand Knowledge Hub, check advertisements in Compliance Engine, review results in Verification History, and explore example reports in Scam Intelligence Centre.";
    }

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
      { role: "assistant", text: reply },
    ]);
    setChatInput("");
  }
    function renderDashboard() {
    return (
      <>
        <section className="dash-hero">
          <div className="hero-copy">
            <span className="hero-tag">
              <Sparkles size={15} /> INTELLIGENT BRAND VERIFICATION
            </span>
            <h1>
              Protect your brand.
              <br />
              <span>Verify every claim.</span>
            </h1>
            <p>
              A unified workspace for checking brand facts, reviewing
              marketing content and improving brand consistency.
            </p>
            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => setActivePage("Compliance Engine")}
              >
                Start Verification <ArrowUpRight size={17} />
              </button>
              <button
                className="secondary-button"
                onClick={() => setActivePage("Brand Knowledge Hub")}
              >
                Explore Brand Facts
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-shield">
              <ShieldCheck size={85} />
            </div>
            <div className="floating-chip chip-top">
              <CheckCircle2 size={16} /> Brand Protected
            </div>
            <div className="floating-chip chip-bottom">
              <Sparkles size={16} /> Smart Verification
            </div>
          </div>
        </section>

        <div className="stats-grid premium-stats">
          <StatCard title="Brand Products" value={facts.length} icon={<Package />} />
          <StatCard title="Total Verifications" value={records.length} icon={<ShieldCheck />} />
          <StatCard title="Approved Records" value={approvedCount} icon={<CheckCircle2 />} />
          <StatCard title="Pending Reviews" value={pendingCount} icon={<Clock />} />
        </div>

        <section className="dashboard-section">
          <div className="section-intro">
            <div>
              <h2>Verification Overview</h2>
              <p>Monitor your recent brand verification activity.</p>
            </div>
            <span className="live-label">
              <Activity size={14} /> DEMO DATA
            </span>
          </div>

          <div className="dashboard-grid">
            <div className="panel analytics-panel">
              <h3>Brand Integrity Score</h3>
              <div className="score-layout">
                <div className="score-ring">
                  <div className="score-ring-inner">
                    <strong>92</strong>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="score-details">
                  <h3>Excellent</h3>
                  <p>Your sample brand profile is ready for verification.</p>
                  <span className="positive-text">
                    <CheckCircle2 size={15} /> Demo score
                  </span>
                </div>
              </div>
            </div>

            <div className="panel activity-panel">
              <h3>Recent Activity</h3>
              {records.slice(0, 3).map((record) => (
                <div className="activity-item" key={record.id}>
                  <span className="activity-icon">
                    <FileText size={18} />
                  </span>
                  <div>
                    <strong>{record.title}</strong>
                    <p>{record.date} · {record.brand}</p>
                  </div>
                  <Status status={record.status} />
                </div>
              ))}
              {records.length === 0 && <p>No activity yet.</p>}
            </div>
          </div>
        </section>

        <section className="panel workflow-panel">
          <h3>How VERIBRAND AI Works</h3>
          <div className="workflow">
            {[
              ["01", "Add Brand Facts", "Store approved product information."],
              ["02", "Submit Content", "Enter your advertisement or claim."],
              ["03", "Verify Content", "Run the prototype consistency checks."],
              ["04", "Review Results", "Check findings and suggested corrections."],
            ].map(([number, title, description]) => (
              <div className="workflow-step" key={number}>
                <span className="workflow-number">{number}</span>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderKnowledgeHub() {
    return (
      <section className="panel">
        <PageHeading
          title="Brand Knowledge Hub"
          description="Manage approved product facts and brand information."
        />
        <button className="primary-button" onClick={addFact}>
          <Plus size={17} /> Add Brand Fact
        </button>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Approved Price</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {facts.map((fact) => (
                <tr key={fact.id}>
                  <td>{fact.product}</td>
                  <td>{fact.brand}</td>
                  <td>{fact.price}</td>
                  <td>{fact.category}</td>
                  <td><Status status={fact.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderCompliance() {
    return (
      <section className="panel">
        <PageHeading
          title="Compliance Engine"
          description="Check marketing content against available approved brand facts."
        />
        <div className="form-grid">
          <label>
            Brand Name
            <input
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              placeholder="Enter brand name"
            />
          </label>
          <label>
            Product Name
            <input
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Enter exact approved product name"
            />
          </label>
        </div>
        <label className="full-label">
          Advertisement / Content
          <textarea
            rows={7}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste your advertisement or marketing content here..."
          />
        </label>
        <button className="primary-button" onClick={verifyContent}>
          <ShieldCheck size={18} /> Verify Content
        </button>

        {result && (
          <div className="result-box">
            <div className="result-header">
              <div>
                <span className="muted-label">VERIFICATION RESULT</span>
                <h2>{result.score}/100</h2>
                <Status status={result.status} />
              </div>
              <ShieldCheck size={45} />
            </div>
            <h3>Findings</h3>
            <ul>
              {result.findings.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <h3>Suggested Corrections</h3>
            <ul>
              {result.suggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }
    function renderWorkspace() {
    return (
      <section className="panel">
        <PageHeading
          title="Content Workspace"
          description="Create and submit content for verification."
        />
        <label className="full-label">
          Product
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Enter product name"
          />
        </label>
        <label className="full-label">
          Content
          <textarea
            rows={7}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write or paste your content..."
          />
        </label>
        <button
          className="primary-button"
          onClick={() => setActivePage("Compliance Engine")}
        >
          Continue to Verification <ArrowUpRight size={17} />
        </button>
      </section>
    );
  }

  function renderHistory() {
    return (
      <section className="panel">
        <PageHeading
          title="Verification History"
          description="View the verification records created in this session."
        />
        <RecordTable records={records} />
      </section>
    );
  }

  function renderReview() {
    const pending = records.filter((record) => record.status === "Pending");

    return (
      <section className="panel">
        <PageHeading
          title="Review & Approval"
          description="Review pending prototype verification records."
        />
        {pending.length === 0 ? (
          <p>No pending records. New items will appear here when they need review.</p>
        ) : (
          pending.map((record) => (
            <div className="review-item" key={record.id}>
              <div>
                <strong>{record.title}</strong>
                <p>{record.finding}</p>
                <span>Score: {record.score}/100</span>
              </div>
              <div className="review-actions">
                <button
                  className="approve-button"
                  onClick={() => updateRecord(record.id, "Approved")}
                >
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button
                  className="reject-button"
                  onClick={() => updateRecord(record.id, "Rejected")}
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
        <h3>All Records</h3>
        <RecordTable records={records} />
      </section>
    );
  }

  function renderSuggestions() {
    return (
      <section className="panel">
        <PageHeading
          title="Correction Suggestions"
          description="Review helpful corrections generated by the demo checks."
        />
        {result ? (
          <ul className="suggestion-list">
            {result.suggestions.map((item, index) => (
              <li key={index}><Lightbulb size={18} /> {item}</li>
            ))}
          </ul>
        ) : (
          <p>Run a content verification to see correction suggestions here.</p>
        )}
      </section>
    );
  }

  function renderAssistant() {
    return (
      <section className="panel assistant-panel">
        <PageHeading
          title="VERIBRAND AI Assistant"
          description="Ask about saved brand facts, demo verification results and how to use the workspace."
        />
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={index}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage();
            }}
            placeholder="Ask VERIBRAND AI..."
          />
          <button className="primary-button" onClick={sendMessage}>
            <Send size={17} />
          </button>
        </div>
        <p className="prototype-note">
          Demo assistant: replies use local rules and current session data. No external AI model or live service is connected.
        </p>
      </section>
    );
  }

  function renderScamIntelligence() {
    const filteredReports = demoScamReports.filter((report) =>
      `${report.title} ${report.type} ${report.target} ${report.status}`
        .toLowerCase()
        .includes(scamSearch.toLowerCase())
    );

    return (
      <section className="scam-page">
        <PageHeading
          title="Scam Intelligence Centre"
          description="Explore example brand-impersonation and suspicious-message reports."
        />

        <div className="scam-disclaimer">
          <ShieldAlert size={19} />
          <div>
            <strong>DEMO DATA ONLY — NOT LIVE SCAM INTELLIGENCE</strong>
            <p>All incidents below are fictional examples for demonstrating the interface. No live news feed, external threat database, or incident verification is connected.</p>
          </div>
        </div>

        <div className="stats-grid scam-stats">
          <StatCard title="Demo Reports" value={demoScamReports.length} icon={<FileText />} />
          <StatCard title="High-Risk Examples" value={demoScamReports.filter((item) => item.risk === "High").length} icon={<ShieldAlert />} />
          <StatCard title="Under Review" value={demoScamReports.filter((item) => item.status === "Under review").length} icon={<Clock />} />
          <StatCard title="Live Alerts" value="0" icon={<Activity />} />
        </div>

        <div className="panel scam-reports-panel">
          <div className="scam-toolbar">
            <div>
              <h3>Example Incident Reports</h3>
              <p>Search the sample reports shown in this prototype.</p>
            </div>
            <label className="scam-search">
              <Search size={16} />
              <input
                value={scamSearch}
                onChange={(event) => setScamSearch(event.target.value)}
                placeholder="Search reports..."
                aria-label="Search scam reports"
              />
            </label>
          </div>

          <div className="scam-report-list">
            {filteredReports.map((report) => (
              <article className="scam-report-card" key={report.id}>
                <div className="scam-report-top">
                  <span className="scam-report-id">{report.id}</span>
                  <span className={`risk-label ${report.risk.toLowerCase()}`}>{report.risk} example risk</span>
                </div>
                <h4>{report.title}</h4>
                <p>{report.description}</p>
                <div className="scam-report-meta">
                  <span><strong>Type:</strong> {report.type}</span>
                  <span><strong>Target:</strong> {report.target}</span>
                  <span><strong>Status:</strong> {report.status}</span>
                  <span>{report.date}</span>
                </div>
              </article>
            ))}
            {filteredReports.length === 0 && (
              <p>No sample reports match your search.</p>
            )}
          </div>
        </div>
      </section>
    );
  }
    function renderSimplePage(title, description) {
    return (
      <section className="panel">
        <PageHeading title={title} description={description} />
        <p>
          This section is part of the VERIBRAND AI prototype. Its dedicated
          live backend functionality has not yet been implemented.
        </p>
      </section>
    );
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();
      case "Brand Knowledge Hub":
        return renderKnowledgeHub();
      case "Content Workspace":
        return renderWorkspace();
      case "Compliance Engine":
        return renderCompliance();
      case "Correction Suggestions":
        return renderSuggestions();
      case "Review & Approval":
        return renderReview();
      case "Verification History":
        return renderHistory();
      case "Brand Truth Engine":
        return renderSimplePage(
          "Brand Truth Engine",
          "A central view of approved brand information."
        );
      case "Dependency Graph":
        return renderSimplePage(
          "Dependency Graph",
          "Explore relationships between brand facts and content."
        );
      case "AI Brand Assistant":
        return renderAssistant();
      case "Scam Intelligence Centre":
        return renderScamIntelligence();
      default:
        return renderDashboard();
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-logo">
          <span className="logo-icon"><ShieldCheck size={25} /></span>
          <span>
            <strong>VERIBRAND</strong>
            <small>AI BRAND INTELLIGENCE</small>
          </span>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`nav-item ${activePage === item.name ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="profile-avatar">V</div>
            <div>
              <strong>ZYRAVOLT</strong>
              <small>Project Workspace</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>
          <div className="topbar-right">
            <span className="prototype-pill">PROTOTYPE</span>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => window.alert("No new notifications.")}
            >
              <Bell size={19} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {renderPage()}
          <footer className="app-footer">
            <span>VERIBRAND AI · ZYRAVOLT</span>
            <span>Brand consistency prototype</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function PageHeading({ title, description }) {
  return (
    <div className="page-heading">
      <span className="eyebrow">VERIBRAND AI WORKSPACE</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function Status({ status }) {
  const approved = status === "Approved";
  const rejected = status === "Rejected";

  return (
    <span
      className={`status ${
        approved ? "approved" : rejected ? "rejected" : "pending"
      }`}
    >
      {approved ? (
        <CheckCircle2 size={14} />
      ) : rejected ? (
        <XCircle size={14} />
      ) : (
        <Clock size={14} />
      )}
      {status}
    </span>
  );
}

function RecordTable({ records }) {
  if (records.length === 0) return <p>No verification records yet.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Content</th>
            <th>Brand</th>
            <th>Score</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.title}</td>
              <td>{record.brand}</td>
              <td>{record.score}/100</td>
              <td><Status status={record.status} /></td>
              <td>{record.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;