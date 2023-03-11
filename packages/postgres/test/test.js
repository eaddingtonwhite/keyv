const test = require('ava');
const keyvTestSuite = require('@keyv/test-suite').default;
const {keyvOfficialTests, keyvIteratorTests} = require('@keyv/test-suite');
const Keyv = require('keyv');
const KeyvPostgres = require('../src/index.js');

keyvOfficialTests(test, Keyv, 'postgresql://postgres:postgres@localhost:5432/keyv_test', 'postgresql://foo');

const store = () => new KeyvPostgres({uri: 'postgresql://postgres:postgres@localhost:5432/keyv_test', iterationLimit: 2});
keyvTestSuite(test, Keyv, store);
keyvIteratorTests(test, Keyv, store);

test.serial('iterator with default namespace', async t => {
	const keyv = new KeyvPostgres({uri: 'postgresql://postgres:postgres@localhost:5432/keyv_test'});
	await keyv.set('foo', 'bar');
	await keyv.set('foo1', 'bar1');
	await keyv.set('foo2', 'bar2');
	const iterator = keyv.iterator();
	let entry = await iterator.next();
	t.is(entry.value[0], 'foo');
	t.is(entry.value[1], 'bar');
	entry = await iterator.next();
	t.is(entry.value[0], 'foo1');
	t.is(entry.value[1], 'bar1');
	entry = await iterator.next();
	t.is(entry.value[0], 'foo2');
	t.is(entry.value[1], 'bar2');
	entry = await iterator.next();
	t.is(entry.value, undefined);
});

test.serial('.clear() with undefined namespace', async t => {
	const keyv = store();
	t.is(await keyv.clear(), undefined);
});

test.serial('close connection successfully', async t => {
	const keyv = store();
	t.is(await keyv.get('foo'), undefined);
	await keyv.disconnect();
	try {
		await keyv.get('foo');
		t.fail();
	} catch {
		t.pass();
	}
});

test.serial('test schema as non public', async t => {
	const keyv = new KeyvPostgres({uri: 'postgresql://postgres:postgres@localhost:5432/keyv_test', schema: 'keyvtest1'});
	const keyv2 = new KeyvPostgres({uri: 'postgresql://postgres:postgres@localhost:5432/keyv_test', schema: 'keyvtest2'});
	keyv.set('footest11', 'bar1');
	keyv2.set('footest22', 'bar2');
	t.is(await keyv.get('footest11'), 'bar1');
	t.is(await keyv.get('footest22'), undefined);
	t.is(await keyv2.get('footest11'), undefined);
	t.is(await keyv2.get('footest22'), 'bar2');
});

