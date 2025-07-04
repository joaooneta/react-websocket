import { WebSocket, WebSocketServer } from "ws";

let jogadores = [];
let idJogadorAtivo = null;
let status = "PAREANDO";
let turno = null;
let baralho;
let cartaTopoPilhaDescarte = null;
let vencedor = null;

const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const naipes = ["♣️", "♠️", "♥️", "♦️"];

const server = new WebSocketServer({
  port: 8080,
  host: "0.0.0.0",
});

function atualizarStatus() {
  jogadores.forEach((j) =>
    j.ws.send(JSON.stringify({ type: "ATUALIZAR_STATUS", data: status }))
  );
}

function atualizarMaos() {
  jogadores.forEach((j) =>
    j.ws.send(JSON.stringify({ type: "ATUALIZAR_MAOS", data: j.mao }))
  );
}

function atualizarPilhaDescarte() {
  jogadores.forEach((j) =>
    j.ws.send(
      JSON.stringify({
        type: "ATUALIZAR_PILHA_DESCARTE",
        data: cartaTopoPilhaDescarte,
      })
    )
  );
}

function atualizarJogadorAtivo() {
  jogadores.forEach((j) =>
    j.ws.send(
      JSON.stringify({
        type: "ATUALIZAR_MEU_TURNO",
        data: j.id === idJogadorAtivo,
      })
    )
  );
}

function atualizarTurno() {
  jogadores.forEach((j) =>
    j.ws.send(JSON.stringify({ type: "ATUALIZAR_TURNO", data: turno }))
  );
}

function atualizarVencedor() {
  vencedor = jogadores.find((j) => j.id === idJogadorAtivo);
  const id = vencedor.id;
  const mao = vencedor.mao;

  jogadores.forEach((j) =>
    j.ws.send(JSON.stringify({ type: "ATUALIZAR_VENCEDOR", data: { id, mao } }))
  );
}

function montarBaralho(modoTeste = null) {
  const baralho = [];
  for (let v of valores) {
    for (let n of naipes) {
      baralho.push({ valor: v, naipe: n, id: crypto.randomUUID() });
    }
  }

  if (!modoTeste) {
    for (let i = baralho.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
    }
  }

  return baralho;
}

function getMaos() {
  const maoJogador1 = [];
  const maoJogador2 = [];

  for (let i = 0; i < 18; i++) {
    const carta = baralho[i];

    if (i % 2 === 0) maoJogador1.push(carta);
    else maoJogador2.push(carta);
  }

  baralho.splice(0, 18);

  return [maoJogador1, maoJogador2];
}

function iniciarJogo() {
  baralho = montarBaralho(true);

  const [maoJogador1, maoJogador2] = getMaos();

  jogadores[0].mao = maoJogador1;
  jogadores[1].mao = maoJogador2;

  idJogadorAtivo = jogadores[0].id;

  atualizarMaos();
  atualizarJogadorAtivo();
  atualizarTurno();
  atualizarStatus();
}

function bater() {
  status = "FIM_DE_JOGO";

  atualizarVencedor();
  atualizarStatus();
}

function verificarPossoBater() {
  const mao = jogadores.find((j) => j.id === idJogadorAtivo).mao;

  if (mao.length !== 9) return;

  const conjunto1 = mao.slice(0, 3);
  const conjunto2 = mao.slice(3, 6);
  const conjunto3 = mao.slice(6, 9);

  const posso =
    (validarTrinca(conjunto1) || validarSequencia(conjunto1)) &&
    (validarTrinca(conjunto2) || validarSequencia(conjunto2)) &&
    (validarTrinca(conjunto3) || validarSequencia(conjunto3));

  if (posso) bater();
}

function validarTrinca(conjunto) {
  const valor = conjunto[0].valor;
  const mesmoValor = conjunto.every((c) => c.valor === valor);

  const naipes = conjunto.map((c) => c.naipe);
  const qtdeNaipesDiferentes = new Set(naipes).size;

  return mesmoValor && qtdeNaipesDiferentes === 3;
}

function validarSequencia(conjunto) {
  let ehSequencia = true;
  for (let i = 1; i < 3; i++) {
    if (conjunto[i].valor !== conjunto[i - 1].valor + 1) ehSequencia = false;
  }

  const naipes = conjunto.map((c) => c.naipe);
  const qtdeNaipesDiferentes = new Set(naipes);

  return ehSequencia && qtdeNaipesDiferentes.size === 1;
}

