const $ = (id) => document.getElementById(id);

function animateNumber(node, nextValue) {
  const numeric = Number(nextValue);
  if (!Number.isFinite(numeric)) {
    node.textContent = fmt(nextValue);
    return;
  }
  const from = Number(node.dataset.value || 0);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 480);
    node.textContent = String(Math.round(from + (numeric - from) * t));
    if (t < 1) window.requestAnimationFrame(step);
    else node.dataset.value = String(numeric);
  };
  window.requestAnimationFrame(step);
}

function toast(message, kind) {
  const node = $("toast");
  node.textContent = message;
  node.className = `toast show ${kind || ""}`;
  window.setTimeout(() => { node.className = "toast"; }, 2800);
}

function setLoading(on) {
  $("overlay").classList.toggle("hidden", !on);
}

function fmt(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function durationLabel(run) {
  if (!run || !run.started_at || !run.completed_at) return "—";
  const start = Date.parse(run.started_at);
  const end = Date.parse(run.completed_at);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const ms = end - start;
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function shortenHash(value) {
  if (!value) return "—";
  return value.length > 12 ? `${value.slice(0, 10)}…` : value;
}

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Request failed (${response.status})`);
  }
  return data;
}

function renderRuns(runs) {
  const body = $("runs-body");
  body.innerHTML = "";
  $("runs-empty").classList.toggle("visible", !runs.length);
  runs.forEach((run) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmt(run.run_id)}</td>
      <td>${fmt(run.started_at)}</td>
      <td>${fmt(run.completed_at)}</td>
      <td><span class="status-pill ${fmt(run.status)}">${fmt(run.status)}</span></td>
      <td>${fmt(run.files_processed)}</td>
      <td>${fmt(run.records_accepted)}</td>
      <td>${fmt(run.records_quarantined)}</td>
    `;
    body.appendChild(tr);
  });
}

function renderFiles(files) {
  const body = $("files-body");
  body.innerHTML = "";
  $("files-empty").classList.toggle("visible", !files.length);
  files.forEach((file) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmt(file.filename)}</td>
      <td>${fmt(file.size)}</td>
      <td>${file.processed ? "yes" : "no"}</td>
      <td>${shortenHash(file.content_hash)}</td>
      <td>${fmt(file.record_count)}</td>
    `;
    body.appendChild(tr);
  });
}

function renderMetrics(metrics) {
  const body = $("metrics-body");
  body.innerHTML = "";
  $("metrics-empty").classList.toggle("visible", !metrics.length);
  metrics.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmt(row.metric_date)}</td>
      <td>${fmt(row.event_type)}</td>
      <td>${fmt(row.event_count)}</td>
      <td>${fmt(row.total_amount_minor_units)}</td>
    `;
    body.appendChild(tr);
  });

  const byDate = {};
  metrics.forEach((row) => {
    byDate[row.metric_date] = (byDate[row.metric_date] || 0) + Number(row.event_count || 0);
  });
  const dates = Object.keys(byDate).sort().slice(-10);
  const max = Math.max(1, ...dates.map((d) => byDate[d]));
  const chart = $("metrics-chart");
  chart.innerHTML = "";
  dates.forEach((date) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(8, (byDate[date] / max) * 140)}px`;
    bar.innerHTML = `<span>${date.slice(5)} · ${byDate[date]}</span>`;
    chart.appendChild(bar);
  });
}

function renderQuarantine(rows) {
  const list = $("quarantine-list");
  list.innerHTML = "";
  $("quarantine-empty").classList.toggle("visible", !rows.length);
  rows.forEach((row) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "q-item";
    const raw = String(row.raw_record || "");
    item.innerHTML = `
      <strong>${fmt(row.source_file)}:${fmt(row.line_number)}</strong>
      <div>${fmt(row.error_reason)}</div>
      <small>${raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}</small>
    `;
    item.addEventListener("click", () => {
      $("modal-body").textContent = JSON.stringify(row, null, 2);
      $("modal").classList.remove("hidden");
    });
    list.appendChild(item);
  });
}

async function refresh() {
  try {
    const [status, runs, files, metrics, quarantine] = await Promise.all([
      api("/api/status"),
      api("/api/runs"),
      api("/api/files"),
      api("/api/metrics"),
      api("/api/quarantine"),
    ]);

    animateNumber($("stat-events"), status.total_warehouse_events);
    animateNumber($("stat-files"), status.total_processed_files);
    animateNumber($("stat-quarantine"), status.quarantined_records);
    const latest = status.latest_run;
    $("stat-run").textContent = latest ? latest.status : "Never Run";
    $("stat-duration").textContent = durationLabel(latest);
    $("last-run-copy").textContent = latest
      ? `Last run: ${latest.status}`
      : "Last run: Never Run";
    const headline = $("stat-headline");
    if (headline) {
      if (!latest) headline.textContent = "Idle";
      else if (latest.status === "completed") headline.textContent = "Live";
      else if (latest.status === "failed") headline.textContent = "Failed";
      else if (latest.status === "running") headline.textContent = "Running";
      else headline.textContent = latest.status;
    }

    const online = Boolean(status.database_exists);
    $("db-dot").className = `pulse-dot ${online ? "ok" : "bad"}`;
    $("db-label").textContent = online ? "Warehouse reachable" : "Warehouse missing";
    $("db-chip").textContent = online ? "Database: ready" : "Database: missing";

    renderRuns(runs);
    renderFiles(files);
    renderMetrics(metrics);
    renderQuarantine(quarantine);
  } catch (error) {
    $("db-dot").className = "pulse-dot bad";
    $("db-label").textContent = "API unreachable";
    toast(error.message, "error");
  }
}

async function withBusy(button, work) {
  const previous = button.disabled;
  button.disabled = true;
  setLoading(true);
  try {
    return await work();
  } finally {
    button.disabled = previous;
    setLoading(false);
  }
}

$("run-btn").addEventListener("click", async () => {
  try {
    const result = await withBusy($("run-btn"), () => api("/api/run", { method: "POST" }));
    toast(`Pipeline ${result.status}: accepted ${result.records_accepted}`, result.status === "completed" ? "ok" : "error");
    await refresh();
  } catch (error) {
    toast(error.message, "error");
  }
});

$("refresh-btn").addEventListener("click", () => refresh());
$("demo-generate").addEventListener("click", async () => {
  try {
    const result = await withBusy($("demo-generate"), () => api("/api/demo/generate", { method: "POST" }));
    toast(`Wrote ${result.files.length} demo files`, "ok");
    await refresh();
  } catch (error) {
    toast(error.message, "error");
  }
});
$("demo-reset").addEventListener("click", async () => {
  try {
    await withBusy($("demo-reset"), () => api("/api/demo/reset", { method: "POST" }));
    toast("Demo data reset", "ok");
    await refresh();
  } catch (error) {
    toast(error.message, "error");
  }
});
$("modal-close").addEventListener("click", () => $("modal").classList.add("hidden"));
$("modal").addEventListener("click", (event) => {
  if (event.target === $("modal")) $("modal").classList.add("hidden");
});

refresh();
