export default function useNotifications() {
  return {
    notify: () => {},
    fetchUnreadCount: () => Promise.resolve(0),
    subscribeToNotifications: () => () => {},
  };
}

export const useAuth = useNotifications;