function reiniciar() {
  status = "PAREANDO";

  atualizarStatus();
}

function reiniciarPartida() {
  status = "JOGANDO";
  turno = "COMPRANDO";
  baralho = montarBaralho(true);
  cartaTopoPilhaDescarte = null;
  vencedor = null;

  const [maoJogador1, maoJogador2] = getMaos();

  jogadores[0].mao = maoJogador1;
  jogadores[1].mao = maoJogador2;

  idJogadorAtivo = jogadores[0].id;

  atualizarMaos();
  atualizarPilhaDescarte();
  atualizarJogadorAtivo();
  atualizarTurno();
  atualizarStatus();
}

server.on("connection", (ws) => {
  if (jogadores.length === 2) {
    ws.send(
      JSON.stringify({ type: "ATUALIZAR_STATUS", data: "LIMITE_EXCEDIDO" })
    );
    ws.close();
    return;
  }

  if (status === "PAREANDO") {
    const id = crypto.randomUUID();

    const jogador = { id, ws };

    jogadores.push(jogador);

    if (jogadores.length === 1) {
      ws.send(JSON.stringify({ type: "ATUALIZAR_STATUS", data: status }));
    }

    if (jogadores.length === 2) {
      status = "JOGANDO";
      turno = "COMPRANDO";

      iniciarJogo();
    }
  }

  ws.on("message", (message) => {
    const { type, data } = JSON.parse(message.toString());

    if (type === "RECOMEÇAR_PARTIDA" && status === "FIM_DE_JOGO") {
      reiniciarPartida();
      return;
    }

    const jogadorClient = jogadores.find((j) => j.ws === ws);
    const indexJogadorClient = jogadores.findIndex((j) => j.ws === ws);

    if (jogadorClient.id !== idJogadorAtivo) {
      return;
    }

    if (type === "EFETIVAR_COMPRA_BARALHO" && turno === "COMPRANDO") {
      const cartaTopo = baralho.shift();

      jogadores[indexJogadorClient].mao.push(cartaTopo);

      turno = "DESCARTANDO";

      atualizarMaos();
      atualizarTurno();
    }

    if (type === "EFETIVAR_COMPRA_DESCARTE" && turno === "COMPRANDO") {
      if (!cartaTopoPilhaDescarte) return;

      jogadores[indexJogadorClient].mao.push(cartaTopoPilhaDescarte);

      cartaTopoPilhaDescarte = null;

      turno = "DESCARTANDO";

      atualizarPilhaDescarte();
      atualizarMaos();
      atualizarTurno();
    }

    if (type === "EFETIVAR_DESCARTE" && turno === "DESCARTANDO") {
      const novaMao = jogadores[indexJogadorClient].mao.filter(
        (c) => c.id !== data.id
      );

      jogadores[indexJogadorClient].mao = novaMao;

      turno = "FINALIZANDO";

      cartaTopoPilhaDescarte = data;

      atualizarMaos();
      atualizarPilhaDescarte();
      atualizarTurno();
    }

    if (type === "EFETIVAR_TROCA_POSICAO_CARTAS" && turno === "FINALIZANDO") {
      const indexCarta1 = jogadores[indexJogadorClient].mao.findIndex(
        (c) => c.id === data[0].id
      );

      const indexCarta2 = jogadores[indexJogadorClient].mao.findIndex(
        (c) => c.id === data[1].id
      );

      [
        jogadores[indexJogadorClient].mao[indexCarta1],
        jogadores[indexJogadorClient].mao[indexCarta2],
      ] = [
        jogadores[indexJogadorClient].mao[indexCarta2],
        jogadores[indexJogadorClient].mao[indexCarta1],
      ];

      atualizarMaos();
    }

    if (type === "FINALIZAR_TURNO" && turno === "FINALIZANDO") {
      turno = "COMPRANDO";

      idJogadorAtivo =
        idJogadorAtivo !== jogadores[0].id ? jogadores[0].id : jogadores[1].id;

      atualizarTurno();
      atualizarJogadorAtivo();
    }

    if (type === "EFETIVAR_BATIDA" && turno === "FINALIZANDO") {
      verificarPossoBater();
    }
  });

  ws.on("close", (code, reason) => {
    const indexJogadorSaiu = jogadores.findIndex((j) => j.ws === ws);

    jogadores.splice(indexJogadorSaiu, 1);

    reiniciar();
  });
});
