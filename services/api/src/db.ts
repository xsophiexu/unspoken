// The Postgres boundary: the one method the service calls, and the schema it expects.

// A pg Pool has this method, and so does PGlite, which the tests use to run the same SQL in process.
export type Database = {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

// Schema versions, applied in order. Never edit a released one: append the next change instead.
const migrations = [
  // 1: feedback holds the validated request, with null for an optional field left out.
  `create table feedback (
    id uuid primary key default gen_random_uuid(),
    topic text not null,
    message text not null,
    entry_point text,
    platform text,
    app_version text,
    received_at timestamptz not null default now()
  )`,
];

// Brings the schema up to date; the service runs it on every start. Each version applies in one
// statement (so in one transaction) under a lock that makes instances starting together take turns,
// and is recorded in schema_migrations so it never applies twice.
export async function migrate(db: Database) {
  for (const [index, change] of migrations.entries()) {
    const version = index + 1;
    await db.query(`do $migrate$ begin
      perform pg_advisory_xact_lock(hashtext('unspoken schema_migrations'));
      create table if not exists schema_migrations (version integer primary key, applied_at timestamptz not null default now());
      if not exists (select from schema_migrations where version = ${version}) then
        ${change};
        insert into schema_migrations (version) values (${version});
      end if;
    end $migrate$`);
  }
}
