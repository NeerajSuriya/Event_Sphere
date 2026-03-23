import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_5zrm9u5";
const PUBLIC_KEY = "fmERQcxhh-sePoSyB";
const TEMPLATE_APPROVED = "template_r5y64dq";
const TEMPLATE_REGISTRATION = "template_xthpe3d";

export const sendWelcomeEmail = async (user) => {
  console.log("No-op: Welcome email skipped for", user?.email);
  return true;
};

export const sendEventApprovedEmail = async (organizerEmail, organizerName, event) => {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_APPROVED, {
      to_email: organizerEmail,
      to_name: organizerName,
      event_title: event.title,
      event_date: event.date,
      event_venue: event.venue
    }, PUBLIC_KEY);
    return true;
  } catch(e) {
    console.error("sendEventApprovedEmail Error:", e);
    return false;
  }
};

export const sendEventRejectedEmail = async (organizerEmail, event, reason) => {
  console.log("No-op: Event rejection email skipped for", organizerEmail);
  return true;
};

export const sendRegistrationConfirmedEmail = async (studentEmail, studentName, event) => {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_REGISTRATION, {
      to_email: studentEmail,
      to_name: studentName,
      event_title: event.title,
      event_date: event.date,
      event_time: event.time,
      event_venue: event.venue
    }, PUBLIC_KEY);
    return true;
  } catch(e) {
    console.error("sendRegistrationConfirmedEmail Error:", e);
    return false;
  }
};

export const sendAnnouncementEmail = async (userEmail, event) => {
  console.log("No-op: Announcement email skipped for", userEmail);
  return true;
};
