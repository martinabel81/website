# martinabel.net

Plain HTML/CSS/JS site for GitHub Pages. No build step.

| File | What it holds |
|---|---|
| `index.html` | Page layout, bio, teaching |
| `data.js` | All papers, ongoing projects, student research |
| `app.js` | Clickable cards, filters, search, BibTeX |
| `style.css` | Design |
| `assets/` | `headshot.jpg`, `Martin-Abel_CV.pdf`, `figures/*.png` |

## Add a paper
Copy an entry in `papers` in `data.js`, edit the fields, and set `featured: true` to show it in the top grid.
Put its key figure in `assets/figures/` and set `figure` to that path (optional `figureCaption`).

## Preview locally
Double-click `index.html`.

## Link to a paper
`martinabel.net/#paper-9` opens that paper directly.
