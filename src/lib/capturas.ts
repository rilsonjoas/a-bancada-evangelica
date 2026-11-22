/**
 * Registro de captura das fontes (E1 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * ARQUIVO GERADO por `pnpm registrar:fontes --gravar` (scripts/registrar-fontes.ts).
 * Não edite à mão: rode o script de novo e revise o diff.
 */
export interface Captura {
  arquivo: string;
  ano: number;
  tipo: string;
  /** Data (AAAA-MM-DD) de modificação do arquivo na máquina de quem baixou. */
  capturadoEm: string;
  bytes: number;
  sha256: string;
  urlOficial: string | null;
  observacao: string | null;
}

export const CAPTURAS: ReadonlyArray<Captura> = [
  { arquivo: "bem_candidato_2026.zip", ano: 2026, tipo: "Bens declarados", capturadoEm: "2026-11-02", bytes: 3762285, sha256: "3b49484f7851b2815d2247fc966e8a63fe3d4841dd3fbd8d1177e0f9367b72b8", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2026.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "consulta_cand_2026.zip", ano: 2026, tipo: "Candidaturas e resultado", capturadoEm: "2026-11-02", bytes: 3283629, sha256: "5e6619a4ad0b906f057bdbe6b51c9004c891baa17230b76b1343ab37c42dc7aa", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "prestacao_de_contas_eleitorais_candidatos_2026.zip", ano: 2026, tipo: "Prestação de contas (receitas e despesas)", capturadoEm: "2026-11-02", bytes: 236197662, sha256: "6c6c32268f934d2430658271845c728cb25f440e3559b913fccc240d077cb4e2", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2026.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "rede_social_candidato_2026.zip", ano: 2026, tipo: "Redes sociais declaradas", capturadoEm: "2026-11-02", bytes: 3003260, sha256: "d4a21ba933f6d66a988ab598899b1ea83bfb8561d8f94fa700a03bddbdac04fd", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "bem_candidato_2022.zip", ano: 2022, tipo: "Bens declarados", capturadoEm: "2026-08-20", bytes: 5376095, sha256: "aec6e3bb13d192ea25ded6350bc4baf339bf63bbce99f6016b1deb130b9556e9", urlOficial: null, observacao: null },
  { arquivo: "bem_candidato_2022.zip", ano: 2022, tipo: "Bens declarados", capturadoEm: "2026-11-02", bytes: 5547989, sha256: "5cc42eec2cc1717edd3651e4d231fad0c379c85a92e8da91d70c375f3af0f40f", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2022.zip", observacao: "Versão republicada pelo TSE em nov/2026; ainda não importada." },
  { arquivo: "consulta_cand_complementar_2022.zip", ano: 2022, tipo: "Candidaturas (complementar)", capturadoEm: "2026-08-20", bytes: 1704744, sha256: "a67111d79802b43e43723a1e8dce023a87f275c6d2778e7188fa48dc7683035a", urlOficial: null, observacao: null },
  { arquivo: "consulta_cand_2022.zip", ano: 2022, tipo: "Candidaturas e resultado", capturadoEm: "2026-08-20", bytes: 4379833, sha256: "2d29446a2b728f151295a0d7bb20aef64d1264430c375a076a60c7cc65594a06", urlOficial: null, observacao: null },
  { arquivo: "consulta_cand_2022.zip", ano: 2022, tipo: "Candidaturas e resultado", capturadoEm: "2026-11-02", bytes: 4440144, sha256: "c6edc2b51002e74952b4736d1859aa0f41631dad8be11677f80a1a5e1a32f4aa", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2022.zip", observacao: "Versão republicada pelo TSE em nov/2026; ainda não importada." },
  { arquivo: "motivo_cassacao_2022.zip", ano: 2022, tipo: "Motivos de cassação", capturadoEm: "2026-08-20", bytes: 162480, sha256: "bb307fcd3565ad5a9e70a37655a8b27248d88352b4d278c880bd7bfc3f1a8712", urlOficial: null, observacao: null },
  { arquivo: "prestacao_de_contas_eleitorais_candidatos_2022.zip", ano: 2022, tipo: "Prestação de contas (receitas e despesas)", capturadoEm: "2026-08-20", bytes: 473268465, sha256: "ceea3bea768f642e01a2344f8f36ddbefe1e4e8a7bf21680b04d4704792c351d", urlOficial: null, observacao: null },
  { arquivo: "prestacao_de_contas_eleitorais_candidatos_2022.zip", ano: 2022, tipo: "Prestação de contas (receitas e despesas)", capturadoEm: "2026-11-02", bytes: 495259842, sha256: "e43c4a9d03c5c27ecf057913224efcc895fd7fb43aa4c8df89a73c41cf141520", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip", observacao: "Versão republicada pelo TSE em nov/2026; ainda não importada." },
  { arquivo: "rede_social_candidato_2022.zip", ano: 2022, tipo: "Redes sociais declaradas", capturadoEm: "2026-11-02", bytes: 1907313, sha256: "ffa8789fa7a4c180256d2674a22c5b243f97823e801d1eb7506ae3a894890436", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2022.zip", observacao: null },
  { arquivo: "bem_candidato_2018.zip", ano: 2018, tipo: "Bens declarados", capturadoEm: "2026-11-03", bytes: 5098559, sha256: "d2473b7eef8849faf6061618a02add730d050364f37b546c93c37b9f2fbac58f", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/bem_candidato/bem_candidato_2018.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "consulta_cand_2018.zip", ano: 2018, tipo: "Candidaturas e resultado", capturadoEm: "2026-11-03", bytes: 4722704, sha256: "57f6881f1aa036142886ae548afd275e7ee6695643a2ab62826f2ee232d3fd44", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2018.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "prestacao_de_contas_eleitorais_candidatos_2018.zip", ano: 2018, tipo: "Prestação de contas (receitas e despesas)", capturadoEm: "2026-11-03", bytes: 305897986, sha256: "7b8f8c6c2b46b90597fc815f798dd83d49ca6bd60b7f01eb5966d2deaf91ffee", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2018.zip", observacao: "Levantamento da Fase E; ainda não importado." },
  { arquivo: "rede_social_candidato_2018.zip", ano: 2018, tipo: "Redes sociais declaradas", capturadoEm: "2026-11-03", bytes: 642323, sha256: "27411dbc32074defd52cc2056ad41fb76a2d9a41d30aa1ac45c0b467b170ccd1", urlOficial: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2018.zip", observacao: "Levantamento da Fase E; ainda não importado." },
];
