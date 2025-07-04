import styles from "./Resultado.module.css";

function Resultado({ vencedor, socket }) {
  function handleRecomecar() {
    socket.send(
      JSON.stringify({
        type: "RECOMEÇAR_PARTIDA",
      })
    );
  }

  console.log(vencedor);

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.containerResultado}>
          {!vencedor && <p>Empate!</p>}

          {vencedor && (
            <>
              <p>Vencedor: {vencedor.id}</p>

              <div className={styles.containerMao}>
                {vencedor.mao.map((c) => (
                  <div key={c.id} className={`${styles.card}`}>
                    <p>{c.valor}</p>
                    <p>{c.naipe}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            className={`${styles.btn} ${styles.btnRecomecar}`}
            onClick={handleRecomecar}
          >
            Recomeçar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Resultado;
