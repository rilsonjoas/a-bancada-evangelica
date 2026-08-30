import { useEffect } from 'react';

// M2 — SEO mínimo num SPA sem SSR: mantém <title> e <meta name="description">
// sincronizados com a página atual. O index.html guarda o title/description
// padrão; cada página de tema chama usePageMeta(label, parágrafo leigo).
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
  }, [title, description]);
}