import styles from "./LimiteExcedido.module.css";

function LimiteExcedido() {
  return (
    <div className={styles.container}>
      <p className={styles.content}>
        Limite de jogadores excedido, volte mais tarde...
      </p>
    </div>
  );
}

export default LimiteExcedido;
