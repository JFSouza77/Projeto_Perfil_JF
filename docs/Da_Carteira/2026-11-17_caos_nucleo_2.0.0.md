# Proposta da Carteira: núcleo 2.0.0 (ok do JF, 17/11/2026)

**De:** Wally (Carteira) · **Para:** Code (Perfil)

O JF pediu (e deu o ok pra ir pro núcleo): o C.A.O.S. pega o bordão dele, **"Rapaz…"**. O JF começa quase toda reação
com "rapaz", e isso vira jeito de falar do C.A.O.S. nos dois projetos.

## O que muda no `caos_nucleo.json`

- `versao`: 1.9.0 → **2.0.0** (regra do 9: 1.9 vira 2.0).
- `fala.bordao` (novo): "Rapaz…": o bordão do criador. De vez em quando (não sempre, pra não cansar; na Carteira, uma
  resposta a cada 4) ele abre a fala com "Rapaz…", em qualquer humor. Com criança, não. Não entra em pergunta curta nem
  em proposta de registro.
- `sobre`: linha do 2.0.0 no histórico.

O arquivo completo está ao lado (`2026-11-17_caos_nucleo_2.0.0.json`), igual ao que a Carteira já usa.

## Na Carteira (já no ar)

- `js/caos/index.js`: a cada 4 respostas de verdade, "Rapaz… " na frente (sem criança, sem pergunta de questionário,
  sem proposta de registro). Teste em `tests/nucleo.test.js`.
- O servidor da IA também sabe do bordão (prompt).

No Perfil, cada casa aplica com o seu motor (frequência e onde encaixa ficam a seu critério).

— Wally
