/* ═══════════════════════════════════════════════════════════════
   CARNET D'ERREURS — module partagé
   ───────────────────────────────────────────────────────────────
   Utilisé par article.html (dictée), oral.html (expression orale)
   et carnet.html (consultation).

   Le carnet ne stocke pas des erreurs isolées mais des POINTS :
   « le passé composé avec être », « le genre des noms »…
   Chaque nouvelle erreur vient nourrir un point existant ou en
   créer un. Un point non revu pendant CLEAN_TARGET sessions
   testables passe en « maîtrisé » : c'est ce qui permet à
   l'étudiante de VOIR qu'elle progresse.

   Stockage : localStorage['acad2_carnet']
   {
     version: 1,
     points: [{
       id, category, label, es,
       occurrences, cleanStreak,
       status: 'active' | 'improving' | 'mastered',
       firstSeen, lastSeen, masteredAt,
       relapses,
       examples: [{ wrong, right, note, at, source, articleId }]
     }],
     sessions: [{ id, at, type, articleId, errorCount,
                  newIds, repeatedIds, masteredIds, relapseIds }]
   }
   ═══════════════════════════════════════════════════════════════ */

const Carnet = {

  STORE: 'acad2_carnet',

  // Nombre de sessions testables sans récidive avant de considérer
  // un point comme maîtrisé.
  CLEAN_TARGET: 3,

  // Combien d'exemples on garde par point (les plus récents).
  MAX_EXAMPLES: 6,

  /* ── Catégories ────────────────────────────────────────────
     Liste préfaite, volontairement NON exhaustive : l'IA et
     l'utilisateur peuvent retomber sur « autre ».
     modes = exercices où le point est testable. Un point de
     prononciation ne peut pas être « revu » par une dictée,
     donc il ne gagne pas de session propre à l'écrit.        */
  CATEGORIES: [
    { key:'conjugaison',  label:'Conjugaison',    es:'Conjugación',        bg:'#EEF2FF', fg:'#4338CA', icon:'fa-clock-rotate-left', modes:['ecrit','oral'], hint:'Temps, terminaisons, auxiliaires' },
    { key:'accord',       label:'Accords',        es:'Concordancias',      bg:'#FCE7F3', fg:'#BE185D', icon:'fa-link',              modes:['ecrit','oral'], hint:'Genre, nombre, participe passé' },
    { key:'genre',        label:'Genre du nom',   es:'Género del nombre',  bg:'#FDF2F8', fg:'#9D174D', icon:'fa-venus-mars',        modes:['ecrit','oral'], hint:'le/la, un/une' },
    { key:'grammaire',    label:'Grammaire',      es:'Gramática',          bg:'#FEF3C7', fg:'#B45309', icon:'fa-diagram-project',   modes:['ecrit','oral'], hint:'Structures, modes, concordance' },
    { key:'syntaxe',      label:'Ordre des mots', es:'Orden de palabras',  bg:'#F3E8FF', fg:'#7E22CE', icon:'fa-arrows-left-right', modes:['ecrit','oral'], hint:'Place de l\'adjectif, de la négation…' },
    { key:'pronoms',      label:'Pronoms',        es:'Pronombres',         bg:'#EDE9FE', fg:'#6D28D9', icon:'fa-share-nodes',       modes:['ecrit','oral'], hint:'COD/COI, y, en, relatifs' },
    { key:'preposition',  label:'Prépositions',   es:'Preposiciones',      bg:'#FFEDD5', fg:'#C2410C', icon:'fa-arrow-right-long',  modes:['ecrit','oral'], hint:'à, de, en, chez, dans…' },
    { key:'determinant',  label:'Déterminants',   es:'Determinantes',      bg:'#ECFEFF', fg:'#0E7490', icon:'fa-hashtag',           modes:['ecrit','oral'], hint:'du, de la, des, partitifs' },
    { key:'negation',     label:'Négation',       es:'Negación',           bg:'#FEE2E2', fg:'#B91C1C', icon:'fa-ban',               modes:['ecrit','oral'], hint:'ne… pas, ne… plus, ne… que' },
    { key:'vocabulaire',  label:'Vocabulaire',    es:'Vocabulario',        bg:'#DCFCE7', fg:'#15803D', icon:'fa-book',              modes:['ecrit','oral'], hint:'Mot mal choisi, imprécis' },
    { key:'fauxami',      label:'Faux-amis',      es:'Falsos amigos',      bg:'#D1FAE5', fg:'#047857', icon:'fa-masks-theater',     modes:['ecrit','oral'], hint:'entendre/comprendre, hispanismes' },
    { key:'orthographe',  label:'Orthographe',    es:'Ortografía',         bg:'#E0F2FE', fg:'#0369A1', icon:'fa-spell-check',       modes:['ecrit'],        hint:'Graphie du mot, doubles consonnes' },
    { key:'accents',      label:'Accents',        es:'Acentos',            bg:'#DBEAFE', fg:'#1D4ED8', icon:'fa-a',                 modes:['ecrit'],        hint:'é, è, ê, à, ù' },
    { key:'homophones',   label:'Homophones',     es:'Homófonos',          bg:'#E0E7FF', fg:'#3730A3', icon:'fa-clone',             modes:['ecrit'],        hint:'a/à, ou/où, ce/se, son/sont' },
    { key:'elision',      label:'Élision',        es:'Elisión',            bg:'#F1F5F9', fg:'#334155', icon:'fa-quote-right',       modes:['ecrit'],        hint:"j'ai, l'école, qu'il" },
    { key:'ponctuation',  label:'Ponctuation',    es:'Puntuación',         bg:'#F3F4F6', fg:'#4B5563', icon:'fa-comment-dots',      modes:['ecrit'],        hint:'Virgule, point, majuscule' },
    { key:'audition',     label:'Discrimination', es:'Discriminación',     bg:'#FFF7ED', fg:'#9A3412', icon:'fa-ear-listen',        modes:['ecrit'],        hint:'Son mal entendu, mot confondu' },
    { key:'omission',     label:'Mot oublié',     es:'Palabra olvidada',   bg:'#FEF2F2', fg:'#991B1B', icon:'fa-eraser',            modes:['ecrit','oral'], hint:'Mot ou idée manquante' },
    { key:'prononciation',label:'Prononciation',  es:'Pronunciación',      bg:'#FFE4E6', fg:'#BE123C', icon:'fa-waveform-lines',    modes:['oral'],         hint:'Sons français, u/ou, r, nasales' },
    { key:'liaison',      label:'Liaisons',       es:'Enlaces',            bg:'#FAE8FF', fg:'#86198F', icon:'fa-grip-lines',        modes:['oral'],         hint:'les_amis, c\'est_un' },
    { key:'fluidite',     label:'Fluidité',       es:'Fluidez',            bg:'#FFFBEB', fg:'#A16207', icon:'fa-gauge-high',        modes:['oral'],         hint:'Hésitations, blancs, débit' },
    { key:'registre',     label:'Registre',       es:'Registro',           bg:'#F0FDF4', fg:'#166534', icon:'fa-user-tie',          modes:['oral'],         hint:'Trop formel ou trop familier' },
    { key:'autre',        label:'À revoir',       es:'Por repasar',        bg:'#F3F4F6', fg:'#4B5563', icon:'fa-circle-question',   modes:['ecrit','oral'], hint:'Autre point' }
  ],

  cat(key) {
    const k = String(key || '').toLowerCase().trim();
    return this.CATEGORIES.find(c => c.key === k) ||
           this.CATEGORIES.find(c => c.key === 'autre');
  },

  catsFor(mode) {
    return this.CATEGORIES.filter(c => c.modes.includes(mode));
  },

  /* ── Stockage ─────────────────────────────────────────────── */
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.STORE) || 'null'); } catch { d = null; }
    if (!d || typeof d !== 'object') d = {};
    if (!Array.isArray(d.points))   d.points   = [];
    if (!Array.isArray(d.sessions)) d.sessions = [];
    d.version = 1;
    // Champs manquants (carnets créés par une version antérieure)
    d.points.forEach(p => {
      p.examples    = Array.isArray(p.examples) ? p.examples : [];
      p.occurrences = p.occurrences || p.examples.length || 1;
      p.cleanStreak = p.cleanStreak || 0;
      p.relapses    = p.relapses || 0;
      p.status      = p.status || 'active';
    });
    return d;
  },

  save(data) {
    localStorage.setItem(this.STORE, JSON.stringify(data));
    return data;
  },

  get points()   { return this.load().points; },
  get sessions() { return this.load().sessions; },

  /* ── Recherche de point ───────────────────────────────────── */
  _norm(s) {
    return String(s || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Deux libellés désignent le même point si l'un contient l'autre
  // ou s'ils partagent l'essentiel de leurs mots significatifs.
  _sameLabel(a, b) {
    const na = this._norm(a), nb = this._norm(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    if (na.includes(nb) || nb.includes(na)) return true;
    const wa = new Set(na.split(' ').filter(w => w.length > 3));
    const wb = new Set(nb.split(' ').filter(w => w.length > 3));
    if (!wa.size || !wb.size) return false;
    let common = 0;
    wa.forEach(w => { if (wb.has(w)) common++; });
    return common / Math.min(wa.size, wb.size) >= 0.7;
  },

  findPoint(data, { id, category, label }) {
    if (id) {
      const byId = data.points.find(p => p.id === id);
      if (byId) return byId;
    }
    const cat = this.cat(category).key;
    return data.points.find(p => p.category === cat && this._sameLabel(p.label, label)) || null;
  },

  _newId() {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  },

  /* ── Enregistrement d'une session ─────────────────────────────
     errors    : [{ pointId?, category, label, wrong, right, note }]
     type      : 'dictee' | 'oral'
     confirmed : ids des points qui étaient en jeu et qu'elle a réussis.
                 Une réussite constatée vaut mieux qu'une simple absence :
                 elle fait avancer deux fois plus vite vers « maîtrisé ».
     Renvoie le changelog à montrer à l'étudiante.              */
  record({ type, articleId = null, errors = [], confirmed = [], at = null }) {
    const data = this.load();
    const stamp = at || new Date().toISOString();
    const mode  = type === 'oral' ? 'oral' : 'ecrit';

    const newIds = [], repeatedIds = [], relapseIds = [], touched = new Set();

    errors.forEach(e => {
      const cat   = this.cat(e.category);
      const label = String(e.label || cat.label).trim().slice(0, 120);
      const example = {
        wrong: String(e.wrong || '').trim(),
        right: String(e.right || '').trim(),
        note:  String(e.note  || '').trim(),
        at: stamp, source: type, articleId
      };

      let p = this.findPoint(data, { id: e.pointId, category: cat.key, label });

      if (!p) {
        p = {
          id: this._newId(),
          category: cat.key,
          label,
          es: String(e.es || '').trim(),
          occurrences: 0,
          cleanStreak: 0,
          relapses: 0,
          status: 'active',
          firstSeen: stamp,
          lastSeen: stamp,
          masteredAt: null,
          examples: []
        };
        data.points.push(p);
        newIds.push(p.id);
      } else {
        if (p.status === 'mastered') { p.relapses = (p.relapses || 0) + 1; relapseIds.push(p.id); }
        else if (!newIds.includes(p.id)) repeatedIds.push(p.id);
      }

      p.occurrences += 1;
      p.cleanStreak  = 0;
      p.status       = 'active';
      p.masteredAt   = null;
      p.lastSeen     = stamp;
      if (!p.es && e.es) p.es = String(e.es).trim();
      if (example.wrong || example.right || example.note) {
        p.examples.unshift(example);
        p.examples = p.examples.slice(0, this.MAX_EXAMPLES);
      }
      touched.add(p.id);
    });

    // Les points testables non revus cette fois progressent.
    const confirmedSet = new Set(Array.isArray(confirmed) ? confirmed : []);
    const masteredIds = [];
    data.points.forEach(p => {
      if (touched.has(p.id)) return;
      if (!this.cat(p.category).modes.includes(mode)) return;   // pas testable ici
      if (p.status === 'mastered') return;
      p.cleanStreak = (p.cleanStreak || 0) + (confirmedSet.has(p.id) ? 2 : 1);
      if (p.cleanStreak >= this.CLEAN_TARGET) {
        p.status = 'mastered';
        p.masteredAt = stamp;
        masteredIds.push(p.id);
      } else {
        p.status = 'improving';
      }
    });

    const session = {
      id: 's' + Date.now().toString(36),
      at: stamp, type, articleId,
      errorCount: errors.length,
      newIds, repeatedIds, masteredIds, relapseIds
    };
    data.sessions.push(session);
    this.save(data);

    return {
      session,
      new:      newIds.map(id => data.points.find(p => p.id === id)).filter(Boolean),
      repeated: repeatedIds.map(id => data.points.find(p => p.id === id)).filter(Boolean),
      mastered: masteredIds.map(id => data.points.find(p => p.id === id)).filter(Boolean),
      relapse:  relapseIds.map(id => data.points.find(p => p.id === id)).filter(Boolean)
    };
  },

  /* ── Statistiques ─────────────────────────────────────────── */
  stats() {
    const data = this.load();
    const active   = data.points.filter(p => p.status === 'active').length;
    const improving= data.points.filter(p => p.status === 'improving').length;
    const mastered = data.points.filter(p => p.status === 'mastered').length;
    const byCat = {};
    data.points.forEach(p => {
      byCat[p.category] = byCat[p.category] || { total: 0, mastered: 0, occurrences: 0 };
      byCat[p.category].total++;
      byCat[p.category].occurrences += p.occurrences || 0;
      if (p.status === 'mastered') byCat[p.category].mastered++;
    });
    return {
      total: data.points.length, active, improving, mastered, byCat,
      sessions: data.sessions.length,
      occurrences: data.points.reduce((a, p) => a + (p.occurrences || 0), 0)
    };
  },

  // Points à travailler en priorité : les plus fréquents et les plus récents.
  priority(limit = 8, mode = null) {
    return this.load().points
      .filter(p => p.status !== 'mastered')
      .filter(p => !mode || this.cat(p.category).modes.includes(mode))
      .sort((a, b) => (b.occurrences - a.occurrences) ||
                      String(b.lastSeen).localeCompare(String(a.lastSeen)))
      .slice(0, limit);
  },

  /* ── Sérialisation pour un prompt IA ─────────────────────────
     Compact et stable : l'IA doit pouvoir renvoyer les mêmes ids. */
  summaryForPrompt(limit = 22, mode = 'ecrit') {
    const pts = this.load().points
      .filter(p => !mode || this.cat(p.category).modes.includes(mode))
      .sort((a, b) => {
        const rank = s => s === 'active' ? 0 : s === 'improving' ? 1 : 2;
        return rank(a.status) - rank(b.status) ||
               (b.occurrences - a.occurrences);
      })
      .slice(0, limit);

    if (!pts.length) return '(carnet vide : c\'est la première correction)';

    return pts.map(p => {
      const ex = p.examples[0];
      const exStr = ex && (ex.wrong || ex.right)
        ? ` | ex : "${ex.wrong}" → "${ex.right}"` : '';
      const st = p.status === 'mastered' ? 'maîtrisé'
               : p.status === 'improving' ? `en progrès (${p.cleanStreak} session(s) sans erreur)`
               : 'actif';
      return `- [${p.id}] ${this.cat(p.category).label} · ${p.label} — ${p.occurrences} fois, ${st}${exStr}`;
    }).join('\n');
  },

  /* ── Rendu du changelog (HTML) ────────────────────────────────
     Partagé par la dictée et l'oral pour rester identique
     visuellement d'un exercice à l'autre.                       */
  renderChangelog(log, { title = 'Ton carnet a été mis à jour' } = {}) {
    const esc = s => this.esc(s);
    const block = (items, cfg) => {
      if (!items.length) return '';
      return `
        <div class="cn-block" style="--cn-c:${cfg.color}; --cn-bg:${cfg.bg};">
          <p class="cn-block-title">
            <i class="fa-solid ${cfg.icon}"></i>
            ${cfg.label} <span class="cn-count">${items.length}</span>
          </p>
          <div class="cn-list">
            ${items.map(p => {
              const c = this.cat(p.category);
              const ex = p.examples && p.examples[0];
              return `
                <div class="cn-item">
                  <span class="cn-badge" style="background:${c.bg}; color:${c.fg};">${c.label}</span>
                  <div class="cn-item-body">
                    <p class="cn-item-label">${esc(p.label)}</p>
                    ${ex && (ex.wrong || ex.right) ? `
                      <p class="cn-item-ex">
                        ${ex.wrong ? `<del>${esc(ex.wrong)}</del>` : ''}
                        ${ex.wrong && ex.right ? '<i class="fa-solid fa-arrow-right"></i>' : ''}
                        ${ex.right ? `<ins>${esc(ex.right)}</ins>` : ''}
                      </p>` : ''}
                    <p class="cn-item-meta">
                      ${p.occurrences} fois au total${cfg.showStreak && p.cleanStreak ? ` · ${p.cleanStreak} sessions propres` : ''}
                    </p>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    };

    const nothing = !log.new.length && !log.repeated.length && !log.mastered.length && !log.relapse.length;

    return `
      <div class="cn-wrap">
        <p class="cn-title"><i class="fa-solid fa-book-bookmark"></i> ${esc(title)}</p>
        ${nothing ? `<p class="cn-empty">Aucun changement : rien de nouveau, rien de répété.</p>` : ''}
        ${block(log.mastered, { label:'Points corrigés',  icon:'fa-circle-check',        color:'#15803D', bg:'#F0FDF4', showStreak:true })}
        ${block(log.new,      { label:'Nouveaux points',  icon:'fa-circle-plus',         color:'#B45309', bg:'#FFFBEB' })}
        ${block(log.repeated, { label:'Points répétés',   icon:'fa-rotate-right',        color:'#B91C1C', bg:'#FEF2F2' })}
        ${block(log.relapse,  { label:'Récidives',        icon:'fa-triangle-exclamation',color:'#BE123C', bg:'#FFF1F2' })}
        <a href="carnet.html" class="cn-link" target="_blank" rel="noopener"
           title="S'ouvre dans un nouvel onglet : tu ne perds pas ta leçon">
          <i class="fa-solid fa-book-bookmark"></i> Voir tout mon carnet
          <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9px; opacity:.6;"></i>
        </a>
      </div>`;
  },

  // Styles du changelog, injectés une seule fois par page.
  injectStyles() {
    if (document.getElementById('carnet-styles')) return;
    const css = `
      .cn-wrap { font-family:'Nunito',sans-serif; }
      .cn-title { font-family:'Montserrat',sans-serif; font-size:11px; font-weight:800;
                  text-transform:uppercase; letter-spacing:.12em; color:#002654; margin-bottom:14px; }
      .cn-title i { color:#D4AF37; margin-right:6px; }
      .cn-empty { font-size:13px; color:#9ca3af; padding:10px 0 4px; }
      .cn-block { background:var(--cn-bg); border:1px solid color-mix(in srgb, var(--cn-c) 22%, transparent);
                  border-radius:14px; padding:12px 14px; margin-bottom:10px; }
      .cn-block-title { font-family:'Montserrat',sans-serif; font-size:10px; font-weight:800;
                        text-transform:uppercase; letter-spacing:.1em; color:var(--cn-c);
                        display:flex; align-items:center; gap:7px; margin-bottom:9px; }
      .cn-count { background:var(--cn-c); color:#fff; border-radius:999px; padding:1px 7px; font-size:9px; }
      .cn-list { display:flex; flex-direction:column; gap:9px; }
      .cn-item { display:flex; gap:9px; align-items:flex-start; }
      .cn-badge { flex-shrink:0; font-family:'Montserrat',sans-serif; font-size:9px; font-weight:800;
                  text-transform:uppercase; letter-spacing:.08em; padding:3px 8px; border-radius:999px; }
      .cn-item-body { min-width:0; flex:1; }
      .cn-item-label { font-size:13.5px; font-weight:700; color:#1f2937; line-height:1.4; }
      .cn-item-ex { font-size:12.5px; color:#4b5563; margin-top:2px; display:flex; flex-wrap:wrap;
                    align-items:center; gap:6px; }
      .cn-item-ex del { color:#9ca3af; }
      .cn-item-ex ins { text-decoration:none; font-weight:800; color:#0f766e; }
      .cn-item-ex i { font-size:9px; color:#9ca3af; }
      .cn-item-meta { font-size:10.5px; color:#9ca3af; margin-top:2px;
                      font-family:'Montserrat',sans-serif; font-weight:600; }
      .cn-link { display:inline-flex; align-items:center; gap:7px; margin-top:6px;
                 font-family:'Montserrat',sans-serif; font-size:11px; font-weight:800;
                 color:#002654; text-decoration:none; border-bottom:1px solid #D4AF37; padding-bottom:2px; }
    `;
    const el = document.createElement('style');
    el.id = 'carnet-styles';
    el.textContent = css;
    document.head.appendChild(el);
  },

  /* ── Utilitaires ──────────────────────────────────────────── */
  esc(str) {
    return String(str === 0 ? '0' : (str || ''))
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  },

  removePoint(id) {
    const data = this.load();
    data.points = data.points.filter(p => p.id !== id);
    data.sessions.forEach(s => {
      ['newIds','repeatedIds','masteredIds','relapseIds'].forEach(k => {
        if (Array.isArray(s[k])) s[k] = s[k].filter(x => x !== id);
      });
    });
    return this.save(data);
  },

  setStatus(id, status) {
    const data = this.load();
    const p = data.points.find(x => x.id === id);
    if (!p) return null;
    p.status = status;
    if (status === 'mastered') {
      p.masteredAt = new Date().toISOString();
      p.cleanStreak = Math.max(p.cleanStreak || 0, this.CLEAN_TARGET);
    } else {
      p.masteredAt = null;
      if (status === 'active') p.cleanStreak = 0;
    }
    return this.save(data);
  },

  exportJson() {
    return JSON.stringify(this.load(), null, 2);
  },

  importJson(raw, { merge = true } = {}) {
    const incoming = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!incoming || !Array.isArray(incoming.points)) throw new Error('FORMAT');
    if (!merge) return this.save({
      version: 1,
      points: incoming.points,
      sessions: Array.isArray(incoming.sessions) ? incoming.sessions : []
    });

    const data = this.load();
    incoming.points.forEach(ip => {
      const p = this.findPoint(data, { id: ip.id, category: ip.category, label: ip.label });
      if (!p) { data.points.push(ip); return; }
      p.occurrences = Math.max(p.occurrences || 0, ip.occurrences || 0);
      const seen = new Set(p.examples.map(e => e.wrong + '|' + e.right));
      (ip.examples || []).forEach(e => {
        if (!seen.has(e.wrong + '|' + e.right)) { p.examples.push(e); seen.add(e.wrong + '|' + e.right); }
      });
      p.examples = p.examples
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))
        .slice(0, this.MAX_EXAMPLES);
      if (String(ip.lastSeen || '') > String(p.lastSeen || '')) {
        p.lastSeen = ip.lastSeen; p.status = ip.status || p.status; p.cleanStreak = ip.cleanStreak || 0;
      }
    });
    const known = new Set(data.sessions.map(s => s.id));
    (incoming.sessions || []).forEach(s => { if (!known.has(s.id)) data.sessions.push(s); });
    data.sessions.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    return this.save(data);
  },

  reset() {
    localStorage.removeItem(this.STORE);
  }
};

