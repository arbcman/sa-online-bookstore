# SA Online Bookstore

A static bookstore web app: HTML + CSS + JS, data in `localStorage`, no server and no build step.
Requirements are in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) (R1–R20), design in
[docs/DESIGN.md](docs/DESIGN.md), UML in [docs/UML.md](docs/UML.md).

## Live demo

**https://arbcman.github.io/sa-online-bookstore/**

The root URL forwards to the storefront (`Customer's/Index.html`). Pages are served by GitHub
Pages from the `main` branch — push to `main` and the site rebuilds automatically. Data is stored
per browser, so the demo starts from the seed catalogue on each new browser/device.

### Demo accounts (seeded automatically)

| Role | Email | Password |
|---|---|---|
| Customer | `cust@gmail.com` | `customer123` |
| Administrator | `admin@gmail.com` | `admin123` |

## Run it locally

Open `Customer's/Login.html` directly, or serve the folder:

```bash
cd "/home/arbcman/SA-1 Online bookstore"
python3 -m http.server 8000
```

Then visit <http://localhost:8000/Customer's/Login.html>.

Seed content (`GENRES`, `SEED_BOOKS` in `assets/js/store.js`) only loads when `DB_VERSION`
changes. After editing it, bump `DB_VERSION`, or click **Reset demo data** in the site footer.
