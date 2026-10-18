# Keresőmegjelenés – jrepas.hu

## Elkészült

- A teljes látható magyar és angol szöveg újraírása, a tényleges grafikai szolgáltatások természetes megnevezésével.
- JavaScript nélkül is olvasható magyar főoldal. A Rust/WASM a látogatónak továbbra is a kiválasztott nyelvet jeleníti meg.
- Egyedi keresési cím és leírás a főoldalon, nyelvváltáskor frissülő közösségi metaadatokkal.
- Kanonikus cím: `https://jrepas.hu/`.
- Schema.org Person, WebSite, WebPage és Service adatok, valós névvel, elérhetőséggel és szolgáltatásokkal. Nincs kitalált cím, értékelés vagy díjazás.
- `https://jrepas.hu/robots.txt`, `https://jrepas.hu/sitemap.xml`, 1200×630-as megosztási kép.
- `/index.html` átirányítása `/` címre. Saját `404.html`, hogy a Cloudflare Pages az ismeretlen címekre valódi 404-et adjon a kezdőlap 200-as visszaadása helyett.
- A csomagolástervezés a főoldali kártyán szerepel, külön aloldal nélkül. A régi `/packaging` és `/packaging.html` címek 301-gyel a `/#service-packaging` szakaszra irányítanak. A sitemap csak a főoldalt tartalmazza.

A generált HTML és a metaadatok frissítése: `python3 scripts/prepare-seo.py`.
Ez a `scripts/build.sh` részeként is lefut. Ellenőrzés: `npm run test:seo`.

## Teendők a Google Search Console-ban

1. Nyisd meg: https://search.google.com/search-console/ . Add hozzá a `jrepas.hu` domaint, ha még nincs felvéve.
2. A Google által kért TXT rekordot a Cloudflare **DNS → Records → Add record** pontjában add hozzá. A tényleges értéket a Search Console adja; nem kell megosztanod a beszélgetésben.
3. A **Webhelytérképek / Sitemaps** résznél küldd be: `https://jrepas.hu/sitemap.xml`.
4. Az **URL-ellenőrzés / URL inspection** mezőben ellenőrizd a `https://jrepas.hu/` címet. Futtasd az élő tesztet, majd válaszd az indexelés kérését.
5. Az indexelési jelentésből derül ki a tényleges kizárási ok. Ha a Google blokkolást jelez, ellenőrizd a Cloudflare botvédelmi/WAF-eseményeket, és kizárólag a szükséges szabályt módosítsd. A Googlebot ne kapjon bejelentkezési vagy ellenőrző képernyőt.

A kódoldali javítások nem jelentenek automatikus vagy garantált Google-indexelést, helyezést vagy határidőt. A Search Console adatai és az éles szerver válasza nélkül nem állapítható meg biztosan, eddig miért nem jelent meg az oldal.

## Ellenőrzési korlát

Ebben a munkakörnyezetben a `https://jrepas.hu/` lekérése a hálózati proxyban elakad (CONNECT 403), még az éles webhely elérése előtt. Ez **nem bizonyítja**, hogy a nyilvános webhely vagy a Googlebot is 403-at kap. A lokális tartalom, útvonalak és böngészős működés ellenőrizhető; az éles Cloudflare-szabályok és a Search Console ellenőrzése külön szükséges.

A korábbi csomagolásoldal eltávolítva; a régi címeket megtartott 301-es átirányítás kezeli.

A Cloudflare helyi futtatásán a státuszkódok is ellenőrizhetők: `TEST_BASE_URL=http://127.0.0.1:8005 TEST_EDGE_STATUS=1 npm run test:seo`. A vizsgálat a 301-es kezdőlap-átirányítást, a csomagolásoldal régi címeinek átirányítását és az ismeretlen URL valódi 404-es válaszát ellenőrzi.

## Érthetőség és ajánlatkérés

A főcím közvetlenül megnevezi a grafikai tervezést. A szolgáltatások előtt rövid kategórialinkek segítik a választást; a menüből a munkafolyamat is közvetlenül elérhető. A hat lépés jelzi az ajánlat elfogadását a tervezés előtt, és az átadás tartalmát. A gyakori kérdések tisztázzák az árazás alapját, az induláshoz szükséges információkat és a fájlformátumok egyeztetését.

Az „Ajánlatot kérek” gombok a kapcsolat szakaszhoz vezetnek. Az egyetlen e-mail-gomb előre kitöltött tárggyal és a projektleírás kérdéseivel nyit levelet; a felhasználó saját levelezőjében küldi el az üzenetet. Ez ajánlatkérés, nem automatikus rendelés vagy fizetés. A cím és az alap e-mail-gomb JavaScript nélkül is használható.

A mobilos menü és a vezérlők legalább 44 px magasak. A törzsszöveg kontrasztosabb, a címek kevésbé törnek, a mozgáscsökkentési beállítást a görgetés is követi. A dekoráció és a képek nem helyettesítik a szolgáltatások szöveges leírását. Az optimalizált, megfelelő méretváltozatban betöltött képek megmaradtak, a hajtás alatti képek késleltetve töltődnek. A verziózott WASM- és Lenis-fájlok tartós böngésző-gyorsítótárat kapnak; a szövegfrissítéshez szükségtelen külön JSON-lekérés megszűnt.

Ellenőrzések: `npm test`, `npm run test:ux`, `npm run test:motion`, `npm run test:seo` és `cargo test --locked`. A UX-teszt 320, 390, 768 és 1440 px szélességen, mindkét témával és nyelvvel ellenőrzi a navigációt, a címeket, a egyszerű kapcsolatfelvételt, az e-mail tartalmát és a kérdések billentyűzetes használatát. Ezek funkcionális ellenőrzések; nem helyettesítik a valódi látogatói használat mérését vagy a Search Console adatait.