/* ═══════════════════════════════════════════════════════════════
   RELAIS VERS CLAUDE — mode manuel partagé
   La correction passe par une IA externe : on ouvre Claude avec
   le prompt prérempli, l'utilisateur colle la réponse JSON.
   ═══════════════════════════════════════════════════════════════ */
const AIRelay = {

  CLAUDE_URL: 'https://claude.ai/new',
  // L'encodage d'un texte français gonfle l'URL d'environ 55 %.
  // Au-delà, on ouvre Claude sans préremplir : l'utilisateur colle.
  MAX_URL_LEN: 9000,

  async copy(txt) {
    try { await navigator.clipboard.writeText(txt); return true; }
    catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch { return false; }
    }
  },

  // Doit être appelé de façon SYNCHRONE depuis le clic, sinon le
  // navigateur bloque l'ouverture de l'onglet.
  open(prompt) {
    const full = `${this.CLAUDE_URL}?q=${encodeURIComponent(prompt)}`;
    const prefilled = full.length <= this.MAX_URL_LEN;
    const w = window.open(prefilled ? full : this.CLAUDE_URL, '_blank');
    if (w) { try { w.opener = null; } catch {} }
    return { opened: !!w, prefilled: prefilled && !!w };
  },

  parseJson(raw) {
    const txt = String(raw || '').trim()
      .replace(/^```(?:json)?/i, '').replace(/```$/, '');
    try { return JSON.parse(txt); } catch {}
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  },

  // Localise un fragment dans un texte. L'IA ne le recopie pas
  // toujours au caractère près : on tolère la casse et les espaces.
  findFragment(haystack, needle) {
    const H = String(haystack || ''), N = String(needle || '');
    if (!H || !N) return null;

    let i = H.indexOf(N);
    if (i >= 0) return { index: i, length: N.length };

    i = H.toLowerCase().indexOf(N.toLowerCase());
    if (i >= 0) return { index: i, length: N.length };

    const pattern = N.trim().split(/\s+/)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
    try {
      const m = pattern && H.match(new RegExp(pattern, 'i'));
      if (m) return { index: m.index, length: m[0].length };
    } catch { /* motif inexploitable */ }

    return null;
  }
};
