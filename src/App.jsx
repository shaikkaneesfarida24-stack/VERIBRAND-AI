import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./utils/supabase";
import {
  ShieldCheck, LayoutDashboard, Database, FileText, ShieldAlert,
  Lightbulb, ClipboardCheck, History, Network, Search, CheckCircle2,
  XCircle, Clock, Plus, Menu, ArrowUpRight, Sparkles, Package,
  Activity, Send, LogOut, User, Save, RefreshCw, Trash2, Pencil,
  Download, Link2, AlertTriangle, Filter, Lock, Mail, Building2,
  ChevronRight
} from "lucide-react";
import "./App.css";

/*
 * VERIBRAND AI — ROUND 3 BUILD
 *
 * Improvement 1: Persistent Brand Knowledge Base
 * Improvement 2: Explainable rule-based Verification Engine
 * Improvement 3: Evidence-based Brand Risk Intelligence
 *
 * Existing tables:
 *   brand_facts
 *   verification_records
 *
 * New table required:
 *   scam_reports (SQL provided after Part 3)
 *
 * This is a transparent prototype. It does not connect to a live AI model,
 * legal certification service, or external threat-intelligence feed.
 */

const DEMO_FACTS = [
  {
    id: "demo-fact-1",
    product: "Organic Millet Cookies",
    brand: "Aurelia Foods",
    price: 199,
    category: "Food",
    status: "Approved",
    isDemo: true,
  },
  {
    id: "demo-fact-2",
    product: "Herbal Face Wash",
    brand: "Aurelia Foods",
    price: 249,
    category: "Personal Care",
    status: "Approved",
    isDemo: true,
  },
];

const DEMO_RECORDS = [
  {
    id: "demo-record-1",
    title: "Millet Cookies Price Advertisement",
    brand: "Aurelia Foods",
    score: 92,
    status: "Approved",
    date: "Demo record",
    findings: ["Sample disclaimer wording needs attention."],
    suggestions: ["Review the disclaimer before publishing."],
    evidence: ["Illustrative record used to demonstrate the dashboard."],
    isDemo: true,
  },
];

const DEMO_SCAMS = [
  {
    id: "DEMO-001",
    title: "Look-alike shopping website",
    report_type: "Website impersonation",
    target: "Aurelia Foods",
    status: "Example only",
    risk: "High",
    description: "A fictional example of a website imitating a brand identity.",
    evidence_url: "",
    isDemo: true,
  },
  {
    id: "DEMO-002",
    title: "Unverified prize message",
    report_type: "Message / social engineering",
    target: "General public",
    status: "Example only",
    risk: "Medium",
    description: "A fictional message requests personal details to claim a prize.",
    evidence_url: "",
    isDemo: true,
  },
  {
    id: "DEMO-003",
    title: "Impersonation social profile",
    report_type: "Social media impersonation",
    target: "Aurelia Foods",
    status: "Example only",
    risk: "Medium",
    description: "A fictional profile uses a similar brand name and visual identity.",
    evidence_url: "",
    isDemo: true,
  },
];

const NAVIGATION = [
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
  { name: "Scam Intelligence Centre", icon: AlertTriangle },
  { name: "User Profile", icon: User },
];

const normalize = (value = "") =>
  String(value).trim().toLocaleLowerCase().replace(/\s+/g, " ");

const parsePrice = (value) => {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/[₹,]/g, "")
    .replace(/^rs\.?\s*/i, "")
    .replace(/^inr\s*/i, "");

  if (!cleaned) return null;

  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};



const hasPriceMention = (text, price) => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return false;

  const escapedAmount = String(amount).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const pattern = new RegExp(
    `(^|[^\\d.])(?:₹\\s*|rs\\.?\\s*|inr\\s*)?${escapedAmount}(?:\\.0+)?(?!\\d|\\.\\d)`,
    "i"
  );

  return pattern.test(String(text ?? "").replace(/,/g, ""));
};



function App() {
  // ---------------- AUTHENTICATION ----------------
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
 

  // ---------------- NAVIGATION AND DATA ----------------
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [facts, setFacts] = useState(DEMO_FACTS);
  const [records, setRecords] = useState(DEMO_RECORDS);
  const [scamReports, setScamReports] = useState(DEMO_SCAMS);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState("");
  const [factSearch, setFactSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scamSearch, setScamSearch] = useState("");

  // ---------------- VERIFICATION WORKSPACE ----------------
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("Aurelia Foods");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [verifyBusy, setVerifyBusy] = useState(false);

  // ---------------- SCAM REPORT FORM ----------------
  const [scamTitle, setScamTitle] = useState("");
  const [scamType, setScamType] = useState("Website impersonation");
  const [scamTarget, setScamTarget] = useState("");
  const [scamDescription, setScamDescription] = useState("");
  const [scamEvidenceUrl, setScamEvidenceUrl] = useState("");
  const [scamRisk, setScamRisk] = useState("Medium");
  const [scamBusy, setScamBusy] = useState(false);

  // ---------------- ASSISTANT ----------------
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to VERIBRAND AI. I can explain brand facts, verification results, review workflows and project features. I use predefined demo rules, not a live AI model.",
    },
  ]);

  // ---------------- PROFILE ----------------
  const [profileName, setProfileName] = useState("");
  const [organization, setOrganization] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  // ---------------- DERIVED DATA ----------------
  const realFacts = useMemo(
    () => facts.filter((item) => !item.isDemo),
    [facts]
  );

  const realRecords = useMemo(
    () => records.filter((item) => !item.isDemo),
    [records]
  );

  const realScamReports = useMemo(
    () => scamReports.filter((item) => !item.isDemo),
    [scamReports]
  );

  const approvedCount = realRecords.filter(
    (record) => record.status === "Approved"
  ).length;

  const pendingCount = realRecords.filter(
    (record) => ["Pending", "Needs Review"].includes(record.status)
  ).length;

  const rejectedCount = realRecords.filter(
    (record) => record.status === "Rejected"
  ).length;

  const highRiskCount = realScamReports.filter(
  (report) => ["High", "Critical"].includes(report.risk)
).length;

  // ---------------- AUTH INITIALISATION ----------------
  useEffect(() => {
    let active = true;

    async function initialiseAuth() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) setAuthMessage(error.message);
      setSession(data?.session || null);
      setAuthLoading(false);
    }

    initialiseAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------------- LOAD SUPABASE DATA ----------------
  const loadDatabaseData = useCallback(async (userId) => {

const parseFindingsData = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  return value;
};

const getFindings = (value) => {
  const data = parseFindingsData(value);

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.findings)) {
    return data.findings;
  }

  return [];
};

