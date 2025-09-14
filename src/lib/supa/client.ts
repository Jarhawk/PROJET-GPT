// Client SQLite factice remplaçant l'ancien client Supabase.
// Les méthodes exposent une API similaire mais ne réalisent aucune requête réelle.

class DummyQuery {
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  eq() { return this; }
  neq() { return this; }
  in() { return this; }
  ilike() { return this; }
  gte() { return this; }
  or() { return this; }
  order() { return this; }
  limit() { return this; }
  then(resolve, reject) {
    return Promise.resolve({ data: null, error: new Error('Base SQLite non configurée') }).then(resolve, reject);
  }
}

class AuthStub {
  async getUser() {
    return { data: null, error: new Error('Auth non disponible') };
  }
  async signInWithPassword() {
    return { data: null, error: new Error('Auth non disponible') };
  }
  async signUp() {
    return { data: null, error: new Error('Auth non disponible') };
  }
  async signOut() {
    return { error: new Error('Auth non disponible') };
  }
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } };
  }
}

class SQLiteClient {
  auth: AuthStub;
  constructor() {
    this.auth = new AuthStub();
  }
  from() {
    return new DummyQuery();
  }
  rpc() {
    return Promise.resolve({ data: null, error: new Error('RPC SQLite non disponible') });
  }
}

export const supabase = new SQLiteClient();
export default supabase;
