
import { useEffect, useState } from "react";
import axios from "axios";

export default function Comments({ postId, userId }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");

  // Cargar comentarios al iniciar
  useEffect(() => {
    axios.get(`http://localhost:4000/comments/${postId}`)
      .then(res => setComentarios(res.data))
      .catch(err => console.error(err));
  }, [postId]);

  // Enviar comentario
  const enviarComentario = () => {
    axios.post("http://localhost:4000/comments", {
      publicacion_id: postId,
      usuario_id: userId,
      comentario: nuevoComentario
    })
    .then(() => {
      setComentarios([{ comentario: nuevoComentario, nombres: "Tú", apellidos: "", fecha: new Date() }, ...comentarios]);
      setNuevoComentario("");
    })
    .catch(err => console.error(err));
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2">Comentarios</h3>
      <div className="mb-3">
        <textarea 
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Escribe un comentario..."
        />
        <button onClick={enviarComentario} className="mt-2 px-4 py-1 bg-blue-600 text-white rounded">
          Enviar
        </button>
      </div>
      <ul>
        {comentarios.map((c, i) => (
          <li key={i} className="border-b py-2">
            <p className="text-sm"><b>{c.nombres} {c.apellidos}:</b> {c.comentario}</p>
            <p className="text-xs text-gray-500">{new Date(c.fecha).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
