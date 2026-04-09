window.BODA_CONFIG = {
  // Pega aqui tu URL de Google Apps Script Web App para guardar RSVPs en Google Sheets.
  // Ejemplo: "https://script.google.com/macros/s/AKfyc.../exec"
  rsvpEndpoint: "https://script.google.com/macros/s/AKfycbzJGqGruLvGJYLLeC9oIL7y3eKaObLbufES0FcSsdwVXyZ7klSwqF1Ywrl48lNiwZEC/exec",

  // Activa esta sincronizacion solo si tu endpoint soporta GET sin registrar datos.
  // Mantener en false evita registros automáticos al abrir la invitación.
  enableRsvpSync: false,

  // Mantener en false evita conservar el bloqueo/mensaje de RSVP al recargar.
  // Si quieres recordar la respuesta y bloquear de nuevo al abrir, cambia a true.
  persistRsvpLock: false,

  // Si quieres mostrar datos reales de transferencia, cambia a true y completa los datos.
  showGiftData: false,
  giftCard: "XXXX XXXX XXXX XXXX",
  giftClabe: "XXXXXXXXXXXXXXXXXX"
};
