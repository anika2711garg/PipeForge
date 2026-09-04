"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  api,
  type IncomingFile,
  type MetricRow,
  type QuarantineRow,
  type RunResult,
  type RunRow,
  type StatusSnapshot,
} from "@/lib/api";

type ToastState = { message: string; kind: "ok" | "error" } | null;

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

function durationLabel(run: RunRow | null): string {
  if (!run?.started_at || !run.completed_at) {
    return "—";
  }
  const start = Date.parse(run.started_at);
  const end = Date.parse(run.completed_at);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "—";
  }
  const ms = end - start;
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

function shortenHash(value: string | null): string {
  if (!value) {
    return "—";
  }
  return value.length > 12 ? `${value.slice(0, 10)}…` : value;
}

function CountUp({ value }: { value: number | string }) {
  const numeric = typeof value === "number" ? value : Number(value);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(numeric)) {
      return;
    }
    const start = performance.now();
    const from = shown;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 520);
      setShown(Math.round(from + (numeric - from) * t));
      if (t < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeric]);

  if (!Number.isFinite(numeric)) {
    return <>{fmt(value)}</>;
  }
  return <>{shown}</>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function Dashboard() {
  const [status, setStatus] = useState<StatusSnapshot | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [files, setFiles] = useState<IncomingFile[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [quarantine, setQuarantine] = useState<QuarantineRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [modal, setModal] = useState<QuarantineRow | null>(null);
  const [navOpen, setNavOpen] = useState(true);
  const [active, setActive] = useState("overview");

  const showToast = useCallback((message: string, kind: "ok" | "error") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [nextStatus, nextRuns, nextFiles, nextMetrics, nextQuarantine] =
        await Promise.all([
          api<StatusSnapshot>("/api/status"),
          api<RunRow[]>("/api/runs"),
          api<IncomingFile[]>("/api/files"),
          api<MetricRow[]>("/api/metrics"),
          api<QuarantineRow[]>("/api/quarantine"),
        ]);
      setStatus(nextStatus);
      setRuns(nextRuns);
      setFiles(nextFiles);
      setMetrics(nextMetrics);
      setQuarantine(nextQuarantine);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "API unreachable", "error");
    }
  }, [showToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function withBusy(work: () => Promise<void>) {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  }

  async function runPipeline() {
    try {
      await withBusy(async () => {
        const result = await api<RunResult>("/api/run", { method: "POST" });
        showToast(
          `Pipeline ${result.status}: accepted ${result.records_accepted}`,
          result.status === "completed" ? "ok" : "error",
        );
        await refresh();
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Run failed", "error");
    }
  }

  const latest = status?.latest_run ?? null;
  const online = Boolean(status?.database_exists);
  const chart = useMemo(() => {
    const byDate: Record<string, { count: number; amount: number }> = {};
    metrics.forEach((row) => {
      const bucket = byDate[row.metric_date] ?? { count: 0, amount: 0 };
      bucket.count += Number(row.event_count || 0);
      bucket.amount += Number(row.total_amount_minor_units || 0);
      byDate[row.metric_date] = bucket;
    });
    const dates = Object.keys(byDate).sort().slice(-10);
    const max = Math.max(1, ...dates.map((date) => byDate[date].count));
    return { dates, byDate, max };
  }, [metrics]);

  const sections = [
    ["overview", "Overview"],
    ["pipeline", "Pipeline"],
    ["runs", "Runs"],
    ["files", "Incoming Files"],
    ["metrics", "Daily Metrics"],
    ["quarantine", "Quarantine"],
    ["demo", "Demo Dataset"],
  ] as const;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <div className="logo-mark" aria-hidden="true" />
          <div>
            <h1>PipeForge</h1>
            <p>Incremental Data Pipeline Control Center</p>
          </div>
        </div>
        <nav>
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={`nav-link ${active === id ? "active" : ""}`}
              onClick={() => setActive(id)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className={`pulse-dot ${online ? "ok" : "bad"}`} />
          <span>{online ? "Warehouse reachable" : "Checking warehouse…"}</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="btn ghost menu-btn"
              type="button"
              onClick={() => setNavOpen((value) => !value)}
            >
              Menu
            </button>
            <strong>PipeForge</strong>
            <span className="badge">ETL Environment</span>
          </div>
          <div className="top-actions">
            <span className="db-chip">
              {online ? "Database: ready" : "Database: missing"}
            </span>
            <motion.button
              className="btn ghost"
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void refresh()}
            >
              Refresh
            </motion.button>
          </div>
        </header>

        <main>
          <motion.section
            id="overview"
            className="cards"
            aria-label="Overview"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {[
              ["Warehouse Events", status?.total_warehouse_events ?? "—"],
              ["Processed Files", status?.total_processed_files ?? "—"],
              ["Quarantined Records", status?.quarantined_records ?? "—"],
              ["Last Run Status", latest?.status ?? "Never Run"],
              ["Latest Run Duration", durationLabel(latest)],
            ].map(([label, value]) => (
              <motion.article
                key={label}
                className="card metric"
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 16px 36px rgba(16,25,43,0.12)" }}
              >
                <span>{label}</span>
                <strong>
                  {typeof value === "number" ? <CountUp value={value} /> : value}
                </strong>
              </motion.article>
            ))}
          </motion.section>

          <motion.section
            id="pipeline"
            className="panel"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="panel-head">
              <div>
                <h2>Incremental Pipeline</h2>
                <p>Last run: {latest ? latest.status : "Never Run"}</p>
              </div>
              <motion.button
                id="run-btn"
                className="btn primary"
                type="button"
                disabled={busy}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void runPipeline()}
              >
                {busy ? "Running…" : "Run Pipeline"}
              </motion.button>
            </div>
          </motion.section>

          <section id="runs" className="panel">
            <h2>Recent Runs</h2>
            <div className="table-wrap">
              {runs.length === 0 ? (
                <p className="empty">No pipeline runs recorded yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Run ID</th>
                      <th>Started</th>
                      <th>Finished</th>
                      <th>Status</th>
                      <th>Files</th>
                      <th>Accepted</th>
                      <th>Quarantined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <motion.tr key={run.run_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td>{fmt(run.run_id)}</td>
                        <td>{fmt(run.started_at)}</td>
                        <td>{fmt(run.completed_at)}</td>
                        <td>
                          <span className={`status-pill ${fmt(run.status)}`}>
                            {fmt(run.status)}
                          </span>
                        </td>
                        <td>{fmt(run.files_processed)}</td>
                        <td>{fmt(run.records_accepted)}</td>
                        <td>{fmt(run.records_quarantined)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section id="files" className="panel">
            <h2>Incoming Files</h2>
            <div className="table-wrap">
              {files.length === 0 ? (
                <p className="empty">No JSONL files in the incoming directory.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Size</th>
                      <th>Processed</th>
                      <th>Content hash</th>
                      <th>Record count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.filename}>
                        <td>{fmt(file.filename)}</td>
                        <td>{fmt(file.size)}</td>
                        <td>{file.processed ? "yes" : "no"}</td>
                        <td>{shortenHash(file.content_hash)}</td>
                        <td>{fmt(file.record_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section id="metrics" className="panel">
            <h2>Daily Metrics</h2>
            <div className="chart" role="img" aria-label="Daily event counts">
              {chart.dates.map((date) => (
                <motion.div
                  key={date}
                  className="bar"
                  initial={{ scaleY: 0.12 }}
                  animate={{
                    scaleY: 1,
                    height: Math.max(8, (chart.byDate[date].count / chart.max) * 140),
                  }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  <span>
                    {date.slice(5)} · {chart.byDate[date].count}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="table-wrap">
              {metrics.length === 0 ? (
                <p className="empty">No daily metrics yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event type</th>
                      <th>Event count</th>
                      <th>Total amount (minor units)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((row) => (
                      <tr key={`${row.metric_date}-${row.event_type}`}>
                        <td>{fmt(row.metric_date)}</td>
                        <td>{fmt(row.event_type)}</td>
                        <td>{fmt(row.event_count)}</td>
                        <td>{fmt(row.total_amount_minor_units)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section id="quarantine" className="panel">
            <h2>Quarantine</h2>
            <div className="quarantine-list">
              {quarantine.length === 0 ? (
                <p className="empty">No quarantined records.</p>
              ) : (
                quarantine.map((row) => {
                  const raw = String(row.raw_record || "");
                  return (
                    <motion.button
                      key={row.id}
                      type="button"
                      className="q-item"
                      whileHover={{ y: -2 }}
                      onClick={() => setModal(row)}
                    >
                      <strong>
                        {fmt(row.source_file)}:{fmt(row.line_number)}
                      </strong>
                      <div>{fmt(row.error_reason)}</div>
                      <small>{raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}</small>
                    </motion.button>
                  );
                })
              )}
            </div>
          </section>

          <section id="demo" className="panel demo-panel">
            <h2>Demo Dataset</h2>
            <p>
              Synthetic demonstration tools only. These buttons are not part of
              production ingestion.
            </p>
            <div className="btn-row">
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() =>
                  void withBusy(async () => {
                    const result = await api<{ files: string[] }>("/api/demo/generate", {
                      method: "POST",
                    });
                    showToast(`Wrote ${result.files.length} demo files`, "ok");
                    await refresh();
                  })
                }
              >
                Generate Demo Batch
              </button>
              <button
                className="btn danger"
                type="button"
                disabled={busy}
                onClick={() =>
                  void withBusy(async () => {
                    await api("/api/demo/reset", { method: "POST" });
                    showToast("Demo data reset", "ok");
                    await refresh();
                  })
                }
              >
                Reset Demo Data
              </button>
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className={`toast ${toast.kind}`}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {busy ? (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="spinner" aria-hidden="true" />
            <p>Working…</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {modal ? (
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
          >
            <motion.div
              className="modal-card"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <h3>Quarantine detail</h3>
                <button className="btn ghost" type="button" onClick={() => setModal(null)}>
                  Close
                </button>
              </header>
              <pre>{JSON.stringify(modal, null, 2)}</pre>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
