/**
 * registrar-fontes.ts
 *
 * Calcula o SHA-256 dos zips de `data/tse/` (inclusive subpastas) e grava o
 * registro de captura em `src/lib/capturas.ts`, que a página /dados mostra
 * (E1 de docs/PLANO-CONFIANCA-E-DADOS-2027.md). Roda à mão, depois de cada
 * download. Não acessa a rede nem o banco.
 *
 * Uso:
 *   pnpm registrar:fontes           # só relata
 *   pnpm registrar:fontes --gravar  # relata e grava src/lib/capturas.ts
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { inferirArquivo, mesclar, renderizarCapturas, type Captura } from './lib/capturas';

// `src/lib` não é CommonJS, mas mantemos o mesmo padrão do auditar-links: carregar com require.
const req = createRequire(import.meta.url);
const ARQUIVO_SAIDA = path.join(process.cwd(), 'src', 'lib', 'capturas.ts');
const RAIZ = path.join(process.cwd(), 'data', 'tse');

function sha256(arquivo: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(arquivo).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });
}

function listarZips(dir: string, base = ''): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listarZips(path.join(dir, e.name), path.join(base, e.name))
    : e.name.endsWith('.zip') ? [path.join(base, e.name)] : [],
  );
}

async function main() {
  const gravar = process.argv.includes('--gravar');
  let existentes: Captura[] = [];
  try {
    existentes = [...(req('../src/lib/capturas.ts') as { CAPTURAS: Captura[] }).CAPTURAS];
  } catch {
    existentes = [];
  }

  const novas: Captura[] = [];
  for (const rel of listarZips(RAIZ).sort()) {
    const info = inferirArquivo(rel.split(path.sep).join('/'));
    if (!info) { console.log(`  ignorado (nome não reconhecido): ${rel}`); continue; }
    const abs = path.join(RAIZ, rel);
    const st = fs.statSync(abs);
    const hash = await sha256(abs);
    novas.push({ ...info, capturadoEm: st.mtime.toISOString().slice(0, 10), bytes: st.size, sha256: hash });
    console.log(`  ${hash.slice(0, 12)}  ${String(st.size).padStart(11)}  ${rel}`);
  }

  const lista = mesclar(existentes, novas);
  const antes = new Set(existentes.map((c) => c.sha256));
  const entram = lista.filter((c) => !antes.has(c.sha256));
  console.log(`Registro: ${existentes.length} -> ${lista.length} (entram ${entram.length}).`);
  for (const c of entram) console.log(`  + ${c.ano} ${c.tipo} (${c.arquivo})`);

  if (gravar) {
    fs.writeFileSync(ARQUIVO_SAIDA, renderizarCapturas(lista));
    console.log(`Gravado: ${path.relative(process.cwd(), ARQUIVO_SAIDA)}`);
  } else {
    console.log('Nada gravado (use --gravar).');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
