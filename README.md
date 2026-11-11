# Steady Christmas Delivery – pełna wersja lokalna

Przeglądarkowa gra świąteczna (HTML + CSS + Vanilla JS + Canvas, bez frameworków, bez backendu).
11 bohaterów Steady, 3 poziomy, finałowy boss, punktacja z bonusem czasu, sterowanie na desktopie i telefonie.

## 1. Uruchomienie lokalne
- **Najprościej:** otwórz `steady-christmas-delivery.html` (cała gra w jednym pliku) dwuklikiem.
- **Wersja modułowa:** rozpakuj ZIP i otwórz `index.html`. Foldery `css/` i `js/` muszą leżeć obok niego.
- Po zmianach w kodzie wersję jednoplikową odtworzysz: `python3 build-single-file.py`.
- Nie jest potrzebny serwer ani instalacja. Telefon: wrzuć pliki na hosting statyczny i podlinkuj adres kodem QR.

## 2. Wdrożenie na landing page
1. Wgraj `steady-christmas-delivery.html` na hosting i wstaw przez `<iframe src="..." style="width:100%;height:80vh;border:0" allow="fullscreen"></iframe>`,
   **albo** skopiuj `<main id="stage">…</main>`, `css/style.css` i skrypty do swojej strony.
2. Gra wypełnia kontener `#stage` (100% jego szerokości i wysokości). Nadaj kontenerowi rozmiar (np. `height: 80vh`); `ResizeObserver` dopasuje canvas.
3. Style `html, body { overflow:hidden; touch-action:none }` są ustawione dla strony samodzielnej. W iframe nie trzeba nic zmieniać.
4. Uwaga na landing page: gra przechwytuje spację i strzałki tylko w trakcie rozgrywki.

## 3. Struktura projektu
- `index.html` – szkielet, ekrany, HUD, sterowanie dotykowe
- `css/style.css` – wygląd interfejsu (safe area, mobile)
- `js/config.js` – **parametry gry**: gracz, przeciwnicy (`ENEMY_TYPES`), boss (`BOSS`), kamera
- `js/characters.js` – 11 postaci (tylko wygląd)
- `js/maps.js` – legenda kafelków, kolizje i **3 ręcznie zaprojektowane poziomy** (napisy znaków + listy obiektów)
- `js/sprites.js` – cała grafika pixel art generowana w kodzie (siatki znaków 16×16, kafelki, boss)
- `js/effects.js` – cząsteczki i napisy punktów
- `js/controls.js` – klawiatura, joystick dotykowy, przycisk ataku
- `js/scoring.js` – **punktacja** (wartości na górze pliku)
- `js/player.js`, `js/enemies.js`, `js/boss.js`, `js/combat.js` – bohater, wrogowie, boss, atak i pociski
- `js/ui.js` – ekrany, HUD, podsumowania · `js/game.js` – pętla, poziomy, kamera, prezenty · `js/main.js` – spinanie ekranów z grą
- `build-single-file.py` – skleja wszystko w jeden plik HTML

## 4. Jak działa punktacja
| Akcja | Punkty |
|---|---|
| Pokonanie zwykłego przeciwnika (bałwan, lodowy stworek, Bug) | +50 |
| Pokonanie trudniejszego (Deadline, Mroźny bałwan, Lodowy alfa, Wielki Deadline) | +100 |
| Dostarczony prezent (naliczany **przy dostawie do sań**, nie przy zebraniu) | +250 |
| Ukończenie poziomu | +500 |
| Pokonanie The Big Deadline | +1000 |
| Każdy utracony punkt życia | −40 |
| Bonus czasu (tylko po ukończeniu wszystkich poziomów) | `max(0, 1000 − 2 × sekundy)` |

- Czas liczy się tylko w trakcie rozgrywki, bez menu i ekranów pośrednich, od początku poziomu 1 do końca poziomu 3.
- Każda akcja liczy się raz: wróg ma flagę `scored`, prezent można zebrać raz, dostawa zeruje „plecak”, a poziom kończy się raz.
- Wynik końcowy nie spada poniżej 0. Prezenty zebrane, ale niedostarczone przed śmiercią, nie dają punktów.
- **Odchylenie od propozycji:** zamiast `600 − 2·t` użyłem `1000 − 2·t`. Przy docelowych 5–8 minutach rozgrywki oryginalna formuła dawałaby bonus 0 prawie każdemu. Zmienisz to w `SCORING.timeBonus`.
- Maksymalnie do zdobycia za walkę, prezenty i poziomy jest ok. 7000 pkt, a bonus czasu to najwyżej 1000, więc pomijanie wrogów i prezentów się nie opłaca.

