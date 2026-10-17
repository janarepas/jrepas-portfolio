import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
export function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../../migrations/0001_content.sql', import.meta.url), 'utf8'));
  return { prepare(sql) { let args=[];return { bind(...values){args=values;return this;}, first(){return sqlite.prepare(sql).get(...args)||null;}, run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};} }; }, close(){sqlite.close();} };
}
