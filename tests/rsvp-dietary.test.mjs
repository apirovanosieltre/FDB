import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDietaryInput, MAX_DIETARY_NOTES, newEditToken, hashEditToken} from '../lib/rsvp-dietary.ts';

test('food allergies require explicit yes/no for attending guests', () => {
  assert.match(parseDietaryInput({},true).error,/Yes or No/);
  assert.deepEqual(parseDietaryInput({hasAllergies:false},true),{notes:null});
  assert.deepEqual(parseDietaryInput({},false),{notes:null});
});
test('yes requires useful details and explicit consent', () => {
  assert.ok(parseDietaryInput({hasAllergies:true,allergyDetails:'Peanuts'},true).error);
  assert.ok(parseDietaryInput({hasAllergies:true,allergyDetails:'  ' ,dietaryConsent:true},true).error);
  assert.ok(parseDietaryInput({hasAllergies:true,allergyDetails:'x'.repeat(MAX_DIETARY_NOTES+1),dietaryConsent:true},true).error);
  assert.deepEqual(parseDietaryInput({hasAllergies:true,allergyDetails:'  Peanuts  ',dietaryConsent:true},true),{notes:'Peanuts'});
});
test('editing credentials are unpredictable and hashable',async () => {
  const a=newEditToken(),b=newEditToken();
  assert.match(a,/^[0-9a-f]{64}$/);
  assert.notEqual(a,b);
  assert.notEqual(await hashEditToken(a),a);
  assert.equal(await hashEditToken(a),await hashEditToken(a));
});
