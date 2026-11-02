import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RedesSociais } from '../RedesSociais';
import type { PoliticianDetail } from '@/hooks/usePoliticianDetail';

type L = NonNullable<PoliticianDetail['socialLinks']>[number];

// `platform` é `string` de propósito: um teste envia plataforma desconhecida, como a API poderia mandar.
const link = (platform: string, url: string, label: string, origin: L['origin'] = 'CAMARA'): L => ({
  platform: platform as L['platform'],
  url,
  label,
  origin,
});

describe('RedesSociais', () => {
  it('não renderiza nada sem links (undefined, vazio)', () => {
    const { container, rerender } = render(<RedesSociais links={undefined} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<RedesSociais links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra nome da rede, abre em nova aba com rel seguro e avisa leitor de tela', () => {
    render(<RedesSociais links={[link('instagram', 'https://www.instagram.com/fulano', 'Instagram')]} />);
    const a = screen.getByRole('link', { name: /Instagram/ });
    expect(a).toHaveAttribute('href', 'https://www.instagram.com/fulano');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(a).toHaveTextContent('(abre em nova aba)');
  });

  it('diz a origem do link e que o conteúdo não é conferido', () => {
    render(<RedesSociais links={[link('website', 'https://cidgomes.com.br/', 'Site do parlamentar', 'SENADO')]} />);
    expect(screen.getByText(/informados ao Senado Federal/)).toBeInTheDocument();
    expect(screen.getByText(/não conferimos o que é publicado/)).toBeInTheDocument();
  });

  it('aceita http só para site pessoal; rede social em http e protocolos perigosos são ignorados', () => {
    render(
      <RedesSociais
        links={[
          link('website', 'http://www.senador.com.br/', 'Site do parlamentar', 'SENADO'),
          link('facebook', 'http://www.facebook.com/x', 'Facebook'),
          link('x', 'javascript:alert(1)', 'X (Twitter)'),
        ]}
      />,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Site do parlamentar/ })).toBeInTheDocument();
  });

  it('plataforma desconhecida vinda da API é ignorada', () => {
    render(<RedesSociais links={[link('orkut', 'https://orkut.com/x', 'Orkut')]} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('quando há links de origens diferentes, cita todas as origens', () => {
    render(
      <RedesSociais
        links={[
          link('instagram', 'https://www.instagram.com/a', 'Instagram', 'CAMARA'),
          link('facebook', 'https://www.facebook.com/a', 'Facebook', 'TSE'),
        ]}
      />,
    );
    expect(screen.getByText(/informados à Câmara dos Deputados e ao TSE, na candidatura de 2022/)).toBeInTheDocument();
  });
});
