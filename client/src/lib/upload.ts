export function uploadFormData<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Caricamento interrotto. Controlla la connessione e riprova."));
    request.onload = () => {
      let payload: any = {};
      try { payload = JSON.parse(request.responseText); } catch { /* risposta non JSON */ }
      if (request.status >= 200 && request.status < 300) resolve(payload as T);
      else reject(new Error(payload.message || "Caricamento non riuscito"));
    };
    request.send(formData);
  });
}
