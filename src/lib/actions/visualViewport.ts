import type { Action } from 'svelte/action';

export const visualViewport: Action<HTMLElement> = (node) => {
	const viewport = window.visualViewport;

	const update = () => {
		if (!viewport) {
			return;
		}

		node.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
		node.style.setProperty('--visual-viewport-offset-top', `${viewport.offsetTop}px`);
	};

	update();
	viewport?.addEventListener('resize', update);
	viewport?.addEventListener('scroll', update);
	window.addEventListener('resize', update);

	return {
		destroy() {
			viewport?.removeEventListener('resize', update);
			viewport?.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			node.style.removeProperty('--visual-viewport-height');
			node.style.removeProperty('--visual-viewport-offset-top');
		}
	};
};
