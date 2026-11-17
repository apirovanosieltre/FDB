import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanName,guestKey} from '../lib/rsvp-identity.ts';
test('same full name matches regardless of case, whitespace and Unicode composition',()=>{
 assert.equal(guestKey(' Andréa ', ' DE  ROSSI '),guestKey('ANDRE\u0301A','de rossi'));
 assert.equal(guestKey('ÉLODIE','MÜLLER'),guestKey('élodie','müller'));
 assert.equal(cleanName('  Anna   Maria '),'Anna Maria');
});
test('both names must match and accents remain meaningful',()=>{
 assert.notEqual(guestKey('Anna','Rossi'),guestKey('Anna','Bianchi'));
 assert.notEqual(guestKey('Anna','Rossi'),guestKey('Maria','Rossi'));
 assert.notEqual(guestKey('Andrea','Rossi'),guestKey('Andréa','Rossi'));
 assert.notEqual(guestKey('Anna Maria','Rossi'),guestKey('Anna','Maria Rossi'));
});
