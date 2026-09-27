import { useState, useEffect, useMemo, useCallback } from "react";
import { obtenerContenidoAdmin, guardarContenido } from "../api/contenido";

export function useContenidoAdmin() {
  const [original, setOriginal] = useState(null);
  const [borrador, setBorrador] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [erroresCampo, setErroresCampo] = useState(null);

  useEffect(() => {
    let vigente = true;
    obtenerContenidoAdmin()
      .then((datos) => {
        if (!vigente) return;
        setOriginal(datos);
        setBorrador(datos);
        setEstado("listo");
      })
      .catch((e) => {
        if (!vigente) return;
        setError(e.message);
        setEstado("error");
      });
    return () => {
      vigente = false;
    };
  }, []);

  // Comparación por serialización: burda, pero con este tamaño de datos
  // es instantánea y no hay que mantener lógica de igualdad profunda.
  const sucio = useMemo(
    () =>
      original !== null &&
      JSON.stringify(original) !== JSON.stringify(borrador),
    [original, borrador]
  );

  // Aviso del navegador al cerrar con cambios pendientes.
  useEffect(() => {
    if (!sucio) return undefined;
    const manejar = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", manejar);
    return () => window.removeEventListener("beforeunload", manejar);
  }, [sucio]);

  const guardar = useCallback(async () => {
    setGuardando(true);
    setError(null);
    setErroresCampo(null);
    try {
      // El servidor devuelve el documento con su actualizadoEn:
      // sincronizamos ambos con esa versión canónica.
      const guardado = await guardarContenido(borrador);
      setOriginal(guardado);
      setBorrador(guardado);
      return true;
    } catch (e) {
      setError(e.message);
      if (e.detalles) setErroresCampo(e.detalles);
      return false;
    } finally {
      setGuardando(false);
    }
  }, [borrador]);

  const descartar = useCallback(() => {
    setBorrador(original);
    setError(null);
    setErroresCampo(null);
  }, [original]);

  const editarNegocio = useCallback((campos) => {
    setBorrador((b) => ({ ...b, negocio: { ...b.negocio, ...campos } }));
  }, []);

  const editarProductos = useCallback((productos) => {
    setBorrador((b) => ({ ...b, productos }));
  }, []);

  const editarCategorias = useCallback((categorias) => {
    setBorrador((b) => ({ ...b, categorias }));
  }, []);

  return {
    estado,
    borrador,
    sucio,
    guardando,
    error,
    erroresCampo,
    guardar,
    descartar,
    editarNegocio,
    editarProductos,
    editarCategorias,
  };
}
