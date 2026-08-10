import type { Action } from 'svelte/action';

export const visualViewport: Action<HTMLElement, boolean> = (node, preserveBottom) => {
	const viewport = window.visualViewport;
	let previousHeight = viewport?.height;
	let scrollFrame: number | undefined;

	const update = () => {
		if (!viewport) {
			return;
		}

		// Check before resizing the shell so the old viewport position is still measurable.
		const pinnedScrollers =
			preserveBottom &&
			viewport.scale === 1 &&
			previousHeight !== undefined &&
			viewport.height < previousHeight
				? [...node.querySelectorAll<HTMLElement>('[data-visual-viewport-scroll]')].filter(
						(element) => element.scrollHeight - element.scrollTop <= element.clientHeight + 5
					)
				: [];

		node.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
		node.style.setProperty('--visual-viewport-offset-top', `${viewport.offsetTop}px`);
		previousHeight = viewport.height;

		if (pinnedScrollers.length > 0) {
			if (scrollFrame !== undefined) {
				cancelAnimationFrame(scrollFrame);
			}

			scrollFrame = requestAnimationFrame(() => {
				for (const element of pinnedScrollers) {
					element.scrollTop = element.scrollHeight;
				}
				scrollFrame = undefined;
			});
		}
	};

	update();
	viewport?.addEventListener('resize', update);
	viewport?.addEventListener('scroll', update);
	window.addEventListener('resize', update);

	return {
		update(value) {
			preserveBottom = value;
		},
		destroy() {
			viewport?.removeEventListener('resize', update);
			viewport?.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			if (scrollFrame !== undefined) {
				cancelAnimationFrame(scrollFrame);
			}
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
