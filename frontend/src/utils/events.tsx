export const PROFILE_UPDATED_EVENT = 'profileUpdated';

export const emitProfileUpdated = () => {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
};