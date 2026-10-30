# Gera cartas no formato do jogo a partir de um lote (JSON): [{a, q:[17 dicas], class?, os?}]
# uso: python3 gerar.py <cat> <primeiro_numero> <lote.json> <saida.js> [--anexar]
import json, sys
cat, n0, lote, saida = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
anexar = "--anexar" in sys.argv
ESP = [
  ["*Volte 3 casas", "*Escolha um jogador para avançar 2 casas", "*Um palpite a qualquer hora"],
  ["*Avance 1 casa", "*Escolha um jogador para voltar 2 casas", "*Perca sua vez"],
  ["*Volte 2 casas", "*Um palpite a qualquer hora", "*Escolha um jogador para avançar 2 casas"],
  ["*Avance 2 casas", "*Perca sua vez", "*Escolha um jogador para voltar 2 casas"],
  ["*Perca sua vez", "*Volte 2 casas", "*Escolha um jogador para avançar 2 casas"],
  ["*Um palpite a qualquer hora", "*Avance 1 casa", "*Escolha um jogador para voltar 2 casas"],
]
POS = [[4, 10, 15], [2, 9, 17], [6, 12, 18], [3, 11, 16], [5, 13, 19]]
cartas = json.load(open(lote, encoding="utf8"))
out = []
for k, c in enumerate(cartas):
    q = list(c["q"])
    assert len(q) == 17, (c["a"], len(q))
    esp = ESP[(n0 + k) % len(ESP)]
    for p, e in zip(POS[(n0 + k) % len(POS)], esp):
        q.insert(p, e)
    assert len(q) == 20
    linhas = [f'  {{', f'    id: "{cat}-{n0 + k:04d}",', f'    cat: "{cat}",', f'    a: {json.dumps(c["a"], ensure_ascii=False)},']
    if c.get("class"): linhas.append(f'    class: "{c["class"]}",')
    if c.get("os"): linhas.append('    os: 1,')
    linhas.append('    q: [')
    linhas += [f'      {json.dumps(t, ensure_ascii=False)},' for t in q]
    linhas += ['    ],', '  },']
    out.append("\n".join(linhas))
txt = "\n".join(out) + "\n"
with open(saida, "a" if anexar else "w", encoding="utf8") as f:
    f.write(txt)
print(len(cartas), "cartas", cat, n0, "a", n0 + len(cartas) - 1)
