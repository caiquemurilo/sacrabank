// Loads the official Pluggy Connect widget on demand (browser only).
const SRC = "https://cdn.pluggy.ai/pluggy-connect/v2.8.2/pluggy-connect.js";

type PluggyConnectOptions = {
  connectToken: string;
  includeSandbox?: boolean;
  onSuccess?: (data: { item: { id: string } }) => void;
  onError?: (error: { message?: string }) => void;
  onClose?: () => void;
};
type PluggyConnectCtor = new (opts: PluggyConnectOptions) => { init: () => Promise<void> | void };

declare global {
  interface Window { PluggyConnect?: PluggyConnectCtor }
}

let loading: Promise<PluggyConnectCtor> | null = null;

function loadWidget(): Promise<PluggyConnectCtor> {
  if (window.PluggyConnect) return Promise.resolve(window.PluggyConnect);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.PluggyConnect ? resolve(window.PluggyConnect) : reject(new Error("Widget indisponível")));
    s.onerror = () => { loading = null; reject(new Error("Não foi possível carregar o Pluggy Connect.")); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Abre o Pluggy Connect (com Sandbox) e resolve com o itemId, ou null se o usuário fechar. */
export async function openPluggyConnect(connectToken: string): Promise<string | null> {
  const PluggyConnect = await loadWidget();
  return new Promise((resolve, reject) => {
    let done = false;
    const widget = new PluggyConnect({
      connectToken,
      includeSandbox: true,
      onSuccess: ({ item }) => { done = true; resolve(item.id); },
      onError: (e) => { done = true; reject(new Error(e?.message || "Erro na conexão com o banco.")); },
      onClose: () => { if (!done) resolve(null); },
    });
    void widget.init();
  });
}
