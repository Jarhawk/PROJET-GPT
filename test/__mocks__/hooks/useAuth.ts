export function useAuth() {
  return {
    session: undefined,
    user: { id: 'u-test', email: 'test@example.com' },
    mama_id: '00000000-0000-0000-0000-000000000000',
    access_rights: {},
    can: () => true,
    loading: false,
  };
}
