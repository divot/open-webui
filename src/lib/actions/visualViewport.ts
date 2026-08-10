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

export const preventVisualViewportScroll: Action<HTMLElement, boolean> = (node, enabled) => {
	const viewport = window.visualViewport;
	let isEnabled = enabled;

	const preventOuterScroll = (event: TouchEvent) => {
		const target = event.target;
		const layoutViewportHeight = document.documentElement.clientHeight;

		if (
			!isEnabled ||
			!viewport ||
			viewport.scale !== 1 ||
			Math.round(viewport.height) >= Math.round(layoutViewportHeight) ||
			!(target instanceof Element) ||
			target.closest('[data-visual-viewport-scroll]')
		) {
			return;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
	};

	node.addEventListener('touchmove', preventOuterScroll, { capture: true, passive: false });

	return {
		update(value) {
			isEnabled = value;
		},
		destroy() {
			node.removeEventListener('touchmove', preventOuterScroll, { capture: true });
		}
	};
};
