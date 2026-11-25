import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveScheduledDjLabel, resolveDjShowcaseLogoFile } from '../dj-logo-filename-fix.js';
import { getScheduledPresenterNames } from '../dj-showcase.js';

test('Known incomplete historic rows resolve to the real two-word identities', () => {
    assert.equal(resolveScheduledDjLabel('Milo'), 'Milo Medina');
    assert.equal(resolveScheduledDjLabel('Squidly'), 'Squidly Bashment');
    assert.equal(resolveScheduledDjLabel('Selector'), 'Selector Frost');
    assert.equal(resolveScheduledDjLabel('Unknown'), 'Unknown');
    assert.equal(resolveScheduledDjLabel('Milo Medina Int Roots'), 'Milo Medina Int Roots');
    assert.equal(resolveScheduledDjLabel('DJ Choice Evening Show'), 'DJ Choice Evening Show');
});

test('Real labels resolve to their existing image filenames', () => {
    for (const [name, expected] of [
        ['Milo Medina', 'milo_medina_int.png'],
        ['Squidly Bashment', 'squidly_bashment.png'],
        ['Selector Frost', 'selector_frost.png'],
        ['DJ Choice', 'dj_choice.png']
    ]) {
        assert.equal(resolveDjShowcaseLogoFile(name), expected);
    }
});

test('Milo and Milo Medina produce ONE gallery card, including other known old short labels', () => {
    const rows = [
        { dj_name: 'Milo', day_of_week: 'thursday', start_time: '1500' },
        { dj_name: 'Milo Medina Int', day_of_week: 'saturday', start_time: '0200' },
        { dj_name: 'Milo Medina Roots and Culture', day_of_week: 'monday', start_time: '2000' },
        { dj_name: 'Squidly', day_of_week: 'wednesday', start_time: '1600' },
        { dj_name: 'Selector', day_of_week: 'thursday', start_time: '2000' },
        { dj_name: 'DJ Choice', day_of_week: 'wednesday', start_time: '0000' },
        { dj_name: 'Unknown', day_of_week: 'friday', start_time: '1400' },
        { dj_name: 'tellstream', day_of_week: 'sunday', start_time: '0800' },
        { dj_name: 'Bad Entry', day_of_week: 'noday', start_time: '1000' }
    ];
    const names = getScheduledPresenterNames(rows, resolveDjShowcaseLogoFile);
    assert.deepEqual(names, ['DJ Choice', 'Milo Medina', 'Selector Frost', 'Squidly Bashment']);
    assert.equal(names.filter(n => n.startsWith('Milo')).length, 1);
});

test('Show titles beyond word two do not become separate presenter cards', () => {
    const rows = [
        { dj_name: 'Squidly Bashment', day_of_week: 'wednesday', start_time: '1600' },
        { dj_name: 'Squidly Bashment Reggae Show', day_of_week: 'sunday', start_time: '1700' },
        { dj_name: 'DJ Choice', day_of_week: 'wednesday', start_time: '0000' },
        { dj_name: 'DJ Choice Rhythm Hour', day_of_week: 'friday', start_time: '1100' }
    ];
    assert.deepEqual(getScheduledPresenterNames(rows, resolveDjShowcaseLogoFile),
        ['DJ Choice', 'Squidly Bashment']);
});
