# PEW PEW

**El matamarcianos que suena a ti.** Un shoot'em up absurdo dibujado a boli en un cuaderno, en el que todos los efectos de sonido los grabas tú con tu voz antes de jugar.

▶ **Jugar:** https://danuve3.github.io/pewpew/ (instalable como app)

## Qué tiene

- **Estudio de grabación:** 8 efectos (disparo, disparo enemigo, muerte enemigo, muerte propia, te dan, power-up, llega el jefe y jefe derrotado). Mantienes pulsado, haces el ruido y sueltas. Hasta 3 tomas por sonido; el juego elige una al azar en cada disparo.
- **Filtros de voz:** Normal, Ardilla, Gigante, Robot, Eco, Al revés y Caos (uno al azar cada vez). Además, cada reproducción varía un poco el tono.
- **Las grabaciones se guardan en el dispositivo** (IndexedDB) y no hay que regrabar cada partida. Nada sale de tu navegador.
- Los sonidos opcionales que no grabes se fabrican a partir de los tuyos con otro filtro. Si no hay micro, suenan pitidos tristes de emergencia.
- **4 personajes:** Michi Láser, Tostadora Kamikaze, Vaca Abducida y Pingüino Contable, cada uno con su arma.
- **Enemigos:** patos kamikaze, pulpos con gafas, brócolis furiosos, pizzas que se dividen, cabras rebotonas, plátanos bumerán y huevos… de los que salen pollitos que **no debes disparar**.
- **Jefes cada 4 oleadas:** El Lunes, La Abuela y El Router del Quinto.
- **Power-ups:** calcetines, gravedad invertida, modo Comic Sans, baguette invencible y croqueta (+1 vida).
- **Cada partida es distinta:** reglas aleatorias (viento de levante, hipo, día del sombrero, balas XXL, modo espejo, tercer café…), orden de enemigos y de jefes al azar.

## Controles

- **Móvil:** arrastra el dedo en cualquier parte de la pantalla. Se dispara solo.
- **Teclado:** flechas o WASD. `P` o `Esc` para pausar.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/
```

Vite + Canvas 2D en JavaScript sin dependencias de runtime. La PWA (manifest y service worker) la genera `vite-plugin-pwa`.

## Despliegue

Cada push a `main` lanza `.github/workflows/deploy.yml`, que compila y publica en GitHub Pages. En **Settings → Pages** el origen tiene que estar en **GitHub Actions**.

## Estructura

```
src/
  main.js            pantallas, estudio de grabación, flujo
  sounds.js          lista de efectos y filtros
  audio/engine.js    reproducción con filtros (Web Audio)
  audio/recorder.js  grabación, recorte de silencios y normalizado
  audio/store.js     guardado en IndexedDB
  game/game.js       bucle, oleadas, colisiones, HUD
  game/content.js    personajes, enemigos, jefes, power-ups, reglas
  game/sprites.js    todos los dibujos
  game/doodle.js     el "boli" que tiembla
```