const getEvidence = (value) => {
  const data = parseFindingsData(value);

  if (!data) return [];

  if (Array.isArray(data)) {
    return data.flatMap((item) => {
      if (Array.isArray(item?.evidence)) return item.evidence;
      return item?.evidence ? [item.evidence] : [];
    });
  }

  return Array.isArray(data.evidence) ? data.evidence : [];
};

    if (!userId) return;

    setDataLoading(true);
    setDataMessage("");

    try {
      const [factsResponse, recordsResponse, scamsResponse] =
        await Promise.all([
          supabase
            .from("brand_facts")
            .select("*")
            .eq("owner_id", userId)
            .order("created_at", { ascending: false }),

          supabase
            .from("verification_records")
            .select("*")
            .eq("owner_id", userId)
            .order("created_at", { ascending: false }),

          supabase
            .from("scam_reports")
            .select("*")
            .eq("owner_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      const errors = [];

      if (factsResponse.error) {
        errors.push(`Brand facts: ${factsResponse.error.message}`);
      } else {
        const savedFacts = (factsResponse.data || []).map((item) => ({
          id: item.id,
          product: item.product_name,
          brand: item.brand_name,
          price: item.price ?? "",
          category: item.category || "General",
          status: item.status || "Approved",
          isDemo: false,
        }));

        setFacts([...savedFacts, ...DEMO_FACTS]);
      }

      if (recordsResponse.error) {
        errors.push(`History: ${recordsResponse.error.message}`);
      } else {
        const savedRecords = (recordsResponse.data || []).map((item) => ({
          id: item.id,
          title: item.title,
          brand: item.category || "Brand not specified",
          score: item.score,
          status: item.status || "Pending",
          date: item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "Date unavailable",
          findings: getFindings(item.findings),
          evidence: getEvidence(item.findings),
          suggestions: Array.isArray(item.suggestions)
            ? item.suggestions
            : [],
          content: item.content || "",
          isDemo: false,
        }));

        setRecords([...savedRecords, ...DEMO_RECORDS]);
      }

      if (scamsResponse.error) {
        errors.push(`Scam reports: ${scamsResponse.error.message}`);
      } else {
        const savedReports = (scamsResponse.data || []).map((item) => ({
          id: item.id,
          title: item.title,
          report_type: item.report_type,
          target: item.target || "Not specified",
          description: item.description,
          evidence_url: item.evidence_url || "",
          risk: item.risk,
          status: item.status || "Submitted",
          date: item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "Date unavailable",
          isDemo: false,
        }));

        setScamReports([...savedReports, ...DEMO_SCAMS]);
      }

      setDataMessage(
        errors.length
          ? errors.join(" | ")
          : "Workspace data is up to date."
      );
    } catch (error) {
      setDataMessage(`Could not load account data: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setFacts(DEMO_FACTS);
      setRecords(DEMO_RECORDS);
      setScamReports(DEMO_SCAMS);
      return;
    }

    const metadata = session.user.user_metadata || {};
    setProfileName(metadata.full_name || "");
    setOrganization(metadata.organization || "");
    loadDatabaseData(session.user.id);
  }, [session?.user?.id, loadDatabaseData]);

  // ---------------- LOGIN AND SIGNUP ----------------
  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");
    setAuthBusy(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              full_name: authName.trim(),
              organization: "",
            },
          },
        });

        if (error) throw error;

        setAuthMessage(
          data.session
            ? "Account created successfully."
            : "Account created. Check your email and confirm your account before logging in."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;
      }
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setSession(null);
    setActivePage("Dashboard");
    setResult(null);
  }

  // ---------------- PROFILE ----------------
  async function saveProfile() {
    if (!session?.user) return;

    setProfileBusy(true);
    setProfileMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profileName.trim(),
        organization: organization.trim(),
      },
    });

    setProfileMessage(
      error ? error.message : "Profile updated successfully."
    );

    setProfileBusy(false);
  }

  // ---------------- BRAND KNOWLEDGE HUB ----------------
  async function addFact() {
    const product = window.prompt("Enter approved product name:");
    if (!product?.trim()) return;

    const brand = window.prompt("Enter brand name:");
    if (!brand?.trim()) return;

    const priceInput = window.prompt(
      "Enter approved price using numbers only (example: 199):"
    );

    if (priceInput === null) return;

    const numericPrice = parsePrice(priceInput);

    if (numericPrice === null) {
      setDataMessage("Enter a valid numeric price, for example 199.");
      return;
    }

    const category =
      window.prompt("Enter category (example: Food):")?.trim() || "General";

    if (!session?.user?.id) {
      setDataMessage("Please log in to save a brand fact.");
      return;
    }

    setDataMessage("Saving brand fact...");

    const { data, error } = await supabase
      .from("brand_facts")
      .insert({
        owner_id: session.user.id,
        product_name: product.trim(),
        brand_name: brand.trim(),
        price: numericPrice,
        category,
        status: "Approved",
      })
      .select()
      .single();

    if (error) {
      setDataMessage(`Could not save brand fact: ${error.message}`);
      return;
    }

    setFacts((current) => [
      {
        id: data.id,
        product: data.product_name,
        brand: data.brand_name,
        price: data.price ?? "",
        category: data.category || "General",
        status: data.status || "Approved",
        isDemo: false,
      },
      ...current,
    ]);

    setDataMessage("Brand fact saved successfully.");
  }

  async function editFact(fact) {
    if (fact.isDemo) {
      setDataMessage("Demo facts are read-only.");
      return;
    }

    const product = window.prompt(
      "Update product name:",
      fact.product
    );
    if (!product?.trim()) return;

    const brand = window.prompt("Update brand name:", fact.brand);
    if (!brand?.trim()) return;

    const priceInput = window.prompt(
      "Update approved price using numbers only:",
      String(fact.price ?? "")
    );

    if (priceInput === null) return;

    const numericPrice = parsePrice(priceInput);

    if (numericPrice === null) {
      setDataMessage("Enter a valid numeric price, for example 199.");
      return;
    }

    const category =
      window.prompt("Update category:", fact.category)?.trim() ||
      "General";

    const { data, error } = await supabase
      .from("brand_facts")
      .update({
        product_name: product.trim(),
        brand_name: brand.trim(),
        price: numericPrice,
        category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fact.id)
      .eq("owner_id", session.user.id)
      .select()
      .single();

    if (error) {
      setDataMessage(`Could not update fact: ${error.message}`);
      return;
    }

    setFacts((current) =>
      current.map((item) =>
        item.id === fact.id
          ? {
              ...item,
              product: data.product_name,
              brand: data.brand_name,
              price: data.price ?? "",
              category: data.category,
              status: data.status,
            }
          : item
      )
    );

    setDataMessage("Brand fact updated.");
  }

  async function deleteFact(fact) {
    if (fact.isDemo) {
      setDataMessage("Demo facts cannot be deleted.");
      return;
    }

    if (!window.confirm(`Delete the approved fact for "${fact.product}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("brand_facts")
      .delete()
      .eq("id", fact.id)
      .eq("owner_id", session.user.id);

    if (error) {
      setDataMessage(`Could not delete fact: ${error.message}`);
      return;
    }

    setFacts((current) =>
      current.filter((item) => item.id !== fact.id)
    );

    setDataMessage("Brand fact deleted.");
  }
    // ---------------- EXPLAINABLE VERIFICATION ENGINE ----------------
  async function verifyContent() {
    if (!productName.trim() || !brandName.trim() || !content.trim()) {
      setResult({
        score: 0,
        status: "Incomplete",
        evidence: [
          "Verification was not run because required fields are missing.",
        ],
        findings: [
          "Brand name, product name and content are required.",
        ],
        suggestions: [
          "Complete all three fields and run verification again.",
        ],
      });
      return;
    }

    setVerifyBusy(true);
    setDataMessage("");

    try {
      const product = facts.find(
        (fact) =>
          normalize(fact.product) === normalize(productName) &&
          fact.status === "Approved"
      );

      const findings = [];
      const suggestions = [];
      const evidence = [];
      let score = 100;

      if (!product) {
        findings.push(
          "No approved product fact matched the submitted product name."
        );
        suggestions.push(
          "Add the correct product to the Brand Knowledge Hub or check its spelling."
        );
        evidence.push(
          `Submitted product: "${productName.trim()}". No exact approved match was found.`
        );
        score -= 35;
      } else {
        evidence.push(
          `Approved reference matched: ${product.product}; brand: ${product.brand}; price: ${formatPrice(product.price)}.`
        );

        if (normalize(product.brand) !== normalize(brandName)) {
          findings.push(
            "Submitted brand name differs from the approved brand record."
          );
          suggestions.push(
            `Use the approved brand name "${product.brand}".`
          );
          evidence.push(
            `Submitted brand: "${brandName.trim()}"; approved brand: "${product.brand}".`
          );
          score -= 25;
        } else {
          evidence.push("Submitted brand matches the approved brand record.");
        }

        if (
          product.price !== null &&
          product.price !== undefined &&
          product.price !== ""
        ) {
          console.log("PRICE DEBUG:", {
  content: content,
  rawPrice: product.price,
  priceType: typeof product.price,
  numericPrice: Number(product.price),
  detected: hasPriceMention(content, product.price)
});
          if (!hasPriceMention(content, product.price)) {
            findings.push(
              "The approved price was not found in the submitted content."
            );
            suggestions.push(
              `Check whether the advertisement should display the approved price ${formatPrice(product.price)}.`
            );
            evidence.push(
              `Expected price reference: ${formatPrice(product.price)}.`
            );
            score -= 20;
          } else {
            evidence.push(
              `The approved price ${formatPrice(product.price)} was detected in the content.`
            );
          }
        } else {
          evidence.push(
            "No approved price is stored for this product; price verification was skipped."
          );
        }

        if (!normalize(content).includes(normalize(product.product))) {
          findings.push(
            "The exact approved product name is not present in the content."
          );
          suggestions.push(
            `Include the exact product name "${product.product}".`
          );
          evidence.push(`Expected product name: "${product.product}".`);
          score -= 10;
        } else {
          evidence.push("The exact approved product name was detected.");
        }
      }

      const disclaimerFound =
        normalize(content).includes("terms and conditions") ||
        normalize(content).includes("conditions apply");

      if (!disclaimerFound) {
        findings.push("No standard disclaimer phrase was detected.");
        suggestions.push(
          "Check whether a disclaimer is required and add the approved wording when applicable."
        );
        evidence.push(
          'Neither "terms and conditions" nor "conditions apply" was detected.'
        );
        score -= 10;
      } else {
        evidence.push("A standard disclaimer phrase was detected.");
      }

      score = Math.max(0, Math.min(100, score));

      const status =
        score >= 90
          ? "Approved"
          : score >= 70
            ? "Needs Review"
            : "Rejected";

      const finalResult = {
        score,
        status,
        evidence,
        findings:
          findings.length > 0
            ? findings
            : [
                "No inconsistencies were detected by the available prototype checks.",
              ],
        suggestions:
          suggestions.length > 0
            ? suggestions
            : [
                "The content passed the available rule-based checks. Complete a human review before publishing.",
              ],
      };

      setResult(finalResult);

      if (!session?.user?.id) {
        setDataMessage(
          "Verification completed. Log in to save this result to your account."
        );
        return;
      }

      const { data, error } = await supabase
        .from("verification_records")
        .insert({
          owner_id: session.user.id,
          title: `${productName.trim()} Advertisement`,
          content: content.trim(),
          category: brandName.trim(),
          format: "Advertisement",
          score,
          status,
          findings: {
            items: finalResult.findings,
            evidence: finalResult.evidence,
          },
          suggestions: finalResult.suggestions,
        })
        .select()
        .single();

      if (error) {
        setDataMessage(
          `Verification completed, but saving failed: ${error.message}`
        );
      } else {
        setRecords((current) => [
          {
            id: data.id,
            title: data.title,
            brand: data.category,
            score: data.score,
            status: data.status,
            date: new Date(data.created_at).toLocaleString(),
            findings: finalResult.findings,
            evidence: finalResult.evidence,
            suggestions: finalResult.suggestions,
            content: data.content,
            isDemo: false,
          },
          ...current,
        ]);

        setDataMessage(
          "Verification completed and saved to your account."
        );
      }
    } catch (error) {
      setDataMessage(`Verification error: ${error.message}`);
    } finally {
      setVerifyBusy(false);
    }
  }

  // ---------------- REVIEW WORKFLOW ----------------
  async function updateRecord(record, nextStatus) {
    if (record.isDemo) {
      setDataMessage("Demo records are read-only.");
      return;
    }

    const { error } = await supabase
      .from("verification_records")
      .update({ status: nextStatus })
      .eq("id", record.id)
      .eq("owner_id", session.user.id);

    if (error) {
      setDataMessage(`Could not update review status: ${error.message}`);
      return;
    }

    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setDataMessage(`Record marked as ${nextStatus}.`);
  }

  function exportRecords() {
    const rows = [
      ["Title", "Brand", "Score", "Status", "Date", "Findings"],
      ...realRecords.map((record) => [
        record.title,
        record.brand,
        record.score,
        record.status,
        record.date,
        (record.findings || []).join("; "),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "veribrand-verification-history.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  // ---------------- IMPROVEMENT 3: SCAM REPORT SUBMISSION ----------------
  async function submitScamReport(event) {
    event.preventDefault();

    if (!session?.user?.id) {
      setDataMessage("Please log in to submit a report.");
      return;
    }

    if (
      !scamTitle.trim() ||
      !scamTarget.trim() ||
      !scamDescription.trim()
    ) {
      setDataMessage("Enter the report title, target and description.");
      return;
    }

    if (scamEvidenceUrl.trim()) {
      try {
        const parsedUrl = new URL(scamEvidenceUrl.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        setDataMessage(
          "Enter a valid evidence link beginning with https:// or http://."
        );
        return;
      }
    }

    setScamBusy(true);
    setDataMessage("Submitting incident report...");

    try {
      const { data, error } = await supabase
        .from("scam_reports")
        .insert({
          owner_id: session.user.id,
          title: scamTitle.trim(),
          report_type: scamType,
          target: scamTarget.trim(),
          description: scamDescription.trim(),
          evidence_url: scamEvidenceUrl.trim() || null,
          risk: scamRisk,
          status: "Submitted",
        })
        .select()
        .single();

      if (error) throw error;

      const newReport = {
        id: data.id,
        title: data.title,
        report_type: data.report_type,
        target: data.target,
        description: data.description,
        evidence_url: data.evidence_url || "",
        risk: data.risk,
        status: data.status,
        date: new Date(data.created_at).toLocaleString(),
        isDemo: false,
      };

      setScamReports((current) => [newReport, ...current]);

      setScamTitle("");
      setScamType("Website impersonation");
      setScamTarget("");
      setScamDescription("");
      setScamEvidenceUrl("");
      setScamRisk("Medium");

      setDataMessage(
        "Report submitted successfully and saved to your workspace."
      );
    } catch (error) {
      setDataMessage(`Could not submit report: ${error.message}`);
    } finally {
      setScamBusy(false);
    }
  }

  async function updateScamStatus(report, nextStatus) {
    if (report.isDemo) {
      setDataMessage("Demo reports are read-only.");
      return;
    }

    const { error } = await supabase
      .from("scam_reports")
      .update({ status: nextStatus })
      .eq("id", report.id)
      .eq("owner_id", session.user.id);

    if (error) {
      setDataMessage(`Could not update report: ${error.message}`);
      return;
    }

    setScamReports((current) =>
      current.map((item) =>
        item.id === report.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setDataMessage(`Incident report marked as ${nextStatus}.`);
  }

  // ---------------- LOCAL PROJECT ASSISTANT ----------------
  function getAssistantReply(question) {
    const q = normalize(question);

    if (/^(hi|hello|hey)\b/.test(q)) {
      return "Hello! Ask me about the Brand Knowledge Hub, verification results, review workflows, evidence or project features.";
    }

    if (
      q.includes("what is veribrand") ||
      q.includes("purpose") ||
      q.includes("about")
    ) {
      return "VERIBRAND AI is a brand-governance prototype. It stores approved brand facts, compares marketing content against those facts, explains detected mismatches and supports a human review workflow.";
    }

    if (q.includes("brand fact") || q.includes("knowledge hub")) {
      return `The Brand Knowledge Hub stores approved product names, brand names, prices and categories. Your account currently has ${realFacts.length} saved facts, plus ${DEMO_FACTS.length} sample facts.`;
    }

    if (
      q.includes("verify") ||
      q.includes("compliance") ||
      q.includes("score")
    ) {
      return "Open Compliance Engine, enter the brand, exact approved product name and advertisement text, then select Verify Content. The score comes from visible rule-based checks. It is a prototype assessment, not legal approval or proof of authenticity.";
    }

    if (q.includes("review") || q.includes("approve") || q.includes("reject")) {
      return "Open Review & Approval. Records marked Pending or Needs Review can be reviewed by a signed-in workspace user. Approve or Reject saves the decision to Supabase.";
    }

    if (q.includes("scam") || q.includes("fraud") || q.includes("fake")) {
      return "The Scam Intelligence Centre accepts workspace incident reports with a risk category and an evidence link. Reports are saved in Supabase and have a review status. Sample incidents are fictional; there is no live threat feed.";
    }

    if (q.includes("evidence")) {
      return "A report can include an HTTP or HTTPS evidence reference. The link is stored with the report. This prototype does not upload or preserve the external file itself.";
    }

    if (q.includes("dependency") || q.includes("graph")) {
      return "The Dependency Graph derives relationships from saved brand facts and verification records. It is not an external graph-intelligence service.";
    }

    if (q.includes("truth engine")) {
      return "The Brand Truth Engine presents approved reference facts stored in the workspace. Verification compares submitted content against these records.";
    }

    if (q.includes("data") || q.includes("save") || q.includes("database")) {
      return "Signed-in brand facts, verification records and scam reports are stored in Supabase under the authenticated user's owner_id. Row Level Security should be enabled for each table.";
    }

    if (q.includes("help") || q.includes("features")) {
      return "Main features: persistent Brand Knowledge Hub, explainable verification, human review, verification history, dependency view, assistant and evidence-based incident reporting.";
    }

    return "I can explain the project workflow and its current features. Try: How does verification work? What are brand facts? How do I submit an incident report?";
  }

  function sendMessage(question = chatInput) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const reply = getAssistantReply(cleanQuestion);

    setMessages((current) => [
      ...current,
      { role: "user", text: cleanQuestion },
      { role: "assistant", text: reply },
    ]);

    setChatInput("");
  }

  // ---------------- DASHBOARD ----------------
  function renderDashboard() {
    const recent = records.slice(0, 5);

    return (
      <>
        <section className="dash-hero">
          <div className="hero-copy">
            <span className="hero-tag">
              <Sparkles size={15} /> INTELLIGENT BRAND GOVERNANCE
            </span>

            <h1>
              Protect your brand.<br />
              <span>Verify every claim.</span>
            </h1>

            <p>
              A workspace for managing approved brand facts, checking
              marketing content and reviewing consistency issues with
              explainable evidence.
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
              <CheckCircle2 size={16} /> Evidence-based checks
            </div>
            <div className="floating-chip chip-bottom">
              <Sparkles size={16} /> Human review workflow
            </div>
          </div>
        </section>

        <div className="stats-grid premium-stats">
          <StatCard
            title="Saved Brand Facts"
            value={realFacts.length}
            icon={<Package />}
          />
          <StatCard
            title="Real Verifications"
            value={realRecords.length}
            icon={<ShieldCheck />}
          />
          <StatCard
            title="Approved Records"
            value={approvedCount}
            icon={<CheckCircle2 />}
          />
          <StatCard
            title="Awaiting Review"
            value={pendingCount}
            icon={<Clock />}
          />
        </div>

        <section className="dashboard-section">
          <div className="section-intro">
            <div>
              <h2>Workspace Overview</h2>
              <p>Recent account activity and verification outcomes.</p>
            </div>
            <span className="live-label">
              <Activity size={14} /> ACCOUNT WORKSPACE
            </span>
          </div>

          <div className="dashboard-grid">
            <div className="panel analytics-panel">
              <h3>Verification Status</h3>

              <div className="score-layout">
                <div className="score-ring">
                  <div className="score-ring-inner">
                    <strong>{realRecords.length}</strong>
                    <span>records</span>
                  </div>
                </div>

                <div className="score-details">
                  <h3>Saved activity</h3>
                  <p>
                    {approvedCount} approved · {pendingCount} awaiting review
                    · {rejectedCount} rejected
                  </p>
                  <span className="positive-text">
                    <CheckCircle2 size={15} /> Account records only
                  </span>
                </div>
              </div>
            </div>

            <div className="panel activity-panel">
              <h3>Recent Activity</h3>

              {recent.map((record) => (
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

              {recent.length === 0 && (
                <p>
                  No verification activity yet. Start by checking an
                  advertisement.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="panel workflow-panel">
          <h3>How VERIBRAND AI Works</h3>

          <div className="workflow">
            {[
              ["01", "Add Brand Facts", "Save approved product and brand references."],
              ["02", "Submit Content", "Enter the advertisement or marketing claim."],
              ["03", "Run Verification", "Compare content with approved reference data."],
              ["04", "Review Evidence", "Inspect findings and record a human decision."],
            ].map(([number, title, description]) => (
              <div className="workflow-step" key={number}>
                <span className="workflow-number">{number}</span>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            ))}
          </div>

          <p className="prototype-note">
            Sample records are labelled as demo data. Verification uses
            transparent prototype rules and requires human review before
            publication.
          </p>
        </section>
      </>
    );
  }

  // ---------------- BRAND KNOWLEDGE HUB ----------------
  function renderKnowledgeHub() {
    const filtered = facts.filter((fact) =>
      `${fact.product} ${fact.brand} ${fact.category}`
        .toLowerCase()
        .includes(factSearch.toLowerCase())
    );

    return (
      <section className="panel">
        <PageHeading
          title="Brand Knowledge Hub"
          description="Maintain a structured source of approved product and brand facts."
        />

        <div className="toolbar-row">
          <button className="primary-button" onClick={addFact}>
            <Plus size={17} /> Add Brand Fact
          </button>

          <label className="scam-search">
            <Search size={16} />
            <input
              value={factSearch}
              onChange={(e) => setFactSearch(e.target.value)}
              placeholder="Search facts..."
            />
          </label>
        </div>

        {dataMessage && <p className="prototype-note">{dataMessage}</p>}
        {dataLoading && <p>Loading account records...</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Approved Price</th>
                <th>Category</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((fact) => (
                <tr key={fact.id}>
                  <td>{fact.product}</td>
                  <td>{fact.brand}</td>
                  <td>{formatPrice(fact.price)}</td>
                  <td>{fact.category}</td>
                  <td>{fact.isDemo ? "Demo" : "Workspace"}</td>
                  <td><Status status={fact.status} /></td>
                  <td>
                    {fact.isDemo ? (
                      <span className="muted-label">Read-only</span>
                    ) : (
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="Edit fact"
                          onClick={() => editFact(fact)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button"
                          title="Delete fact"
                          onClick={() => deleteFact(fact)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="prototype-note">
          Demo facts are included to help you explore the prototype. Only
          workspace facts are stored in your Supabase account.
        </p>
      </section>
    );
  }

  // ---------------- COMPLIANCE ENGINE ----------------
  function renderCompliance() {
    return (
      <section className="panel">
        <PageHeading
          title="Explainable Compliance Engine"
          description="Compare submitted content with approved brand facts and inspect the evidence behind each result."
        />

        <div className="form-grid">
          <label>
            Brand Name
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter brand name"
            />
          </label>

          <label>
            Exact Product Name
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter approved product name"
            />
          </label>
        </div>

        <label className="full-label">
          Advertisement / Content
          <textarea
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your advertisement or marketing content here..."
          />
        </label>

        <button
          className="primary-button"
          onClick={verifyContent}
          disabled={verifyBusy}
        >
          <ShieldCheck size={18} />
          {verifyBusy ? "Checking..." : "Verify Content"}
        </button>

        {dataMessage && <p className="prototype-note">{dataMessage}</p>}

        {result && (
          <div className="result-box">
            <div className="result-header">
              <div>
                <span className="muted-label">RULE-BASED RESULT</span>
                <h2>{result.score}/100</h2>
                <Status status={result.status} />
              </div>
              <ShieldCheck size={45} />
            </div>

            <h3>Evidence</h3>
            <ul>
              {result.evidence.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

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

            <p className="prototype-note">
              This score reflects predefined consistency checks only. It is
              not a legal certification, an authenticity guarantee or a
              substitute for human review.
            </p>
          </div>
        )}
      </section>
    );
  }

  // ---------------- CONTENT WORKSPACE ----------------
  function renderWorkspace() {
    return (
      <section className="panel">
        <PageHeading
          title="Content Workspace"
          description="Prepare marketing content and send it to the verification workflow."
        />

        <label className="full-label">
          Brand Name
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Enter brand name"
          />
        </label>

        <label className="full-label">
          Product
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter exact product name"
          />
        </label>

        <label className="full-label">
          Content
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
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

  // ---------------- VERIFICATION HISTORY ----------------
  function renderHistory() {
    const filtered = records.filter((record) => {
      const matchesText = `${record.title} ${record.brand}`
        .toLowerCase()
        .includes(recordSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesText && matchesStatus;
    });

    return (
      <section className="panel">
        <PageHeading
          title="Verification History"
          description="Search, filter and export verification records saved in this workspace."
        />

        <div className="toolbar-row">
          <label className="scam-search">
            <Search size={16} />
            <input
              value={recordSearch}
              onChange={(e) => setRecordSearch(e.target.value)}
              placeholder="Search history..."
            />
          </label>

          <label className="filter-control">
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Needs Review</option>
              <option>Rejected</option>
            </select>
          </label>

          <button
            className="secondary-button"
            onClick={() => loadDatabaseData(session.user.id)}
            disabled={dataLoading}
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button className="secondary-button" onClick={exportRecords}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        {dataMessage && <p className="prototype-note">{dataMessage}</p>}
        <RecordTable records={filtered} />
      </section>
    );
  }

  // ---------------- REVIEW AND APPROVAL ----------------
  function renderReview() {
    const pending = records.filter(
      (record) =>
        !record.isDemo &&
        ["Pending", "Needs Review"].includes(record.status)
    );

    return (
      <section className="panel">
        <PageHeading
          title="Review & Approval"
          description="A human reviewer makes the final decision after inspecting the verification result."
        />

        {dataMessage && <p className="prototype-note">{dataMessage}</p>}

        {pending.length === 0 ? (
          <p>No workspace records are awaiting review.</p>
        ) : (
          pending.map((record) => (
            <div className="review-item" key={record.id}>
              <div>
                <strong>{record.title}</strong>
                <p>{record.findings?.[0] || "No findings recorded."}</p>
                <span>Score: {record.score}/100</span>
              </div>

              <div className="review-actions">
                <button
                  className="approve-button"
                  onClick={() => updateRecord(record, "Approved")}
                >
                  <CheckCircle2 size={16} /> Approve
                </button>

                <button
                  className="reject-button"
                  onClick={() => updateRecord(record, "Rejected")}
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          ))
        )}

        <h3>All Records</h3>
        <RecordTable records={realRecords} />
      </section>
    );
  }

  // ---------------- CORRECTION SUGGESTIONS ----------------
  function renderSuggestions() {
    return (
      <section className="panel">
        <PageHeading
          title="Correction Suggestions"
          description="Review actionable suggestions produced by the latest verification."
        />

        {result ? (
          <ul className="suggestion-list">
            {result.suggestions.map((item, index) => (
              <li key={index}>
                <Lightbulb size={18} /> {item}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Run a content verification to generate correction suggestions.
          </p>
        )}

        <button
          className="secondary-button"
          onClick={() => setActivePage("Compliance Engine")}
        >
          Open Compliance Engine <ChevronRight size={16} />
        </button>
      </section>
    );
  }

  // ---------------- BRAND TRUTH ENGINE ----------------
  function renderTruthEngine() {
    const grouped = facts.reduce((acc, fact) => {
      const key = fact.brand || "Unassigned brand";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return (
      <section className="panel">
        <PageHeading
          title="Brand Truth Engine"
          description="A consolidated view of the approved reference facts used by the verification workflow."
        />

        <div className="stats-grid">
          <StatCard
            title="All Reference Facts"
            value={facts.length}
            icon={<Database />}
          />
          <StatCard
            title="Workspace Facts"
            value={realFacts.length}
            icon={<Lock />}
          />
          <StatCard
            title="Brands Represented"
            value={Object.keys(grouped).length}
            icon={<Building2 />}
          />
        </div>

        <h3>Brand Reference Summary</h3>

        {Object.entries(grouped).map(([brand, count]) => (
          <div className="activity-item" key={brand}>
            <span className="activity-icon">
              <ShieldCheck size={18} />
            </span>
            <div>
              <strong>{brand}</strong>
              <p>{count} reference fact(s)</p>
            </div>
          </div>
        ))}

        <h3>Approved Reference Data</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Product</th>
                <th>Approved Price</th>
                <th>Category</th>
                <th>Source</th>
              </tr>
            </thead>

            <tbody>
              {facts
                .filter((fact) => fact.status === "Approved")
                .map((fact) => (
                  <tr key={fact.id}>
                    <td>{fact.brand}</td>
                    <td>{fact.product}</td>
                    <td>{formatPrice(fact.price)}</td>
                    <td>{fact.category}</td>
                    <td>{fact.isDemo ? "Demo" : "Workspace"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="prototype-note">
          This engine provides a consolidated reference view. Verification
          is limited to the fields stored in the Brand Knowledge Hub.
        </p>
      </section>
    );
  }
    // ---------------- DEPENDENCY GRAPH ----------------
  function renderDependencyGraph() {
    const links = realRecords.map((record) => {
      const matchedFact = facts.find((fact) =>
        normalize(record.title).includes(normalize(fact.product))
      );

      return { record, fact: matchedFact };
    });

    return (
      <section className="panel">
        <PageHeading
          title="Dependency Graph"
          description="Explore relationships between saved approved facts and verification records."
        />

        <div className="stats-grid">
          <StatCard
            title="Brand Facts"
            value={realFacts.length}
            icon={<Database />}
          />
          <StatCard
            title="Verification Records"
            value={realRecords.length}
            icon={<FileText />}
          />
          <StatCard
            title="Matched Relationships"
            value={links.filter((link) => link.fact).length}
            icon={<Link2 />}
          />
        </div>

        {realFacts.length === 0 && realRecords.length === 0 ? (
          <p>
            Add a workspace brand fact and run a verification to build your
            first relationship view.
          </p>
        ) : (
          <div className="dependency-list">
            {realFacts.map((fact) => {
              const related = links.filter(
                (link) => link.fact?.id === fact.id
              );

              return (
                <article className="review-item" key={fact.id}>
                  <div>
                    <strong>
                      <Database size={16} /> {fact.product}
                    </strong>

                    <p>
                      {fact.brand} · {formatPrice(fact.price)} ·{" "}
                      {fact.category}
                    </p>

                    <span>
                      {related.length} related verification record(s)
                    </span>

                    {related.map(({ record }) => (
                      <p className="dependency-edge" key={record.id}>
                        <Link2 size={14} /> {record.title} · {record.status}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="prototype-note">
          Relationships are derived from product-name matches in saved
          record titles. This is a working prototype view, not an external
          graph database.
        </p>
      </section>
    );
  }

  // ---------------- ASSISTANT ----------------
  function renderAssistant() {
    return (
      <section className="panel assistant-panel">
        <PageHeading
          title="VERIBRAND AI Assistant"
          description="Ask questions about the workspace and its verification workflow."
        />

        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              className={`chat-message ${message.role}`}
              key={index}
            >
              {message.text}
            </div>
          ))}
        </div>

        <form
          className="chat-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask VERIBRAND AI..."
          />

          <button
            type="submit"
            className="primary-button"
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </form>

        <p className="prototype-note">
          Assistant responses use predefined rules. No external AI model is
          connected.
        </p>
      </section>
    );
  }

  // ---------------- IMPROVEMENT 3: SCAM INTELLIGENCE CENTRE ----------------
  function renderScamIntelligence() {
    const filtered = scamReports.filter((item) =>
      `${item.title} ${item.report_type} ${item.target} ${item.status}`
        .toLowerCase()
        .includes(scamSearch.toLowerCase())
    );

    return (
      <section className="scam-page">
        <PageHeading
          title="Scam Intelligence Centre"
          description="Submit brand-risk incidents with evidence references and track their review status."
        />

        <div className="scam-disclaimer">
          <ShieldAlert size={19} />
          <div>
            <strong>WORKSPACE REPORTS — NOT A LIVE THREAT FEED</strong>
            <p>
              Reports are submitted by workspace users. Evidence links are
              references supplied by the reporter and are not independently
              verified by this prototype.
            </p>
          </div>
        </div>

        <div className="stats-grid scam-stats">
          <StatCard
            title="Workspace Reports"
            value={realScamReports.length}
            icon={<FileText />}
          />
          <StatCard
            title="High-Risk Reports"
            value={highRiskCount}
            icon={<ShieldAlert />}
          />
          <StatCard
            title="Sample Reports"
            value={DEMO_SCAMS.length}
            icon={<Activity />}
          />
          <StatCard
            title="Live Threat Feed"
            value="Disconnected"
            icon={<Clock />}
          />
        </div>

        <div className="panel scam-reports-panel">
          <h3>Submit an Incident Report</h3>
          <p>
            Provide the incident details and an evidence URL or reference
            when available.
          </p>

          <form className="profile-form" onSubmit={submitScamReport}>
            <label>
              Report Title
              <input
                value={scamTitle}
                onChange={(e) => setScamTitle(e.target.value)}
                placeholder="Example: Suspicious brand website"
                required
              />
            </label>

            <label>
              Incident Type
              <select
                value={scamType}
                onChange={(e) => setScamType(e.target.value)}
              >
                <option>Website impersonation</option>
                <option>Social media impersonation</option>
                <option>Message / social engineering</option>
                <option>Fake advertisement</option>
                <option>Suspicious payment request</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Brand / Target
              <input
                value={scamTarget}
                onChange={(e) => setScamTarget(e.target.value)}
                placeholder="Enter the affected brand or target"
                required
              />
            </label>

            <label>
              Description
              <textarea
                rows={4}
                value={scamDescription}
                onChange={(e) => setScamDescription(e.target.value)}
                placeholder="Describe why this incident appears suspicious..."
                required
              />
            </label>

            <label>
              Evidence URL (optional)
              <input
                type="url"
                value={scamEvidenceUrl}
                onChange={(e) => setScamEvidenceUrl(e.target.value)}
                placeholder="https://example.com/evidence"
              />
            </label>

            <label>
              Risk Category
              <select
                value={scamRisk}
                onChange={(e) => setScamRisk(e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={scamBusy}
            >
              <Send size={17} />
              {scamBusy ? "Submitting..." : "Submit Incident Report"}
            </button>
          </form>

          {dataMessage && (
            <p className="prototype-note">{dataMessage}</p>
          )}
        </div>

        <div className="panel scam-reports-panel">
          <div className="scam-toolbar">
            <div>
              <h3>Incident Reports</h3>
              <p>Workspace reports and clearly labelled fictional examples.</p>
            </div>

            <label className="scam-search">
              <Search size={16} />
              <input
                value={scamSearch}
                onChange={(e) => setScamSearch(e.target.value)}
                placeholder="Search reports..."
              />
            </label>
          </div>

          <div className="scam-report-list">
            {filtered.map((report) => (
              <article className="scam-report-card" key={report.id}>
                <div className="scam-report-top">
                  <span className="scam-report-id">
                    {report.isDemo ? report.id : `REPORT-${report.id}`}
                  </span>

                  <span
                    className={`risk-label ${String(report.risk).toLowerCase()}`}
                  >
                    {report.risk} risk
                  </span>
                </div>

                <h4>{report.title}</h4>
                <p>{report.description}</p>

                <div className="scam-report-meta">
                  <span>
                    <strong>Type:</strong> {report.report_type}
                  </span>
                  <span>
                    <strong>Target:</strong> {report.target}
                  </span>
                  <span>
                    <strong>Status:</strong> {report.status}
                  </span>
                  {report.date && (
                    <span>
                      <strong>Date:</strong> {report.date}
                    </span>
                  )}
                </div>

                {report.evidence_url && (
                  <p>
                    <strong>Evidence reference:</strong>{" "}
                    <a
                      href={report.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open evidence link
                    </a>
                  </p>
                )}

                {!report.isDemo && (
                  <div className="review-actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        updateScamStatus(report, "Under Review")
                      }
                    >
                      <Clock size={15} /> Under Review
                    </button>

                    <button
                      className="approve-button"
                      onClick={() =>
                        updateScamStatus(report, "Reviewed")
                      }
                    >
                      <CheckCircle2 size={15} /> Mark Reviewed
                    </button>

                    <button
                      className="reject-button"
                      onClick={() =>
                        updateScamStatus(report, "Closed")
                      }
                    >
                      <XCircle size={15} /> Close
                    </button>
                  </div>
                )}

                {report.isDemo && (
                  <span className="muted-label">
                    Fictional sample · Read-only
                  </span>
                )}
              </article>
            ))}

            {filtered.length === 0 && (
              <p>No reports match your search.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ---------------- USER PROFILE ----------------
  function renderProfile() {
    return (
      <section className="panel profile-page">
        <PageHeading
          title="User Profile"
          description="Manage your authenticated workspace account."
        />

        <div className="profile-main-card">
          <div className="profile-large-avatar">
            {(profileName || session?.user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <h2>{profileName || "User"}</h2>
            <p>{session?.user?.email}</p>
            <span className="profile-account-label">
              <ShieldCheck size={14} /> Authenticated account
            </span>
          </div>
        </div>

        <div className="profile-form">
          <label>
            Full Name
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Email Address
            <input value={session?.user?.email || ""} disabled />
          </label>

          <label>
            Organization
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Enter organization name"
            />
          </label>

          <button
            className="primary-button"
            onClick={saveProfile}
            disabled={profileBusy}
          >
            <Save size={17} />
            {profileBusy ? "Saving..." : "Save Profile"}
          </button>

          {profileMessage && (
            <p className="prototype-note">{profileMessage}</p>
          )}

          <button className="reject-button" onClick={handleLogout}>
            <LogOut size={17} /> Logout
          </button>
        </div>
      </section>
    );
  }

  // ---------------- PAGE ROUTING ----------------
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
        return renderTruthEngine();
      case "Dependency Graph":
        return renderDependencyGraph();
      case "AI Brand Assistant":
        return renderAssistant();
      case "Scam Intelligence Centre":
        return renderScamIntelligence();
      case "User Profile":
        return renderProfile();
      default:
        return renderDashboard();
    }
  }

  // ---------------- AUTH SCREEN ----------------
  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <ShieldCheck size={42} />
          <h2>VERIBRAND AI</h2>
          <p>Checking your account...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="auth-logo">
            <ShieldCheck size={38} />
          </div>

          <span className="eyebrow">ZYRAVOLT PROJECT</span>
          <h1>VERIBRAND AI</h1>

          <p className="auth-description">
            Secure brand verification and governance workspace.
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "selected" : ""}
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={authMode === "signup" ? "selected" : ""}
              onClick={() => {
                setAuthMode("signup");
                setAuthMessage("");
              }}
            >
              Sign Up
            </button>
          </div>

          {authMode === "signup" && (
            <label>
              Full Name
              <span className="auth-input">
                <User size={17} />
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </span>
            </label>
          )}

          <label>
            Email Address
            <span className="auth-input">
              <Mail size={17} />
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </span>
          </label>

          <label>
            Password
            <span className="auth-input">
              <Lock size={17} />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
                minLength={6}
                required
              />
            </span>
          </label>

          {authMessage && (
            <p className="auth-message">{authMessage}</p>
          )}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={authBusy}
          >
            {authBusy
              ? "Please wait..."
              : authMode === "login"
                ? "Login to Workspace"
                : "Create Account"}
            <ArrowUpRight size={17} />
          </button>

          <p className="auth-footer">
            <Lock size={13} /> Secure account authentication powered by
            Supabase.
          </p>
        </form>
      </div>
    );
  }

  // ---------------- MAIN APPLICATION ----------------
  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}
      >
        <div className="brand-logo">
          <span className="logo-icon">
            <ShieldCheck size={25} />
          </span>

          <span>
            <strong>VERIBRAND</strong>
            <small>AI BRAND INTELLIGENCE</small>
          </span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {NAVIGATION.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
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
          <button
            className="profile-card"
            onClick={() => setActivePage("User Profile")}
          >
            <div className="profile-avatar">
              {(profileName || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{profileName || "User Account"}</strong>
              <small>{organization || "ZYRAVOLT Workspace"}</small>
            </div>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMobileMenu((open) => !open)}
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span className="prototype-pill">ROUND 3 BUILD</span>

            <button
              className="icon-button"
              aria-label="User profile"
              onClick={() => setActivePage("User Profile")}
            >
              <User size={19} />
            </button>

            <button
              className="icon-button"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {renderPage()}

          <footer className="app-footer">
            <span>VERIBRAND AI · ZYRAVOLT</span>
            <span>Explainable brand governance prototype</span>
          </footer>
        </div>
      </main>

      {/* Floating assistant */}
      <button
        className="mini-chat-launcher"
        onClick={() => setChatOpen((open) => !open)}
        aria-label="Open VERIBRAND assistant"
      >
        {chatOpen ? <XCircle size={24} /> : <MessageCircleIcon />}
      </button>

      {chatOpen && (
        <div className="mini-chat-window">
          <div className="mini-chat-header">
            <div className="mini-chat-brand">
              <div className="mini-chat-avatar">
                <Sparkles size={19} />
              </div>

              <div>
                <strong>VERIBRAND Assistant</strong>
                <small>Project help · Demo mode</small>
              </div>
            </div>

            <button
              className="mini-chat-close"
              onClick={() => setChatOpen(false)}
              aria-label="Close assistant"
            >
              <XCircle size={19} />
            </button>
          </div>

          <div className="mini-chat-messages">
            {messages.slice(-20).map((message, index) => (
              <div
                className={`mini-chat-message ${message.role}`}
                key={index}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mini-chat-prompts">
            {[
              "What is VERIBRAND AI?",
              "What are Brand Facts?",
              "How does verification work?",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="mini-chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about this project..."
            />

            <button type="submit" aria-label="Send message">
              <Send size={18} />
            </button>
          </form>

          <p className="mini-chat-disclaimer">
            Predefined demo responses · No live AI model connected
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------- REUSABLE COMPONENTS ----------------
function MessageCircleIcon() {
  return <Send size={23} />;
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
  if (!records.length) {
    return <p>No verification records match this view.</p>;
  }

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
              <td>
                {record.title}
                {record.isDemo && (
                  <small className="muted-label"> · DEMO</small>
                )}
              </td>
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