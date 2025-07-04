import { useEffect, useState } from "react";
import styles from "./Jogando.module.css";

function Jogando({ socket, mao, pilhaDescarte, turno, meuTurno }) {
  const [cartaDescarte, setCartaDescarte] = useState(null);
  const [cartasOrganizar, setCartasOrganizar] = useState([]);
  const [possoBater, setPossoBater] = useState(false);

  const maoAdversario = Array.from({ length: 9 }, () => ({
    id: crypto.randomUUID(),
  }));

  function handleComprarBaralho() {
    if (!meuTurno) return;

    if (turno !== "COMPRANDO") return;

    socket.send(JSON.stringify({ type: "EFETIVAR_COMPRA_BARALHO" }));
  }

  function handleComprarDescarte() {
    if (!meuTurno) return;

    if (turno !== "COMPRANDO" || !pilhaDescarte) return;

    socket.send(JSON.stringify({ type: "EFETIVAR_COMPRA_DESCARTE" }));
  }

  function handleSelecionarCarta(c) {
    if (!meuTurno) return;

    if (turno !== "DESCARTANDO" && turno !== "FINALIZANDO") return;

    if (turno === "DESCARTANDO") {
      setCartaDescarte(c);
    }

    if (turno === "FINALIZANDO") {
      setCartasOrganizar((prev) => [...prev, c]);
    }
  }

  function handleDescartar() {
    if (!meuTurno) return;

    if (!cartaDescarte) return;
    socket.send(
      JSON.stringify({ type: "EFETIVAR_DESCARTE", data: cartaDescarte })
    );
  }

  function handleFinalizar() {
    if (!meuTurno) return;

    setPossoBater(false);
    setCartaDescarte(null);
    setCartasOrganizar([]);

    socket.send(JSON.stringify({ type: "FINALIZAR_TURNO" }));
  }

  function handleBater() {
    if (!meuTurno) return;

    setPossoBater(false);
    setCartaDescarte(null);
    setCartasOrganizar([]);

    socket.send(JSON.stringify({ type: "EFETIVAR_BATIDA" }));
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

  useEffect(() => {
    if (!meuTurno) return;

    if (turno === "FINALIZANDO" && cartasOrganizar.length === 2) {
      socket.send(
        JSON.stringify({
          type: "EFETIVAR_TROCA_POSICAO_CARTAS",
          data: cartasOrganizar,
        })
      );

      setCartasOrganizar([]);
    }
  }, [cartasOrganizar, turno, socket, meuTurno]);

  useEffect(() => {
    if (!meuTurno) return;

    function verificarPossoBater() {
      if (mao.length !== 9) return;

      const conjunto1 = mao.slice(0, 3);
      const conjunto2 = mao.slice(3, 6);
      const conjunto3 = mao.slice(6, 9);

      const posso =
        (validarTrinca(conjunto1) || validarSequencia(conjunto1)) &&
        (validarTrinca(conjunto2) || validarSequencia(conjunto2)) &&
        (validarTrinca(conjunto3) || validarSequencia(conjunto3));

      return posso;
    }

    if (turno === "FINALIZANDO") {
      const booleanPossoBater = verificarPossoBater(mao);
      setPossoBater(booleanPossoBater);
    }
  }, [meuTurno, mao, turno]);

  return (
    <div className={styles.container}>
      <div className={styles.cardContainer}>
        {maoAdversario.map((c) => (
          <div key={c.id} className={`${styles.card} ${styles.cardBack}`}></div>
        ))}
      </div>

      <div className={styles.pilhaBaralhoContainer}>
        <div className={`${styles.card}`} onClick={handleComprarBaralho}>
          Baralho
        </div>

        <div className={`${styles.card}`} onClick={handleComprarDescarte}>
          {pilhaDescarte ? (
            <>
              <p>{pilhaDescarte.valor}</p>
              <p>{pilhaDescarte.naipe}</p>
            </>
          ) : (
            "Pilha"
          )}
        </div>
      </div>

      <div className={styles.cardContainer}>
        {mao.map((c) => (
          <div
            key={c.id}
            className={`${styles.card} ${
              cartaDescarte &&
              c.id === cartaDescarte.id &&
              styles.cardSelectedDescarte
            } ${
              cartasOrganizar[0] &&
              c.id === cartasOrganizar[0].id &&
              styles.cardSelectedOrganizar
            }`}
            onClick={() => {
              handleSelecionarCarta(c);
            }}
          >
            <p>{c.valor}</p>
            <p>{c.naipe}</p>
          </div>
        ))}

        <div className={styles.acoesContainer}>
          <button
            className={`${styles.btn} ${styles.btnDescartar}`}
            disabled={!(meuTurno && turno === "DESCARTANDO" && cartaDescarte)}
            onClick={handleDescartar}
          >
            Descartar
          </button>
          <button
            className={`${styles.btn} ${styles.btnFinalizar}`}
            disabled={!(meuTurno && turno === "FINALIZANDO")}
            onClick={handleFinalizar}
          >
            Finalizar
          </button>
          <button
            className={`${styles.btn} ${styles.btnBater}`}
            disabled={!(meuTurno && turno === "FINALIZANDO") || !possoBater}
            onClick={handleBater}
          >
            Bater
          </button>
        </div>
      </div>
    </div>
  );
}

export default Jogando;
