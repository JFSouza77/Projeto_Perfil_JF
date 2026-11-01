#!/bin/bash
# Refaz um arquivo de cartas da 2.0 inteiro a partir dos lotes (na ordem), pra corrigir uma dica sem duplicar.
# uso: bash cartas_2.0/fonte/refazer.sh PESSOA 201 02-pessoa.js pessoa   (usa fonte/pessoa1.json, pessoa2.json, ...)
cd "$(dirname "$0")/.."
cat_=$1; n=$2; saida=$3; base=$4; primeiro=1
for f in $(ls fonte/${base}[0-9]*.json | sort -V); do
  k=$(python3 -c "import json;print(len(json.load(open('$f'))))")
  if [ $primeiro = 1 ]; then python3 fonte/gerar.py $cat_ $n $f $saida >/dev/null; primeiro=0; else python3 fonte/gerar.py $cat_ $n $f $saida --anexar >/dev/null; fi
  n=$((n + k))
done
echo "$saida: até $cat_-$((n - 1))"
