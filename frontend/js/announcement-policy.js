export function announcementTarget(message, error = false) {
  return error
    ? Object.freeze({ polite: "", alert: message })
    : Object.freeze({ polite: message, alert: "" });
}
