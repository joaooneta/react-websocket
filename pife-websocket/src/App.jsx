import { useEffect, useRef, useState } from "react";

import Pareando from "./components/Pareando/Pareando";
import Jogando from "./components/Jogando/Jogando";
import LimiteExcedido from "./components/LimiteExcedido/LimiteExcedido";
import Resultado from "./components/Resultado/Resultado";

function App() {
  const socket = useRef(null);
  const [status, setStatus] = useState(null);
  const [turno, setTurno] = useState(null);
  const [meuTurno, setMeuTurno] = useState(false);
  const [mao, setMao] = useState(null);
  const [pilhaDescarte, setPilhaDescarte] = useState(null);
  const [vencedor, setVencedor] = useState(null);

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:8080");

    socket.current.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);

      if (type === "ATUALIZAR_STATUS") setStatus(data);

      if (type === "ATUALIZAR_MAOS") setMao(data);

      if (type === "ATUALIZAR_TURNO") setTurno(data);

      if (type === "ATUALIZAR_MEU_TURNO") setMeuTurno(data);

      if (type === "ATUALIZAR_PILHA_DESCARTE") setPilhaDescarte(data);

      if (type === "ATUALIZAR_VENCEDOR") setVencedor(data);
    };
  }, []);

  return (
    <>
      {status === "PAREANDO" && <Pareando />}
      {status === "JOGANDO" && (
        <Jogando
          socket={socket.current}
          mao={mao}
          pilhaDescarte={pilhaDescarte}
          turno={turno}
          meuTurno={meuTurno}
        />
      )}
      {status == "FIM_DE_JOGO" && (
        <Resultado vencedor={vencedor} socket={socket.current} />
      )}
      {status === "LIMITE_EXCEDIDO" && <LimiteExcedido />}
    </>
  );
}

export default App;
