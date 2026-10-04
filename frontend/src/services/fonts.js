/**
 * Font loading with a fallback:
 *   1. try Google Fonts (client fetches from the internet over its own connection),
 *   2. if that fails or is too slow, use the local copy in public/fonts (served by the same
 *      host that served the page, i.e. the event laptop).
 *
 * Both sources define the same families, so the CSS needs no changes. Everything is
 * non-blocking: text renders with a fallback font and swaps when the real font arrives.
 *
 * The local copy is created once with `npm run fonts` (scripts/download-fonts.mjs) and committed.
 */

const REMOTE_CSS =
  'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Press+Start+2P&family=VT323&display=swap';
const LOCAL_CSS = `${import.meta.env.BASE_URL}fonts/fonts.css`;

// Fonts that must actually load for the remote source to count as working
const PROBES = ['16px "Press Start 2P"', '16px "Pixelify Sans"', '16px "VT323"'];

const REMOTE_CSS_TIMEOUT_MS = 3000;
const REMOTE_FILES_TIMEOUT_MS = 4000;
const LOCAL_TIMEOUT_MS = 5000;

function addStylesheet(href, source, timeoutMs) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.fontSource = source;

    const timer = setTimeout(() => {
      link.remove();
      reject(new Error(`${source} stylesheet timed out`));
    }, timeoutMs);

    link.onload = () => {
      clearTimeout(timer);
      resolve(link);
    };
    link.onerror = () => {
      clearTimeout(timer);
      link.remove();
      reject(new Error(`${source} stylesheet failed`));
    };
    document.head.appendChild(link);
  });
}

/** Resolves only if every probe font really loaded (an empty result means no @font-face matched). */
async function probeFonts(timeoutMs) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('font files timed out')), timeoutMs)
  );
  const results = await Promise.race([
    Promise.all(PROBES.map((probe) => document.fonts.load(probe, 'Abc'))),
    timeout,
  ]);
  if (results.some((faces) => faces.length === 0)) throw new Error('font face missing');
}

/** Returns 'remote' or 'local' (or 'system' if neither worked). Never throws. */
export async function loadFonts() {
  try {
    await addStylesheet(REMOTE_CSS, 'remote', REMOTE_CSS_TIMEOUT_MS);
    await probeFonts(REMOTE_FILES_TIMEOUT_MS);
    return 'remote';
  } catch (remoteError) {
    console.info('[fonts] Google Fonts unavailable, using local copy:', remoteError.message);
    // Drop the remote sheet so a half-working remote can't shadow the local faces
    document.querySelectorAll('link[data-font-source="remote"]').forEach((el) => el.remove());
  }

  try {
    await addStylesheet(LOCAL_CSS, 'local', LOCAL_TIMEOUT_MS);
    await probeFonts(LOCAL_TIMEOUT_MS);
    return 'local';
  } catch (localError) {
    console.warn(
      '[fonts] Local fonts unavailable (run `npm run fonts` once in frontend/ and commit public/fonts). Using system fonts.',
      localError.message
    );
    return 'system';
  }
}
