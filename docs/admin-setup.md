# Az admin aktiválása Cloudflare Pagesen

Az admin címe: **https://jrepas.hu/admin/**.

A kód és a tesztek elkészültek. Az éles szerkesztést az alábbi egyszeri
Cloudflare-beállítások engedélyezik. Ezek nélkül az admin érthető beállítási
üzenetet mutat, a meglévő nyilvános oldal pedig változatlanul működik.

## 1. Tartalom-adatbázis

1. A Cloudflare-fiókban hozz létre egy D1 adatbázist, például `jrepas-content` néven.
2. A D1 konzoljában futtasd a [migráció](../migrations/0001_content.sql) teljes
   tartalmát. Ez létrehozza a táblát és az üres piszkozatot; nem módosít meglévő
   szövegeket.
3. A **meglévő Pages projekt** beállításainál adj hozzá egy D1 bindingot:
   változónév **`SITE_DB`**, adatbázis az előbb létrehozott `jrepas-content`.
   A Production környezetet állítsd be. Teszttelepítéshez külön adatbázist használj,
   ne ugyanazt az éles adatbázist.

## 2. Belépés

1. A Cloudflare Zero Trust / Access alatt hozz létre egy **Self-hosted** alkalmazást.
2. Védd a **`jrepas.hu/admin*`** útvonalat. Ez az `/admin/` felületet és az
   `/admin/api/` végpontokat is lefedi. Ha másik hostnéven is használod az admint,
   azt is add hozzá ugyanahhoz az alkalmazáshoz.
3. Az Allow szabályba **kizárólag a saját e-mail-címedet** vedd fel. Használhatsz
   e-mailes egyszeri belépőkódot (One-time PIN) vagy meglévő identitásszolgáltatót.
4. A Pages projekt Production környezetében add meg:

   | Változó | Tartalom |
   | --- | --- |
   | `CF_ACCESS_TEAM_DOMAIN` | A Zero Trust csapatdomain, például `sajatcsapat.cloudflareaccess.com`, `https://` és útvonal nélkül |
   | `CF_ACCESS_AUD` | Az előbb létrehozott Access-alkalmazás Application Audience (AUD) azonosítója |

   Ezek konfigurációs azonosítók, nem jelszavak. A belépéshez nem kell GitHub-token
   vagy jelszó a forráskódba. A backend minden admin kérésnél ellenőrzi az Access
   JWT aláírását, lejáratát, kibocsátóját és célalkalmazását. A fejléc önmagában
   nem jogosít szerkesztésre.

## 3. Újratelepítés és ellenőrzés

A bindingok és változók mentése után indíts egy új telepítést a Pages projektben
(Retry deployment / új deployment a `main` ágról). A build továbbra is **None**,
üres build command és **`.`** output directory; ne kelljen külön Rust szervert indítani.

1. Nyisd meg a **https://jrepas.hu/admin/** címet, és jelentkezz be.
2. Válassz egy szakaszt, majd a Magyar / English nyelvet.
3. Módosíts egy szöveget, és válaszd a **Piszkozat mentése** gombot.
4. Az **Előnézet** menti a még nem mentett módosításokat, majd védett ablakban
   megmutatja a piszkozatot. Az éles látogatók ezt nem látják.
5. A **Közzététel** gomb és a megerősítés után frissül az élő tartalom. Nem kell
   GitHub-commit vagy új Rust-build minden szövegmódosításhoz.

A korábbi mentést másik ablakból nem lehet csendben felülírni: eltérő verziónál
az admin ütközést jelez. A piszkozat és a publikált tartalom külön adatbázissorban
van; a puszta mentés nem publikál.

## Mi szerkeszthető?

- Magyar és angol nyitószövegek, címek, leírások, menü- és gombfeliratok.
- A meglévő nyolc portfóliókártya és tíz carousel-lap szövegei.
- Nyitókép, portfólió- és carousel-képek **HTTPS URL-lel** vagy már létező
  `/images/…` útvonallal. Üres képmezőnél az eredeti kép/grafikus borító marad.
- E-mail-cím és Upwork-profil; az e-mail-gombok célja is követi a módosítást.

Közvetlen fájlfeltöltés, új kártyák hozzáadása és a dizájn CSS-szerkesztése ebben
az első adminváltozatban nincs. A képeket külön elérhető helyre kell feltölteni,
majd a címüket megadni. A szövegmezők egyszerű szöveget fogadnak el; az Enterrel
beírt sortörés megmarad, HTML-kód nem fut le.

## Fejlesztés és tesztek

```sh
npm ci
npm test
# Egy külön terminálban:
python3 -m http.server 8000 --bind 127.0.0.1
# Majd:
npm run test:browser
```

A böngészős teszt Chromiumot igényel; a cloud környezetben `/usr/bin/chromium`
elérhető. Más gépen `npx playwright install chromium`, vagy
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` használható.

A tesztek valós SQLite-on ellenőrzik a piszkozatot/publikálást és a verzióütközést,
valós RSA aláírással a JWT-ellenőrzést, böngészőben pedig a felületet, a képeket és
a Rustba érkező tartalom biztonságos megjelenítését. A böngészős teszt saját,
izolált hitelesítési fixture-t használ; az éles kódban nincs belépést megkerülő mód.

A teljes Pages/D1 környezet helyileg Wranglerrel futtatható. Ehhez saját helyi
`wrangler.toml` kell `pages_build_output_dir = "."`, `compatibility_date` és egy
`SITE_DB` D1-kötés megadásával; a helyi `database_id` nem valódi éles azonosító.
`npx wrangler d1 execute <helyi-db-nev> --local --file migrations/0001_content.sql`
után `npx wrangler pages dev --port 8788` indítja a szolgáltatást. Belépés nélkül
az API helyileg is megtagadja a hozzáférést. A helyi konfigurációt, `.dev.vars`
fájlt, adatbázist és tesztadatokat ne tedd közzé.
