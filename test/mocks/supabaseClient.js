export function makeSupabaseMock(init = { data: [], error: null, count: 0 }) {
  const result = Promise.resolve({
    data: init.data,
    error: init.error,
    count: init.count
  });

  const chain = {
    from() { return chain; },
    select() { return chain; },
    insert() { return chain; },
    update() { return chain; },
    delete() { return chain; },
    order() { return chain; },
    eq() { return chain; },
    in() { return chain; },
    range() { return chain; },
    single() { return result; },
    maybeSingle() { return result; },
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally?.bind(result) ?? ((f)=>result)
  };
  return chain;
}
