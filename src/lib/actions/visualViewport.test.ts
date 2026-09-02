import { describe, expect, it } from 'vitest';

import { getVisualViewportTranslation } from './visualViewport';

describe('getVisualViewportTranslation', () => {
	it('uses the visual viewport position during a normal keyboard pan', () => {
		expect(getVisualViewportTranslation({ offsetTop: 320, pageTop: 320, containerTop: -320 })).toBe(
			320
		);
	});

	it('uses pageTop when WebKit under-reports offsetTop', () => {
		expect(getVisualViewportTranslation({ offsetTop: 0, pageTop: 84, containerTop: -84 })).toBe(84);
	});

	it('falls back to rendered geometry when viewport positions are stale', () => {
		expect(getVisualViewportTranslation({ offsetTop: 0, pageTop: 0, containerTop: -84 })).toBe(84);
	});

	it('does not move the shell above its document origin', () => {
		expect(getVisualViewportTranslation({ offsetTop: -10, pageTop: -10, containerTop: 10 })).toBe(
			0
		);
	});
});
