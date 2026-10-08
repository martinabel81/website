# martinabel.net

Plain HTML/CSS/JS site on GitHub Pages (repo `martinabel81/website`, custom domain martinabel.net). No build step is needed to publish.

| File | What it holds |
|---|---|
| `index.html` | Page layout, bio, teaching, search/preview tags. Paper lists are pre-filled from `data.js` so search engines can read them. |
| `data.js` | All papers (abstract, links, figure, key finding, audio), work in progress, student research |
| `app.js` | Pop-ups, filters, search, BibTeX, audio player |
| `style.css` | Design |
| `assets/` | `headshot.jpg`, `Martin-Abel_CV.pdf`, `og-image.png` (link preview), `figures/`, `audio/` |
| `robots.txt`, `sitemap.xml` | Help search engines find the site |

## Updating the site
1. Change files in the local `site` folder (or ask Claude to).
2. On github.com/martinabel81/website: Add file → Upload files → drag in only the changed files/folders → Commit changes.
3. Wait ~1 minute, then reload martinabel.net (Ctrl+F5 to bypass the cache).

## Add a paper / figure / audio
In `data.js`, copy an entry in `papers` and edit it.
- Featured card: `featured: true`
- Figure: put the PNG in `assets/figures/`, set `figure`, `figureCaption`, `takeaway`
- Audio: put the file in `assets/audio/`, set `audio: {"src": "assets/audio/NAME.m4a", "length": "4 min"}`

Edits to `data.js` show up immediately for visitors. The search-engine copy inside `index.html` refreshes the next time Claude regenerates it.

## Link to a paper
`martinabel.net/#paper-19` opens that paper directly.