## 5. Najważniejsze parametry do zmiany
- Szybkość, HP, zasięg ataku bohaterów (wspólne dla wszystkich): `CONFIG.player` w `config.js`
- HP, szybkość, obrażenia, zasięg wykrycia każdego wroga: `ENEMY_TYPES` w `config.js`
- Boss (HP, czasy ostrzeżeń, prędkości ataków, próg wściekłości): `BOSS` w `config.js`
- Punkty i bonus czasu: `SCORING` w `scoring.js`
- Układ map, prezenty, pierniczki, wrogowie: `LEVELS` w `maps.js` (współrzędne w kafelkach)
- Wygląd postaci: `characters.js` (kolory, fryzura, czapka); kształty fryzur: `characterRows` w `sprites.js`

## 6. Zasady gry
Zbierz wszystkie prezenty na mapie i zanieś je do sań (punkt dostawy, wskazuje je strzałka). Wrogowie nie są wymagani do ukończenia poziomu, ale dają punkty.
Na poziomie 3 trzeba dodatkowo pokonać The Big Deadline. Pierniczki leczą 1 HP. Życie wraca do pełna na początku każdego poziomu.
Boss ma 3 ataki, każdy z sygnałem: **szarża** (czerwony pas), **burza papierów** (żółty pierścień) i **uderzenie zegara** (czerwone koło; trzeba z niego uciec).

## 7. Instrukcja testowania
1. Otwórz grę i przejdź: start → fabuła → wybór postaci → intro → poziom 1.
2. Sprawdź kolejno wszystkie 11 postaci (wygląd w menu i w grze). Parametry są identyczne, bo `Player` nie czyta nic z `characters.js` poza identyfikatorem sprite'a.
3. Przejdź poziomy 1–3, sprawdzając: zbieranie i dostawę prezentów, odmowę ukończenia bez prezentów, punkty nad wrogami, karę za obrażenia (HUD, podsumowanie), bonus czasu na ekranie końcowym.
4. Przegraj celowo (ekran końcowy bez bonusu czasu), potem „Zagraj ponownie” i „Zmień postać”. Na ekranie startowym i wyboru postaci jest też „Ostatni wynik”.
5. Telefon: pion i poziom, joystick, przycisk ataku, brak przewijania strony, zachowanie notcha (safe area).
6. Balans: jeśli za łatwo lub za trudno, zmień `ENEMY_TYPES`, `BOSS` i `CONFIG.player`.

## 8. Co jest gotowe, a co jest placeholderem
**Gotowe i działające:** przepływ ekranów, 11 postaci, 3 poziomy, 7 typów wrogów, boss z 3 atakami, prezenty i dostawa, punktacja, bonus czasu, kara za obrażenia, podsumowania, sterowanie desktop/mobile, kamera, skalowanie.
**Placeholdery / do dopracowania przez grafika:** cała grafika jest generowana kodem (pixel art „pierwszego przejścia”, bez plików w `assets/`), a postacie mają 3 klatki chodu bez osobnego widoku z boku (ruch w lewo to odbicie lustrzane). Animacje wrogów to kołysanie, bez klatek. Nie ma dźwięku ani muzyki.

## 9. Znane ograniczenia i ryzyka
- **Gra nie była przeze mnie testowana w prawdziwej przeglądarce ani na telefonie.** Logika (przepływ, punktacja, kolizje, boss, 11 postaci, kamera) przeszła testy automatyczne w Node z atrapą przeglądarki. Wygląd, płynność i „czucie” gry musicie ocenić ręcznie.
- Długość rozgrywki (cel 5–8 min) i poziom trudności nie były mierzone na ludziach. Strojenie opisano wyżej.
- AI wrogów jest prosta: pościg z obejściem przeszkód, bez wyszukiwania ścieżki. Rzadko mogą utknąć w zakamarkach.
- Joystick dotykowy obsługuje jeden palec na joysticku i jeden na przycisku. Safari na starszych iOS może inaczej traktować `100dvh`.
- Wynik jest tylko w pamięci strony: odświeżenie ją czyści. Ranking i backend są poza zakresem tego etapu.
