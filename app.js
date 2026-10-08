(function () {
  const D = window.SITE_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STATUS = { all: "All", published: "Published", working: "Working papers" };

  // ---------- helpers ----------
  // Fill a section only if it exists, so a missing section never breaks the rest of the page.
  const setHTML = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  function bibtex(p) {
    const authors = /with \d+/.test(p.authors)
      ? "Abel, Martin and others"
      : p.authors.split(/,\s*/).map(n => { const w = n.trim().split(" "); return w.pop() + ", " + w.join(" "); }).join(" and ");
    const first = p.title.toLowerCase().replace(/[^a-z ]/g, "").split(" ").find(w => w.length > 3) || "paper";
    const doiLink = p.links.find(l => /doi\.org\//.test(l[1]));
    const type = p.status === "published" ? "article" : "techreport";
    const lines = [
      `@${type}{abel${p.year}${first},`,
      `  author = {${authors}},`,
      `  title = {${p.title}},`,
      p.status === "published" ? `  journal = {${p.venue}},` : `  institution = {IZA},\n  note = {${p.detail}},`,
      `  year = {${p.year}}` + (doiLink ? "," : ""),
    ];
    if (doiLink) lines.push(`  doi = {${doiLink[1].split("doi.org/")[1]}}`);
    lines.push("}");
    return lines.join("\n");
  }

  // Figure panel: key finding on top, figure (click to enlarge), source caption below.
  function figureHTML(p) {
    if (!p.figure) return "";
    return `<figure class="figure">
      ${p.takeaway ? `<div class="takeaway-label">Key finding</div><p class="takeaway">${esc(p.takeaway)}</p>` : ""}
      <a href="${esc(p.figure)}" target="_blank" rel="noopener" title="Open full size">
        <img src="${esc(p.figure)}" alt="Key figure: ${esc(p.title)}" loading="lazy"
          onerror="const g=this.closest('.pgrid'); if(g) g.classList.add('nofig'); this.closest('figure').remove()"></a>
      ${p.figureCaption ? `<figcaption>${esc(p.figureCaption)}</figcaption>` : ""}</figure>`;
  }

  // AI-generated audio summary (optional per paper: audio: {src, length})
  function audioHTML(p) {
    if (!p.audio) return "";
    return `<div class="audio">
      <div class="audio-label">AI-generated audio summary${p.audio.length ? ` · ${esc(p.audio.length)}` : ""}</div>
      <audio controls preload="none" src="${esc(p.audio.src)}"></audio>
      <div class="audio-note">Created with Google NotebookLM from the paper. It may simplify or contain errors; the paper is the authoritative source.</div>
    </div>`;
  }

  // Abstract and links on the left, figure on the right (stacks on phones).
  function detailHTML(p) {
    const links = p.links.map(([l, u]) => `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`).join("");
    const media = p.media.length
      ? `<div class="media"><strong>Coverage:</strong> ${p.media.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(" · ")}</div>` : "";
    return `
      <div class="pgrid ${p.figure ? "" : "nofig"}">
        <div class="ptext">
          <div class="abstract-label">Abstract</div>
          <p class="abstract">${esc(p.abstract)}</p>
          ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
          ${audioHTML(p)}
          <div class="links">${links}<button class="btn bib-toggle" type="button">Cite (BibTeX)</button></div>
          <pre class="bib">${esc(bibtex(p))}</pre>
          ${media}
        </div>
        ${figureHTML(p)}
      </div>`;
  }

  function wireBib(root) {
    root.querySelectorAll(".bib-toggle").forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      const pre = b.closest(".links").nextElementSibling;
      pre.classList.toggle("show");
      if (pre.classList.contains("show") && navigator.clipboard) {
        navigator.clipboard.writeText(pre.textContent).then(() => { b.textContent = "Copied ✓"; setTimeout(() => (b.textContent = "Cite (BibTeX)"), 1600); }).catch(() => {});
      }
    }));
  }

  // ---------- modal ----------
  const modal = $("#modal"), body = $("#modal-body");
  function openPaper(id, push = true) {
    const p = D.papers.find(x => x.id == id);
    if (!p) return;
    body.innerHTML = `
      <h3 id="m-title">${esc(p.title)}</h3>
      <div class="authors">${esc(p.authors)}</div>
      <div class="venue">${esc(p.venue)}${p.detail ? ", " + esc(p.detail) : ""}</div>
      <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      ${detailHTML(p)}`;
    wireBib(body);
    if (!modal.open) modal.showModal();
    if (push) history.replaceState(null, "", "#paper-" + id);
  }
  function openStudent(s) {
    body.innerHTML = `
      ${s.image ? `<figure class="figure"><img src="${esc(s.image)}" alt="" onerror="this.closest('figure').remove()"></figure>` : ""}
      <h3 id="m-title">${esc(s.title)}</h3>
      <div class="authors">${esc(s.author)}</div>
      <p class="abstract">${esc(s.summary)}</p>
      <div class="links"><a class="btn" href="${esc(s.pdf)}" target="_blank" rel="noopener">Read the paper</a></div>`;
    if (!modal.open) modal.showModal();
  }
  function closeModal() { modal.close(); }
  modal.addEventListener("close", () => { if (location.hash.startsWith("#paper-")) history.replaceState(null, "", "#research"); });
  $(".close", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  // ---------- featured ----------
  // Cards show the key figure on top when one exists; otherwise just the text.
  const card = p => `
    <button class="fcard" data-paper="${p.id}">
      ${p.figure ? `<div class="thumb"><img src="${esc(p.figure)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>` : ""}
      <div class="body">
        <div class="title">${esc(p.title)}</div>
        <div class="authors">${esc(p.authors)}</div>
        <div class="venue">${p.status === "published" ? esc(p.venue) + ", " + p.year : esc(p.detail) + ", " + p.year}</div>
        <div class="more">${p.audio ? "Abstract, audio &amp; links →" : "Abstract &amp; links →"}</div>
      </div>
    </button>`;
  setHTML("#featured", D.papers.filter(p => p.featured && p.status === "published").map(card).join(""));
  setHTML("#featured-wp", D.papers.filter(p => p.featured && p.status === "working").sort((a, b) => b.year - a.year || b.id - a.id).map(card).join(""));

  // ---------- filters + list ----------
  const state = { status: "all", tag: null, q: "" };
  const tagCounts = {};
  D.papers.forEach(p => p.tags.forEach(t => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  function renderFilters() {
    $("#status-filters").innerHTML = Object.entries(STATUS).map(([k, l]) => {
      const n = k === "all" ? D.papers.length : D.papers.filter(p => p.status === k).length;
      return `<button class="chip" data-status="${k}" aria-pressed="${state.status === k}">${l}<span class="n">${n}</span></button>`;
    }).join("");
    $("#tag-filters").innerHTML = tags.map(t =>
      `<button class="chip" data-tag="${esc(t)}" aria-pressed="${state.tag === t}">${esc(t)}<span class="n">${tagCounts[t]}</span></button>`).join("");
  }

  function matches(p) {
    if (state.status !== "all" && p.status !== state.status) return false;
    if (state.tag && !p.tags.includes(state.tag)) return false;
    if (state.q) {
      const hay = (p.title + " " + p.authors + " " + p.abstract + " " + p.venue).toLowerCase();
      if (!state.q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  }

  function renderList() {
    const order = { published: 0, working: 1 };
    const list = D.papers.filter(matches).sort((a, b) => order[a.status] - order[b.status] || (a.status === "working" ? b.year - a.year || b.id - a.id : 0));
    $("#paper-list").innerHTML = list.map(p => `
      <div class="prow" id="row-${p.id}">
        <button aria-expanded="false">
          <div>
            <div class="ptitle">${esc(p.title)}<span class="caret">›</span>${p.status === "working" ? '<span class="badge">Working paper</span>' : ""}${p.audio ? '<span class="badge badge-audio">Audio</span>' : ""}</div>
            <div class="authors">${esc(p.authors)}</div>
            <div class="venue">${esc(p.venue)}${p.detail && p.status === "published" ? ", " + esc(p.detail) : ""}</div>
          </div>
          <div class="year">${p.year}</div>
        </button>
        <div class="pdetail">${detailHTML(p)}</div>
      </div>`).join("");
    $("#empty").hidden = list.length > 0;
    document.querySelectorAll(".prow > button").forEach(b => b.addEventListener("click", () => {
      const row = b.parentElement, open = row.classList.toggle("open");
      b.setAttribute("aria-expanded", open);
    }));
    wireBib($("#paper-list"));
  }

  document.addEventListener("click", e => {
    const s = e.target.closest("[data-status]"), t = e.target.closest("[data-tag]"), pp = e.target.closest("[data-paper]");
    if (s) { state.status = s.dataset.status; renderFilters(); renderList(); }
    else if (t) { state.tag = state.tag === t.dataset.tag ? null : t.dataset.tag; renderFilters(); renderList(); }
    else if (pp) { e.preventDefault(); openPaper(pp.dataset.paper); }
  });
  $("#search").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); renderList(); });

  renderFilters(); renderList();

  // ---------- ongoing ----------
  $("#ongoing").innerHTML = D.ongoing.map(o => `<li><span class="t">${esc(o.title)}</span> <span class="muted">(with ${esc(o.authors)})</span></li>`).join("");

  // ---------- students ----------
  ["theses", "covid"].forEach(k => {
    const el = $("#" + k);
    el.innerHTML = D.students[k].map((s, i) => `
      <button class="scard" data-s="${k}:${i}">
        <div class="simg" ${s.image ? `style="background-image:url('${esc(s.image)}')"` : ""}></div>
        <div class="sbody"><div class="stitle">${esc(s.title)}</div><div class="sauthor">${esc(s.author)}</div></div>
      </button>`).join("");
    el.addEventListener("click", e => {
      const c = e.target.closest("[data-s]"); if (!c) return;
      const [kk, i] = c.dataset.s.split(":"); openStudent(D.students[kk][+i]);
    });
  });

  // ---------- nav ----------
  const toggle = $(".nav-toggle"), links = $(".nav-links");
  toggle.addEventListener("click", () => { const o = links.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); });
  links.addEventListener("click", e => { if (e.target.tagName === "A") links.classList.remove("open"); });
  const secs = ["about", "research", "teaching", "students"].map(id => document.getElementById(id));
  const navA = id => links.querySelector(`a[href="#${id}"]`);
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { links.querySelectorAll("a").forEach(a => a.classList.remove("active")); navA(en.target.id)?.classList.add("active"); }
  }), { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(s => s && io.observe(s));

  $("#yr").textContent = new Date().getFullYear();

  // deep link: martinabel.net/#paper-9 opens that paper
  const m = location.hash.match(/^#paper-(\d+)/);
  if (m) openPaper(m[1], false);
})();
